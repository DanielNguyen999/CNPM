"""
Create Draft Order from AI Use Case
"""
from typing import Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal

from domain.entities.draft_order import DraftOrder, DraftOrderSource, DraftOrderStatus
from domain.repositories.draft_order_repository import DraftOrderRepository
from infrastructure.ai.llm_provider import LLMProvider


class CreateDraftOrderFromAIUseCase:
    """
    Use case for creating draft orders from AI-parsed natural language.
    
    Business Flow:
    1. Parse user input via LLM
    2. Validate confidence score
    3. Create draft order
    4. Create notification for user
    5. Return draft order
    """
    
    def __init__(
        self,
        draft_repo: DraftOrderRepository,
        llm_provider: LLMProvider
    ):
        self.draft_repo = draft_repo
        self.llm_provider = llm_provider
    
    async def execute(
        self,
        owner_id: int,
        user_input: str,
        source: str,  # "AI_TEXT" or "AI_VOICE"
        created_by: int,
        context: Dict[str, Any] = None
    ) -> DraftOrder:
        """
        Execute draft order creation from AI.
        
        Args:
            owner_id: Owner ID (tenant)
            user_input: Vietnamese natural language input
            source: Input source (AI_TEXT or AI_VOICE)
            created_by: User ID receiving the draft
            context: Optional context (products, customers, etc.)
        
        Returns:
            Created DraftOrder
        """
        
        # 1. Parse input via LLM
        if context is None:
            context = {"owner_id": owner_id}
        
        parsed_data = await self.llm_provider.parse_order_from_text(
            user_input=user_input,
            context=context
        )
        
        # 2. Extract confidence and validation
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
