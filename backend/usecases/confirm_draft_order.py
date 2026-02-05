"""
Confirm Draft Order Use Case - Convert AI draft to actual order
"""
from typing import Dict, Any, List
from decimal import Decimal

from domain.entities.draft_order import DraftOrder
from domain.entities.order import Order
from domain.repositories.draft_order_repository import DraftOrderRepository
from domain.repositories.customer_repository import CustomerRepository
from domain.repositories.product_repository import ProductRepository
from usecases.create_order import CreateOrderUseCase


class ConfirmDraftOrderUseCase:
    """
    Use case for confirming AI-generated draft orders.
    
    Business Flow:
    1. Validate draft order exists and is pending
    2. Parse draft data
    3. Resolve customer (find or suggest creation)
    4. Resolve products (match by name/code)
    5. Create actual order via CreateOrderUseCase
    6. Update draft order status
    7. Return created order
    """
    
    def __init__(
        self,
        draft_repo: DraftOrderRepository,
        customer_repo: CustomerRepository,
        product_repo: ProductRepository,
        create_order_usecase: CreateOrderUseCase
    ):
        self.draft_repo = draft_repo
        self.customer_repo = customer_repo
        self.product_repo = product_repo
        self.create_order_usecase = create_order_usecase
    
    async def execute(
        self,
        draft_id: int,
        owner_id: int,
        confirmed_by: int,
        overrides: Dict[str, Any] = None
    ) -> Order:
        """
        Execute draft order confirmation.
        
        Args:
            draft_id: Draft order ID
            owner_id: Owner ID (tenant)
            confirmed_by: User ID confirming
            overrides: Optional overrides for parsed data
        
        Returns:
            Created Order
        
        Raises:
            ValueError: If validation fails
        """
        
        # 1. Get draft order
        draft = await self.draft_repo.get_by_id(draft_id, owner_id)
        if not draft:
            raise ValueError(f"Draft order {draft_id} not found")
        
        if not draft.can_be_confirmed():
            raise ValueError(f"Draft order cannot be confirmed (status: {draft.status.value})")
        
        # 2. Parse draft data
        parsed_data = draft.parsed_data
        if overrides:
            parsed_data.update(overrides)
        
        # 3. Resolve customer
        customer_data = parsed_data.get("customer", {})
        customer_id = customer_data.get("id")
        
        if not customer_id:
            # Try to find by name or phone
            query = customer_data.get("name") or customer_data.get("phone")
            if query:
                customers = await self.customer_repo.search_by_name_or_phone(query, owner_id, limit=1)
                if customers:
                    customer_id = customers[0].id
        
        if not customer_id:
            raise ValueError(
                f"Cannot resolve customer. "
                f"Please create customer first or provide customer_id in overrides."
            )
        
        # 4. Resolve products and prepare items
        items_data = parsed_data.get("items", [])
        if not items_data:
            raise ValueError("No items in draft order")
        
        order_items = []
        for item_data in items_data:
            product_id = item_data.get("product_id")
            
            if not product_id:
                # Try to find by name or code
                product_name = item_data.get("product") or item_data.get("name")
                if product_name:
                    products = await self.product_repo.search_by_name(product_name, owner_id, limit=1)
                    if products:
                        product_id = products[0].id
            
            if not product_id:
                raise ValueError(
                    f"Cannot resolve product: {item_data.get('product')}. "
                    f"Please provide product_id in overrides."
                )
            
            # Get product to determine unit and price
            product = await self.product_repo.get_by_id(product_id, owner_id)
            
            order_items.append({
                "product_id": product_id,
                "unit_id": item_data.get("unit_id", product.base_unit_id),
                "quantity": item_data.get("quantity", 1),
                "unit_price": item_data.get("unit_price", product.base_price),
                "discount_percent": item_data.get("discount_percent", 0)
            })
        
        # 5. Extract payment info
        payment_data = parsed_data.get("payment", {})
        paid_amount = Decimal(str(payment_data.get("paid_amount", 0)))
        payment_method = payment_data.get("payment_method", "CASH")
        
        # 6. Create order
        order = await self.create_order_usecase.execute(
            owner_id=owner_id,
            customer_id=customer_id,
            created_by=confirmed_by,
            items=order_items,
            tax_rate=Decimal(str(parsed_data.get("tax_rate", 10))),
            discount_amount=Decimal(str(parsed_data.get("discount_amount", 0))),
            paid_amount=paid_amount,
            payment_method=payment_method,
            notes=f"From AI draft {draft.draft_code}. Original: {draft.original_input}"
        )
        
        # 7. Update draft order
        draft.confirm(confirmed_by=confirmed_by, order_id=order.id)
        await self.draft_repo.update(draft)
        
        return order
