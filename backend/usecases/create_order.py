"""
Create Order Use Case - At-counter order creation
"""
from typing import List, Dict, Any
from decimal import Decimal
from datetime import datetime

from domain.entities.order import Order, OrderItem, OrderType, PaymentMethod
from domain.entities.inventory import StockMovement, MovementType, ReferenceType
from domain.repositories.order_repository import OrderRepository
from domain.repositories.customer_repository import CustomerRepository
from domain.repositories.product_repository import ProductRepository
from domain.repositories.inventory_repository import InventoryRepository
from domain.repositories.debt_repository import DebtRepository
from api.v1.routes.events import publish_event


class CreateOrderUseCase:
    """
    Use case for creating at-counter orders.
    
    Business Flow:
    1. Validate customer exists and is active
    2. Validate all products exist and are active
    3. Check inventory availability
    4. Calculate totals
    5. Create order
    6. Create order items
    7. Update inventory (create stock movements)
    8. Create debt record if needed
    9. Return created order
    """
    
    def __init__(
        self,
        order_repo: OrderRepository,
        customer_repo: CustomerRepository,
        product_repo: ProductRepository,
        inventory_repo: InventoryRepository,
        debt_repo: DebtRepository
    ):
        self.order_repo = order_repo
        self.customer_repo = customer_repo
        self.product_repo = product_repo
        self.inventory_repo = inventory_repo
        self.debt_repo = debt_repo
        
        # Initialize InventoryService
        from domain.services.inventory_service import InventoryService
        self.inventory_service = InventoryService(inventory_repo, product_repo)
    
    async def execute(
        self,
        db, # Pass db session for transaction management
        owner_id: int,
        customer_id: int,
        created_by: int,
        items: List[Dict[str, Any]],
        tax_rate: Decimal = Decimal("10"),
        discount_amount: Decimal = Decimal("0"),
        paid_amount: Decimal = Decimal("0"),
        payment_method: str = "CASH",
        notes: str = None
    ) -> Order:
        """
        Execute order creation.
        
        Args:
            owner_id: Owner ID (tenant)
            customer_id: Customer ID
            created_by: User ID creating order
            items: List of items [{product_id, unit_id, quantity, unit_price, discount_percent}]
            tax_rate: Tax rate percentage
            discount_amount: Order-level discount
            paid_amount: Amount paid
            payment_method: Payment method
            notes: Order notes
        
        Returns:
            Created Order with items
        
        Raises:
            ValueError: If validation fails
        """
        
        try:
            # 1. Validate customer
            customer = await self.customer_repo.get_by_id(customer_id, owner_id)
            if not customer:
                raise ValueError(f"Customer {customer_id} not found")
            
            if not customer.is_active:
                raise ValueError(f"Customer {customer.full_name} is inactive")
            
            # 2. Validate products and check inventory
            order_items = []
            for item_data in items:
                product_id = item_data["product_id"]
                unit_id = item_data["unit_id"]
                quantity = Decimal(str(item_data["quantity"]))
                unit_price = Decimal(str(item_data["unit_price"]))
                discount_percent = Decimal(str(item_data.get("discount_percent", 0)))
                
                # Validate product
                product = await self.product_repo.get_by_id(product_id, owner_id)
                if not product:
                    raise ValueError(f"Product {product_id} not found")
                
                if not product.is_active:
                    raise ValueError(f"Product {product.name} is inactive")
                
                # Check inventory using InventoryService
                inventory = await self.inventory_service.get_current_stock(product_id, owner_id)
                
                if not inventory.can_fulfill(quantity):
                    raise ValueError(
                        f"Insufficient stock for {product.name}. "
                        f"Available: {inventory.get_available_quantity()}, Requested: {quantity}"
                    )
                
                # Create order item
                order_item = OrderItem(
                    id=None,
                    order_id=None,
                    product_id=product_id,
                    unit_id=unit_id,
                    quantity=quantity,
                    unit_price=unit_price,
                    discount_percent=discount_percent,
                    product_name=product.name # Populate display field
                )
                order_item.apply_discount_percent()
                order_items.append(order_item)
            
            # 3. Generate order code
            order_code = await self.order_repo.generate_order_code(owner_id)
            
            # 4. Create order
            order = Order(
                id=None,
                owner_id=owner_id,
                order_code=order_code,
                customer_id=customer_id,
                customer_name=customer.full_name, # Populate display field
                customer_phone=customer.phone,    # Populate display field
                created_by=created_by,
                order_date=datetime.utcnow(),
                order_type=OrderType.SALE,
                tax_rate=tax_rate,
                discount_amount=discount_amount,
                paid_amount=paid_amount,
                payment_method=PaymentMethod(payment_method),
                notes=notes,
                items=order_items
            )
            
            # Calculate totals
            order.recalculate_totals()
            
            # 5. Check credit limit if has debt
            if order.has_debt():
                current_debt = await self.customer_repo.get_total_debt(customer_id, owner_id)
                debt_amount = order.get_debt_amount()
                
                if not customer.can_incur_debt(debt_amount, current_debt):
                    raise ValueError(
                        f"Customer credit limit exceeded. "
                        f"Limit: {customer.credit_limit}, "
                        f"Current debt: {current_debt}, "
                        f"New debt: {debt_amount}"
                    )
            
            # 6. Save order (this will also save items) - Uses flush internally now
            created_order = await self.order_repo.create(order)
            
            # 7. Update inventory using InventoryService (atomic stock deduction) - Uses flush internally now
            for item in created_order.items:
                await self.inventory_service.deduct_stock_for_order(
                    product_id=item.product_id,
                    owner_id=owner_id,
                    quantity=item.quantity,
                    order_id=created_order.id,
                    unit_id=item.unit_id,
                    created_by=created_by
                )
            
            # 8. Create debt record if needed - Uses flush internally now
            if created_order.has_debt():
                from domain.entities.debt import Debt, DebtStatus
                from datetime import date, timedelta
                
                debt = Debt(
                    id=None,
                    owner_id=owner_id,
                    customer_id=customer_id,
                    order_id=created_order.id,
                    debt_amount=created_order.get_debt_amount(),
                    remaining_amount=created_order.get_debt_amount(),
                    due_date=date.today() + timedelta(days=30),  # 30 days default
                    status=DebtStatus.PENDING,
                    notes=f"From order {created_order.order_code}"
                )
                
                await self.debt_repo.create(debt)
            
            # Commit the entire transaction
            db.commit()

            # Trigger real-time UI update via SSE
            await publish_event(
                owner_id=owner_id,
                event_type="ORDER_CREATED",
                data={
                    "order_id": created_order.id,
                    "order_code": created_order.order_code,
                    "total_amount": float(created_order.total_amount),
                    "customer_name": created_order.customer_name
                }
            )

            return created_order
            
        except Exception as e:
            db.rollback()
            raise e
