"""
Product entity - Products for each business owner
"""
from datetime import datetime
from typing import Optional, List, Any
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class Product:
    """
    Product entity representing products in inventory.
    
    Business Rules:
    - product_code unique per owner
    - base_unit_id required for inventory tracking
    - base_price must be >= 0
    - cost_price used for profit calculation
    """
    id: Optional[int]
    owner_id: int
    product_code: str
    name: str
    base_unit_id: int
    base_price: Decimal
    category: Optional[str] = None
    description: Optional[str] = None
    cost_price: Optional[Decimal] = None
    barcode: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    available_quantity: Optional[Decimal] = None
    units: Optional[List[Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate product data"""
        if not self.product_code or len(self.product_code.strip()) == 0:
            raise ValueError("Product code is required")
        
        if not self.name or len(self.name.strip()) == 0:
            raise ValueError("Product name is required")
        
        if self.base_price < 0:
            raise ValueError("Base price cannot be negative")
        
        if self.cost_price is not None and self.cost_price < 0:
            raise ValueError("Cost price cannot be negative")
    
    def calculate_profit_margin(self) -> Optional[Decimal]:
        """
        Calculate profit margin percentage.
        Returns None if cost_price not set.
        """
        if self.cost_price is None or self.cost_price == 0:
            return None
        
        profit = self.base_price - self.cost_price
        margin = (profit / self.cost_price) * 100
        return round(margin, 2)
    
    def is_profitable(self) -> bool:
        """Check if product is profitable"""
        if self.cost_price is None:
            return True  # Unknown, assume profitable
        return self.base_price > self.cost_price
    
    def get_profit_per_unit(self) -> Decimal:
        """Get profit per unit in base price"""
        if self.cost_price is None:
            return Decimal("0")
        return self.base_price - self.cost_price
