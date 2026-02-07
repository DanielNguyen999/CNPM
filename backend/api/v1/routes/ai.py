"""
AI draft order routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from infrastructure.database.connection import get_db
from infrastructure.ai.mock_provider import MockLLMProvider
from infrastructure.database.draft_order_repository_impl import SQLAlchemyDraftOrderRepository
from api.schemas import DraftOrderCreate, DraftOrderResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user
from usecases.create_draft_order_from_ai import CreateDraftOrderFromAIUseCase

router = APIRouter()


@router.post("/parse", response_model=DraftOrderResponse, status_code=status.HTTP_201_CREATED)
async def parse_order_from_text(
    draft_data: DraftOrderCreate,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parse Vietnamese natural language order into draft order and persist it.

    Example:
        POST /api/v1/ai/parse
        {
            "user_input": "Anh Minh gọi đặt 5 bao xi măng Hà Tiên, giao chiều nay",
            "source": "AI_TEXT"
        }
    """
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào"
        )

    # Initialize AI provider and repositories
    from infrastructure.ai import get_llm_provider
    from infrastructure.database.product_repository_impl import SQLAlchemyProductRepository
    from infrastructure.database.customer_repository_impl import SQLAlchemyCustomerRepository
    
    llm_provider = get_llm_provider()
    draft_repo = SQLAlchemyDraftOrderRepository(db)
    product_repo = SQLAlchemyProductRepository(db)
    customer_repo = SQLAlchemyCustomerRepository(db)

    use_case = CreateDraftOrderFromAIUseCase(
        draft_repo=draft_repo,
        product_repo=product_repo,
        customer_repo=customer_repo,
        llm_provider=llm_provider,
    )

    try:
        created_draft = await use_case.execute(
            owner_id=current_user.owner_id,
            user_input=draft_data.user_input,
            source=draft_data.source,
            created_by=current_user.user_id,
            context={"owner_id": current_user.owner_id},
        )

        # Map domain entity to API schema
        return DraftOrderResponse(
            id=created_draft.id,
            owner_id=created_draft.owner_id,
            draft_code=created_draft.draft_code,
            source=created_draft.source.value,
            original_input=created_draft.original_input,
            parsed_data=created_draft.parsed_data,
            confidence_score=created_draft.confidence_score or 0,
            missing_fields=created_draft.missing_fields or [],
            questions=created_draft.questions or [],
            status=created_draft.status.value,
            created_at=created_draft.created_at,
            expires_at=created_draft.expires_at,
        )

    except HTTPException:
        # re-raise explicit HTTP errors
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi phân tích đơn hàng: {str(e)}"
        )


@router.get("/test", response_model=dict)
async def test_ai_parsing():
    """
    Test AI parsing without authentication (for demo).
    
    Example:
        GET /api/v1/ai/test
    """
    llm_provider = MockLLMProvider()
    
    test_inputs = [
        "Anh Minh gọi đặt 5 bao xi măng Hà Tiên",
        "Chị Lan cần 10 thùng Coca, 5 gói snack",
        "Khách hàng ABC đặt 20 viên gạch Đồng Tâm, giao chiều nay"
    ]
    
    results = []
    for user_input in test_inputs:
        parsed = await llm_provider.parse_order_from_text(user_input, context={})
        results.append({
            "input": user_input,
            "parsed": parsed
        })
    
    return {
        "message": "AI Mock Provider Test",
        "provider": "MockLLMProvider",
        "results": results
    }
