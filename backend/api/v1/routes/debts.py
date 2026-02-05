"""
Debt management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from infrastructure.database.connection import get_db
from infrastructure.database.debt_repository_impl import SQLAlchemyDebtRepository
from infrastructure.database.order_repository_impl import SQLAlchemyOrderRepository
from api.schemas import DebtSummaryResponse, DebtDetailResponse, DebtPaymentCreate, DebtPaymentResponse, PaginatedResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role
from api.v1.routes.events import publish_event
from domain.entities.debt import DebtPayment as DebtPaymentEntity, DebtPaymentMethod
from usecases.repay_debt import RepayDebtUseCase
from domain.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=PaginatedResponse)
async def list_debts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    sort: str = Query("latest"), # latest, largest_remaining, nearest_due
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List debts with advanced filters and pagination"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    repo = SQLAlchemyDebtRepository(db)
    
    # If user is CUSTOMER, force filter by their customer_id
    if current_user.role == "CUSTOMER":
        from infrastructure.database.models import Customer as CustomerModel
        customer_record = db.query(CustomerModel).filter(CustomerModel.user_id == current_user.user_id).first()
        if not customer_record:
            return PaginatedResponse(items=[], total=0, page=page, page_size=page_size, total_pages=0)
        customer_id = customer_record.id
        
    items, total = await repo.list_debts(
        owner_id=current_user.owner_id,
        status=status,
        customer_id=customer_id,
        sort=sort,
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


@router.get("/{debt_id}", response_model=DebtDetailResponse)
async def get_debt(
    debt_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get debt details with payment history"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    repo = SQLAlchemyDebtRepository(db)
    debt_detail = await repo.get_debt_detail(debt_id, current_user.owner_id)
    
    if not debt_detail:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ công nợ")
        
    # Security check for Customer
    if current_user.role == "CUSTOMER":
        from infrastructure.database.models import Customer as CustomerModel
        customer_record = db.query(CustomerModel).filter(CustomerModel.user_id == current_user.user_id).first()
        if not customer_record or debt_detail['customer_id'] != customer_record.id:
             raise HTTPException(status_code=403, detail="Không có quyền truy cập")
        
    return DebtDetailResponse(**debt_detail)


@router.post("/{debt_id}/repay", response_model=DebtDetailResponse)
async def record_payment(
    debt_id: int,
    payment: DebtPaymentCreate,
    current_user: CurrentUser = Depends(require_role("OWNER", "ADMIN", "EMPLOYEE")),
    db: Session = Depends(get_db)
):
    """
    Record a payment for a specific debt.
    """
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Repos
    debt_repo = SQLAlchemyDebtRepository(db)
    order_repo = SQLAlchemyOrderRepository(db)
    
    # Use Case
    use_case = RepayDebtUseCase(debt_repo, order_repo)
    
    try:
        await use_case.execute(
            debt_id=debt_id,
            owner_id=current_user.owner_id,
            payment_amount=payment.payment_amount,
            payment_method=payment.payment_method,
            payment_date=payment.payment_date,
            reference_number=payment.reference_number,
            notes=payment.notes,
            created_by=current_user.user_id
        )
        
        # Return updated detail
        updated_detail = await debt_repo.get_debt_detail(debt_id, current_user.owner_id)
        
        # Trigger real-time UI update via SSE
        if updated_detail:
            await publish_event(
                owner_id=current_user.owner_id,
                event_type="DEBT_REPAID",
                data={
                    "debt_id": debt_id,
                    "payment_amount": float(payment.payment_amount),
                    "remaining_amount": float(updated_detail["remaining_amount"]),
                    "status": updated_detail["status"]
                }
            )
        
        return DebtDetailResponse(**updated_detail)
        
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{debt_id}/payments", response_model=List[DebtPaymentResponse])
async def get_debt_payments(
    debt_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get payment history for a debt"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    repo = SQLAlchemyDebtRepository(db)
    
    # Security check for Customer (Retrieve debt first to check ownership)
    if current_user.role == "CUSTOMER":
        from infrastructure.database.models import Customer as CustomerModel
        from infrastructure.database.models import Debt as DebtModel
        customer_record = db.query(CustomerModel).filter(CustomerModel.user_id == current_user.user_id).first()
        debt = db.query(DebtModel).filter(DebtModel.id == debt_id).first()
        if not customer_record or not debt or debt.customer_id != customer_record.id:
             raise HTTPException(status_code=403, detail="Không có quyền truy cập")
    
    payments = await repo.get_payments(debt_id, current_user.owner_id)
    
    return [DebtPaymentResponse.from_orm(p) for p in payments]
