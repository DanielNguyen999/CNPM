"""
Unit management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from infrastructure.database.connection import get_db
from infrastructure.database.models import Unit as UnitModel
from api.schemas import UserRole
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role
from pydantic import BaseModel

router = APIRouter()

class UnitBase(BaseModel):
    name: str
    abbreviation: str
    description: str | None = None

class UnitResponse(UnitBase):
    id: int
    owner_id: int
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[UnitResponse])
async def list_units(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all units for owner"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Người dùng không thuộc về bất kỳ cửa hàng nào")
    return db.query(UnitModel).filter(UnitModel.owner_id == current_user.owner_id).all()

@router.post("", response_model=UnitResponse, status_code=201)
async def create_unit(
    unit: UnitBase,
    current_user: CurrentUser = Depends(require_role("OWNER")),
    db: Session = Depends(get_db)
):
    """Create a new unit"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Người dùng không thuộc về bất kỳ cửa hàng nào")
    
    # Check if exists
    existing = db.query(UnitModel).filter(
        UnitModel.owner_id == current_user.owner_id,
        UnitModel.name == unit.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Đơn vị đã tồn tại")
        
    db_unit = UnitModel(
        owner_id=current_user.owner_id,
        name=unit.name,
        abbreviation=unit.abbreviation,
        description=unit.description
    )
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit

@router.delete("/{unit_id}", status_code=204)
async def delete_unit(
    unit_id: int,
    current_user: CurrentUser = Depends(require_role("OWNER")),
    db: Session = Depends(get_db)
):
    """Delete a unit"""
    unit = db.query(UnitModel).filter(
        UnitModel.id == unit_id,
        UnitModel.owner_id == current_user.owner_id
    ).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn vị")
        
    db.delete(unit)
    db.commit()
    return None
