"""
Debt entity - Customer debts and payments
"""
from datetime import date, datetime
from typing import Optional
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class DebtStatus(str, Enum):
    """Debt status enumeration"""
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class DebtPaymentMethod(str, Enum):
    """Debt payment method enumeration"""
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    OTHER = "OTHER"


@dataclass
class DebtPayment:
    """
    Debt payment entity.
    
    Business Rules:
    - payment_amount must be > 0
    - Updates parent Debt.paid_amount
    """
    id: Optional[int]
    debt_id: int
    payment_amount: Decimal
    created_by: int
    payment_method: DebtPaymentMethod = DebtPaymentMethod.CASH
    payment_date: datetime = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate payment data"""
        if self.payment_amount <= 0:
            raise ValueError("Payment amount must be greater than 0")
        
        if self.payment_date is None:
            self.payment_date = datetime.utcnow()


@dataclass
class Debt:
    """
    Debt entity representing customer debts.
    
    Business Rules:
    - Auto-created when ORDER.debt_amount > 0
    - remaining_amount = debt_amount - paid_amount
    - status auto-updated based on payments and due_date
    - Enforces CUSTOMER.credit_limit
    """
    id: Optional[int]
    owner_id: int
    customer_id: int
    order_id: int
    debt_amount: Decimal
    paid_amount: Decimal = Decimal("0")
    remaining_amount: Decimal = Decimal("0")
    due_date: Optional[date] = None
    status: DebtStatus = DebtStatus.PENDING
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate debt data"""
        if self.debt_amount <= 0:
            raise ValueError("Debt amount must be greater than 0")
        
        if self.paid_amount < 0:
            raise ValueError("Paid amount cannot be negative")
        
        if self.paid_amount > self.debt_amount:
            raise ValueError("Paid amount cannot exceed debt amount")
        
        # Sync remaining_amount if not set
        if self.remaining_amount == Decimal("0") and self.debt_amount > 0:
            self.remaining_amount = self.debt_amount - self.paid_amount
    
    def get_remaining_amount(self) -> Decimal:
        """Get remaining debt amount"""
        return self.remaining_amount
    
    def recalculate_remaining_amount(self):
        """Recalculate and update remaining_amount field"""
        self.remaining_amount = self.debt_amount - self.paid_amount
    
    def is_fully_paid(self) -> bool:
        """Check if debt is fully paid"""
        return self.get_remaining_amount() <= 0
    
    def is_overdue(self) -> bool:
        """Check if debt is overdue"""
        if self.due_date is None:
            return False
        return date.today() > self.due_date and not self.is_fully_paid()
    
    def record_payment(self, payment: DebtPayment):
        """
        Record a payment for this debt.
        
        Args:
            payment: DebtPayment object
        
        Raises:
            ValueError: If payment exceeds remaining amount
        """
        remaining = self.get_remaining_amount()
        
        if payment.payment_amount > remaining:
            raise ValueError(f"Payment amount {payment.payment_amount} exceeds remaining debt {remaining}")
        
        self.paid_amount += payment.payment_amount
        self.recalculate_remaining_amount()
        self.update_status()
    
    def update_status(self):
        """Update debt status based on paid amount and due date"""
        if self.is_fully_paid():
            self.status = DebtStatus.PAID
        elif self.paid_amount > 0:
            self.status = DebtStatus.PARTIAL
        elif self.is_overdue():
            self.status = DebtStatus.OVERDUE
        else:
            self.status = DebtStatus.PENDING
    
    def days_overdue(self) -> int:
        """Get number of days overdue (0 if not overdue)"""
        if not self.is_overdue():
            return 0
        
        delta = date.today() - self.due_date
        return delta.days
