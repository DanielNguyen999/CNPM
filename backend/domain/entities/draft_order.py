"""
Draft Order entity - AI-generated draft orders awaiting confirmation
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from decimal import Decimal
from enum import Enum


class DraftOrderSource(str, Enum):
    """Draft order source enumeration"""
    AI_TEXT = "AI_TEXT"
    AI_VOICE = "AI_VOICE"
    MANUAL = "MANUAL"


class DraftOrderStatus(str, Enum):
    """Draft order status enumeration"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


@dataclass
class DraftOrder:
    """
    Draft Order entity representing AI-generated orders awaiting confirmation.
    
    Business Rules:
    - Human-in-the-loop required (no auto-confirm)
    - Expires after 24 hours if not confirmed
    - Creates notification for employee/owner
    - AI cannot create final Order without confirmation
    """
    id: Optional[int]
    owner_id: int
    draft_code: str
    source: DraftOrderSource
    created_by: int
    parsed_data: Dict[str, Any]
    original_input: Optional[str] = None
    confidence_score: Optional[Decimal] = None
    missing_fields: Optional[List[str]] = field(default_factory=list)
    questions: Optional[List[str]] = field(default_factory=list)
    status: DraftOrderStatus = DraftOrderStatus.PENDING
    confirmed_by: Optional[int] = None
    confirmed_at: Optional[datetime] = None
    final_order_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    
    def __post_init__(self):
        """Validate and initialize draft order"""
        if not self.draft_code or len(self.draft_code.strip()) == 0:
            raise ValueError("Draft code is required")
        
        if not self.parsed_data:
            raise ValueError("Parsed data is required")
        
        # Set expiration if not provided (24 hours from creation)
        if self.expires_at is None:
            if self.created_at:
                self.expires_at = self.created_at + timedelta(hours=24)
            else:
                self.expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Validate confidence score
        if self.confidence_score is not None:
            if self.confidence_score < 0 or self.confidence_score > 1:
                raise ValueError("Confidence score must be between 0 and 1")
    
    def is_expired(self) -> bool:
        """Check if draft order has expired"""
        return datetime.utcnow() > self.expires_at
    
    def is_pending(self) -> bool:
        """Check if draft order is pending confirmation"""
        return self.status == DraftOrderStatus.PENDING
    
    def is_confirmed(self) -> bool:
        """Check if draft order was confirmed"""
        return self.status == DraftOrderStatus.CONFIRMED
    
    def is_rejected(self) -> bool:
        """Check if draft order was rejected"""
        return self.status == DraftOrderStatus.REJECTED
    
    def can_be_confirmed(self) -> bool:
        """Check if draft order can be confirmed"""
        return self.is_pending() and not self.is_expired()
    
    def confirm(self, confirmed_by: int, order_id: int):
        """
        Confirm draft order and link to created order.
        
        Args:
            confirmed_by: User ID who confirmed
            order_id: Created order ID
        
        Raises:
            ValueError: If draft cannot be confirmed
        """
        if not self.can_be_confirmed():
            raise ValueError("Draft order cannot be confirmed (expired or already processed)")
        
        self.status = DraftOrderStatus.CONFIRMED
        self.confirmed_by = confirmed_by
        self.confirmed_at = datetime.utcnow()
        self.final_order_id = order_id
    
    def reject(self, rejected_by: int):
        """
        Reject draft order.
        
        Args:
            rejected_by: User ID who rejected
        
        Raises:
            ValueError: If draft cannot be rejected
        """
        if not self.is_pending():
            raise ValueError("Only pending draft orders can be rejected")
        
        self.status = DraftOrderStatus.REJECTED
        self.confirmed_by = rejected_by
        self.confirmed_at = datetime.utcnow()
    
    def mark_expired(self):
        """Mark draft order as expired"""
        if self.is_pending() and self.is_expired():
            self.status = DraftOrderStatus.EXPIRED
    
    def has_high_confidence(self, threshold: Decimal = Decimal("0.8")) -> bool:
        """Check if AI confidence is above threshold"""
        if self.confidence_score is None:
            return False
        return self.confidence_score >= threshold
    
    def needs_clarification(self) -> bool:
        """Check if draft needs user clarification"""
        return (self.missing_fields and len(self.missing_fields) > 0) or \
               (self.questions and len(self.questions) > 0)
    
    def get_customer_info(self) -> Optional[Dict[str, Any]]:
        """Extract customer info from parsed data"""
        return self.parsed_data.get("customer")
    
    def get_items(self) -> List[Dict[str, Any]]:
        """Extract items from parsed data"""
        return self.parsed_data.get("items", [])
    
    def get_total_items(self) -> int:
        """Get total number of items"""
        return len(self.get_items())
