from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date

from infrastructure.database.connection import get_db
from infrastructure.database.models import User as UserModel, Employee as EmployeeModel, Owner as OwnerModel, UserRoleEnum
from api.schemas import UserCreate, UserResponse, UserRole, UserProfileUpdate, StoreProfileUpdate
from api.v1.auth.deps import get_current_active_user, require_role, _get_owner_id_robust
from api.v1.auth.utils import hash_password

from typing import List

router = APIRouter()

@router.get("/employees", response_model=List[UserResponse])
async def list_employees(
    current_user: UserModel = Depends(require_role("OWNER")),
    db: Session = Depends(get_db)
):
    """
    List all employees for the current owner.
    """
    owner_id = getattr(current_user, "owner_id", None)
    if not owner_id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )
    
    # Query users who have an Employee record linked to this owner
    employees = db.query(UserModel).join(EmployeeModel).filter(
        EmployeeModel.owner_id == owner_id
    ).all()
    
    return employees


@router.post("/employees", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    request: UserCreate,
    current_user: UserModel = Depends(require_role("OWNER")),
    db: Session = Depends(get_db)
):
    """
    Create a new employee (restricted to OWNER).
    """
    if request.role != UserRole.EMPLOYEE:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ có thể tạo người dùng với vai trò NHÂN VIÊN"
        )

    # 1. Check if email exists
    existing_user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký"
        )
    
    # 2. Get owner profile
    owner_id = getattr(current_user, "owner_id", None)
    if not owner_id:
         raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )

    # 3. Create User
    new_user = UserModel(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        phone=request.phone,
        role=UserRoleEnum.EMPLOYEE,
        is_active=True
    )
    db.add(new_user)
    db.flush()

    # 4. Create Employee Profile
    new_employee = EmployeeModel(
        user_id=new_user.id,
        owner_id=owner_id,
        hire_date=date.today(),
        position="Staff"
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: UserProfileUpdate,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile info.
    """
    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.phone is not None:
        current_user.phone = request.phone
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/store", response_model=dict)
async def get_store_info(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get store/owner info for the current user.
    """
    owner_id = _get_owner_id_robust(db, current_user)
    if not owner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin cửa hàng cho người dùng này"
        )
    
    owner = db.query(OwnerModel).filter(OwnerModel.id == owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bản ghi cửa hàng"
        )
    
    return {
        "id": owner.id,
        "business_name": owner.business_name,
        "business_address": owner.business_address,
        "tax_code": owner.tax_code,
        # footer_notes could be stored in a new field or a settings JSON if we had one
        # For now, let's just return what we have
    }


@router.put("/store", response_model=dict)
async def update_store_info(
    request: StoreProfileUpdate,
    current_user: UserModel = Depends(require_role("OWNER")),
    db: Session = Depends(get_db)
):
    """
    Update store/owner info. Only OWNER can do this.
    """
    owner_id = _get_owner_id_robust(db, current_user)
    if not owner_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy thông tin cửa hàng cho người dùng này"
        )
    
    owner = db.query(OwnerModel).filter(OwnerModel.id == owner_id).first()
    if not owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy bản ghi cửa hàng"
        )
    
    if request.business_name is not None:
        owner.business_name = request.business_name
    if request.business_address is not None:
        owner.business_address = request.business_address
    if request.tax_code is not None:
        owner.tax_code = request.tax_code
    
    db.commit()
    db.refresh(owner)
    
    return {
        "id": owner.id,
        "business_name": owner.business_name,
        "business_address": owner.business_address,
        "tax_code": owner.tax_code,
    }

@router.get("/me/permissions")
async def get_my_permissions(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get granular permissions for the current logged-in user"""
    if current_user.role == UserRoleEnum.ADMIN or current_user.role == UserRoleEnum.OWNER:
        # These roles have all permissions implicitly, but return a full list if needed
        # For now, UI handles them as "all granted"
        return []
    
    employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == current_user.id).first()
    if not employee:
        return []
        
    from infrastructure.database.employee_permission_repository_impl import SQLAlchemyEmployeePermissionRepository
    repo = SQLAlchemyEmployeePermissionRepository(db)
    perms = await repo.get_by_employee(employee.id)
    return perms

@router.get("/employees/{user_id}/permissions")
async def get_employee_permissions(
    user_id: int,
    current_user: UserModel = Depends(require_role("OWNER")),
    db: Session = Depends(get_db)
):
    """Get granular permissions for an employee"""
    employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
    
    from infrastructure.database.employee_permission_repository_impl import SQLAlchemyEmployeePermissionRepository
    repo = SQLAlchemyEmployeePermissionRepository(db)
    perms = await repo.get_by_employee(employee.id)
    return perms

@router.post("/employees/{user_id}/permissions")
async def update_employee_permissions(
    user_id: int,
    permissions: List[dict],
    current_user: UserModel = Depends(require_role("OWNER")),
    db: Session = Depends(get_db)
):
    """Update granular permissions for an employee"""
    employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == user_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Không tìm thấy nhân viên")
    
    from infrastructure.database.employee_permission_repository_impl import SQLAlchemyEmployeePermissionRepository
    from domain.entities.employee_permission import EmployeePermission
    from datetime import datetime
    
    repo = SQLAlchemyEmployeePermissionRepository(db)
    
    for p in permissions:
        perm_entity = EmployeePermission(
            id=None,
            employee_id=employee.id,
            permission_key=p["permission_key"],
            is_granted=p["is_granted"],
            granted_by=current_user.id,
            granted_at=datetime.utcnow()
        )
        await repo.save(perm_entity)
    
    return {"status": "success"}
    return {"status": "success"}

@router.patch("/me/password")
async def change_my_password(
    reset_data: dict,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Allow a user to change their own password."""
    from api.v1.auth.utils import hash_password
    
    new_password = reset_data.get("new_password")
    if not new_password or len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Mật khẩu mới phải có ít nhất 6 ký tự")
    
    current_user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Đổi mật khẩu thành công"}


@router.post("/change-password")
async def change_password(
    password_data: dict,
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change password with old password validation.
    Requires: old_password, new_password
    """
    from api.v1.auth.utils import hash_password, verify_password
    
    old_password = password_data.get("old_password")
    new_password = password_data.get("new_password")
    
    # Validate inputs
    if not old_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng nhập mật khẩu cũ"
        )
    
    if not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vui lòng nhập mật khẩu mới"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu mới phải có ít nhất 6 ký tự"
        )
    
    # Verify old password
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu cũ không đúng"
        )
    
    # Update password
    current_user.password_hash = hash_password(new_password)
    db.commit()
    
    return {"message": "Đổi mật khẩu thành công"}

@router.post("/forgot-password")
async def request_password_reset(
    request_data: dict,
    db: Session = Depends(get_db)
):
    """Public endpoint to request a password reset (creates a pending request for admin)."""
    email = request_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp email")
    
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        # For security, we might return 200 even if user not found, 
        # but here we can be helpful or follow requirement. 
        # Requirement says "request not appearing in admin", so we need to create one.
        return {"message": "Nếu email tồn tại, yêu cầu của bạn đã được gửi tới quản trị viên."}

    from infrastructure.database.models import PasswordResetRequest
    
    # Check if a pending request already exists
    existing = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.user_id == user.id,
        PasswordResetRequest.status == "PENDING"
    ).first()
    
    if not existing:
        new_req = PasswordResetRequest(
            user_id=user.id,
            email=email,
            status="PENDING"
        )
        db.add(new_req)
        db.commit()
    
    return {"message": "Yêu cầu đã được gửi tới quản trị viên. Vui lòng chờ phê duyệt."}
