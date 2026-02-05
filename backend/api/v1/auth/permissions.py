from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from infrastructure.database.connection import get_db
from api.v1.auth.dependencies import CurrentUser, get_current_user
from infrastructure.database.employee_permission_repository_impl import SQLAlchemyEmployeePermissionRepository

def require_permission(permission_key: str):
    """
    Dependency to check if the current user has a specific granular permission.
    If the user is an OWNER or ADMIN, they have all permissions.
    If the user is an EMPLOYEE, we check the EMPLOYEE_PERMISSION table.
    """
    async def permission_checker(
        current_user: CurrentUser = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        # ADMIN and OWNER have all permissions
        if current_user.role in ["ADMIN", "OWNER"]:
            return current_user
            
        # For EMPLOYEES, check granular permissions
        if current_user.role == "EMPLOYEE":
            repo = SQLAlchemyEmployeePermissionRepository(db)
            # Find the employee record linked to this user
            from infrastructure.database.models import Employee as EmployeeModel
            employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == current_user.user_id).first()
            
            if not employee:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Hồ sơ nhân viên không tồn tại"
                )
            
            permission = await repo.get_permission(employee.id, permission_key)
            if permission and permission.is_granted:
                return current_user
                
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Bạn không có quyền thực hiện hành động này: {permission_key}"
        )
        
    return permission_checker
