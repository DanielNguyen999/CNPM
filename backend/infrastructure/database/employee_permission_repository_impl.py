from typing import List, Optional
from sqlalchemy.orm import Session
from infrastructure.database.models import EmployeePermission as EmployeePermissionModel
from domain.entities.employee_permission import EmployeePermission

class SQLAlchemyEmployeePermissionRepository:
    """
    SQLAlchemy implementation of EmployeePermission repository.
    """
    def __init__(self, db: Session):
        self.db = db

    async def get_by_employee(self, employee_id: int) -> List[EmployeePermission]:
        """Get all permissions for an employee"""
        models = self.db.query(EmployeePermissionModel).filter(
            EmployeePermissionModel.employee_id == employee_id
        ).all()
        return [self._to_entity(m) for m in models]

    async def get_permission(self, employee_id: int, key: str) -> Optional[EmployeePermission]:
        """Get a specific permission by key"""
        model = self.db.query(EmployeePermissionModel).filter(
            EmployeePermissionModel.employee_id == employee_id,
            EmployeePermissionModel.permission_key == key
        ).first()
        return self._to_entity(model) if model else None

    async def save(self, permission: EmployeePermission) -> EmployeePermission:
        """Create or update a permission"""
        model = self.db.query(EmployeePermissionModel).filter(
            EmployeePermissionModel.employee_id == permission.employee_id,
            EmployeePermissionModel.permission_key == permission.permission_key
        ).first()

        if model:
            model.is_granted = permission.is_granted
            model.granted_by = permission.granted_by
            model.granted_at = permission.granted_at
        else:
            model = EmployeePermissionModel(
                employee_id=permission.employee_id,
                permission_key=permission.permission_key,
                is_granted=permission.is_granted,
                granted_by=permission.granted_by,
                granted_at=permission.granted_at
            )
            self.db.add(model)
        
        self.db.commit()
        self.db.refresh(model)
        return self._to_entity(model)

    def _to_entity(self, model: EmployeePermissionModel) -> EmployeePermission:
        return EmployeePermission(
            id=model.id,
            employee_id=model.employee_id,
            permission_key=model.permission_key,
            is_granted=model.is_granted,
            granted_by=model.granted_by,
            granted_at=model.granted_at
        )
