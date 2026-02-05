"""
Draft order management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from infrastructure.database.connection import get_db
from infrastructure.database.draft_order_repository_impl import SQLAlchemyDraftOrderRepository
from infrastructure.database.customer_repository_impl import SQLAlchemyCustomerRepository
from infrastructure.database.product_repository_impl import SQLAlchemyProductRepository
from infrastructure.database.order_repository_impl import SQLAlchemyOrderRepository
from infrastructure.database.inventory_repository_impl import SQLAlchemyInventoryRepository
from infrastructure.database.debt_repository_impl import SQLAlchemyDebtRepository

from api.schemas import DraftOrderResponse, ConfirmDraftRequest, OrderResponse, OrderItemResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role

from usecases.confirm_draft_order import ConfirmDraftOrderUseCase
from usecases.create_order import CreateOrderUseCase

router = APIRouter()


@router.get("", response_model=List[DraftOrderResponse])
async def list_pending_drafts(
    skip: int = 0,
    limit: int = 100,
    current_user: CurrentUser = Depends(require_role("OWNER", "EMPLOYEE")),
    db: Session = Depends(get_db),
):
    """
    List pending draft orders for current tenant.
    """
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào",
        )

    draft_repo = SQLAlchemyDraftOrderRepository(db)
    drafts = await draft_repo.list_pending(owner_id=current_user.owner_id, skip=skip, limit=limit)

    return [
        DraftOrderResponse(
            id=d.id,
            owner_id=d.owner_id,
            draft_code=d.draft_code,
            source=d.source.value,
            original_input=d.original_input or "",
            parsed_data=d.parsed_data,
            confidence_score=d.confidence_score or 0,
            missing_fields=d.missing_fields or [],
            questions=d.questions or [],
            status=d.status.value,
            created_at=d.created_at,
            expires_at=d.expires_at,
        )
        for d in drafts
    ]


@router.post("/{draft_id}/confirm", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def confirm_draft_order(
    draft_id: int,
    body: ConfirmDraftRequest,
    current_user: CurrentUser = Depends(require_role("OWNER", "EMPLOYEE")),
    db: Session = Depends(get_db),
):
    """
    Confirm an AI draft order and create an actual order.
    """
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào",
        )

    # Initialize repositories
    draft_repo = SQLAlchemyDraftOrderRepository(db)
    customer_repo = SQLAlchemyCustomerRepository(db)
    product_repo = SQLAlchemyProductRepository(db)
    order_repo = SQLAlchemyOrderRepository(db)
    inventory_repo = SQLAlchemyInventoryRepository(db)
    debt_repo = SQLAlchemyDebtRepository(db)

    # Wire use cases
    create_order_uc = CreateOrderUseCase(
        order_repo=order_repo,
        customer_repo=customer_repo,
        product_repo=product_repo,
        inventory_repo=inventory_repo,
        debt_repo=debt_repo,
    )
    confirm_uc = ConfirmDraftOrderUseCase(
        draft_repo=draft_repo,
        customer_repo=customer_repo,
        product_repo=product_repo,
        create_order_usecase=create_order_uc,
    )

    try:
        order = await confirm_uc.execute(
            draft_id=draft_id,
            owner_id=current_user.owner_id,
            confirmed_by=current_user.user_id,
            overrides=body.overrides or {},
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Map domain order entity to API schema
    return OrderResponse(
        id=order.id,
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
        debt_amount=order.get_debt_amount(),
        payment_method=order.payment_method.value,
        payment_status=order.payment_status.value,
        notes=order.notes,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                unit_id=item.unit_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                discount_percent=item.discount_percent,
                discount_amount=item.discount_amount,
                line_total=item.calculate_subtotal(),
            )
            for item in order.items
        ],
        created_at=order.created_at or order.order_date,
    )


@router.post("/{draft_id}/reject", status_code=status.HTTP_200_OK)
async def reject_draft_order(
    draft_id: int,
    current_user: CurrentUser = Depends(require_role("OWNER", "EMPLOYEE")),
    db: Session = Depends(get_db),
):
    """
    Reject a draft order (do not create actual order).
    """
    if not current_user.owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Người dùng không thuộc về bất kỳ cửa hàng nào",
        )

    draft_repo = SQLAlchemyDraftOrderRepository(db)
    draft = await draft_repo.get_by_id(draft_id, current_user.owner_id)
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy đơn nháp ID {draft_id}",
        )

    try:
        draft.reject(rejected_by=current_user.user_id)
        await draft_repo.update(draft)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    return {"status": "REJECTED", "draft_id": draft_id}

