"""
SQLAlchemy implementation of OrderRepository
"""
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, extract

from domain.entities.order import Order as OrderEntity, OrderItem as OrderItemEntity, OrderType, PaymentMethod, PaymentStatus
from domain.repositories.order_repository import OrderRepository
from infrastructure.database.models import Order as OrderModel, OrderItem as OrderItemModel


class SQLAlchemyOrderRepository(OrderRepository):
    """SQLAlchemy implementation of OrderRepository"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, order: OrderEntity) -> OrderEntity:
        """Create a new order (Atomic-ready)"""
        # Create order model
        order_model = OrderModel(
            owner_id=order.owner_id,
            order_code=order.order_code,
            customer_id=order.customer_id,
            order_date=order.order_date,
            order_type=order.order_type.value,
            subtotal=order.subtotal,
            tax_rate=order.tax_rate,
            tax_amount=order.tax_amount,
            discount_amount=order.discount_amount,
            total_amount=order.total_amount,
            paid_amount=order.paid_amount,
            payment_method=order.payment_method.value,
            payment_status=order.payment_status.value,
            notes=order.notes,
            created_by=order.created_by
        )
        
        self.session.add(order_model)
        self.session.flush()  # Get ID
        
        # Create order items
        for item in order.items:
            item_model = OrderItemModel(
                order_id=order_model.id,
                product_id=item.product_id,
                unit_id=item.unit_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percent=item.discount_percent,
                discount_amount=item.discount_amount,
            )
            self.session.add(item_model)
        
        self.session.flush()
        # self.session.refresh(order_model) # Do not refresh here if we want to avoid FetchValue errors during transaction, but Refresh is needed for FetchValues.
        # Actually, refresh is fine for FetchedValue as long as we don't try to write into them.
        self.session.refresh(order_model)
        
        return self._to_entity(order_model)
    
    async def get_by_id(self, order_id: int, owner_id: int) -> Optional[OrderEntity]:
        """Get order by ID with tenant isolation"""
        order_model = self.session.query(OrderModel).filter(
            and_(
                OrderModel.id == order_id,
                OrderModel.owner_id == owner_id
            )
        ).first()
        
        if not order_model:
            return None
        
        return self._to_entity(order_model)
    
    async def get_by_code(self, order_code: str, owner_id: int) -> Optional[OrderEntity]:
        """Get order by code with tenant isolation"""
        order_model = self.session.query(OrderModel).filter(
            and_(
                OrderModel.order_code == order_code,
                OrderModel.owner_id == owner_id
            )
        ).first()
        
        if not order_model:
            return None
        
        return self._to_entity(order_model)
    
    async def list_by_owner(
        self, 
        owner_id: int, 
        skip: int = 0, 
        limit: int = 100,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        search: Optional[str] = None,
        status: Optional[str] = None,
        customer_id: Optional[int] = None
    ) -> List[OrderEntity]:
        """List orders for owner with pagination and filters"""
        query = self.session.query(OrderModel).filter(
            OrderModel.owner_id == owner_id
        )
        
        if start_date:
            query = query.filter(OrderModel.order_date >= start_date)
        if end_date:
            query = query.filter(OrderModel.order_date <= end_date)
            
        if status:
            query = query.filter(OrderModel.payment_status == status)
            
        if customer_id:
             query = query.filter(OrderModel.customer_id == customer_id)
            
        if search:
            # Search by order_code or customer name (requires join with customer if implemented, or just order_code for now)
            # Assuming OrderModel usually has order_code. Search logic might vary.
            # Using simple order_code match for now
             query = query.filter(OrderModel.order_code.ilike(f"%{search}%"))

        query = query.order_by(OrderModel.order_date.desc())
        query = query.offset(skip).limit(limit)
        
        order_models = query.all()
        return [self._to_entity(om) for om in order_models]
    
    async def list_by_customer(
        self, 
        customer_id: int, 
        owner_id: int,
        skip: int = 0, 
        limit: int = 100
    ) -> List[OrderEntity]:
        """List orders for specific customer"""
        order_models = self.session.query(OrderModel).filter(
            and_(
                OrderModel.customer_id == customer_id,
                OrderModel.owner_id == owner_id
            )
        ).order_by(OrderModel.order_date.desc()).offset(skip).limit(limit).all()
        
        return [self._to_entity(om) for om in order_models]
    
    async def update(self, order: OrderEntity) -> OrderEntity:
        """Update order"""
        order_model = self.session.query(OrderModel).filter(
            and_(
                OrderModel.id == order.id,
                OrderModel.owner_id == order.owner_id
            )
        ).first()
        
        if not order_model:
            raise ValueError(f"Order {order.id} not found")
        
        # Update fields
        order_model.paid_amount = order.paid_amount
        order_model.payment_status = order.payment_status.value
        order_model.notes = order.notes
        
        self.session.flush()
        return order
    
    async def delete(self, order_id: int, owner_id: int) -> bool:
        """Delete order (soft delete)"""
        # In production, implement soft delete
        order_model = self.session.query(OrderModel).filter(
            and_(
                OrderModel.id == order_id,
                OrderModel.owner_id == owner_id
            )
        ).first()
        
        if not order_model:
            return False
        
        self.session.delete(order_model)
        self.session.commit()
        return True
    
    async def count_by_owner(self, owner_id: int, month: Optional[int] = None) -> int:
        """Count orders for subscription limit check"""
        query = self.session.query(func.count(OrderModel.id)).filter(
            OrderModel.owner_id == owner_id
        )
        
        if month:
            query = query.filter(extract('month', OrderModel.order_date) == month)
        
        return query.scalar()
    
    async def generate_order_code(self, owner_id: int) -> str:
        """Generate unique order code"""
        # Get current date
        now = datetime.now()
        date_str = now.strftime("%Y%m%d")
        
        # Get count for today
        count = self.session.query(func.count(OrderModel.id)).filter(
            and_(
                OrderModel.owner_id == owner_id,
                func.date(OrderModel.order_date) == now.date()
            )
        ).scalar()
        
        # Generate code: ORD-YYYYMMDD-XXXX
        return f"ORD-{date_str}-{count + 1:04d}"
    
    def _to_entity(self, order_model: OrderModel) -> OrderEntity:
        """Convert SQLAlchemy model to domain entity"""
        # Get order items from relationship if available, else query
        item_models = order_model.items_rel if hasattr(order_model, 'items_rel') else self.session.query(OrderItemModel).filter(
            OrderItemModel.order_id == order_model.id
        ).all()
        
        items = [
            OrderItemEntity(
                id=im.id,
                order_id=im.order_id,
                product_id=im.product_id,
                unit_id=im.unit_id,
                quantity=im.quantity,
                unit_price=im.unit_price,
                discount_percent=im.discount_percent,
                discount_amount=im.discount_amount,
                subtotal=im.subtotal,
                line_total=im.subtotal,
                product_name=im.product.name if hasattr(im, 'product') and im.product else None,
                unit_name=im.unit.name if hasattr(im, 'unit') and im.unit else None
            )
            for im in item_models
        ]
        
        return OrderEntity(
            id=order_model.id,
            owner_id=order_model.owner_id,
            order_code=order_model.order_code,
            customer_id=order_model.customer_id,
            customer_name=order_model.customer.full_name if hasattr(order_model, 'customer') and order_model.customer else None,
            customer_phone=order_model.customer.phone if hasattr(order_model, 'customer') and order_model.customer else None,
            created_by=order_model.created_by,
            order_date=order_model.order_date,
            order_type=OrderType(order_model.order_type),
            tax_rate=order_model.tax_rate,
            discount_amount=order_model.discount_amount,
            paid_amount=order_model.paid_amount,
            payment_method=PaymentMethod(order_model.payment_method),
            notes=order_model.notes,
            items=items,
            subtotal=order_model.subtotal,
            tax_amount=order_model.tax_amount,
            total_amount=order_model.total_amount,
            debt_amount=order_model.debt_amount,
            payment_status=PaymentStatus(order_model.payment_status),
            created_at=order_model.created_at,
            updated_at=order_model.updated_at
        )
