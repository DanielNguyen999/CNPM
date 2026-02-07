"""
SQLAlchemy implementation of DraftOrderRepository
"""
from typing import List, Optional
import json
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_

from domain.entities.draft_order import DraftOrder as DraftOrderEntity, DraftOrderStatus, DraftOrderSource
from domain.repositories.draft_order_repository import DraftOrderRepository
from infrastructure.database.models import DraftOrder as DraftOrderModel


class SQLAlchemyDraftOrderRepository(DraftOrderRepository):
    """SQLAlchemy implementation of DraftOrderRepository"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create(self, draft_order: DraftOrderEntity) -> DraftOrderEntity:
        """Create a new draft order"""
        draft_model = DraftOrderModel(
            owner_id=draft_order.owner_id,
            draft_code=draft_order.draft_code,
            source=draft_order.source.value,
            original_input=draft_order.original_input,
            parsed_data=json.dumps(draft_order.parsed_data),
            confidence_score=draft_order.confidence_score,
            missing_fields=json.dumps(draft_order.missing_fields),
            questions=json.dumps(draft_order.questions),
            status=draft_order.status.value,
            created_by=draft_order.created_by,
            expires_at=draft_order.expires_at
        )
        
        self.session.add(draft_model)
        self.session.commit()
        
        draft_order.id = draft_model.id
        return draft_order
    
    async def get_by_id(self, draft_id: int, owner_id: int) -> Optional[DraftOrderEntity]:
        """Get draft order by ID"""
        draft_model = self.session.query(DraftOrderModel).filter(
            and_(
                DraftOrderModel.id == draft_id,
                DraftOrderModel.owner_id == owner_id
            )
        ).first()
        
        if not draft_model:
            return None
        
        return self._to_entity(draft_model)
    
    async def get_by_code(self, draft_code: str, owner_id: int) -> Optional[DraftOrderEntity]:
        """Get draft order by code"""
        draft_model = self.session.query(DraftOrderModel).filter(
            and_(
                DraftOrderModel.draft_code == draft_code,
                DraftOrderModel.owner_id == owner_id
            )
        ).first()
        
        if not draft_model:
            return None
        
        return self._to_entity(draft_model)
    
    async def list_pending(self, owner_id: int, skip: int = 0, limit: int = 100) -> List[DraftOrderEntity]:
        """List pending draft orders"""
        draft_models = self.session.query(DraftOrderModel).filter(
            and_(
                DraftOrderModel.owner_id == owner_id,
                DraftOrderModel.status == DraftOrderStatus.PENDING.value
            )
        ).order_by(DraftOrderModel.created_at.desc()).offset(skip).limit(limit).all()
        
        return [self._to_entity(dm) for dm in draft_models]
    
    async def update(self, draft_order: DraftOrderEntity) -> DraftOrderEntity:
        """Update draft order"""
        draft_model = self.session.query(DraftOrderModel).filter(
            and_(
                DraftOrderModel.id == draft_order.id,
                DraftOrderModel.owner_id == draft_order.owner_id
            )
        ).first()
        
        if not draft_model:
            raise ValueError(f"DraftOrder {draft_order.id} not found")
        
        draft_model.parsed_data = json.dumps(draft_order.parsed_data)
        draft_model.status = draft_order.status.value
        draft_model.confirmed_by = draft_order.confirmed_by
        draft_model.confirmed_at = draft_order.confirmed_at
        draft_model.final_order_id = draft_order.final_order_id
        
        self.session.commit()
        return draft_order
    
    async def mark_expired(self, owner_id: int) -> int:
        """Mark expired draft orders"""
        from datetime import datetime
        now = datetime.utcnow()
        
        updated = self.session.query(DraftOrderModel).filter(
            and_(
                DraftOrderModel.owner_id == owner_id,
                DraftOrderModel.status == DraftOrderStatus.PENDING.value,
                DraftOrderModel.expires_at < now
            )
        ).update({DraftOrderModel.status: DraftOrderStatus.EXPIRED.value})
        
        self.session.commit()
        return updated
    
    async def generate_draft_code(self, owner_id: int) -> str:
        """Generate unique draft code"""
        from datetime import datetime
        from sqlalchemy import func
        now = datetime.utcnow()
        date_str = now.strftime("%Y%m%d")
        
        count = self.session.query(func.count(DraftOrderModel.id)).filter(
            and_(
                DraftOrderModel.owner_id == owner_id,
                func.date(DraftOrderModel.created_at) == now.date()
            )
        ).scalar()
        
        return f"DRF-{date_str}-{count + 1:04d}"

    def _to_entity(self, model: DraftOrderModel) -> DraftOrderEntity:
        return DraftOrderEntity(
            id=model.id,
            owner_id=model.owner_id,
            draft_code=model.draft_code,
            source=DraftOrderSource(model.source),
            original_input=model.original_input,
            parsed_data=json.loads(model.parsed_data),
            confidence_score=model.confidence_score,
            missing_fields=json.loads(model.missing_fields) if model.missing_fields else [],
            questions=json.loads(model.questions) if model.questions else [],
            status=DraftOrderStatus(model.status),
            created_by=model.created_by,
            created_at=model.created_at,
            expires_at=model.expires_at,
            confirmed_by=model.confirmed_by,
            confirmed_at=model.confirmed_at,
            final_order_id=model.final_order_id
        )
