"""
Inventory Repository Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from decimal import Decimal
from domain.entities.inventory import Inventory, StockMovement


class InventoryRepository(ABC):
    """Abstract repository for Inventory entity"""
    
    @abstractmethod
    async def get_by_product(self, product_id: int, owner_id: int) -> Optional[Inventory]:
        """Get inventory for product with tenant isolation"""
        pass
    
    @abstractmethod
    async def create_or_update(self, inventory: Inventory) -> Inventory:
        """Create or update inventory record"""
        pass
    
    @abstractmethod
    async def list_low_stock(self, owner_id: int) -> List[Inventory]:
        """List products with low stock"""
        pass
    
    @abstractmethod
    async def list_by_owner(self, owner_id: int, skip: int = 0, limit: int = 100) -> List[Inventory]:
        """List inventory for owner"""
        pass
    
    @abstractmethod
    async def record_movement(self, movement: StockMovement) -> StockMovement:
        """Record stock movement and update inventory"""
        pass
    
    @abstractmethod
    async def get_movements(
        self, 
        product_id: int, 
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[StockMovement]:
        """Get stock movement history for product"""
        pass
    
    @abstractmethod
    async def adjust_quantity(self, product_id: int, owner_id: int, quantity_change: Decimal) -> Inventory:
        """Adjust inventory quantity (atomic operation)"""
        pass
