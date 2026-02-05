"""
Owner entity - Business owners (tenant root)
"""
from datetime import date, datetime
from typing import Optional
from dataclasses import dataclass


@dataclass
class Owner:
    """
    Owner entity representing business owners.
    
    Business Rules:
    - One user can be one owner only
    - Subscription must be active
    - Tax code required for TT88 compliance
    """
    id: Optional[int]
    user_id: int
    business_name: str
    subscription_plan_id: int
    subscription_start_date: date
    subscription_end_date: date
    business_address: Optional[str] = None
    tax_code: Optional[str] = None
    is_trial: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate owner data"""
        if not self.business_name or len(self.business_name.strip()) == 0:
            raise ValueError("Business name is required")
        
        if self.subscription_end_date < self.subscription_start_date:
            raise ValueError("Subscription end date must be after start date")
    
    def is_subscription_active(self) -> bool:
        """Check if subscription is currently active"""
        today = date.today()
        return self.subscription_start_date <= today <= self.subscription_end_date
    
    def days_until_expiration(self) -> int:
        """Get number of days until subscription expires"""
        today = date.today()
        delta = self.subscription_end_date - today
        return delta.days
    
    def is_expiring_soon(self, days: int = 7) -> bool:
        """Check if subscription is expiring within N days"""
        return 0 < self.days_until_expiration() <= days
    
    def has_tax_code(self) -> bool:
        """Check if tax code is configured (required for TT88)"""
        return self.tax_code is not None and len(self.tax_code.strip()) > 0
