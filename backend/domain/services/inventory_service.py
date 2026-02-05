"""
Centralized Inventory Service - Single Source of Truth for Stock Management

This service ensures data consistency across:
- Product Management
- Inventory Adjustments  
- POS (Order Creation)
- Stock Movements

All inventory operations MUST go through this service.
"""
from decimal import Decimal
from typing import Optional
from datetime import datetime

from domain.entities.inventory import Inventory, StockMovement, MovementType, ReferenceType
from domain.repositories.inventory_repository import InventoryRepository
from domain.repositories.product_repository import ProductRepository


class InventoryService:
    """
    Centralized service for all inventory operations.
    Ensures atomic updates and data consistency.
    """
    
    def __init__(
        self,
        inventory_repo: InventoryRepository,
        product_repo: ProductRepository
    ):
        self.inventory_repo = inventory_repo
        self.product_repo = product_repo
    
    async def get_current_stock(
        self, 
        product_id: int, 
        owner_id: int
    ) -> Inventory:
        """
        Get current stock level for a product.
        Creates inventory record if it doesn't exist.
        
        Returns:
            Inventory entity with current stock levels
        """
        inventory = await self.inventory_repo.get_by_product(product_id, owner_id)
        
        if not inventory:
            # Auto-create inventory record with 0 stock
            product = await self.product_repo.get_by_id(product_id, owner_id)
            if not product:
                raise ValueError(f"Product {product_id} not found")
            
            inventory = Inventory(
                id=None,
                owner_id=owner_id,
                product_id=product_id,
                quantity=Decimal("0"),
                reserved_quantity=Decimal("0"),
                available_quantity=Decimal("0"),
                low_stock_threshold=Decimal("10")
            )
            inventory = await self.inventory_repo.create_or_update(inventory)
        
        return inventory
    
    async def adjust_stock(
        self,
        product_id: int,
        owner_id: int,
        quantity_change: Decimal,
        reason: str,
        created_by: int,
        unit_id: int
    ) -> Inventory:
        """
        Manually adjust stock level (for corrections, damages, etc).
        Records movement in audit trail.
        
        Args:
            product_id: Product ID
            owner_id: Owner ID (tenant)
            quantity_change: Positive for increase, negative for decrease
            reason: Reason for adjustment
            created_by: User ID making adjustment
            unit_id: Unit ID
            
        Returns:
            Updated inventory
        """
        inventory = await self.get_current_stock(product_id, owner_id)
        
        # Validate adjustment
        new_quantity = inventory.quantity + quantity_change
        if new_quantity < 0:
            raise ValueError(
                f"Cannot adjust stock to negative value. "
                f"Current: {inventory.quantity}, Change: {quantity_change}"
            )
        
        # Record movement
        movement = StockMovement(
            id=None,
            owner_id=owner_id,
            product_id=product_id,
            movement_type=MovementType.ADJUSTMENT,
            quantity=quantity_change,
            unit_id=unit_id,
            created_by=created_by,
            reference_type=ReferenceType.ADJUSTMENT,
            notes=reason
        )
        
        # Update inventory and record movement atomically
        await self.inventory_repo.record_movement(movement)
        
        # Get updated inventory
        return await self.get_current_stock(product_id, owner_id)
    
    async def reserve_stock_for_order(
        self,
        product_id: int,
        owner_id: int,
        quantity: Decimal,
        order_id: int
    ) -> Inventory:
        """
        Reserve stock for a pending order.
        Used in draft orders or payment pending scenarios.
        
        Args:
            product_id: Product ID
            owner_id: Owner ID
            quantity: Quantity to reserve
            order_id: Order ID
            
        Returns:
            Updated inventory
            
        Raises:
            ValueError: If insufficient stock
        """
        inventory = await self.get_current_stock(product_id, owner_id)
        
        # Check availability
        if not inventory.can_fulfill(quantity):
            raise ValueError(
                f"Insufficient stock for product {product_id}. "
                f"Available: {inventory.get_available_quantity()}, "
                f"Requested: {quantity}"
            )
        
        # Reserve stock
        inventory.reserve_stock(quantity)
        
        # Update inventory
        return await self.inventory_repo.create_or_update(inventory)
    
    async def release_stock_reservation(
        self,
        product_id: int,
        owner_id: int,
        quantity: Decimal,
        order_id: int
    ) -> Inventory:
        """
        Release reserved stock (e.g., order cancelled).
        
        Args:
            product_id: Product ID
            owner_id: Owner ID
            quantity: Quantity to release
            order_id: Order ID
            
        Returns:
            Updated inventory
        """
        inventory = await self.get_current_stock(product_id, owner_id)
        inventory.release_stock(quantity)
        return await self.inventory_repo.create_or_update(inventory)
    
    async def deduct_stock_for_order(
        self,
        product_id: int,
        owner_id: int,
        quantity: Decimal,
        order_id: int,
        unit_id: int,
        created_by: int
    ) -> Inventory:
        """
        Deduct stock when order is finalized/paid.
        This is the ONLY way to reduce stock for sales.
        
        Args:
            product_id: Product ID
            owner_id: Owner ID
            quantity: Quantity sold
            order_id: Order ID
            unit_id: Unit ID
            created_by: User ID who created order
            
        Returns:
            Updated inventory
            
        Raises:
            ValueError: If insufficient stock
        """
        inventory = await self.get_current_stock(product_id, owner_id)
        
        # Check availability
        if not inventory.can_fulfill(quantity):
            raise ValueError(
                f"Insufficient stock for product {product_id}. "
                f"Available: {inventory.get_available_quantity()}, "
                f"Requested: {quantity}"
            )
        
        # Record export movement
        movement = StockMovement(
            id=None,
            owner_id=owner_id,
            product_id=product_id,
            movement_type=MovementType.EXPORT,
            quantity=quantity,
            unit_id=unit_id,
            created_by=created_by,
            reference_type=ReferenceType.ORDER,
            reference_id=order_id,
            notes=f"Sold via order #{order_id}"
        )
        
        # Update inventory and record movement atomically
        await self.inventory_repo.record_movement(movement)
        
        # Get updated inventory
        return await self.get_current_stock(product_id, owner_id)
    
    async def add_stock_from_purchase(
        self,
        product_id: int,
        owner_id: int,
        quantity: Decimal,
        purchase_id: int,
        unit_id: int,
        created_by: int
    ) -> Inventory:
        """
        Add stock from purchase/import.
        
        Args:
            product_id: Product ID
            owner_id: Owner ID
            quantity: Quantity purchased
            purchase_id: Purchase order ID
            unit_id: Unit ID
            created_by: User ID
            
        Returns:
            Updated inventory
        """
        # Record import movement
        movement = StockMovement(
            id=None,
            owner_id=owner_id,
            product_id=product_id,
            movement_type=MovementType.IMPORT,
            quantity=quantity,
            unit_id=unit_id,
            created_by=created_by,
            reference_type=ReferenceType.PURCHASE,
            reference_id=purchase_id,
            notes=f"Imported via purchase #{purchase_id}"
        )
        
        # Update inventory and record movement atomically
        await self.inventory_repo.record_movement(movement)
        
        # Get updated inventory
        return await self.get_current_stock(product_id, owner_id)
