"""
Product Repository Interface
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from domain.entities.product import Product


class ProductRepository(ABC):
    """Abstract repository for Product entity"""
    
    @abstractmethod
    async def create(self, product: Product) -> Product:
        """Create a new product"""
        pass
    
    @abstractmethod
    async def get_by_id(self, product_id: int, owner_id: int) -> Optional[Product]:
        """Get product by ID with tenant isolation"""
        pass
    
    @abstractmethod
    async def get_by_code(self, product_code: str, owner_id: int) -> Optional[Product]:
        """Get product by code with tenant isolation"""
        pass
    
    @abstractmethod
    async def search_by_name(self, query: str, owner_id: int, limit: int = 20) -> List[Product]:
        """Search products by name (for AI and autocomplete)"""
        pass
    
    @abstractmethod
    async def list_by_owner(
        self, 
        owner_id: int, 
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        is_active: bool = True
    ) -> List[Product]:
        """List products for owner with pagination"""
        pass
    
    @abstractmethod
    async def update(self, product: Product) -> Product:
        """Update product"""
        pass
    
    @abstractmethod
    async def delete(self, product_id: int, owner_id: int) -> bool:
        """Delete product (soft delete)"""
        pass
    
    @abstractmethod
    async def count_by_owner(self, owner_id: int) -> int:
        """Count products for subscription limit check"""
        pass
