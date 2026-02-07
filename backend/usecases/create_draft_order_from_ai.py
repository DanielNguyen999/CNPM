"""
Create Draft Order from AI Use Case
"""
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from domain.entities.draft_order import DraftOrder, DraftOrderSource, DraftOrderStatus
from domain.repositories.draft_order_repository import DraftOrderRepository
from domain.repositories.product_repository import ProductRepository
from domain.repositories.customer_repository import CustomerRepository
from infrastructure.ai.llm_provider import LLMProvider


class CreateDraftOrderFromAIUseCase:
    """
    Use case for creating draft orders from AI-parsed natural language.
    """
    
    def __init__(
        self,
        draft_repo: DraftOrderRepository,
        product_repo: ProductRepository,
        customer_repo: CustomerRepository,
        llm_provider: LLMProvider
    ):
        self.draft_repo = draft_repo
        self.product_repo = product_repo
        self.customer_repo = customer_repo
        self.llm_provider = llm_provider
    
    async def execute(
        self,
        owner_id: int,
        user_input: str,
        source: str,
        created_by: int,
        context: Dict[str, Any] = None
    ) -> DraftOrder:
        """
        Execute draft order creation from AI.
        """
        
        # 1. Parse input via LLM
        if context is None:
            context = {"owner_id": owner_id}
        
        parsed_data = await self.llm_provider.parse_order_from_text(
            user_input=user_input,
            context=context
        )
        
        # 2. Resolve customer from database if not identified by ID
        customer_data = parsed_data.get("customer", {})
        customer_name = customer_data.get("name")
        if customer_name and not customer_data.get("id"):
            customers = await self.customer_repo.search_by_name_or_phone(customer_name, owner_id, limit=1)
            if customers:
                customer_data["id"] = customers[0].id
                # Update with formal name from DB if matched
                customer_data["name"] = customers[0].full_name
                customer_data["phone"] = customers[0].phone or customer_data.get("phone", "")

        # 3. Resolve unit prices from database if they are 0
        items = parsed_data.get("items", [])
        for item in items:
            product_name = item.get("product_name")
            current_price = item.get("unit_price", 0)
            
            if (not current_price or current_price == 0) and product_name:
                # Try to find product by name to get the actual price
                products = await self.product_repo.search_by_name(product_name, owner_id, limit=1)
                if products:
                    product = products[0]
                    item["unit_price"] = float(product.base_price)
                    # Also try to map product_id if possible
                    item["product_id"] = product.id
                    if not item.get("unit_name") and product.base_unit_id:
                         # We could resolve unit name here but let's keep it simple
                         pass

        # 3. Extract confidence and validation
        confidence = Decimal(str(parsed_data.get("confidence", 0)))
        missing_fields = parsed_data.get("missing_fields", [])
        questions = parsed_data.get("questions", [])
        
        # 3. Generate draft code
        draft_code = await self.draft_repo.generate_draft_code(owner_id)
        
        # 4. Create draft order
        draft_order = DraftOrder(
            id=None,
            owner_id=owner_id,
            draft_code=draft_code,
            source=DraftOrderSource(source),
            created_by=created_by,
            original_input=user_input,
            parsed_data=parsed_data,
            confidence_score=confidence,
            missing_fields=missing_fields,
            questions=questions,
            status=DraftOrderStatus.PENDING,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        
        # 5. Save draft order
        created_draft = await self.draft_repo.create(draft_order)
        
        # TODO: Create notification for user
        # This would notify the employee/owner about the new draft order
        
        return created_draft
