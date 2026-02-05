"""
Portal routes for CUSTOMER role
Path: backend/api/v1/routes/portal.py
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from infrastructure.database.connection import get_db
from infrastructure.database.models import Order, Debt, User
from api.schemas import OrderResponse, DebtSummaryResponse, UserMeResponse, PaginatedOrdersResponse, PaginatedDebtsResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role
from sqlalchemy.sql import func

router = APIRouter()

@router.get("/orders", response_model=PaginatedOrdersResponse)
async def get_my_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(require_role("CUSTOMER")),
    db: Session = Depends(get_db)
):
    """Get orders belonging to the authenticated customer with pagination"""
    if not current_user.customer_id:
        raise HTTPException(status_code=400, detail="Người dùng không phải là khách hàng được liên kết")
    
    query = db.query(Order).filter(
        Order.customer_id == current_user.customer_id
    )
    
    total = query.count()
    orders = query.order_by(Order.created_at.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return PaginatedOrdersResponse(
        items=orders,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

@router.get("/debts", response_model=PaginatedDebtsResponse)
async def get_my_debts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(require_role("CUSTOMER")),
    db: Session = Depends(get_db)
):
    """Get debts belonging to the authenticated customer with pagination"""
    if not current_user.customer_id:
        raise HTTPException(status_code=400, detail="Người dùng không phải là khách hàng được liên kết")
    
    query = db.query(Debt).filter(
        Debt.customer_id == current_user.customer_id
    )
    
    total = query.count()
    debts = query.order_by(Debt.created_at.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    # Calculate total pending amount for this customer
    total_pending = db.query(func.sum(Debt.remaining_amount)).filter(
        Debt.customer_id == current_user.customer_id
    ).scalar() or 0
    
    return PaginatedDebtsResponse(
        items=debts,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
        total_amount_pending=total_pending
    )

@router.get("/profile", response_model=UserMeResponse)
async def get_my_profile(
    current_user: CurrentUser = Depends(require_role("CUSTOMER")),
    db: Session = Depends(get_db)
):
    """Get current customer profile"""
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
        
    return UserMeResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        owner_id=current_user.owner_id,
        customer_id=current_user.customer_id,
        is_active=user.is_active,
        last_login_at=user.last_login_at
    )

@router.put("/profile", response_model=UserMeResponse)
async def update_my_profile(
    user_data: dict, # Change to body
    current_user: CurrentUser = Depends(require_role("CUSTOMER")),
    db: Session = Depends(get_db)
):
    """Update current customer profile"""
    user = db.query(User).filter(User.id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    
    # Update User Info
    if "full_name" in user_data:
        user.full_name = user_data["full_name"]
    if "phone" in user_data:
        user.phone = user_data["phone"]
        
    # Update Customer Info (Address)
    from infrastructure.database.models import Customer
    if current_user.customer_id:
        customer = db.query(Customer).filter(Customer.id == current_user.customer_id).first()
        if customer:
            if "address" in user_data:
                customer.address = user_data["address"]
            if "full_name" in user_data:
                customer.full_name = user_data["full_name"] # Sync name
            if "phone" in user_data:
                customer.phone = user_data["phone"] # Sync phone

    db.commit()
    db.refresh(user)
    
    return UserMeResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        role=user.role,
        owner_id=current_user.owner_id,
        customer_id=current_user.customer_id,
        is_active=user.is_active,
        last_login_at=user.last_login_at
    )
