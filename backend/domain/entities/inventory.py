"""
Inventory entity - Current inventory levels and stock movements
"""
from datetime import datetime
from typing import Optional
from dataclasses import dataclass
from decimal import Decimal
from enum import Enum


class MovementType(str, Enum):
    """Stock movement type enumeration"""
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"
    ADJUSTMENT = "ADJUSTMENT"
    RETURN = "RETURN"


class ReferenceType(str, Enum):
    """Stock movement reference type enumeration"""
    ORDER = "ORDER"
    PURCHASE = "PURCHASE"
    ADJUSTMENT = "ADJUSTMENT"
    OTHER = "OTHER"


@dataclass
class Inventory:
    """
    Inventory entity representing current stock levels.
    
    Business Rules:
    - One inventory record per product per owner
    - available_quantity = quantity - reserved_quantity
    - Alerts when available_quantity <= low_stock_threshold
    """
    id: Optional[int]
    owner_id: int
    product_id: int
    quantity: Decimal = Decimal("0")
    reserved_quantity: Decimal = Decimal("0")
    available_quantity: Decimal = Decimal("0")
    low_stock_threshold: Decimal = Decimal("10")
    product_name: Optional[str] = None
    product_code: Optional[str] = None
    last_stock_check_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate inventory data"""
        if self.quantity < 0:
            raise ValueError("Quantity cannot be negative")
        
        if self.reserved_quantity < 0:
            raise ValueError("Reserved quantity cannot be negative")
        
        if self.reserved_quantity > self.quantity:
            raise ValueError("Reserved quantity cannot exceed total quantity")
    
    def get_available_quantity(self) -> Decimal:
        """Calculate available quantity"""
        return self.quantity - self.reserved_quantity
    
    def is_low_stock(self) -> bool:
        """Check if stock is low"""
        return self.get_available_quantity() <= self.low_stock_threshold
    
    def is_out_of_stock(self) -> bool:
        """Check if out of stock"""
        return self.get_available_quantity() <= 0
    
    def can_fulfill(self, quantity: Decimal) -> bool:
        """Check if inventory can fulfill requested quantity"""
        return self.get_available_quantity() >= quantity
    
    def reserve_stock(self, quantity: Decimal):
        """
        Reserve stock for pending order.
        
        Args:
            quantity: Quantity to reserve
        
        Raises:
            ValueError: If insufficient stock
        """
        if not self.can_fulfill(quantity):
            raise ValueError(f"Insufficient stock. Available: {self.get_available_quantity()}, Requested: {quantity}")
        
        self.reserved_quantity += quantity
    
    def release_stock(self, quantity: Decimal):
        """Release reserved stock"""
        self.reserved_quantity -= quantity
        if self.reserved_quantity < 0:
            self.reserved_quantity = Decimal("0")
    
    def add_stock(self, quantity: Decimal):
        """Add stock (import)"""
        if quantity <= 0:
            raise ValueError("Quantity to add must be greater than 0")
        self.quantity += quantity
    
    def remove_stock(self, quantity: Decimal):
        """Remove stock (export)"""
        if quantity <= 0:
            raise ValueError("Quantity to remove must be greater than 0")
        
        if quantity > self.quantity:
            raise ValueError(f"Cannot remove {quantity}. Current stock: {self.quantity}")
        
        self.quantity -= quantity
    
    def adjust_stock(self, new_quantity: Decimal):
        """Adjust stock to specific quantity (for corrections)"""
        if new_quantity < 0:
            raise ValueError("New quantity cannot be negative")
        self.quantity = new_quantity


@dataclass
class StockMovement:
    """
    Stock movement entity (audit trail).
    
    Business Rules:
    - Immutable audit log
    - Positive quantity = stock increase
    - Negative quantity = stock decrease
    - Updates INVENTORY.quantity
    """
    id: Optional[int]
    owner_id: int
    product_id: int
    movement_type: MovementType
    quantity: Decimal
    unit_id: int
    created_by: int
    reference_type: Optional[ReferenceType] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate stock movement"""
        if self.quantity == 0:
            raise ValueError("Movement quantity cannot be zero")
    
    def is_import(self) -> bool:
        """Check if movement is import (stock increase)"""
        return self.movement_type == MovementType.IMPORT
    
    def is_export(self) -> bool:
        """Check if movement is export (stock decrease)"""
        return self.movement_type == MovementType.EXPORT
    
    def is_adjustment(self) -> bool:
        """Check if movement is adjustment"""
        return self.movement_type == MovementType.ADJUSTMENT
    
    def get_quantity_change(self) -> Decimal:
        """
        Get quantity change for inventory update.
        Positive for imports, negative for exports.
        """
        if self.is_import() or self.movement_type == MovementType.RETURN:
            return abs(self.quantity)
        elif self.is_export():
            return -abs(self.quantity)
        else:  # ADJUSTMENT
            return self.quantity
