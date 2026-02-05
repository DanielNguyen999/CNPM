from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from infrastructure.database.models import AuditLog

class AuditService:
    """
    Service for logging system actions and changes.
    """
    
    @staticmethod
    def log_action(
        db: Session,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        owner_id: Optional[int] = None
    ):
        """
        Record an action in the audit log.
        """
        import json
        audit_entry = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=json.dumps(details or {}),
            owner_id=owner_id,
            created_at=datetime.utcnow()
        )
        db.add(audit_entry)
        db.commit()
