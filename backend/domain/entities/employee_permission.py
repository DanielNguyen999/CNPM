from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class EmployeePermission:
    """
    Employee Permission entity for granular access control.
    """
    id: Optional[int]
    employee_id: int
    permission_key: str  # e.g., 'can_view_reports', 'can_edit_prices'
    is_granted: bool = True
    granted_by: Optional[int] = None
    granted_at: Optional[datetime] = None

    def __post_init__(self):
        if not self.permission_key:
            raise ValueError("Permission key is required")
