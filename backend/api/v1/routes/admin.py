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

class PlanCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    max_employees: int
    max_products: int
    max_orders_per_month: int
    features: str | None = None
    is_active: bool = True

class PlanUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    max_employees: int | None = None
    max_products: int | None = None
    max_orders_per_month: int | None = None
    features: str | None = None
    is_active: bool | None = None

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

@router.post("/plans", response_model=PlanAdminResponse)
async def create_plan(
    plan: PlanCreate,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Create a new subscription plan."""
    # Check if name exists
    existing = db.query(PlanModel).filter(PlanModel.name == plan.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Plan name already exists")
    
    new_plan = PlanModel(**plan.dict())
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.put("/plans/{plan_id}", response_model=PlanAdminResponse)
async def update_plan(
    plan_id: int,
    plan_update: PlanUpdate,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Update a subscription plan."""
    db_plan = db.query(PlanModel).filter(PlanModel.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    update_data = plan_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/plans/{plan_id}")
async def delete_plan(
    plan_id: int,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Delete a plan (if not used) or deactivate it."""
    db_plan = db.query(PlanModel).filter(PlanModel.id == plan_id).first()
    if not db_plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Check if used by any owner
    from infrastructure.database.models import Owner
    count = db.query(Owner).filter(Owner.subscription_plan_id == plan_id).count()
    if count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete plan in use (assigned to owners). Deactivate it instead.")
    
    db.delete(db_plan)
    db.commit()
    return {"message": "Plan deleted"}

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
    current_user: UserModel = Depends(require_role("ADMIN", "OWNER")),
    db: Session = Depends(get_db)
):
    """Broadcast an announcement to all owners, employees, and customers."""
    from infrastructure.database.models import Notification, Owner, Employee, Customer, NotificationTypeEnum
    
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
            notification_type=NotificationTypeEnum.SYSTEM,
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
            notification_type=NotificationTypeEnum.SYSTEM,
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
            notification_type=NotificationTypeEnum.SYSTEM,
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
            order.payment_status.value if order.payment_status else "UNKNOWN",
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


@router.get("/config")
async def get_system_config(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Get system configuration."""
    from infrastructure.database.models import SystemConfig
    configs = db.query(SystemConfig).all()
    
    result = {}
    for c in configs:
        result[c.key] = c.value
    
    # Defaults if missing
    if not result:
        return {
            "APP_NAME": "BizFlow Platform",
            "SUPPORT_EMAIL": "support@bizflow.vn",
            "VERSION": "2.0.0"
        }
        
    return result

class ConfigUpdate(BaseModel):
    items: dict[str, str]

@router.post("/config")
async def update_system_config(
    config_data: ConfigUpdate,
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Update system configuration."""
    from infrastructure.database.models import SystemConfig
    
    for k, v in config_data.items.items():
        conf = db.query(SystemConfig).filter(SystemConfig.key == k).first()
        if conf:
            conf.value = v
        else:
            new_conf = SystemConfig(key=k, value=v, description="Setting")
            db.add(new_conf)
    
    db.commit()
    return {"message": "Config updated"}


@router.get("/announcements/history")
async def list_announcements_history(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """List history of published announcements (from Audit Logs)."""
    from infrastructure.database.models import AuditLog
    logs = db.query(AuditLog).filter(
        AuditLog.action == "PUBLISH_ANNOUNCEMENT"
    ).order_by(AuditLog.created_at.desc()).limit(20).all()
    
    result = []
    for log in logs:
        try:
            # Format: "Admin published announcement: {title} to {n} users..."
            if ": " in log.details:
                title_part = log.details.split(": ", 1)[1]
                title = title_part.split(" to ", 1)[0]
            else:
                title = "Thông báo hệ thống"
        except:
            title = "Thông báo hệ thống"
            
        result.append({
            "id": log.id,
            "title": title,
            "message": log.details,
            "created_at": log.created_at
        })
    return result
@router.get("/reports/users/export")
async def export_users_report(
    current_user: UserModel = Depends(require_role("ADMIN")),
    db: Session = Depends(get_db)
):
    """Export all users as CSV."""
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    # Get all users
    users = db.query(UserModel).order_by(UserModel.created_at.desc()).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "ID", "Tên đầy đủ", "Email", "Vai trò", "Trạng thái", "Ngày tham gia"
    ])
    
    # Data rows
    for u in users:
        role_display = u.role.value if u.role else "N/A"
        created_at_str = u.created_at.strftime("%d/%m/%Y %H:%M") if u.created_at else ""
        status_str = "Hoạt động" if u.is_active else "Bị khóa"
        
        writer.writerow([
            str(u.id),
            u.full_name or "",
            u.email,
            role_display,
            status_str,
            created_at_str
        ])
    
    # Prepare response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=danh_sach_nguoi_dung.csv"
        }
    )

