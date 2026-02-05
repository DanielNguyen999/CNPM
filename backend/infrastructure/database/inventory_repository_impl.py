"""
SQLAlchemy implementation of InventoryRepository
"""
from typing import List, Optional
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from domain.entities.inventory import Inventory as InventoryEntity, StockMovement as StockMovementEntity
from domain.entities.inventory import MovementType, ReferenceType
from domain.repositories.inventory_repository import InventoryRepository
from infrastructure.database.models import Inventory as InventoryModel, StockMovement as StockMovementModel, Product as ProductModel


class SQLAlchemyInventoryRepository(InventoryRepository):
    """SQLAlchemy implementation of InventoryRepository"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def get_by_product(self, product_id: int, owner_id: int) -> Optional[InventoryEntity]:
        """Get inventory for product with tenant isolation"""
        inventory_model = self.session.query(InventoryModel).filter(
            and_(
                InventoryModel.product_id == product_id,
                InventoryModel.owner_id == owner_id
            )
        ).first()
        
        if not inventory_model:
            # If inventory record doesn't exist, check if product belongs to owner
            product = self.session.query(ProductModel).filter(
                and_(
                    ProductModel.id == product_id,
                    ProductModel.owner_id == owner_id
                )
            ).first()
            
            if not product:
                return None
                
            # Create default inventory record
            inventory_model = InventoryModel(
                owner_id=owner_id,
                product_id=product_id,
                quantity=0,
                reserved_quantity=0,
                low_stock_threshold=10
            )
            self.session.add(inventory_model)
            self.session.flush()
        
        return self._to_entity(inventory_model)
    
    async def create_or_update(self, inventory: InventoryEntity) -> InventoryEntity:
        """Create or update inventory record"""
        inventory_model = self.session.query(InventoryModel).filter(
            and_(
                InventoryModel.product_id == inventory.product_id,
                InventoryModel.owner_id == inventory.owner_id
            )
        ).first()
        
        if inventory_model:
            inventory_model.quantity = inventory.quantity
            inventory_model.reserved_quantity = inventory.reserved_quantity
            inventory_model.low_stock_threshold = inventory.low_stock_threshold
        else:
            inventory_model = InventoryModel(
                owner_id=inventory.owner_id,
                product_id=inventory.product_id,
                quantity=inventory.quantity,
                reserved_quantity=inventory.reserved_quantity,
                low_stock_threshold=inventory.low_stock_threshold
            )
            self.session.add(inventory_model)
        
        self.session.commit()
        return self._to_entity(inventory_model)
    
    async def list_low_stock(self, owner_id: int) -> List[InventoryEntity]:
        """List products with low stock"""
        inventory_models = self.session.query(InventoryModel).filter(
            and_(
                InventoryModel.owner_id == owner_id,
                InventoryModel.available_quantity <= InventoryModel.low_stock_threshold
            )
        ).all()
        
        return [self._to_entity(inv) for inv in inventory_models]
    
    async def list_by_owner(self, owner_id: int, skip: int = 0, limit: int = 100) -> List[InventoryEntity]:
        """List inventory for owner with product details"""
        results = self.session.query(InventoryModel, ProductModel.name, ProductModel.product_code).join(
            ProductModel, InventoryModel.product_id == ProductModel.id
        ).filter(
            InventoryModel.owner_id == owner_id
        ).offset(skip).limit(limit).all()
        
        entities = []
        for inv_model, name, code in results:
            entity = self._to_entity(inv_model)
            entity.product_name = name
            entity.product_code = code
            entities.append(entity)
            
        return entities
    
    async def record_movement(self, movement: StockMovementEntity) -> StockMovementEntity:
        """Record stock movement and update inventory"""
        # Create movement record
        movement_model = StockMovementModel(
            owner_id=movement.owner_id,
            product_id=movement.product_id,
            movement_type=movement.movement_type.value,
            quantity=movement.quantity,
            unit_id=movement.unit_id,
            reference_type=movement.reference_type.value if movement.reference_type else None,
            reference_id=movement.reference_id,
            notes=movement.notes,
            created_by=movement.created_by,
            created_at=movement.created_at
        )
        self.session.add(movement_model)
        
        # Update inventory based on movement
        inventory = await self.get_by_product(movement.product_id, movement.owner_id)
        if inventory:
            # Logic here duplicates Entity logic a bit, but ensures DB consistency
            # Ideally calling domain logic then saving state
            pass # We rely on adjust_quantity or the use case to update the inventory fields
            
        # For now, we assume the use case calls appropriate methods to update Inventory entity separately
        # OR we can trigger it here. Let's do a direct update:
        
        inv_model = self.session.query(InventoryModel).filter(
            and_(
                InventoryModel.product_id == movement.product_id,
                InventoryModel.owner_id == movement.owner_id
            )
        ).first()
        
        if inv_model:
            # Update quantity based on movement type
            if movement.movement_type == MovementType.IMPORT:
                inv_model.quantity += movement.quantity
            elif movement.movement_type == MovementType.EXPORT:
                inv_model.quantity -= movement.quantity
            elif movement.movement_type == MovementType.ADJUSTMENT:
                # If negative quantity in ADJUSTMENT, it will naturally decrease
                inv_model.quantity += movement.quantity
            elif movement.movement_type == MovementType.RETURN:
                inv_model.quantity += movement.quantity
                
        
        self.session.flush()
        
        movement.id = movement_model.id
        return movement
    
    async def get_movements(
        self, 
        product_id: int, 
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[StockMovementEntity]:
        """Get stock movement history for product"""
        movements = self.session.query(StockMovementModel).filter(
            and_(
                StockMovementModel.product_id == product_id,
                StockMovementModel.owner_id == owner_id
            )
        ).order_by(StockMovementModel.created_at.desc()).offset(skip).limit(limit).all()
        
        return [
            StockMovementEntity(
                id=m.id,
                owner_id=m.owner_id,
                product_id=m.product_id,
                movement_type=MovementType(m.movement_type),
                quantity=m.quantity,
                unit_id=m.unit_id,
                reference_type=ReferenceType(m.reference_type) if m.reference_type else None,
                reference_id=m.reference_id,
                notes=m.notes,
                created_by=m.created_by,
                created_at=m.created_at
            )
            for m in movements
        ]
    
    async def list_all_movements(
        self, 
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[StockMovementEntity]:
        """Get all stock movements for owner"""
        results = self.session.query(StockMovementModel, ProductModel.name, ProductModel.product_code).join(
            ProductModel, StockMovementModel.product_id == ProductModel.id
        ).filter(
            StockMovementModel.owner_id == owner_id
        ).order_by(StockMovementModel.created_at.desc()).offset(skip).limit(limit).all()
        
        entities = []
        for m, name, code in results:
            entity = StockMovementEntity(
                id=m.id,
                owner_id=m.owner_id,
                product_id=m.product_id,
                movement_type=MovementType(m.movement_type),
                quantity=m.quantity,
                unit_id=m.unit_id,
                reference_type=ReferenceType(m.reference_type) if m.reference_type else None,
                reference_id=m.reference_id,
                notes=m.notes,
                created_by=m.created_by,
                created_at=m.created_at
            )
            # Attach product info dynamically suitable for response
            # Note: Entity doesn't strictly have product_name, but we can return enriched objects or handle in route
            # For simplicity, we attach to the entity if possible or return tuples.
            # StockMovementEntity definition doesn't have product_name.
            # We'll rely on the route to attach it or extend the entity/response.
            # Let's check StockMovementEntity definitions in route.
            
            # The route uses StockMovementResponse. 
            # We should probably return a tuple or enriched object.
            # For cleanlyness, let's return tuple in this internal method or just the entity and let route fetch names?
            # Fetching names individually is slow (N+1).
            # Let's attach it to the entity as ephemeral attribute.
            entity.product_name = name
            entity.product_code = code
            entities.append(entity)
            
        return entities

    async def adjust_quantity(self, product_id: int, owner_id: int, quantity_change: Decimal) -> InventoryEntity:
        """Adjust inventory quantity"""
        inventory_model = self.session.query(InventoryModel).filter(
            and_(
                InventoryModel.product_id == product_id,
                InventoryModel.owner_id == owner_id
            )
        ).with_for_update().first() # Lock row
        
        if not inventory_model:
             # Create default
             inventory_model = InventoryModel(
                owner_id=owner_id,
                product_id=product_id,
                quantity=0,
                reserved_quantity=0,
                low_stock_threshold=10
            )
             self.session.add(inventory_model)
        
        inventory_model.quantity += quantity_change
        
        self.session.flush()
        return self._to_entity(inventory_model)

    def _to_entity(self, model: InventoryModel) -> InventoryEntity:
        return InventoryEntity(
            id=model.id,
            owner_id=model.owner_id,
            product_id=model.product_id,
            quantity=model.quantity,
            reserved_quantity=model.reserved_quantity,
            available_quantity=model.available_quantity,
            low_stock_threshold=model.low_stock_threshold
        )
