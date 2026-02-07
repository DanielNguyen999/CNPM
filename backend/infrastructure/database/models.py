"""
SQLAlchemy ORM Models
Maps database tables to Python classes

BizFlow - 16 entities:
SUBSCRIPTION_PLAN, USER, OWNER, EMPLOYEE, CUSTOMER, PRODUCT, UNIT, PRODUCT_UNIT,
INVENTORY, STOCK_MOVEMENT, DRAFT_ORDER, ORDER, ORDER_ITEM, NOTIFICATION, DEBT, DEBT_PAYMENT
"""

from datetime import datetime, date, timedelta, timezone
import enum

def get_vietnam_time():
    """Return naive datetime representing current Vietnam Time (GMT+7)"""
    return datetime.now(timezone(timedelta(hours=7))).replace(tzinfo=None)

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Date,
    Boolean,
    Text,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    FetchedValue
)
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


# =======================
# Enums
# =======================

class UserRoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    OWNER = "OWNER"
    EMPLOYEE = "EMPLOYEE"
    CUSTOMER = "CUSTOMER"


class SubscriptionTierEnum(str, enum.Enum):
    FREE = "FREE"
    BASIC = "BASIC"
    PRO = "PRO"
    ENTERPRISE = "ENTERPRISE"


class OrderTypeEnum(str, enum.Enum):
    SALE = "SALE"
    RETURN = "RETURN"


class PaymentMethodEnum(str, enum.Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    CREDIT = "CREDIT"
    MIXED = "MIXED"


class PaymentStatusEnum(str, enum.Enum):
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"
    PAID = "PAID"


class DraftOrderSourceEnum(str, enum.Enum):
    AI_TEXT = "AI_TEXT"
    AI_VOICE = "AI_VOICE"
    MANUAL = "MANUAL"


class DraftOrderStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class DebtStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class DebtPaymentMethodEnum(str, enum.Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    OTHER = "OTHER"


class MovementTypeEnum(str, enum.Enum):
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"


class ReferenceTypeEnum(str, enum.Enum):
    ORDER = "ORDER"
    PURCHASE = "PURCHASE"
    ADJUSTMENT = "ADJUSTMENT"
    OTHER = "OTHER"


class NotificationTypeEnum(str, enum.Enum):
    DRAFT_ORDER = "DRAFT_ORDER"
    LOW_STOCK = "LOW_STOCK"
    DEBT_WARNING = "DEBT_WARNING"
    SYSTEM = "SYSTEM"
    OTHER = "OTHER"


class CustomerTypeEnum(str, enum.Enum):
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"


# =======================
# Models
# =======================

class SubscriptionPlan(Base):
    __tablename__ = "SUBSCRIPTION_PLAN"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text)
    price = Column(Numeric(15, 2), nullable=False, default=0)

    max_employees = Column(Integer, nullable=False, default=1)
    max_products = Column(Integer, nullable=False, default=100)
    max_orders_per_month = Column(Integer, nullable=False, default=1000)

    features = Column(Text)  # JSON in DB, treated as Text/JSON in ORM
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)


class PasswordResetRequest(Base) :
    __tablename__ = "PASSWORD_RESET_REQUEST"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("USER.id", ondelete="CASCADE"), nullable=False)
    
    # Simple status: PENDING, APPROVED, REJECTED
    status = Column(String(20), default="PENDING", nullable=False)
    
    # Store requester info for guest requests
    email = Column(String(255), nullable=False)
    
    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    resolved_at = Column(DateTime)
    resolved_by = Column(Integer, ForeignKey("USER.id"))

    user = relationship("User", foreign_keys=[user_id])


class User(Base):
    __tablename__ = "USER"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20))

    role = Column(Enum(UserRoleEnum), nullable=False, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)


class Owner(Base):
    __tablename__ = "OWNER"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("USER.id", ondelete="CASCADE"), nullable=False, unique=True)

    business_name = Column(String(255), nullable=False)
    business_address = Column(Text)
    tax_code = Column(String(50))

    subscription_plan_id = Column(Integer, ForeignKey("SUBSCRIPTION_PLAN.id"), nullable=False)
    subscription_start_date = Column(Date, nullable=False)
    subscription_end_date = Column(Date, nullable=False)

    is_trial = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    user = relationship("User", backref="owner_profile")
    subscription_plan = relationship("SubscriptionPlan", lazy="joined")


class Employee(Base):
    __tablename__ = "EMPLOYEE"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("USER.id", ondelete="CASCADE"), nullable=False, unique=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)

    position = Column(String(100))
    hire_date = Column(Date, nullable=False)
    salary = Column(Numeric(15, 2))
    permissions = Column(Text)  # JSON in DB

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    user = relationship("User", backref="employee_profile")
    owner = relationship("Owner", backref="employees")


