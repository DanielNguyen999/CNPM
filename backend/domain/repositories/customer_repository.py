"""
Customer Repository Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from decimal import Decimal
from domain.entities.customer import Customer


class CustomerRepository(ABC):
    """Abstract repository for Customer entity"""
    
    @abstractmethod
    async def create(self, customer: Customer) -> Customer:
        """Create a new customer"""
        pass
    
    @abstractmethod
    async def get_by_id(self, customer_id: int, owner_id: int) -> Optional[Customer]:
        """Get customer by ID with tenant isolation"""
        pass
    
    @abstractmethod
    async def get_by_code(self, customer_code: str, owner_id: int) -> Optional[Customer]:
        """Get customer by code with tenant isolation"""
        pass
    
    @abstractmethod
    async def search_by_name_or_phone(self, query: str, owner_id: int, limit: int = 20) -> List[Customer]:
        """Search customers by name or phone (for AI and autocomplete)"""
        pass
    
    @abstractmethod
    async def list_by_owner(
        self, 
        owner_id: int, 
        skip: int = 0, 
        limit: int = 100,
        is_active: bool = True
    ) -> List[Customer]:
        """List customers for owner with pagination"""
        pass
    
    @abstractmethod
    async def update(self, customer: Customer) -> Customer:
        """Update customer"""
        pass
    
    @abstractmethod
    async def delete(self, customer_id: int, owner_id: int) -> bool:
        """Delete customer (soft delete)"""
        pass
    
    @abstractmethod
    async def get_total_debt(self, customer_id: int, owner_id: int) -> Decimal:
        """Get customer's total outstanding debt"""
        pass
    
    @abstractmethod
    async def generate_customer_code(self, owner_id: int) -> str:
        """Generate unique customer code"""
        pass
