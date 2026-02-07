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
        create_order_usecase: CreateOrderUseCase,
        db: Any = None # Add db for transaction support
    ):
        self.draft_repo = draft_repo
        self.customer_repo = customer_repo
        self.product_repo = product_repo
        self.create_order_usecase = create_order_usecase
        self.db = db
    
    async def execute(
        self,
        draft_id: int,
        owner_id: int,
        confirmed_by: int,
        overrides: Dict[str, Any] = None
    ) -> Order:
        """
        Execute draft order confirmation.
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
        customer_name = customer_data.get("name")
        customer_phone = customer_data.get("phone")
        
        if not customer_id:
            # Try to find by name or phone
            query = customer_name or customer_phone
            if query:
                customers = await self.customer_repo.search_by_name_or_phone(query, owner_id, limit=1)
                if customers:
                    customer_id = customers[0].id
        
        if not customer_id:
            # If we have a name and it's not generic "Khách lẻ", let's create it!
            if customer_name and customer_name.lower() not in ["khách lẻ", "khach le", ""]:
                from domain.entities.customer import Customer as CustomerEntity, CustomerType
                new_customer_code = await self.customer_repo.generate_customer_code(owner_id)
                new_customer = CustomerEntity(
                    id=None,
                    owner_id=owner_id,
                    customer_code=new_customer_code,
                    full_name=customer_name.title(),
                    phone=customer_phone or "",
                    customer_type=CustomerType.INDIVIDUAL,
                    is_active=True
                )
                created_customer = await self.customer_repo.create(new_customer)
                customer_id = created_customer.id
            else:
                # Fallback to "Khách lẻ"
                retail_customers = await self.customer_repo.search_by_name_or_phone("Khách lẻ", owner_id, limit=1)
                if retail_customers:
                    customer_id = retail_customers[0].id
                else:
                    # Create default "Khách lẻ"
                    from domain.entities.customer import Customer as CustomerEntity, CustomerType
                    new_customer_code = await self.customer_repo.generate_customer_code(owner_id)
                    retail_customer = CustomerEntity(
                        id=None,
                        owner_id=owner_id,
                        customer_code=new_customer_code,
                        full_name="Khách lẻ",
                        phone=customer_phone or "",
                        customer_type=CustomerType.INDIVIDUAL,
                        is_active=True
                    )
                    created_customer = await self.customer_repo.create(retail_customer)
                    customer_id = created_customer.id
        
        # 4. Resolve products and prepare items
        items_data = parsed_data.get("items", [])
        if not items_data:
            raise ValueError("No items in draft order")
        
        order_items = []
        for item_data in items_data:
            product_id = item_data.get("product_id")
            
            if not product_id:
                # Try to find by name or code
                product_name = item_data.get("product_name") or item_data.get("product") or item_data.get("name")
                if product_name:
                    products = await self.product_repo.search_by_name(product_name, owner_id, limit=1)
                    if products:
                        product_id = products[0].id
            
            if not product_id:
                raise ValueError(
                    f"Không tìm thấy sản phẩm '{item_data.get('product_name') or item_data.get('product')}' trong kho. "
                    f"Vui lòng tạo sản phẩm trước."
                )
            
            # Get product to determine unit and price
            product = await self.product_repo.get_by_id(product_id, owner_id)
            
            # Resolve unit if unit_name is provided
            unit_id = item_data.get("unit_id")
            unit_name = item_data.get("unit_name") or item_data.get("unit")
            if not unit_id and unit_name:
                unit_id = product.base_unit_id

            # Fallback for price if it's 0 or None
            item_price = item_data.get("unit_price")
            needs_fallback = False
            try:
                if item_price is None or float(item_price) == 0:
                    needs_fallback = True
            except (ValueError, TypeError):
                needs_fallback = True
            
            if needs_fallback:
                item_price = product.base_price

            order_items.append({
                "product_id": product_id,
                "unit_id": unit_id or product.base_unit_id,
                "quantity": Decimal(str(item_data.get("quantity", 1))),
                "unit_price": Decimal(str(item_price)),
                "discount_percent": Decimal(str(item_data.get("discount_percent", 0)))
            })

        
        # 5. Extract payment info
        payment_data = parsed_data.get("payment", {})
        # Check both UI flag 'is_debt' and AI-parsed 'method'
        is_debt_flag = payment_data.get("is_debt", False)
        payment_method_val = payment_data.get("method") or payment_data.get("payment_method", "CASH")
        
        if is_debt_flag or payment_method_val == "CREDIT":
            payment_method = "CREDIT"
            paid_amount = Decimal("0")
        else:
            payment_method = payment_method_val
            paid_amount = Decimal(str(payment_data.get("paid_amount", 0)))
        
        # 6. Create order
        order = await self.create_order_usecase.execute(
            db=self.db,
            owner_id=owner_id,
            customer_id=customer_id,
            created_by=confirmed_by,
            items=order_items,
            tax_rate=Decimal(str(parsed_data.get("tax_rate", 10))),
            discount_amount=Decimal(str(parsed_data.get("discount_amount", 0))),
            paid_amount=paid_amount,
            payment_method=payment_method,
            notes=f"Từ đơn nháp AI {draft.draft_code}. Gốc: {draft.original_input}"
        )

        
        # 7. Update draft order
        draft.confirm(confirmed_by=confirmed_by, order_id=order.id)
        await self.draft_repo.update(draft)
        
        return order

