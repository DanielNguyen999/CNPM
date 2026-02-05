"""
Customer entity - Customers for each business owner
"""
from datetime import datetime
from typing import Optional
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class CustomerType(str, Enum):
    """Customer type enumeration"""
    INDIVIDUAL = "INDIVIDUAL"
    BUSINESS = "BUSINESS"


@dataclass
class Customer:
    """
    Customer entity representing customers.
    
    Business Rules:
    - customer_code unique per owner
    - credit_limit enforced for debt creation
    - tax_code required for business customers (TT88)
    """
    id: Optional[int]
    owner_id: int
    customer_code: str
    full_name: str
    customer_type: CustomerType = CustomerType.INDIVIDUAL
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    tax_code: Optional[str] = None
    credit_limit: Decimal = Decimal("0")
    notes: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate customer data"""
        if not self.customer_code or len(self.customer_code.strip()) == 0:
            raise ValueError("Customer code is required")
        
        if not self.full_name or len(self.full_name.strip()) == 0:
            raise ValueError("Customer name is required")
        
        if self.credit_limit < 0:
            raise ValueError("Credit limit cannot be negative")
    
    def is_business_customer(self) -> bool:
        """Check if customer is a business"""
        return self.customer_type == CustomerType.BUSINESS
    
    def has_tax_code(self) -> bool:
        """Check if tax code is set"""
        return self.tax_code is not None and len(self.tax_code.strip()) > 0
    
    def can_incur_debt(self, amount: Decimal, current_debt: Decimal = Decimal("0")) -> bool:
        """
        Check if customer can incur additional debt.
        
        Args:
            amount: New debt amount to add
            current_debt: Customer's current total debt
        
        Returns:
            True if within credit limit, False otherwise
        """
        if self.credit_limit == 0:
            return False  # No credit allowed
        
        total_debt = current_debt + amount
        return total_debt <= self.credit_limit
    
    def get_remaining_credit(self, current_debt: Decimal = Decimal("0")) -> Decimal:
        """Get remaining credit available"""
        return max(Decimal("0"), self.credit_limit - current_debt)
