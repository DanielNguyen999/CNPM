"""
Authentication dependencies for FastAPI
"""
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from infrastructure.database.connection import get_db
from infrastructure.database.models import User as UserModel, Owner as OwnerModel, Employee as EmployeeModel
from api.v1.auth.utils import decode_access_token

# Security scheme
security = HTTPBearer()


class CurrentUser:
    """Current authenticated user"""
    
    def __init__(
        self,
        user_id: int,
        email: str,
        role: str,
        owner_id: Optional[int] = None,
        customer_id: Optional[int] = None
    ):
        self.user_id = user_id
        self.email = email
        self.role = role
        self.owner_id = owner_id
        self.customer_id = customer_id
    
    def is_admin(self) -> bool:
        return self.role == "ADMIN"
    
    def is_owner(self) -> bool:
        return self.role == "OWNER"
    
    def is_employee(self) -> bool:
        return self.role == "EMPLOYEE"
    
    def can_access_tenant(self, owner_id: int) -> bool:
        """Check if user can access specific tenant"""
        if self.is_admin():
            return True
        return self.owner_id == owner_id


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> CurrentUser:
    """
    Get current authenticated user from JWT token.
    Supports both Authorization header (HTTPBearer) and ?token= query parameter (for SSE).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Không thể xác thực thông tin đăng nhập",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    final_token = None
    if credentials:
        final_token = credentials.credentials
    elif token:
        final_token = token
    
    if not final_token:
        raise credentials_exception
        
    payload = decode_access_token(final_token)
    
    if payload is None:
        raise credentials_exception
    
    user_id: int = payload.get("user_id")
    email: str = payload.get("email")
    role: str = payload.get("role")
    
    if user_id is None or email is None or role is None:
        raise credentials_exception
    
    # Verify user exists and is active
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_exception
    
    # Get owner_id if applicable
    owner_id = None
    if role == "OWNER":
        owner = db.query(OwnerModel).filter(OwnerModel.user_id == user_id).first()
        if owner:
            owner_id = owner.id
    elif role == "EMPLOYEE":
        employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == user_id).first()
        if employee:
            owner_id = employee.owner_id
    
    # Get customer_id if applicable
    customer_id = None
    if role == "CUSTOMER":
        from infrastructure.database.models import Customer as CustomerModel
        customer = db.query(CustomerModel).filter(CustomerModel.user_id == user_id).first()
        if customer:
            customer_id = customer.id
            owner_id = customer.owner_id # Customers are still associated with an owner (shop)
    
    return CurrentUser(
        user_id=user_id,
        email=email,
        role=role,
        owner_id=owner_id,
        customer_id=customer_id
    )


def require_role(*allowed_roles: str):
    """
    Dependency to require specific roles.
    
    Usage:
        @app.get("/admin-only")
        def admin_route(current_user: CurrentUser = Depends(require_role("ADMIN"))):
            return {"message": "Admin only"}
    """
    async def role_checker(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Vai trò {current_user.role} không được phép truy cập. Yêu cầu: {allowed_roles}"
            )
        return current_user
    
    return role_checker
