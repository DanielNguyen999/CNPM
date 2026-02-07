"""
Inventory management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal

from infrastructure.database.connection import get_db
from infrastructure.database.inventory_repository_impl import SQLAlchemyInventoryRepository
from infrastructure.database.product_repository_impl import SQLAlchemyProductRepository
from api.schemas import InventoryResponse, StockMovementResponse, StockAdjustmentRequest
from api.v1.auth.dependencies import CurrentUser, get_current_user, require_role
from domain.entities.inventory import StockMovement as StockMovementEntity, MovementType
from domain.services.audit_service import AuditService
from api.v1.auth.permissions import require_permission

router = APIRouter()


@router.get("", response_model=List[InventoryResponse])
async def list_inventory(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    low_stock_only: bool = False,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List inventory items"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
    
    repo = SQLAlchemyInventoryRepository(db)
    
    if low_stock_only:
        inventory = await repo.list_low_stock(current_user.owner_id)
        # Pagination for low stock not implemented in repo yet properly for huge lists but usually small list
        inventory = inventory[skip: skip+limit]
    else:
        inventory = await repo.list_by_owner(current_user.owner_id, skip, limit)
    
    # inventory is list of InventoryEntity(with potentially loaded product)
    # We need to map manually if Pydantic alias doesn't work for nested
    results = []
    for item in inventory:
        resp = InventoryResponse.from_orm(item)
        # Manually populate from loaded product relationship if available
        if hasattr(item, 'product') and item.product:
            resp.product_name = item.product.name
            resp.product_code = item.product.product_code
        
        # Populate from dynamic attributes attached by repo
        if hasattr(item, 'product_name'):
             resp.product_name = item.product_name
        if hasattr(item, 'product_code'):
             resp.product_code = item.product_code
        if hasattr(item, 'unit_name'):
             resp.unit_name = item.unit_name
             
        results.append(resp)
        
    return results


@router.get("/{product_id}", response_model=InventoryResponse)
async def get_product_inventory(
    product_id: int,
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get inventory for specific product"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
        
    repo = SQLAlchemyInventoryRepository(db)
    inventory = await repo.get_by_product(product_id, current_user.owner_id)
    
    if not inventory:
        raise HTTPException(status_code=404, detail="Không tìm thấy thông tin kho của sản phẩm")
        
    return InventoryResponse.from_orm(inventory)


@router.post("/{product_id}/adjust", response_model=InventoryResponse)
async def adjust_stock(
    product_id: int,
    adjustment: StockAdjustmentRequest,
    current_user: CurrentUser = Depends(require_permission("can_adjust_inventory")),
    db: Session = Depends(get_db)
):
    """
    Manually adjust stock level (e.g. stock count, damages).
    Uses centralized InventoryService for data consistency.
    """
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
        
    # Initialize repositories
    inv_repo = SQLAlchemyInventoryRepository(db)
    prod_repo = SQLAlchemyProductRepository(db)
    
    # Initialize InventoryService
    from domain.services.inventory_service import InventoryService
    inventory_service = InventoryService(inv_repo, prod_repo)
    
    # Verify product exists
    product = await prod_repo.get_by_id(product_id, current_user.owner_id)
    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm")
    
    try:
        # Use centralized service for adjustment
        updated_inv = await inventory_service.adjust_stock(
            product_id=product_id,
            owner_id=current_user.owner_id,
            quantity_change=adjustment.quantity_change,
            reason=f"{adjustment.reason} - {adjustment.notes or ''}",
            created_by=current_user.user_id,
            unit_id=product.base_unit_id
        )
        
        # Log Audit
        AuditService.log_action(
            db=db,
            user_id=current_user.user_id,
            action="ADJUST_STOCK",
            resource_type="INVENTORY",
            resource_id=product_id,
            owner_id=current_user.owner_id,
            details={"quantity_change": float(adjustment.quantity_change), "reason": adjustment.reason}
        )
        
        return InventoryResponse.from_orm(updated_inv)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/movements", response_model=List[StockMovementResponse])
async def list_all_stock_movements(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get global stock movement history"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
        
    repo = SQLAlchemyInventoryRepository(db)
    movements = await repo.list_all_movements(current_user.owner_id, skip, limit)
    
    results = []
    for m in movements:
        resp = StockMovementResponse.from_orm(m)
        if hasattr(m, 'product_name'):
            resp.product_name = m.product_name
        if hasattr(m, 'product_code'):
            resp.product_code = m.product_code
        results.append(resp)
        
    return results



@router.get("/{product_id}/movements", response_model=List[StockMovementResponse])
async def get_movements(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get stock history for product"""
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Truy cập bị từ chối")
        
    repo = SQLAlchemyInventoryRepository(db)
    movements = await repo.get_movements(product_id, current_user.owner_id, skip, limit)
    
    return [StockMovementResponse.from_orm(m) for m in movements]
