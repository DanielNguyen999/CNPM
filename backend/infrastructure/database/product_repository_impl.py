"""
SQLAlchemy implementation of ProductRepository
"""
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func
from domain.entities.product import Product as ProductEntity
from domain.repositories.product_repository import ProductRepository
from infrastructure.database.models import Product as ProductModel, Inventory as InventoryModel, ProductUnit as ProductUnitModel


class SQLAlchemyProductRepository(ProductRepository):
    """SQLAlchemy implementation of ProductRepository"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, product: ProductEntity) -> ProductEntity:
        """Create a new product with its base unit and initial inventory"""
        product_model = ProductModel(
            owner_id=product.owner_id,
            product_code=product.product_code,
            name=product.name,
            description=product.description,
            category=product.category,
            base_unit_id=product.base_unit_id,
            base_price=product.base_price,
            cost_price=product.cost_price,
            image_url=product.image_url,
            is_active=product.is_active
        )
        
        self.session.add(product_model)
        self.session.flush() # Get ID
        
        # Create initial inventory record
        inventory_model = InventoryModel(
            product_id=product_model.id,
            owner_id=product.owner_id,
            quantity=0,
            reserved_quantity=0,
            low_stock_threshold=product.low_stock_threshold if hasattr(product, 'low_stock_threshold') else 10
        )
        self.session.add(inventory_model)
        
        # Create default product unit record
        product_unit_model = ProductUnitModel(
            product_id=product_model.id,
            unit_id=product.base_unit_id,
            conversion_rate=1,
            price=product.base_price,
            is_default=True
        )
        self.session.add(product_unit_model)
        
        # Handle extra units if provided in entity
        if product.units:
            for u in product.units:
                # Skip if it's the default unit we just added (though usually units passed in entity are extra ones)
                if u.get('is_default'): 
                    continue
                    
                extra_unit = ProductUnitModel(
                    product_id=product_model.id,
                    unit_id=u['unit_id'],
                    conversion_rate=u['conversion_rate'],
                    price=u['price'],
                    is_default=False
                )
                self.session.add(extra_unit)
        
        self.session.commit()
        self.session.refresh(product_model)
        
        return self._to_entity(product_model)

    async def get_by_id(self, product_id: int, owner_id: int) -> Optional[ProductEntity]:
        """Get product by ID with tenant isolation"""
        product_model = self.session.query(ProductModel).filter(
            and_(
                ProductModel.id == product_id,
                ProductModel.owner_id == owner_id,
                ProductModel.is_active == True
            )
        ).first()
        
        if not product_model:
            return None
        
        return self._to_entity(product_model)

    async def get_by_code(self, product_code: str, owner_id: int) -> Optional[ProductEntity]:
        """Get product by code with tenant isolation"""
        product_model = self.session.query(ProductModel).filter(
            and_(
                ProductModel.product_code == product_code,
                ProductModel.owner_id == owner_id,
                ProductModel.is_active == True
            )
        ).first()
        
        if not product_model:
            return None
        
        return self._to_entity(product_model)

    async def list_by_owner(self, owner_id: int, skip: int = 0, limit: int = 100, category: Optional[str] = None) -> List[ProductEntity]:
        """List products for owner with pagination and filters"""
        query = self.session.query(ProductModel).filter(
            and_(
                ProductModel.owner_id == owner_id,
                ProductModel.is_active == True
            )
        )
        
        if category:
            query = query.filter(ProductModel.category == category)
            
        product_models = query.offset(skip).limit(limit).all()
        return [self._to_entity(pm) for pm in product_models]

    async def search_by_name(self, query: str, owner_id: int, limit: int = 20) -> List[ProductEntity]:
        """Search products by name or code"""
        search_filter = or_(
            ProductModel.name.ilike(f"%{query}%"),
            ProductModel.product_code.ilike(f"%{query}%")
        )
        
        product_models = self.session.query(ProductModel).filter(
            and_(
                ProductModel.owner_id == owner_id,
                ProductModel.is_active == True,
                search_filter
            )
        ).limit(limit).all()
        
        return [self._to_entity(pm) for pm in product_models]

    async def update(self, product: ProductEntity) -> ProductEntity:
        """Update product"""
        product_model = self.session.query(ProductModel).filter(
            and_(
                ProductModel.id == product.id,
                ProductModel.owner_id == product.owner_id
            )
        ).first()
        
        if not product_model:
            raise ValueError(f"Product {product.id} not found")
        
        product_model.name = product.name
        product_model.description = product.description
        product_model.category = product.category
        product_model.base_price = product.base_price
        product_model.cost_price = product.cost_price
        product_model.image_url = product.image_url
        product_model.is_active = product.is_active
        
        # Sync default unit price if base_price changed
        default_unit = self.session.query(ProductUnitModel).filter(
            and_(
                ProductUnitModel.product_id == product.id,
                ProductUnitModel.is_default == True
            )
        ).first()
        if default_unit:
            default_unit.price = product.base_price
            
        # Handle extra units update if provided
        if product.units is not None:
             # This is a simplified "replace all extra units" or "upsert" strategy
             # For safety, let's just add new ones or update existing if logic permits.
             # Given simplicity, we'll assume the entity has the FULL list of desired secondary units.
             # But here, we only receive a list of "dicts" from the Schema usually. 
             # Let's trust the Controller logic passed valid data.
             pass 
             # TODO: Full unit sync logic is complex. For now, we update basic fields.
        
        self.session.commit()
        return product
    
    async def delete(self, product_id: int, owner_id: int) -> bool:
        """Delete product (soft delete)"""
        product_model = self.session.query(ProductModel).filter(
            and_(
                ProductModel.id == product_id,
                ProductModel.owner_id == owner_id
            )
        ).first()
        
        if not product_model:
            return False
        
        product_model.is_active = False
        self.session.commit()
        return True
    
    async def count_by_owner(self, owner_id: int) -> int:
        """Count products for subscription limit check"""
        return self.session.query(func.count(ProductModel.id)).filter(
            and_(
                ProductModel.owner_id == owner_id,
                ProductModel.is_active == True
            )
        ).scalar()
    
    def _to_entity(self, product_model: ProductModel) -> ProductEntity:
        """Convert SQLAlchemy model to domain entity"""
        entity = ProductEntity(
            id=product_model.id,
            owner_id=product_model.owner_id,
            product_code=product_model.product_code,
            name=product_model.name,
            description=product_model.description,
            category=product_model.category,
            base_unit_id=product_model.base_unit_id,
            base_price=product_model.base_price,
            cost_price=product_model.cost_price,
            image_url=product_model.image_url,
            is_active=product_model.is_active,
            created_at=product_model.created_at,
            updated_at=product_model.updated_at
        )

        
        # Populate available quantity from inventory
        if hasattr(product_model, 'inventory') and product_model.inventory:
            entity.available_quantity = product_model.inventory.available_quantity
        
        # Populate units
        if hasattr(product_model, 'units') and product_model.units:
            entity.units = [
                {
                    "id": pu.id,
                    "unit_id": pu.unit_id,
                    "unit_name": pu.unit.name if pu.unit else "Unknown",
                    "conversion_rate": pu.conversion_rate,
                    "price": pu.price,
                    "is_default": pu.is_default
                }
                for pu in product_model.units
            ]
            
        return entity
