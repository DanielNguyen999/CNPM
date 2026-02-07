"""
Order management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from infrastructure.database.connection import get_db
from infrastructure.database.order_repository_impl import SQLAlchemyOrderRepository
from infrastructure.database.customer_repository_impl import SQLAlchemyCustomerRepository
from infrastructure.database.inventory_repository_impl import SQLAlchemyInventoryRepository
from infrastructure.database.debt_repository_impl import SQLAlchemyDebtRepository

from infrastructure.database.product_repository_impl import SQLAlchemyProductRepository
from api.schemas import OrderCreate, OrderResponse, OrderItemResponse, PaginatedResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role
from api.v1.auth.permissions import require_permission
from usecases.create_order import CreateOrderUseCase
from domain.services.audit_service import AuditService

router = APIRouter()
@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: CurrentUser = Depends(require_role("OWNER", "EMPLOYEE")),
    db: Session = Depends(get_db)
):
    """
    Create a new order (at-counter).
    
    Requires: OWNER or EMPLOYEE role
    """
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    # Initialize repositories
    order_repo = SQLAlchemyOrderRepository(db)
    customer_repo = SQLAlchemyCustomerRepository(db)
    product_repo = SQLAlchemyProductRepository(db)
    inventory_repo = SQLAlchemyInventoryRepository(db)
    debt_repo = SQLAlchemyDebtRepository(db)
    
    # Initialize Use Case
    use_case = CreateOrderUseCase(
        order_repo=order_repo,
        customer_repo=customer_repo,
        product_repo=product_repo,
        inventory_repo=inventory_repo,
        debt_repo=debt_repo
    )
    
    try:
        # Execute use case
        created_order = await use_case.execute(
            db=db,
            owner_id=current_user.owner_id,
            customer_id=order_data.customer_id,
            created_by=current_user.user_id,
            items=[item.dict() for item in order_data.items],
            tax_rate=order_data.tax_rate,
            discount_amount=order_data.discount_amount,
            paid_amount=order_data.paid_amount,
            payment_method=order_data.payment_method.value,
            notes=order_data.notes
        )
        
        # Convert domain entity to response
        # Convert domain entity to response
        # Convert domain entity to response
        # Using model_validate because our entities now match the schema fields (customer_name etc)
        response = OrderResponse.from_orm(created_order)
        # Note: OrderResponse.from_orm works because ConfigDict(from_attributes=True) is set.
        # But wait, dataclasses might need different handling. Let's use a manual mapper but cleaner.
        
        # Actually, let's keep the manual mapping for safety with dataclasses
        response = OrderResponse(
            id=created_order.id,
            owner_id=created_order.owner_id,
            order_code=created_order.order_code,
            customer_id=created_order.customer_id,
            customer_name=created_order.customer_name,
            customer_phone=created_order.customer_phone,
            order_date=created_order.order_date,
            order_type=created_order.order_type.value,
            subtotal=created_order.subtotal,
            tax_rate=created_order.tax_rate,
            tax_amount=created_order.tax_amount,
            discount_amount=created_order.discount_amount,
            total_amount=created_order.total_amount,
            paid_amount=created_order.paid_amount,
            debt_amount=created_order.debt_amount,
            payment_method=created_order.payment_method.value,
            payment_status=created_order.payment_status.value,
            notes=created_order.notes,
            items=[
                OrderItemResponse(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    unit_id=item.unit_id,
                    unit_name=item.unit_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    discount_percent=item.discount_percent,
                    discount_amount=item.discount_amount,
                    line_total=item.subtotal
                )
                for item in created_order.items
            ],
            created_at=created_order.created_at or created_order.order_date
        )
        
        # Log Audit
        AuditService.log_action(
            db=db,
            user_id=current_user.user_id,
            action="CREATE_ORDER",
            resource_type="ORDER",
            resource_id=created_order.id,
            owner_id=current_user.owner_id,
            details={"order_code": created_order.order_code, "total": float(created_order.total_amount)}
        )
        
        return response
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get order by ID"""
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    order_repo = SQLAlchemyOrderRepository(db)
    order = await order_repo.get_by_id(order_id, current_user.owner_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đơn hàng có ID: {order_id}"
        )
    
    return OrderResponse(
        id=order.id,
        owner_id=order.owner_id,
        order_code=order.order_code,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        customer_phone=order.customer_phone,
        order_date=order.order_date,
        order_type=order.order_type.value,
        subtotal=order.subtotal,
        tax_rate=order.tax_rate,
        tax_amount=order.tax_amount,
        discount_amount=order.discount_amount,
        total_amount=order.total_amount,
        paid_amount=order.paid_amount,
        debt_amount=order.debt_amount,
        payment_method=order.payment_method.value,
        payment_status=order.payment_status.value,
        notes=order.notes,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product_name,
                unit_id=item.unit_id,
                unit_name=item.unit_name,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percent=item.discount_percent,
                discount_amount=item.discount_amount,
                line_total=item.subtotal
            )
            for item in order.items
        ],
        created_at=order.created_at
    )


