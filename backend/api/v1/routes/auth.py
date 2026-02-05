"""
Authentication routes
Path: backend/api/routes/auth.py
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func

from infrastructure.database.connection import get_db
from infrastructure.database.models import (
    User as UserModel,
    Owner as OwnerModel,
    Employee as EmployeeModel,
)
from api.schemas import LoginRequest, LoginResponse
from api.v1.auth.utils import verify_password, hash_password, create_access_token, decode_access_token

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


from api.v1.auth.deps import get_current_active_user, _get_owner_id_robust, _get_customer_id_robust
from api.schemas import OwnerRegisterRequest, CustomerRegisterRequest, UserRole
from infrastructure.database.models import UserRoleEnum, CustomerTypeEnum, Customer as CustomerModel
from datetime import date, timedelta


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(request: OwnerRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new Owner and create their business profile.
    """
    # 1. Check if email exists
    existing_user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký"
        )
    
    # 2. Get target subscription plan (FREE by default)
    from infrastructure.database.models import SubscriptionPlan
    free_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == "FREE").first()
    if not free_plan:
        # Emergency fallback if seed hasn't run
        free_plan = SubscriptionPlan(
            name="FREE", 
            description="Default free plan", 
            price=0, 
            max_employees=1, 
            max_products=100, 
            max_orders_per_month=500
        )
        db.add(free_plan)
        db.flush()

    # 3. Create User
    new_user = UserModel(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        phone=request.phone,
        role=UserRoleEnum.OWNER,
        is_active=True
    )
    db.add(new_user)
    db.flush() # Get user id

    # 4. Create Owner Profile
    new_owner = OwnerModel(
        user_id=new_user.id,
        business_name=request.business_name,
        business_address=request.business_address,
        subscription_plan_id=free_plan.id,
        subscription_start_date=date.today(),
        subscription_end_date=date.today() + timedelta(days=365) # 1 year default
    )
    db.add(new_owner)
    db.flush() # Get owner id

    # 4.1 Add default units for new owner
    from infrastructure.database.models import Unit as UnitModel
    default_units = [
        {"name": "Cái", "abbreviation": "cái"},
        {"name": "Chiếc", "abbreviation": "chiếc"},
        {"name": "Bộ", "abbreviation": "bộ"},
        {"name": "Gói", "abbreviation": "gói"},
        {"name": "Thùng", "abbreviation": "thùng"},
    ]
    for unit_data in default_units:
        db.add(UnitModel(
            owner_id=new_owner.id,
            name=unit_data["name"],
            abbreviation=unit_data["abbreviation"]
        ))
    
    db.commit()
    
    token_data = {
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value,
        "owner_id": new_owner.id,
    }
    token = create_access_token(token_data)
    
    return LoginResponse(
        access_token=token,
        user_id=new_user.id,
        email=new_user.email,
        role=UserRole.OWNER,
        owner_id=new_owner.id
    )


@router.post("/register/customer", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register_customer(request: CustomerRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new Customer.
    Note: Customers are global users but may be linked to multiple owners.
    For self-registration, we create a User with role CUSTOMER.
    """
    # 1. Check if email exists
    existing_user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email này đã được đăng ký"
        )
    
    # 2. Create User
    new_user = UserModel(
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        phone=request.phone,
        role=UserRoleEnum.CUSTOMER,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_data = {
        "user_id": new_user.id,
        "email": new_user.email,
        "role": new_user.role.value,
        "owner_id": None,
    }
    token = create_access_token(token_data)
    
    return LoginResponse(
        access_token=token,
        user_id=new_user.id,
        email=new_user.email,
        role=UserRole.CUSTOMER,
        owner_id=None
    )

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login endpoint - returns JWT token.
    """
    print(f"DEBUG LOGIN: Connection URL: {db.bind.url}")
    print(f"DEBUG LOGIN: Attempting login for '{request.email}'")
    user = db.query(UserModel).filter(UserModel.email == request.email).first()
    if not user:
        print("DEBUG LOGIN: User not found!")
        all_users = db.query(UserModel).all()
        print(f"DEBUG LOGIN: All users in DB: {[u.email for u in all_users]}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
        )
    
    print(f"DEBUG LOGIN: User found. Hash in DB: {user.password_hash}")

    # verify password
    try:
        ok = verify_password(request.password, user.password_hash)
        print(f"DEBUG LOGIN: Verification result: {ok}")
    except Exception as e:
        # e.g. UnknownHashError if DB still has legacy hash
        print(f"DEBUG LOGIN: Verification EXCEPTION: {e}")
        ok = False

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không chính xác",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản người dùng đang bị khóa hoặc ngưng hoạt động",
        )

    owner_id = _get_owner_id_robust(db, user)

    token_data = {
        "user_id": user.id,
        "email": user.email,
        "role": user.role.value if user.role else None,
        "owner_id": owner_id,
        "customer_id": getattr(user, "customer_id", None) or _get_customer_id_robust(db, user)
    }
    access_token = create_access_token(token_data)

    # update last login
    user.last_login_at = db.query(func.now()).scalar()
    db.commit()

    return LoginResponse(
        access_token=access_token,
        user_id=user.id,
        email=user.email,
        role=user.role.value if user.role else None,
        owner_id=owner_id,
        customer_id=getattr(user, "customer_id", None) or _get_customer_id_robust(db, user)
    )


from api.schemas import LoginRequest, LoginResponse, UserMeResponse

# ...

@router.get("/me", response_model=UserMeResponse)
async def me(
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Return current user info with robust ID resolution.
    """
    owner_id = _get_owner_id_robust(db, current_user)
    customer_id = _get_customer_id_robust(db, current_user)
    
    return UserMeResponse(
        user_id=current_user.id,
        email=current_user.email,
        role=UserRole(current_user.role.value),
        owner_id=owner_id,
        customer_id=customer_id,
        full_name=current_user.full_name,
        phone=current_user.phone,
        is_active=current_user.is_active,
        last_login_at=current_user.last_login_at,
    )


@router.post("/forgot-password")
async def forgot_password(request: dict, db: Session = Depends(get_db)):
    """
    Create a password reset request for admin approval.
    """
    email = request.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email là bắt buộc"
        )
    
    # Check if user exists
    user = db.query(UserModel).filter(UserModel.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email không tồn tại trong hệ thống"
        )
    
    # Create password reset request
    from infrastructure.database.models import PasswordResetRequest
    from datetime import datetime
    
    # Check if there's already a pending request
    existing_request = db.query(PasswordResetRequest).filter(
        PasswordResetRequest.user_id == user.id,
        PasswordResetRequest.status == "PENDING"
    ).first()
    
    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bạn đã có yêu cầu đang chờ xử lý"
        )
    
    reset_request = PasswordResetRequest(
        user_id=user.id,
        email=email,
        status="PENDING",
        created_at=datetime.utcnow()
    )
    db.add(reset_request)
    db.commit()
    
    return {"message": "Yêu cầu đã được gửi. Vui lòng chờ admin phê duyệt."}


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should discard token).
    """
    return {"message": "Đã đăng xuất thành công"}
