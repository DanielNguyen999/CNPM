"""
User entity - System users (Admin, Owner, Employee)
"""
from datetime import datetime
from enum import Enum
from typing import Optional
from dataclasses import dataclass


class UserRole(str, Enum):
    """User role enumeration"""
    ADMIN = "ADMIN"
    OWNER = "OWNER"
    EMPLOYEE = "EMPLOYEE"
    CUSTOMER = "CUSTOMER"


@dataclass
class User:
    """
    User entity representing system users.
    
    Business Rules:
    - Email must be unique
    - Password must be hashed with bcrypt
    - Role determines access level
    """
    id: Optional[int]
    email: str
    password_hash: str
    full_name: str
    role: UserRole
    phone: Optional[str] = None
    is_active: bool = True
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate user data"""
        if not self.email or "@" not in self.email:
            raise ValueError("Invalid email address")
        
        if not self.full_name or len(self.full_name.strip()) == 0:
            raise ValueError("Full name is required")
        
        if not self.password_hash:
            raise ValueError("Password hash is required")
    
    def is_admin(self) -> bool:
        """Check if user is admin"""
        return self.role == UserRole.ADMIN
    
    def is_owner(self) -> bool:
        """Check if user is owner"""
        return self.role == UserRole.OWNER
    
    def is_employee(self) -> bool:
        """Check if user is employee"""
        return self.role == UserRole.EMPLOYEE
    
    def can_access_tenant(self, owner_id: int) -> bool:
        """
        Check if user can access tenant data.
        Admin can access all tenants.
        Owner/Employee must match owner_id.
        """
        if self.is_admin():
            return True
        # This will be checked against owner_id from Owner/Employee entity
        return False
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login_at = datetime.utcnow()
