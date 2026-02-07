import sys
import os
from datetime import datetime, date, timedelta
from decimal import Decimal
from passlib.context import CryptContext

# Add backend to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from infrastructure.database.connection import MySQLSessionLocal, mysql_engine, Base
from infrastructure.database.models import (
    SubscriptionPlan, User, Owner, Employee, Customer, 
    Product, Unit, ProductUnit, Inventory, Order, OrderItem,
    UserRoleEnum, SubscriptionTierEnum, CustomerTypeEnum,
    OrderTypeEnum, PaymentMethodEnum, PaymentStatusEnum
)
from config.settings import settings

from api.v1.auth.utils import hash_password

def seed_demo():
    print("Starting demo data seeding...")
    db = MySQLSessionLocal()
    
    try:
        # 1. Subscription Plans
        plans = [
            {"name": "Free Trial", "price": 0, "max_employees": 1, "max_products": 50},
            {"name": "Basic", "price": 299000, "max_employees": 3, "max_products": 500},
            {"name": "Pro", "price": 599000, "max_employees": 10, "max_products": 2000},
            {"name": "Enterprise", "price": 1299000, "max_employees": 50, "max_products": 10000},
        ]
        plan_objects = {}
        for p in plans:
            existing = db.query(SubscriptionPlan).filter_by(name=p["name"]).first()
            if not existing:
                new_p = SubscriptionPlan(**p, features="[]")
                db.add(new_p)
                db.flush()
                plan_objects[p["name"]] = new_p
            else:
                plan_objects[p["name"]] = existing
        
        # 2. Users & Roles
        demo_pass = os.getenv("DEMO_PASSWORD", "password123")
        hashed_pass = hash_password(demo_pass)
        
        users_data = [
            {"email": "admin@bizflow.vn", "full_name": "System Administrator", "role": UserRoleEnum.ADMIN},
            {"email": "owner1@example.com", "full_name": "Nguyễn Văn Hòa", "role": UserRoleEnum.OWNER},
            {"email": "owner2@example.com", "full_name": "Phạm Thị Minh", "role": UserRoleEnum.OWNER},
            {"email": "employee1@example.com", "full_name": "Trần Thị Bình", "role": UserRoleEnum.EMPLOYEE},
            {"email": "employee2@example.com", "full_name": "Lê Văn An", "role": UserRoleEnum.EMPLOYEE},
            {"email": "customer1@example.com", "full_name": "Khách hàng Thân thiết", "role": UserRoleEnum.CUSTOMER},
        ]
        
        user_objects = {}
        for u in users_data:
            existing = db.query(User).filter_by(email=u["email"]).first()
            if not existing:
                new_u = User(
                    email=u["email"],
                    password_hash=hashed_pass,
                    full_name=u["full_name"],
                    role=u[ "role"],
                    is_active=True
                )
                db.add(new_u)
                db.flush()
                user_objects[u["email"]] = new_u
            else:
                existing.password_hash = hashed_pass
                user_objects[u["email"]] = existing
                
        # 3. Owners
        owners_data = [
            {
                "user_id": user_objects["owner1@example.com"].id,
                "business_name": "Cửa hàng VLXD Hòa Bình",
                "plan": "Pro"
            },
            {
                "user_id": user_objects["owner2@example.com"].id,
                "business_name": "Cửa hàng tạp hóa Minh Phương",
                "plan": "Basic"
            }
        ]
        owner_objects = {}
        for o in owners_data:
            existing = db.query(Owner).filter_by(user_id=o["user_id"]).first()
            if not existing:
                new_o = Owner(
                    user_id=o["user_id"],
                    business_name=o["business_name"],
                    subscription_plan_id=plan_objects[o["plan"]].id,
                    subscription_start_date=date.today(),
                    subscription_end_date=date.today() + timedelta(days=365)
                )
                db.add(new_o)
                db.flush()
                owner_objects[o["business_name"]] = new_o
            else:
                owner_objects[o["business_name"]] = existing
                
        # 4. Employees
        employees_data = [
            {"email": "employee1@example.com", "owner": "Cửa hàng VLXD Hòa Bình", "pos": "Bán hàng"},
            {"email": "employee2@example.com", "owner": "Cửa hàng VLXD Hòa Bình", "pos": "Thủ kho"},
        ]
        for e in employees_data:
            user = user_objects[e["email"]]
            owner = owner_objects[e["owner"]]
            existing = db.query(Employee).filter_by(user_id=user.id).first()
            if not existing:
                new_e = Employee(
                    user_id=user.id,
                    owner_id=owner.id,
                    position=e["pos"],
                    hire_date=date.today(),
                    permissions="[]"
                )
                db.add(new_e)
        
        # 5. Units
        units_data = [
            {"name": "Cái", "abbr": "cái", "owner": "Cửa hàng VLXD Hòa Bình"},
            {"name": "Bao", "abbr": "bao", "owner": "Cửa hàng VLXD Hòa Bình"},
            {"name": "Thùng", "abbr": "thùng", "owner": "Cửa hàng VLXD Hòa Bình"},
            {"name": "Tấn", "abbr": "tấn", "owner": "Cửa hàng VLXD Hòa Bình"},
        ]
        unit_objects = {}
        for unit in units_data:
            owner = owner_objects[unit["owner"]]
            existing = db.query(Unit).filter_by(owner_id=owner.id, name=unit["name"]).first()
            if not existing:
                new_unit = Unit(
                    owner_id=owner.id,
                    name=unit["name"],
                    abbreviation=unit["abbr"]
                )
                db.add(new_unit)
                db.flush()
                unit_objects[f"{unit['owner']}_{unit['name']}"] = new_unit
            else:
                unit_objects[f"{unit['owner']}_{unit['name']}"] = existing
                
        # 6. Products & Inventory
        products_data = [
            {
                "owner": "Cửa hàng VLXD Hòa Bình",
                "code": "XM001",
                "name": "Xi măng Hà Tiên PCB40",
                "unit": "Bao",
                "price": 95000,
                "cost": 85000,
                "stock": 500
            },
            {
                "owner": "Cửa hàng VLXD Hòa Bình",
                "code": "ST001",
                "name": "Sơn Dulux nội thất",
                "unit": "Thùng",
                "price": 1850000,
                "cost": 1600000,
                "stock": 50
            }
        ]
        for p in products_data:
            owner = owner_objects[p["owner"]]
            unit = unit_objects[f"{p['owner']}_{p['unit']}"]
            existing = db.query(Product).filter_by(owner_id=owner.id, product_code=p["code"]).first()
            if not existing:
                new_p = Product(
                    owner_id=owner.id,
                    product_code=p["code"],
                    name=p["name"],
                    base_unit_id=unit.id,
                    base_price=p["price"],
                    cost_price=p["cost"]
                )
                db.add(new_p)
                db.flush()
                
                # Inventory
                new_inv = Inventory(
                    owner_id=owner.id,
                    product_id=new_p.id,
                    quantity=p["stock"],
                    low_stock_threshold=10
                )
                db.add(new_inv)
                
                # Default unit
                new_pu = ProductUnit(
                    product_id=new_p.id,
                    unit_id=unit.id,
                    conversion_rate=1,
                    price=p["price"],
                    is_default=True
                )
                db.add(new_pu)
        
        # 7. Customer (with Portal User)
        cust_user = user_objects["customer1@example.com"]
        owner1 = owner_objects["Cửa hàng VLXD Hòa Bình"]
        existing_cust = db.query(Customer).filter_by(owner_id=owner1.id, email="customer1@example.com").first()
        if not existing_cust:
            new_cust = Customer(
                owner_id=owner1.id,
                user_id=cust_user.id,
                customer_code="KH001",
                full_name="Khách hàng Thân thiết",
                email="customer1@example.com",
                phone="0909000111",
                customer_type=CustomerTypeEnum.INDIVIDUAL,
                is_active=True
            )
            db.add(new_cust)
        
        db.commit()
        print("Demo data seeded successfully!")
        print("-" * 30)
        print("TÀI KHOẢN DEMO (Password: {}):".format(demo_pass))
        print("1. Admin: admin@bizflow.vn")
        print("2. Owner: owner1@example.com")
        print("3. Employee: employee1@example.com")
        print("4. Customer (Portal): customer1@example.com")
        print("-" * 30)
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo()
