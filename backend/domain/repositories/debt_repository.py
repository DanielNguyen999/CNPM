"""
Debt Repository Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from domain.entities.debt import Debt, DebtPayment


class DebtRepository(ABC):
    """Abstract repository for Debt entity"""
    
    @abstractmethod
    async def create(self, debt: Debt) -> Debt:
        """Create a new debt record"""
        pass
    
    @abstractmethod
    async def get_by_id(self, debt_id: int, owner_id: int) -> Optional[Debt]:
        """Get debt by ID with tenant isolation"""
        pass
    
    @abstractmethod
    async def get_by_order(self, order_id: int, owner_id: int) -> Optional[Debt]:
        """Get debt for specific order"""
        pass
    
    @abstractmethod
    async def list_by_customer(
        self, 
        customer_id: int, 
        owner_id: int,
        include_paid: bool = False
    ) -> List[Debt]:
        """List debts for customer"""
        pass
    
    @abstractmethod
    async def list_by_owner(
        self, 
        owner_id: int,
        skip: int = 0,
        limit: int = 100,
        include_paid: bool = False
    ) -> List[Debt]:
        """List debts for owner"""
        pass
    
    @abstractmethod
    async def update(self, debt: Debt) -> Debt:
        """Update debt"""
        pass
    
    @abstractmethod
    async def record_payment(self, payment: DebtPayment) -> DebtPayment:
        """Record debt payment and update debt"""
        pass
    
    @abstractmethod
    async def get_payments(self, debt_id: int, owner_id: int) -> List[DebtPayment]:
        """Get payment history for debt"""
        pass
    
    @abstractmethod
    async def list_overdue(self, owner_id: int) -> List[Debt]:
        """List overdue debts"""
        pass
