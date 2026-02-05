from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from config.settings import settings
from infrastructure.database.connection import get_db
from infrastructure.database.models import User as UserModel, Owner as OwnerModel, Employee as EmployeeModel
from api.v1.auth.utils import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def _get_owner_id_robust(db: Session, user: UserModel) -> int | None:
    """
    Resolve owner_id for current user. (Shared logic)
    """
    # 1) Try OWNER profile
    try:
        owner = db.query(OwnerModel).filter(OwnerModel.user_id == user.id).first()
        if owner:
            return int(owner.id)
    except Exception:
        pass

    # 2) EMPLOYEE -> owner_id
    if getattr(user, "role", None) is not None and getattr(user.role, "value", None) == "EMPLOYEE":
        try:
            employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == user.id).first()
            if employee and getattr(employee, "owner_id", None) is not None:
                return int(employee.owner_id)
        except Exception:
            pass

    return None

def _get_customer_id_robust(db: Session, user: UserModel) -> int | None:
    """
    Resolve customer_id for current user.
    """
    if getattr(user, "role", None) is not None and getattr(user.role, "value", None) == "CUSTOMER":
        from infrastructure.database.models import Customer as CustomerModel
        customer = db.query(CustomerModel).filter(CustomerModel.user_id == user.id).first()
        if customer:
            return int(customer.id)
    return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserModel:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user

async def get_current_active_user(
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserModel:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Attach owner_id and customer_id to user object dynamically
    current_user.owner_id = _get_owner_id_robust(db, current_user)
    current_user.customer_id = _get_customer_id_robust(db, current_user)
    
    # If customer, owner_id might need to be resolved from customer record
    if current_user.role.value == "CUSTOMER" and not current_user.owner_id and current_user.customer_id:
        from infrastructure.database.models import Customer as CustomerModel
        customer = db.query(CustomerModel).filter(CustomerModel.id == current_user.customer_id).first()
        if customer:
            current_user.owner_id = customer.owner_id
    
    return current_user

def require_role(*roles: str):
    """
    Dependency factory to restrict access based on user role.
    """
    async def role_checker(current_user: UserModel = Depends(get_current_active_user)):
        if current_user.role.value not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: {current_user.role.value}"
            )
        return current_user
    return role_checker
