import sys
import os

# Add backend to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
sys.path.append(backend_dir)

from infrastructure.database.connection import MySQLSessionLocal, mysql_engine
from infrastructure.database.models import User, UserRoleEnum, Base
from api.v1.auth.utils import hash_password

def reset_admin():
    print("Creating tables if not exists...")
    Base.metadata.create_all(bind=mysql_engine)
    db = MySQLSessionLocal()
    
    # 1. System Admin
    email = "admin@bizflow.vn"
    password = "password123"
    hashed = hash_password(password)
    
    user = db.query(User).filter(User.email == email).first()
    if user:
        print(f"Updating existing admin: {email}")
        user.password_hash = hashed
        user.is_active = True
    else:
        print(f"Creating new admin: {email}")
        user = User(
            email=email,
            password_hash=hashed,
            full_name="System Administrator",
            role=UserRoleEnum.ADMIN,
            is_active=True
        )
        db.add(user)
    
    # 2. Shop Owner (for testing POS/Orders)
    owner_email = "owner1@example.com"
    owner_user = db.query(User).filter(User.email == owner_email).first()
    if owner_user:
        print(f"Updating existing owner: {owner_email}")
        owner_user.password_hash = hashed
        owner_user.is_active = True
    
    db.commit()
    print("-" * 30)
    print("SUCCESS! Credentials updated/created:")
    print(f"1. Admin (System): {email} / {password}")
    print(f"2. Owner (Shop):   {owner_email} / {password}")
    print("-" * 30)

if __name__ == "__main__":
    reset_admin()
