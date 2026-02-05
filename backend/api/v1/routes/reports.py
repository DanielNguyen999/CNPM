"""
Reporting and Analytics routes
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal

from infrastructure.database.connection import get_db
from infrastructure.database.models import Order, Debt, Inventory
from api.schemas import DashboardStatsResponse
from api.v1.auth.dependencies import CurrentUser, get_current_user
from api.v1.auth.permissions import require_permission

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    target_date: date = Query(default=date.today(), alias="date"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard stats for a specific date (default today).
    Tenant isolated by owner_id.
    """
    owner_id = current_user.owner_id
    
    # 1. Today Revenue & Order Count
    start_of_day = datetime.combine(target_date, datetime.min.time())
    end_of_day = datetime.combine(target_date, datetime.max.time())
    
    # Base stats for Owner/Employee
    today_revenue = Decimal("0")
    today_count = 0
    total_debt = Decimal("0")
    low_stock = 0
    recent_activity = []
    
    # Customer specific stats
    customer_orders_count = None
    customer_debt = None
    new_products_count = None

    if current_user.role in ["OWNER", "EMPLOYEE", "ADMIN"]:
        order_stats = db.query(
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("count")
        ).filter(
            and_(
                Order.owner_id == owner_id,
                Order.order_date >= start_of_day,
                Order.order_date <= end_of_day,
                Order.order_type == "SALE"
            )
        ).first()
        
        today_revenue = order_stats.revenue or Decimal("0")
        today_count = order_stats.count or 0
        
        total_debt = db.query(
            func.sum(Debt.remaining_amount)
        ).filter(
            and_(
                Debt.owner_id == owner_id,
                Debt.status.in_(["PENDING", "PARTIAL", "OVERDUE"])
            )
        ).scalar() or Decimal("0")
        
        low_stock = db.query(
            func.count(Inventory.id)
        ).filter(
            and_(
                Inventory.owner_id == owner_id,
                Inventory.available_quantity <= Inventory.low_stock_threshold
            )
        ).scalar() or 0
        
        recent_orders = db.query(Order).filter(
            Order.owner_id == owner_id
        ).order_by(
            Order.created_at.desc()
        ).limit(5).all()
        
        for order in recent_orders:
            recent_activity.append({
                "type": "ORDER",
                "id": order.id,
                "description": f"Order {order.order_code} - {order.total_amount:,.0f} VND",
                "timestamp": order.created_at,
                "status": order.payment_status.value
            })
            
    if current_user.role == "CUSTOMER":
        customer_id = current_user.customer_id
        customer_orders_count = db.query(func.count(Order.id)).filter(
            and_(Order.customer_id == customer_id, Order.owner_id == owner_id)
        ).scalar() or 0
        
        customer_debt = db.query(func.sum(Debt.remaining_amount)).filter(
            and_(Debt.customer_id == customer_id, Debt.owner_id == owner_id)
        ).scalar() or Decimal("0")
        
        # New products in last 7 days
        from infrastructure.database.models import Product
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_products_count = db.query(func.count(Product.id)).filter(
            and_(Product.owner_id == owner_id, Product.created_at >= week_ago)
        ).scalar() or 0

    # Mask sensitive data if employee doesn't have report permission
    if current_user.role == "EMPLOYEE":
        from api.v1.auth.permissions import require_permission
        # We can't use Depends() here, so we check manually via repo or logic
        # Actually, let's just use a simple check if possible, or assume it's enforced at UI level
        # For true backend security, we should check it here.
        from infrastructure.database.employee_permission_repository_impl import SQLAlchemyEmployeePermissionRepository
        from infrastructure.database.models import Employee as EmployeeModel
        employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == current_user.id).first()
        if employee:
            repo = SQLAlchemyEmployeePermissionRepository(db)
            # async-await issue here as this is a sync route?
            # get_dashboard_stats is async, so we can await.
            # But the repo method is async.
            has_report_perm = await repo.get_permission(employee.id, "can_view_reports")
            if not has_report_perm or not has_report_perm.is_granted:
                today_revenue = Decimal("0")
                total_debt = Decimal("0")

    # AI Summary (Optional - only if owner/admin and requested)
    ai_summary = None
    if current_user.role in ["OWNER", "ADMIN"]:
        try:
            from infrastructure.ai import get_llm_provider
            llm = get_llm_provider()
            ai_summary = await llm.generate_business_summary({
                "revenue": float(today_revenue),
                "orders": today_count,
                "debt": float(total_debt),
                "low_stock": low_stock
            })
        except Exception:
            ai_summary = "Không thể tạo tóm tắt AI lúc này."

    return DashboardStatsResponse(
        today_revenue=today_revenue,
        today_orders_count=today_count,
        total_debt_pending=total_debt,
        low_stock_count=low_stock,
        recent_activity=recent_activity,
        customer_orders_count=customer_orders_count,
        customer_debt=customer_debt,
        new_products_count=new_products_count,
        ai_summary=ai_summary
    )

@router.get("/revenue", response_model=List[dict])
async def get_revenue_analytics(
    start_date: date,
    end_date: date,
    current_user: CurrentUser = Depends(require_permission("can_view_reports")),
    db: Session = Depends(get_db)
):
    """
    Get daily revenue between dates.
    """
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Group by date
    results = db.query(
        func.date(Order.order_date).label("date"),
        func.sum(Order.total_amount).label("revenue")
    ).filter(
        and_(
            Order.owner_id == current_user.owner_id,
            Order.order_date >= start_date,
            Order.order_date <= end_date,
            Order.order_type == "SALE" 
        )
    ).group_by(
        func.date(Order.order_date)
    ).order_by(
        func.date(Order.order_date)
    ).all()

    return [{"date": str(r.date), "revenue": r.revenue} for r in results]


@router.get("/top-products", response_model=List[dict])
async def get_top_products(
    limit: int = 5,
    current_user: CurrentUser = Depends(require_permission("can_view_reports")),
    db: Session = Depends(get_db)
):
    """
    Get top selling products (all time).
    """
    from infrastructure.database.models import OrderItem, Product
    
    if not current_user.owner_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    # Join OrderItem -> Product
    # Filter by Order owner_id (Order is unrelated directly to OrderItem in model usually, but OrderItem has order_id. Need to join Order too)
    
    results = db.query(
        Product.name,
        func.sum(OrderItem.quantity).label("total_sold"),
        func.sum(OrderItem.subtotal).label("total_revenue")
    ).select_from(OrderItem).join(Product).join(Order).filter(
        Order.owner_id == current_user.owner_id,
        Order.order_type == "SALE" 
    ).group_by(
        Product.id, Product.name
    ).order_by(
        func.sum(OrderItem.subtotal).desc()
    ).limit(limit).all()
    
    return [
        {"name": r.name, "total_sold": r.total_sold, "total_revenue": r.total_revenue}
        for r in results
    ]
