from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from infrastructure.database.connection import get_db
from infrastructure.database.models import User as UserModel, Owner as OwnerModel, SubscriptionPlan as PlanModel, UserRoleEnum
from api.v1.auth.deps import require_role
from typing import List
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

router = APIRouter()

class OwnerAdminResponse(BaseModel):
    id: int
    business_name: str
    business_address: str | None
    email: str
    full_name: str
    plan_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserAdminResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PlanAdminResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    max_employees: int
    max_products: int
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/owners", response_model=List[OwnerAdminResponse])
async def list_owners(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """List all owners (tenants) in the system."""
    objs = db.query(OwnerModel).join(UserModel, OwnerModel.user_id == UserModel.id).all()
    res = []
    for o in objs:
        res.append({
            "id": o.id,
            "business_name": o.business_name,
            "business_address": o.business_address,
            "email": o.user.email,
            "full_name": o.user.full_name,
            "plan_name": o.subscription_plan.name if o.subscription_plan else "N/A",
            "is_active": o.user.is_active,
            "created_at": o.created_at
        })
    return res

@router.get("/owners/{owner_id}", response_model=OwnerAdminResponse)
async def get_owner(
    owner_id: int,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Get detail of a specific owner."""
    o = db.query(OwnerModel).filter(OwnerModel.id == owner_id).join(UserModel, OwnerModel.user_id == UserModel.id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    return {
        "id": o.id,
        "business_name": o.business_name,
        "business_address": o.business_address,
        "email": o.user.email,
        "full_name": o.user.full_name,
        "plan_name": o.subscription_plan.name if o.subscription_plan else "N/A",
        "is_active": o.user.is_active,
        "created_at": o.created_at
    }

@router.get("/users", response_model=List[UserAdminResponse])
async def list_users(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """List all users in the system."""
    return db.query(UserModel).all()

@router.get("/plans", response_model=List[PlanAdminResponse])
async def list_plans(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """List all subscription plans."""
    return db.query(PlanModel).all()

@router.get("/dashboard-stats")
async def admin_dashboard_stats(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Platform-level stats for SuperAdmin."""
    return {
        "total_owners": db.query(OwnerModel).count(),
        "total_users": db.query(UserModel).count(),
        "total_plans": db.query(PlanModel).count(),
        "active_subscriptions": db.query(OwnerModel).count(), # Simplification
    }

@router.get("/audit-logs")
async def list_audit_logs(
    current_user: UserModel = Depends(require_role("ADMIN", "OWNER")),
    db: Session = Depends(get_db)
):
    """List audit logs. Admin sees all, Owner sees only their tenant's logs."""
    from infrastructure.database.models import AuditLog as AuditLogModel, User as UserModel
    
    query = db.query(AuditLogModel, UserModel.full_name).join(UserModel, AuditLogModel.user_id == UserModel.id)
    
    if current_user.role == UserRoleEnum.OWNER:
        query = query.filter(AuditLogModel.owner_id == current_user.owner_id)
    
    logs = query.order_by(AuditLogModel.created_at.desc()).limit(100).all()
    
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "user_full_name": full_name,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "created_at": log.created_at
        }
        for log, full_name in logs
    ]

class OwnerStatusUpdate(BaseModel):
    is_active: bool

@router.patch("/owners/{owner_id}/status")
async def update_owner_status(
    owner_id: int,
    status_update: OwnerStatusUpdate,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Lock or Unlock a tenant (owner)."""
    owner = db.query(OwnerModel).filter(OwnerModel.id == owner_id).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    
    # Update the linked user account status
    user = db.query(UserModel).filter(UserModel.id == owner.user_id).first()
    if user:
        user.is_active = status_update.is_active
    
    # Log the action
    from infrastructure.database.models import AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="LOCK_TENANT" if not status_update.is_active else "UNLOCK_TENANT",
        resource_type="OWNER",
        resource_id=owner_id,
        details=f"Admin updated owner {owner.business_name} status to {'active' if status_update.is_active else 'inactive'}",
        owner_id=owner.id # Admin action often logs against the tenant
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Owner status updated successfully", "is_active": user.is_active}

class UserPasswordReset(BaseModel):
    new_password: str

@router.patch("/users/{user_id}/password")
async def reset_user_password(
    user_id: int,
    reset_data: UserPasswordReset,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Force reset a user's password."""
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from api.v1.auth.utils import hash_password
    user.password_hash = hash_password(reset_data.new_password)
    
    # Log the action
    from infrastructure.database.models import AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="RESET_PASSWORD",
        resource_type="USER",
        resource_id=user_id,
        details=f"Admin reset password for user {user.email}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/password-requests")