class Customer(Base):
    __tablename__ = "CUSTOMER"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("USER.id", ondelete="SET NULL"), nullable=True, unique=True)

    customer_code = Column(String(50), nullable=False, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), index=True)
    email = Column(String(255))
    address = Column(Text)
    tax_code = Column(String(50))

    customer_type = Column(Enum(CustomerTypeEnum), default=CustomerTypeEnum.INDIVIDUAL, nullable=False)
    credit_limit = Column(Numeric(15, 2), default=0, nullable=False)
    notes = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    __table_args__ = (
        Index("idx_owner_customer_code", "owner_id", "customer_code", unique=True),
    )


class Unit(Base):
    __tablename__ = "UNIT"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)

    name = Column(String(50), nullable=False)
    abbreviation = Column(String(20), nullable=False)
    description = Column(Text)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    __table_args__ = (
        Index("idx_owner_unit_name", "owner_id", "name", unique=True),
    )


class Product(Base):
    __tablename__ = "PRODUCT"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)

    product_code = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    category = Column(String(100), index=True)

    base_unit_id = Column(Integer, ForeignKey("UNIT.id"), nullable=False)
    base_price = Column(Numeric(15, 2), nullable=False)
    cost_price = Column(Numeric(15, 2))
    
    barcode = Column(String(100), index=True)
    image_url = Column(Text)


    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    __table_args__ = (
        Index("idx_owner_product_code", "owner_id", "product_code", unique=True),
    )

    inventory = relationship("Inventory", back_populates="product", uselist=False)
    units = relationship("ProductUnit", back_populates="product")


class ProductUnit(Base):
    __tablename__ = "PRODUCT_UNIT"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("PRODUCT.id", ondelete="CASCADE"), nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("UNIT.id", ondelete="CASCADE"), nullable=False)

    conversion_rate = Column(Numeric(15, 4), nullable=False, default=1.0000)
    price = Column(Numeric(15, 2), default=0.00, nullable=False)
    
    is_default = Column(Boolean, default=False, nullable=False)
    barcode = Column(String(100), index=True)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    product = relationship("Product", back_populates="units")
    unit = relationship("Unit")

    __table_args__ = (
        Index("idx_product_unit", "product_id", "unit_id", unique=True),
    )


class Inventory(Base):
    __tablename__ = "INVENTORY"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("PRODUCT.id", ondelete="CASCADE"), nullable=False, unique=True)

    quantity = Column(Numeric(15, 4), default=0, nullable=False)
    reserved_quantity = Column(Numeric(15, 4), default=0, nullable=False)
    available_quantity = Column(Numeric(15, 4), FetchedValue(), nullable=True) # Calculated column in DB

    low_stock_threshold = Column(Numeric(15, 4), default=10, nullable=False)
    last_stock_check_at = Column(DateTime)
    
    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    product = relationship("Product", back_populates="inventory")


class StockMovement(Base):
    __tablename__ = "STOCK_MOVEMENT"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("PRODUCT.id", ondelete="CASCADE"), nullable=False, index=True)

    movement_type = Column(Enum(MovementTypeEnum), nullable=False)
    quantity = Column(Numeric(15, 4), nullable=False)
    unit_id = Column(Integer, ForeignKey("UNIT.id"), nullable=False)

    reference_type = Column(Enum(ReferenceTypeEnum))
    reference_id = Column(Integer, index=True)

    notes = Column(Text)

    created_by = Column(Integer, ForeignKey("USER.id"), nullable=False)
    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)


class Order(Base):
    __tablename__ = "ORDER"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)
    order_code = Column(String(50), nullable=False, index=True)

    customer_id = Column(Integer, ForeignKey("CUSTOMER.id"), nullable=False, index=True)
    order_date = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)

    order_type = Column(Enum(OrderTypeEnum), default=OrderTypeEnum.SALE, nullable=False)

    subtotal = Column(Numeric(15, 2), default=0.00, nullable=False)
    tax_rate = Column(Numeric(5, 2), default=0.00, nullable=False)
    tax_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    total_amount = Column(Numeric(15, 2), FetchedValue(), nullable=True)

    paid_amount = Column(Numeric(15, 2), default=0.00, nullable=False)
    debt_amount = Column(Numeric(15, 2), FetchedValue(), nullable=True) # Calculated

    payment_method = Column(Enum(PaymentMethodEnum), default=PaymentMethodEnum.CASH, nullable=False)
    payment_status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.UNPAID, nullable=False, index=True)

    notes = Column(Text)
    created_by = Column(Integer, ForeignKey("USER.id"), nullable=False)
    
    draft_order_id = Column(Integer, ForeignKey("DRAFT_ORDER.id"))
    is_invoiced = Column(Boolean, default=False, nullable=False)
    is_accounted = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)

    customer = relationship("Customer", lazy="joined")
    items_rel = relationship("OrderItem", backref="order", cascade="all, delete-orphan", lazy="selectin")
    created_by_user = relationship("User", foreign_keys=[created_by], lazy="joined")

    __table_args__ = (
        Index("idx_owner_order_code", "owner_id", "order_code", unique=True),
    )


