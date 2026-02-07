"""
Product management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from infrastructure.database.connection import get_db
from infrastructure.database.product_repository_impl import SQLAlchemyProductRepository
from api.schemas import ProductCreate, ProductUpdate, ProductResponse, PaginatedResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role
from domain.entities.product import Product as ProductEntity
from domain.services.audit_service import AuditService
from api.v1.auth.permissions import require_permission

router = APIRouter()


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    current_user: CurrentUser = Depends(require_permission("can_edit_products")),
    db: Session = Depends(get_db)
):
    """
    Create a new product.
    
    Requires: OWNER role
    """
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    product_repo = SQLAlchemyProductRepository(db)
    
    # Check if product code already exists
    existing = await product_repo.get_by_code(product_data.product_code, current_user.owner_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã sản phẩm {product_data.product_code} đã tồn tại"
        )
    
    # Create product entity
    product = ProductEntity(
        id=None,
        owner_id=current_user.owner_id,
        product_code=product_data.product_code,
        name=product_data.name,
        description=product_data.description,
        category=product_data.category,
        base_unit_id=product_data.base_unit_id,
        base_price=product_data.base_price,
        cost_price=product_data.cost_price,
        image_url=product_data.image_url,
        units=[u.dict() for u in product_data.units] if product_data.units else None,
        is_active=True
    )
    
    created_product = await product_repo.create(product)
    
    # Log Audit
    AuditService.log_action(
        db=db,
        user_id=current_user.user_id,
        action="CREATE_PRODUCT",
        resource_type="PRODUCT",
        resource_id=created_product.id,
        owner_id=current_user.owner_id,
        details={"product_code": created_product.product_code, "name": created_product.name}
    )
    
    return ProductResponse(
        id=created_product.id,
        owner_id=created_product.owner_id,
        product_code=created_product.product_code,
        name=created_product.name,
        description=created_product.description,
        category=created_product.category,
        base_unit_id=created_product.base_unit_id,
        base_price=created_product.base_price,
        cost_price=created_product.cost_price,
        image_url=created_product.image_url,
        is_active=created_product.is_active,
        created_at=created_product.created_at
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get product by ID"""
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    product_repo = SQLAlchemyProductRepository(db)
    product = await product_repo.get_by_id(product_id, current_user.owner_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm có ID: {product_id}"
        )
    
    return ProductResponse(
        id=product.id,
        owner_id=product.owner_id,
        product_code=product.product_code,
        name=product.name,
        description=product.description,
        category=product.category,
        base_unit_id=product.base_unit_id,
        base_price=product.base_price,
        cost_price=product.cost_price,
        image_url=product.image_url,
        is_active=product.is_active,
        available_quantity=product.available_quantity,
        units=product.units,
        created_at=product.created_at
    )


@router.get("", response_model=PaginatedResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List products for current user's owner (Paginated)"""
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    product_repo = SQLAlchemyProductRepository(db)
    skip = (page - 1) * page_size
    
    # Import inventory repo to get stock levels
    from infrastructure.database.inventory_repository_impl import SQLAlchemyInventoryRepository
    inventory_repo = SQLAlchemyInventoryRepository(db)
    
    if search:
        # Search results (usually not heavily paginated for simple search but let's be consistent)
        products = await product_repo.search_by_name(search, current_user.owner_id, limit=page_size)
        total = len(products) # For search, total is often just the results length unless we do double count
    else:
        products = await product_repo.list_by_owner(
            owner_id=current_user.owner_id,
            skip=skip,
            limit=page_size,
            category=category
        )
        total = await product_repo.count_by_owner(current_user.owner_id)
    
    # Fetch inventory for each product
    result_items = []
    for product in products:
        # Get inventory to include available quantity
        inventory = await inventory_repo.get_by_product(product.id, current_user.owner_id)
        available_qty = inventory.get_available_quantity() if inventory else 0
        
        # Map product units to response format
        units_data = []
        if hasattr(product, 'units') and product.units:
            for pu in product.units:
                units_data.append({
                    'id': pu['id'],
                    'unit_id': pu['unit_id'],
                    'unit_name': pu['unit_name'],
                    'conversion_rate': pu['conversion_rate'],
                    'price': pu['price'],
                    'is_default': pu['is_default']
                })
        
        result_items.append(
            ProductResponse(
                id=product.id,
                owner_id=product.owner_id,
                product_code=product.product_code,
                name=product.name,
                description=product.description,
                category=product.category,
                base_unit_id=product.base_unit_id,
                base_price=product.base_price,
                cost_price=product.cost_price,
                image_url=product.image_url,
                is_active=product.is_active,
                available_quantity=available_qty,
                units=units_data,
                created_at=product.created_at
            )
        )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "items": result_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: CurrentUser = Depends(require_permission("can_edit_products")),
    db: Session = Depends(get_db)
):
    """Update product"""
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    product_repo = SQLAlchemyProductRepository(db)
    product = await product_repo.get_by_id(product_id, current_user.owner_id)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm có ID: {product_id}"
        )
    
    # Update fields
    if product_data.name is not None:
        product.name = product_data.name
    if product_data.description is not None:
        product.description = product_data.description
    if product_data.category is not None:
        product.category = product_data.category
    if product_data.base_price is not None:
        product.base_price = product_data.base_price
    if product_data.cost_price is not None:
        product.cost_price = product_data.cost_price
    if product_data.image_url is not None:
        product.image_url = product_data.image_url
    if product_data.is_active is not None:
        product.is_active = product_data.is_active
    
    updated_product = await product_repo.update(product)
    
    # Log Audit
    AuditService.log_action(
        db=db,
        user_id=current_user.user_id,
        action="UPDATE_PRODUCT",
        resource_type="PRODUCT",
        resource_id=updated_product.id,
        owner_id=current_user.owner_id,
        details={"product_code": updated_product.product_code, "changes": product_data.dict(exclude_unset=True)}
    )
    
    return ProductResponse(
        id=updated_product.id,
        owner_id=updated_product.owner_id,
        product_code=updated_product.product_code,
        name=updated_product.name,
        description=updated_product.description,
        category=updated_product.category,
        base_unit_id=updated_product.base_unit_id,
        base_price=updated_product.base_price,
        cost_price=updated_product.cost_price,
        image_url=updated_product.image_url,
        is_active=updated_product.is_active,
        created_at=updated_product.created_at
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    current_user: CurrentUser = Depends(require_permission("can_edit_products")),
    db: Session = Depends(get_db)
):
    """Delete product (soft delete)"""
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    product_repo = SQLAlchemyProductRepository(db)
    success = await product_repo.delete(product_id, current_user.owner_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy sản phẩm có ID: {product_id}"
        )
        
    # Log Audit
    AuditService.log_action(
        db=db,
        user_id=current_user.user_id,
        action="DELETE_PRODUCT",
        resource_type="PRODUCT",
        resource_id=product_id,
        owner_id=current_user.owner_id,
        details={"product_id": product_id}
    )


@router.get("/{product_id}/suggest-price")
async def suggest_product_price(
    product_id: int,
    customer_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Suggest price based on customer's last order of this product."""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    from infrastructure.database.models import Order, OrderItem
    
    last_item = db.query(OrderItem).join(Order).filter(
        Order.owner_id == current_user.owner_id,
        Order.customer_id == customer_id,
        OrderItem.product_id == product_id,
        Order.order_type == "SALE"
    ).order_by(Order.order_date.desc()).first()
    
    if last_item:
        return {"suggested_price": float(last_item.unit_price)}
    
    return {"suggested_price": None}
