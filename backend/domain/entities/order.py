"""
Order entity - Sales orders
"""
from datetime import datetime
from typing import Optional, List
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum


class OrderType(str, Enum):
    """Order type enumeration"""
    SALE = "SALE"
    RETURN = "RETURN"


class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    CREDIT = "CREDIT"
    MIXED = "MIXED"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PAID = "PAID"
    PARTIAL = "PARTIAL"
    UNPAID = "UNPAID"


@dataclass
class OrderItem:
    """
    Order item (line item) entity.
    
    Business Rules:
    - quantity must be > 0
    - unit_price must be >= 0
    - subtotal = quantity * unit_price - discount_amount
    """
    id: Optional[int]
    order_id: Optional[int]
    product_id: int
    unit_id: int
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    subtotal: Decimal = Decimal("0")
    line_total: Decimal = Decimal("0")
    notes: Optional[str] = None
    product_name: Optional[str] = None
    unit_name: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate order item data"""
        if self.quantity <= 0:
            raise ValueError("Quantity must be greater than 0")
        
        if self.unit_price < 0:
            raise ValueError("Unit price cannot be negative")
        
        if self.discount_percent < 0 or self.discount_percent > 100:
            raise ValueError("Discount percent must be between 0 and 100")
    
    def calculate_subtotal(self) -> Decimal:
        """Calculate item subtotal"""
        base_amount = self.quantity * self.unit_price
        self.subtotal = base_amount - self.discount_amount
        self.line_total = self.subtotal
        return self.subtotal
    
    def apply_discount_percent(self):
        """Apply discount percentage to calculate discount amount"""
        if self.discount_percent > 0:
            base_amount = self.quantity * self.unit_price
            self.discount_amount = (base_amount * self.discount_percent) / 100


@dataclass
class Order:
    """
    Order entity representing sales orders.
    
    Business Rules:
    - total_amount = subtotal + tax_amount - discount_amount
    - debt_amount = total_amount - paid_amount
    - payment_status auto-updated based on paid_amount
    - Creates DEBT record if debt_amount > 0
    """
    id: Optional[int]
    owner_id: int
    order_code: str
    customer_id: int
    created_by: int
    order_date: datetime
    order_type: OrderType = OrderType.SALE
    subtotal: Decimal = Decimal("0")
    tax_rate: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    discount_amount: Decimal = Decimal("0")
    total_amount: Decimal = Decimal("0")
    paid_amount: Decimal = Decimal("0")
    debt_amount: Decimal = Decimal("0")
    payment_method: PaymentMethod = PaymentMethod.CASH
    payment_status: PaymentStatus = PaymentStatus.UNPAID
    notes: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    draft_order_id: Optional[int] = None
    is_invoiced: bool = False
    is_accounted: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[OrderItem] = field(default_factory=list)
    
    def __post_init__(self):
        """Validate order data"""
        if not self.order_code or len(self.order_code.strip()) == 0:
            raise ValueError("Order code is required")
        
        if self.tax_rate < 0 or self.tax_rate > 100:
            raise ValueError("Tax rate must be between 0 and 100")
        
        if self.paid_amount < 0:
            raise ValueError("Paid amount cannot be negative")
    
    def add_item(self, item: OrderItem):
        """Add item to order"""
        self.items.append(item)
        self.recalculate_totals()
    
    def recalculate_totals(self):
        """Recalculate order totals from items"""
        # Calculate subtotal from items
        self.subtotal = sum(item.calculate_subtotal() for item in self.items)
        
        # Calculate tax
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        
        # Calculate total
        self.total_amount = self.subtotal + self.tax_amount - self.discount_amount
        
        # Calculate debt
        self.debt_amount = self.get_debt_amount()
        
        # Update payment status
        self.update_payment_status()
    
    def update_payment_status(self):
        """Update payment status based on paid amount"""
        if self.paid_amount >= self.total_amount:
            self.payment_status = PaymentStatus.PAID
        elif self.paid_amount > 0:
            self.payment_status = PaymentStatus.PARTIAL
        else:
            self.payment_status = PaymentStatus.UNPAID
    
    def get_debt_amount(self) -> Decimal:
        """Calculate debt amount"""
        return max(Decimal("0"), self.total_amount - self.paid_amount)
    
    def has_debt(self) -> bool:
        """Check if order has outstanding debt"""
        return self.get_debt_amount() > 0
    
    def record_payment(self, amount: Decimal):
        """Record a payment for this order"""
        if amount <= 0:
            raise ValueError("Payment amount must be greater than 0")
        
        self.paid_amount += amount
        
        # Don't allow overpayment
        if self.paid_amount > self.total_amount:
            self.paid_amount = self.total_amount
        
        self.update_payment_status()
    
    def is_fully_paid(self) -> bool:
        """Check if order is fully paid"""
        return self.payment_status == PaymentStatus.PAID
    
    def can_be_invoiced(self) -> bool:
        """Check if order can be invoiced"""
        return len(self.items) > 0 and not self.is_invoiced
