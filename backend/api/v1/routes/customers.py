"""
Customer management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from infrastructure.database.connection import get_db
from infrastructure.database.customer_repository_impl import SQLAlchemyCustomerRepository
from infrastructure.database.debt_repository_impl import SQLAlchemyDebtRepository
from api.schemas import CustomerCreate, CustomerResponse, CustomerDetailResponse, CustomerSummaryResponse, PaginatedResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role
from domain.entities.customer import Customer as CustomerEntity, CustomerType

router = APIRouter()


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
async def create_customer(
    customer_data: CustomerCreate,
    current_user: CurrentUser = Depends(require_role("OWNER", "ADMIN", "EMPLOYEE")), # All can create
    db: Session = Depends(get_db)
):
    """
    Create a new customer.
    """
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    # Validate required fields
    # Phone/Email are optional in database, relaxing validation if business wants
    pass
    
    customer_repo = SQLAlchemyCustomerRepository(db)
    
    # Check phone uniqueness within tenant
    from infrastructure.database.models import Customer as CustomerModel
    existing_phone = db.query(CustomerModel).filter(
        CustomerModel.owner_id == current_user.owner_id,
        CustomerModel.phone == customer_data.phone,
        CustomerModel.is_active == True
    ).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số điện thoại đã được dùng"
        )
    
    # Check email uniqueness within tenant
    existing_email = db.query(CustomerModel).filter(
        CustomerModel.owner_id == current_user.owner_id,
        CustomerModel.email == customer_data.email,
        CustomerModel.is_active == True
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được dùng"
        )
    
    code = customer_data.customer_code
    if code == "AUTO":
        code = await customer_repo.generate_customer_code(current_user.owner_id)
    
    # Check existing code
    existing = await customer_repo.get_by_code(code, current_user.owner_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã khách hàng {code} đã tồn tại"
        )
        
    customer = CustomerEntity(
        id=None,
        owner_id=current_user.owner_id,
        customer_code=code,
        full_name=customer_data.full_name,
        phone=customer_data.phone,
        email=customer_data.email,
        address=customer_data.address,
        customer_type=CustomerType(customer_data.customer_type),
        tax_code=customer_data.tax_code,
        credit_limit=customer_data.credit_limit,
        is_active=True
    )
    
    created_customer = await customer_repo.create(customer)
    return CustomerResponse.from_orm(created_customer)


@router.get("/{customer_id}", response_model=CustomerDetailResponse)
async def get_customer(
    customer_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get customer by ID with summary stats"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Người dùng không thuộc về bất kỳ cửa hàng nào")
    
    customer_repo = SQLAlchemyCustomerRepository(db)
    customer = await customer_repo.get_by_id(customer_id, current_user.owner_id)
    
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
        
    summary = await customer_repo.get_customer_summary(customer_id, current_user.owner_id)
    
    response_data = customer.__dict__
    response_data.update(summary)
    
    return CustomerDetailResponse(**response_data)


@router.get("", response_model=PaginatedResponse)
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    q: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List customers with summary and search (Paginated)"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Người dùng không thuộc về bất kỳ cửa hàng nào")
        
    customer_repo = SQLAlchemyCustomerRepository(db)
    
    items, total = await customer_repo.list_customers_with_summary(
        owner_id=current_user.owner_id,
        search=q,
        page=page,
        page_size=page_size
    )
        
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    customer_data: CustomerCreate,
    current_user: CurrentUser = Depends(require_role("OWNER", "ADMIN", "EMPLOYEE")),

    db: Session = Depends(get_db)
):
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
    
    # Validate required fields
    # Phone/Email are optional in database
    pass
        
    customer_repo = SQLAlchemyCustomerRepository(db)
    customer = await customer_repo.get_by_id(customer_id, current_user.owner_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    
    # Check phone uniqueness (excluding current customer)
    from infrastructure.database.models import Customer as CustomerModel
    existing_phone = db.query(CustomerModel).filter(
        CustomerModel.owner_id == current_user.owner_id,
        CustomerModel.phone == customer_data.phone,
        CustomerModel.id != customer_id,
        CustomerModel.is_active == True
    ).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Số điện thoại đã được dùng"
        )
    
    # Check email uniqueness (excluding current customer)
    existing_email = db.query(CustomerModel).filter(
        CustomerModel.owner_id == current_user.owner_id,
        CustomerModel.email == customer_data.email,
        CustomerModel.id != customer_id,
        CustomerModel.is_active == True
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được dùng"
        )
        
    # Update fields
    customer.full_name = customer_data.full_name
    customer.phone = customer_data.phone
    customer.email = customer_data.email
    customer.address = customer_data.address
    customer.customer_type = CustomerType(customer_data.customer_type)
    customer.tax_code = customer_data.tax_code
    customer.credit_limit = customer_data.credit_limit
    
    updated = await customer_repo.update(customer)
    return CustomerResponse.from_orm(updated)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_customer(
    customer_id: int,
    current_user: CurrentUser = Depends(require_role("OWNER", "ADMIN")), # EMPLOYEE forbidden
    db: Session = Depends(get_db)
):
    """Soft delete customer"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
        
    customer_repo = SQLAlchemyCustomerRepository(db)
    success = await customer_repo.delete(customer_id, current_user.owner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Không tìm thấy khách hàng")
    
    return None
