"""
Order Repository Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from datetime import datetime
from domain.entities.order import Order, OrderItem


class OrderRepository(ABC):
    """Abstract repository for Order entity"""
    
    @abstractmethod
    async def create(self, order: Order) -> Order:
        """Create a new order"""
        pass
    
    @abstractmethod
    async def get_by_id(self, order_id: int, owner_id: int) -> Optional[Order]:
        """Get order by ID with tenant isolation"""
        pass
    
    @abstractmethod
    async def get_by_code(self, order_code: str, owner_id: int) -> Optional[Order]:
        """Get order by code with tenant isolation"""
        pass
    
    @abstractmethod
    async def list_by_owner(
        self, 
        owner_id: int, 
        skip: int = 0, 
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Order]:
        """List orders for owner with pagination and filters"""
        pass
    
    @abstractmethod
    async def list_by_customer(
        self, 
        customer_id: int, 
        owner_id: int,
        skip: int = 0, 
        limit: int = 100
    ) -> List[Order]:
        """List orders for specific customer"""
        pass
    
    @abstractmethod
    async def update(self, order: Order) -> Order:
        """Update order"""
        pass
    
    @abstractmethod
    async def delete(self, order_id: int, owner_id: int) -> bool:
        """Delete order (soft delete)"""
        pass
    
    @abstractmethod
    async def count_by_owner(self, owner_id: int, month: Optional[int] = None) -> int:
        """Count orders for subscription limit check"""
        pass
    
    @abstractmethod
    async def generate_order_code(self, owner_id: int) -> str:
        """Generate unique order code"""
        pass
