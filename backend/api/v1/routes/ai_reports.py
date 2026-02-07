"""
AI-enhanced reporting routes
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime, timedelta
from decimal import Decimal

from infrastructure.database.connection import get_db
from infrastructure.database.models import Order, Debt, Inventory, OrderItem
from infrastructure.ai import get_llm_provider
from api.v1.auth.dependencies import CurrentUser, get_current_user
from api.v1.auth.permissions import require_permission

router = APIRouter()

@router.get("/summary")
async def get_ai_business_summary(
    current_user: CurrentUser = Depends(require_permission("can_view_reports")),
    db: Session = Depends(get_db)
):
    """
    Generate a Vietnamese AI summary of the business's current state.
    """
    owner_id = current_user.owner_id
    
    # 1. Fetch metrics for the last 30 days
    last_month = datetime.utcnow() - timedelta(days=30)
    
    stats = db.query(
        func.sum(Order.total_amount).label("revenue"),
        func.count(Order.id).label("orders")
    ).filter(
        and_(
            Order.owner_id == owner_id,
            Order.order_date >= last_month,
            Order.order_type == "SALE"
        )
    ).first()
    
    debt_total = db.query(func.sum(Debt.remaining_amount)).filter(
        Debt.owner_id == owner_id
    ).scalar() or 0
    
    low_stock = db.query(func.count(Inventory.id)).filter(
        and_(
            Inventory.owner_id == owner_id,
            Inventory.available_quantity <= Inventory.low_stock_threshold
        )
    ).scalar() or 0
    
    # 2. Call AI provider
    llm = get_llm_provider()
    summary = await llm.generate_business_summary({
        "revenue": float(stats.revenue or 0),
        "orders": stats.orders or 0,
        "debt": float(debt_total),
        "low_stock": low_stock
    })
    
    return {"summary": summary}

@router.get("/inventory-forecast")
async def get_inventory_forecast(
    limit: int = 10,
    current_user: CurrentUser = Depends(require_permission("can_view_reports")),
    db: Session = Depends(get_db)
):
    """
    Predict restock dates based on historical sales.
    """
    owner_id = current_user.owner_id
    
    # 1. Get products with their current stock and recent sales (last 90 days)
    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    
    items_history = db.query(
        Inventory.product_id,
        Inventory.available_quantity,
        func.sum(OrderItem.quantity).label("total_sold")
    ).select_from(Inventory).join(
        OrderItem, OrderItem.product_id == Inventory.product_id
    ).join(
        Order, Order.id == OrderItem.order_id
    ).filter(
        and_(
            Inventory.owner_id == owner_id,
            Order.order_date >= ninety_days_ago,
            Order.order_type == "SALE"
        )
    ).group_by(
        Inventory.product_id, Inventory.available_quantity
    ).all()
    
    history_data = []
    for item in items_history:
        # Calculate daily average sale
        avg_daily = float(item.total_sold or 0) / 90.0
        history_data.append({
            "product_id": item.product_id,
            "current_qty": float(item.available_quantity),
            "avg_daily_sales": avg_daily
        })
    
    if not history_data:
        return []
        
    # 2. Call AI provider
    llm = get_llm_provider()
    predictions = await llm.forecast_inventory(history_data)
    
    # 3. Enrich with product names
    from infrastructure.database.models import Product
    product_names = {
        p.id: p.name for p in db.query(Product).filter(Product.owner_id == owner_id).all()
    }
    
    for p in predictions:
        p["product_name"] = product_names.get(p["product_id"], "Sản phẩm ẩn")
        
    return predictions