async def list_password_requests(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """List all pending password reset requests."""
    from infrastructure.database.models import PasswordResetRequest as RequestModel
    results = db.query(RequestModel, UserModel.full_name, UserModel.role).join(
        UserModel, RequestModel.user_id == UserModel.id
    ).filter(RequestModel.status == "PENDING").all()
    
    return [
        {
            "id": r[0].id,
            "email": r[0].email,
            "name": r[1],
            "role": r[2],
            "status": r[0].status,
            "created_at": r[0].created_at
        }
        for r in results
    ]

@router.post("/password-requests/{request_id}/approve")
async def approve_password_request(
    request_id: int,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Approve a password reset request and set a temporary password."""
    from api.v1.auth.utils import hash_password
    import secrets
    import string

    req = db.query(RequestModel).filter(RequestModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already processed")

    user = db.query(UserModel).filter(UserModel.id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate a random temporary password
    temp_pass = ''.join(secrets.choice(string.ascii_letters + string.digits) for i in range(10))
    user.password_hash = hash_password(temp_pass)
    
    req.status = "APPROVED"
    req.resolved_at = datetime.utcnow()
    req.resolved_by = current_user.id
    
    # Log the action
    from infrastructure.database.models import AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="APPROVE_PASSWORD_RESET",
        resource_type="USER",
        resource_id=user.id,
        details=f"Admin approved reset for {user.email}. Temporary password: {temp_pass}"
    )
    db.add(audit)
    db.commit()
    
    return {"message": "Request approved", "temp_password": temp_pass}

@router.post("/password-requests/{request_id}/reject")
async def reject_password_request(
    request_id: int,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Reject a password reset request."""
    from infrastructure.database.models import PasswordResetRequest as RequestModel
    req = db.query(RequestModel).filter(RequestModel.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "REJECTED"
    req.resolved_at = datetime.utcnow()
    req.resolved_by = current_user.id
    db.commit()
    return {"message": "Request rejected"}

class AnnouncementCreate(BaseModel):
    title: str
    message: str

@router.post("/announcements")
async def publish_announcement(
    announcement: AnnouncementCreate,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Broadcast an announcement to all owners, employees, and customers."""
    from infrastructure.database.models import Notification, Owner, Employee, Customer
    
    # 1. Get all owners
    owners = db.query(Owner).all()
    # 2. Get all employees
    employees = db.query(Employee).all()
    # 3. Get all customers with user accounts
    customers = db.query(Customer).filter(Customer.user_id.isnot(None)).all()
    
    notifications = []
    
    # Notify Owners
    for owner in owners:
        notifications.append(Notification(
            user_id=owner.user_id,
            owner_id=owner.id,
            notification_type="SYSTEM",
            title=announcement.title,
            message=announcement.message,
            reference_type="ANNOUNCEMENT",
            is_read=False
        ))
        
    # Notify Employees
    for emp in employees:
        notifications.append(Notification(
            user_id=emp.user_id,
            owner_id=emp.owner_id,
            notification_type="SYSTEM",
            title=announcement.title,
            message=announcement.message,
            reference_type="ANNOUNCEMENT",
            is_read=False
        ))
    
    # Notify Customers (NEW)
    for customer in customers:
        notifications.append(Notification(
            user_id=customer.user_id,
            owner_id=customer.owner_id,  # Customer's linked tenant
            notification_type="SYSTEM",
            title=announcement.title,
            message=announcement.message,
            reference_type="ANNOUNCEMENT",
            is_read=False
        ))
    
    db.add_all(notifications)
    
    # Log the action
    from infrastructure.database.models import AuditLog
    audit = AuditLog(
        user_id=current_user.id,
        action="PUBLISH_ANNOUNCEMENT",
        resource_type="SYSTEM",
        details=f"Admin published announcement: {announcement.title} to {len(notifications)} users (owners, employees, customers)"
    )
    db.add(audit)
    db.commit()
    
    return {"message": f"Announcement published to {len(notifications)} users."}


@router.get("/reports/export")
async def export_reports(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Export system reports as CSV."""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    from infrastructure.database.models import Order as OrderModel, Customer as CustomerModel
    
    # Get all orders with customer info
    orders = db.query(OrderModel, CustomerModel.full_name, CustomerModel.phone).join(
        CustomerModel, OrderModel.customer_id == CustomerModel.id
    ).order_by(OrderModel.order_date.desc()).limit(1000).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Mã đơn", "Khách hàng", "SĐT", "Tổng tiền", 
        "Trạng thái", "Ngày đặt", "Ghi chú"
    ])
    
    # Data rows
    for order, customer_name, customer_phone in orders:
        writer.writerow([
            order.order_code,
            customer_name,
            customer_phone or "",
            order.total_amount,
            order.status,
            order.order_date.strftime("%d/%m/%Y") if order.order_date else "",
            order.notes or ""
        ])
    
    # Prepare response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=bao_cao_don_hang.csv"
        }
    )