@router.get("", response_model=PaginatedResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    customer_id: Optional[int] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List orders for current user's owner with filters (Paginated)"""
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    order_repo = SQLAlchemyOrderRepository(db)
    skip = (page - 1) * page_size
    
    # If user is CUSTOMER, force filter by their customer_id
    if current_user.role == "CUSTOMER":
        from infrastructure.database.models import Customer as CustomerModel
        customer_record = db.query(CustomerModel).filter(CustomerModel.user_id == current_user.user_id).first()
        if not customer_record:
            return {"items": [], "total": 0, "page": page, "page_size": page_size, "total_pages": 0}
        customer_id = customer_record.id
        
    orders = await order_repo.list_by_owner(
        owner_id=current_user.owner_id,
        skip=skip,
        limit=page_size,
        start_date=start_date,
        end_date=end_date,
        search=search,
        status=status,
        customer_id=customer_id
    )
    
    # Get total count for pagination
    total = await order_repo.count_by_owner(current_user.owner_id)
    
    result_items = [
        OrderResponse(
            id=order.id,
            owner_id=order.owner_id,
            order_code=order.order_code,
            customer_id=order.customer_id,
            customer_name=order.customer_name,
            customer_phone=order.customer_phone,
            order_date=order.order_date,
            order_type=order.order_type.value,
            subtotal=order.subtotal,
            tax_rate=order.tax_rate,
            tax_amount=order.tax_amount,
            discount_amount=order.discount_amount,
            total_amount=order.total_amount,
            paid_amount=order.paid_amount,
            debt_amount=order.debt_amount,
            payment_method=order.payment_method.value,
            payment_status=order.payment_status.value,
            notes=order.notes,
            items=[
                OrderItemResponse(
                    id=item.id,
                    product_id=item.product_id,
                    product_name=item.product_name,
                    unit_id=item.unit_id,
                    unit_name=item.unit_name,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    discount_percent=item.discount_percent,
                    discount_amount=item.discount_amount,
                    line_total=item.subtotal
                )
                for item in order.items
            ],
            created_at=order.created_at or order.order_date
        )
        for order in orders
    ]
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    current_user: CurrentUser = Depends(require_permission("can_delete_orders")),
    db: Session = Depends(get_db)
):
    """Delete order (soft delete)"""
    order_repo = SQLAlchemyOrderRepository(db)
    # Check if order exists and belongs to owner
    order = await order_repo.get_by_id(order_id, current_user.owner_id)
    if not order:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")
        
    # Standard repository delete or custom logic?
    # For now, let's assume we use a soft delete or just remove
    # (Checking repository for method)
    if hasattr(order_repo, "delete"):
        await order_repo.delete(order_id, current_user.owner_id)
    else:
        # Fallback to direct SQLAlchemy delete if method missing in repo
        from infrastructure.database.models import Order as OrderModel
        db.query(OrderModel).filter(
            OrderModel.id == order_id, 
            OrderModel.owner_id == current_user.owner_id
        ).delete()
        db.commit()
    
    # Log Audit
    AuditService.log_action(
        db=db,
        user_id=current_user.user_id,
        action="DELETE_ORDER",
        resource_type="ORDER",
        resource_id=order_id,
        owner_id=current_user.owner_id,
        details={"order_id": order_id}
    )
    
    return None
