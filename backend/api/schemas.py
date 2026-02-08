"""
Pydantic schemas for API requests and responses
"""
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import Optional, List, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum


# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    OWNER = "OWNER"
    EMPLOYEE = "EMPLOYEE"
    CUSTOMER = "CUSTOMER"


class OrderType(str, Enum):
    SALE = "SALE"
    RETURN = "RETURN"


class PaymentMethod(str, Enum):
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    MOMO = "MOMO"
    ZALOPAY = "ZALOPAY"
    CREDIT = "CREDIT"
    MIXED = "MIXED"


class PaymentStatus(str, Enum):
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"
    PAID = "PAID"


# Authentication Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    role: UserRole
    owner_id: Optional[int] = None
    customer_id: Optional[int] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole


class OwnerRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    business_name: str
    phone: Optional[str] = None
    business_address: Optional[str] = None


class CustomerRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserMeResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    owner_id: Optional[int] = None
    customer_id: Optional[int] = None
    is_active: bool
    last_login_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None


class StoreProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    tax_code: Optional[str] = None
    footer_notes: Optional[str] = None # Added for invoice footer


# Product Schemas
class ProductUnitCreate(BaseModel):
    unit_id: int
    conversion_rate: Decimal = Field(gt=0)
    price: Decimal = Field(gt=0)
    is_default: bool = False

class ProductCreate(BaseModel):
    product_code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    base_unit_id: int
    base_price: Decimal = Field(gt=0)
    cost_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    units: Optional[List[ProductUnitCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[Decimal] = Field(None, gt=0)
    cost_price: Optional[Decimal] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    units: Optional[List[ProductUnitCreate]] = None


class ProductUnitResponse(BaseModel):
    id: int
    unit_id: int
    unit_name: str
    conversion_rate: Decimal
    price: Decimal
    is_default: bool
    
    model_config = ConfigDict(from_attributes=True)


class ProductResponse(BaseModel):
    id: int
    owner_id: int
    product_code: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    base_unit_id: int
    base_price: Decimal
    cost_price: Optional[Decimal] = None
    is_active: bool
    image_url: Optional[str] = None
    available_quantity: Optional[Decimal] = None
    units: Optional[List[ProductUnitResponse]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Customer Schemas
class CustomerCreate(BaseModel):
    customer_code: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    customer_type: str = "INDIVIDUAL"
    tax_code: Optional[str] = None
    credit_limit: Decimal = Decimal("0")


class CustomerResponse(BaseModel):
    id: int
    owner_id: int
    customer_code: str
    full_name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    customer_type: str
    tax_code: Optional[str] = None
    credit_limit: Decimal
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class CustomerSummaryResponse(CustomerResponse):
    total_debt: Decimal = Decimal("0")
    order_count: int = 0
    last_order_date: Optional[datetime] = None


class CustomerDetailResponse(CustomerSummaryResponse):
    address: Optional[str] = None
    tax_code: Optional[str] = None
    credit_limit: Decimal
    notes: Optional[str] = None
    # recent_orders could be added later if needed, but for now summary + detail is good


# Order Schemas
class OrderItemCreate(BaseModel):
    product_id: int
    unit_id: int
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    discount_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    unit_id: int
    unit_name: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    discount_amount: Decimal
    line_total: Decimal
    
    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[OrderItemCreate]
    tax_rate: Decimal = Field(default=Decimal("10"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    paid_amount: Decimal = Field(default=Decimal("0"), ge=0)
    payment_method: PaymentMethod = PaymentMethod.CASH
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    id: int
    owner_id: int
    order_code: str
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    order_date: datetime
    order_type: OrderType
    subtotal: Decimal
    tax_rate: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    paid_amount: Decimal
    debt_amount: Decimal
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    notes: Optional[str] = None
    items: List[OrderItemResponse]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Draft Order Schemas
class DraftOrderCreate(BaseModel):
    user_input: str
    source: str = "AI_TEXT"  # AI_TEXT or AI_VOICE


class DraftOrderResponse(BaseModel):
    id: int
    owner_id: int
    draft_code: str
    source: str
    original_input: str
    parsed_data: dict
    confidence_score: Decimal
    missing_fields: List[str]
    questions: List[str]
    status: str
    created_at: datetime
    expires_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ConfirmDraftRequest(BaseModel):
    overrides: Optional[dict] = None


# Debt Schemas
class DebtPaymentCreate(BaseModel):
    payment_amount: Decimal = Field(gt=0)
    payment_method: PaymentMethod = PaymentMethod.CASH
    payment_date: datetime = Field(default_factory=datetime.utcnow)
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class DebtPaymentResponse(BaseModel):
    id: int
    debt_id: int
    payment_amount: Decimal
    payment_method: str
    payment_date: datetime
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DebtSummaryResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    order_code: Optional[str] = None
    total_amount: Decimal = Field(alias="debt_amount")
    paid_amount: Decimal
    remaining_amount: Decimal
    status: str
    due_date: Optional[date] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DebtDetailResponse(DebtSummaryResponse):
    notes: Optional[str] = None
    payments: List[DebtPaymentResponse] = []
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


# Pagination
class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

class PaginatedOrdersResponse(PaginatedResponse):
    items: List[OrderResponse]

class PaginatedDebtsResponse(PaginatedResponse):
    items: List[DebtSummaryResponse]
    total_amount_pending: Decimal = Decimal("0")


# Inventory Schemas
class InventoryResponse(BaseModel):
    id: int
    owner_id: int
    product_id: int
    quantity: Decimal
    reserved_quantity: Decimal
    available_quantity: Decimal
    low_stock_threshold: int
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    unit_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class StockMovementResponse(BaseModel):
    id: int
    owner_id: int
    product_id: int
    movement_type: str
    quantity: Decimal
    unit_id: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    created_by: int
    
    model_config = ConfigDict(from_attributes=True)


class StockAdjustmentRequest(BaseModel):
    quantity_change: Decimal
    reason: str
    notes: Optional[str] = None
    
    @field_validator('quantity_change')
    @classmethod
    def validate_integer_only(cls, v):
        """Ensure quantity is an integer (no decimals)"""
        if v != int(v):
            raise ValueError('Quantity must be an integer (no decimals allowed)')
        return int(v)


class DashboardStatsResponse(BaseModel):
    today_revenue: Decimal
    today_orders_count: int
    today_orders: int = 0
    total_debt_pending: Decimal
    low_stock_count: int
    new_customers: int = 0
    recent_activity: List[Any] = []
    
    # Customer specific fields
    customer_orders_count: Optional[int] = None
    customer_debt: Optional[Decimal] = None
    new_products_count: Optional[int] = None
    
    # AI enhanced fields
    ai_summary: Optional[str] = None

