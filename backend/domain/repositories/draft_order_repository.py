"""
Draft Order Repository Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from domain.entities.draft_order import DraftOrder


class DraftOrderRepository(ABC):
    """Abstract repository for DraftOrder entity"""
    
    @abstractmethod
    async def create(self, draft_order: DraftOrder) -> DraftOrder:
        """Create a new draft order"""
        pass
    
    @abstractmethod
    async def get_by_id(self, draft_id: int, owner_id: int) -> Optional[DraftOrder]:
        """Get draft order by ID with tenant isolation"""
        pass
    
    @abstractmethod
    async def get_by_code(self, draft_code: str, owner_id: int) -> Optional[DraftOrder]:
        """Get draft order by code with tenant isolation"""
        pass
    
    @abstractmethod
    async def list_pending(self, owner_id: int, skip: int = 0, limit: int = 100) -> List[DraftOrder]:
        """List pending draft orders"""
        pass
    
    @abstractmethod
    async def update(self, draft_order: DraftOrder) -> DraftOrder:
        """Update draft order"""
        pass
    
    @abstractmethod
    async def mark_expired(self, owner_id: int) -> int:
        """Mark expired draft orders and return count"""
        pass
    
    @abstractmethod
    async def generate_draft_code(self, owner_id: int) -> str:
        """Generate unique draft code"""
        pass