class OrderItem(Base):
    __tablename__ = "ORDER_ITEM"

    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("ORDER.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("PRODUCT.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("UNIT.id"), nullable=False)

    quantity = Column(Numeric(15, 4), nullable=False)
    unit_price = Column(Numeric(15, 2), nullable=False)

    discount_percent = Column(Numeric(5, 2), default=0, nullable=False)
    discount_amount = Column(Numeric(15, 2), default=0, nullable=False)

    subtotal = Column(Numeric(15, 2), FetchedValue(), nullable=True) # Calculated
    notes = Column(Text)
    
    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)

    product = relationship("Product", lazy="joined")
    unit = relationship("Unit", lazy="joined")


class DraftOrder(Base):
    __tablename__ = "DRAFT_ORDER"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)
    draft_code = Column(String(50), nullable=False, index=True)

    source = Column(Enum(DraftOrderSourceEnum), nullable=False)
    original_input = Column(Text)

    parsed_data = Column(Text, nullable=False) # JSON
    confidence_score = Column(Numeric(5, 4))
    missing_fields = Column(Text) # JSON
    questions = Column(Text) # JSON

    status = Column(Enum(DraftOrderStatusEnum), default=DraftOrderStatusEnum.PENDING, nullable=False, index=True)

    created_by = Column(Integer, ForeignKey("USER.id"), nullable=False)
    confirmed_by = Column(Integer, ForeignKey("USER.id"))
    confirmed_at = Column(DateTime)

    final_order_id = Column(Integer, ForeignKey("ORDER.id"))
    
    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)

    __table_args__ = (
        Index("idx_owner_draft_code", "owner_id", "draft_code", unique=True),
    )


class Debt(Base):
    __tablename__ = "DEBT"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("CUSTOMER.id"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("ORDER.id"), unique=True)

    debt_amount = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0, nullable=False)
    remaining_amount = Column(Numeric(15, 2), FetchedValue(), nullable=True) # Calculated column

    due_date = Column(Date, index=True)
    status = Column(Enum(DebtStatusEnum), default=DebtStatusEnum.PENDING, nullable=False, index=True)

    notes = Column(Text)

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)


class DebtPayment(Base):
    __tablename__ = "DEBT_PAYMENT"

    id = Column(Integer, primary_key=True, autoincrement=True)
    debt_id = Column(Integer, ForeignKey("DEBT.id", ondelete="CASCADE"), nullable=False, index=True)

    payment_amount = Column(Numeric(15, 2), nullable=False)
    payment_method = Column(Enum(DebtPaymentMethodEnum), default=DebtPaymentMethodEnum.CASH, nullable=False)
    payment_date = Column(DateTime, nullable=False, index=True)

    reference_number = Column(String(100))
    notes = Column(Text)

    created_by = Column(Integer, ForeignKey("USER.id"), nullable=False)
    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)


class Notification(Base):
    __tablename__ = "NOTIFICATION"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("USER.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id", ondelete="CASCADE"), nullable=False, index=True)

    notification_type = Column(Enum(NotificationTypeEnum), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    reference_type = Column(String(50))
    reference_id = Column(Integer)

    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime)
    
    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)


class AuditLog(Base):
    __tablename__ = "AUDIT_LOG"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("USER.id"), nullable=False, index=True)
    owner_id = Column(Integer, ForeignKey("OWNER.id"), index=True)

    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False, index=True)
    resource_id = Column(Integer)
    
    details = Column(Text) # JSON string
    ip_address = Column(String(45))
    user_agent = Column(String(255))

    created_at = Column(DateTime, default=get_vietnam_time, nullable=False, index=True)


class EmployeePermission(Base):
    __tablename__ = "EMPLOYEE_PERMISSION"

    id = Column(Integer, primary_key=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("EMPLOYEE.id", ondelete="CASCADE"), nullable=False, index=True)
    
    permission_key = Column(String(50), nullable=False, index=True)
    is_granted = Column(Boolean, default=True, nullable=False)

    granted_by = Column(Integer, ForeignKey("USER.id"))
    granted_at = Column(DateTime, default=get_vietnam_time, nullable=False)

    __table_args__ = (
        Index("idx_emp_perm_key", "employee_id", "permission_key", unique=True),
    )


class SystemConfig(Base):
    __tablename__ = "SYSTEM_CONFIG"
    
    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255))
    updated_at = Column(DateTime, default=get_vietnam_time, onupdate=get_vietnam_time, nullable=False)
