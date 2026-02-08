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
    target_date: Optional[date] = Query(default=None, alias="date"),
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard stats for a specific date (default today).
    Tenant isolated by owner_id.
    """
    from infrastructure.database.models import get_vietnam_time
    if target_date is None:
        target_date = get_vietnam_time().date()
    
    owner_id = current_user.owner_id
    
    # Range of day in Vietnam time (for comparison with DB timestamps)
    # Since DB is in UTC, we need to compare target_date in VN time.
    # The target_date passed in or default is already a date object.
    # We want orders where order_date converted to VN time has that date.
    # A simpler way is to use a range: target_date 00:00:00 VN to 23:59:59 VN.
    # 00:00 VN = (00:00 - 7h) UTC = 17:00 UTC (day before)
    # 24:00 VN = (24:00 - 7h) UTC = 17:00 UTC (same day)
    
    from datetime import time, timedelta
    start_dt_vn = datetime.combine(target_date, time.min)
    end_dt_vn = datetime.combine(target_date, time.max)
    
    # Convert VN range to UTC for DB query
    start_dt_utc = start_dt_vn - timedelta(hours=7)
    end_dt_utc = end_dt_vn - timedelta(hours=7)

    # Base stats
    today_revenue = Decimal("0")
    today_count = 0
    total_debt = Decimal("0")
    low_stock = 0
    new_customers = 0
    recent_activity = []
    
    # Customer specific stats
    customer_orders_count = None
    customer_debt = None
    new_products_count = None

    if current_user.role in ["OWNER", "EMPLOYEE", "ADMIN"]:
        # 1. Today Revenue & Order Count
        order_stats = db.query(
            func.sum(Order.total_amount).label("revenue"),
            func.count(Order.id).label("count")
        ).filter(
            and_(
                Order.owner_id == owner_id,
                Order.order_date >= start_dt_utc,
                Order.order_date <= end_dt_utc,
                Order.order_type == "SALE"
            )
        ).first()
        
        today_revenue = order_stats.revenue or Decimal("0")
        today_count = order_stats.count or 0
        
        import sys
        sys.stderr.write(f"DEBUG_DASHBOARD: role={current_user.role}, owner_id={owner_id}, target_date={target_date}\n")
        sys.stderr.write(f"DEBUG_DASHBOARD: range_utc={start_dt_utc} to {end_dt_utc}\n")
        sys.stderr.write(f"DEBUG_DASHBOARD: revenue={today_revenue}, orders={today_count}\n")
        
        # 2. Total Pending Debt
        total_debt = db.query(
            func.sum(Debt.remaining_amount)
        ).filter(
            and_(
                Debt.owner_id == owner_id,
                Debt.status.in_(["PENDING", "PARTIAL", "OVERDUE"])
            )
        ).scalar() or Decimal("0")
        
        # 3. Low Stock Items
        low_stock = db.query(
            func.count(Inventory.id)
        ).filter(
            and_(
                Inventory.owner_id == owner_id,
                Inventory.available_quantity <= Inventory.low_stock_threshold
            )
        ).scalar() or 0

        # 4. New customers today
        from infrastructure.database.models import Customer
        new_customers = db.query(func.count(Customer.id)).filter(
            and_(
                Customer.owner_id == owner_id,
                Customer.created_at >= start_dt_utc,
                Customer.created_at <= end_dt_utc
            )
        ).scalar() or 0
        
        sys.stderr.write(f"DEBUG_DASHBOARD: customers={new_customers}, debt={total_debt}, low_stock={low_stock}\n")

        # 5. Recent Activity
        recent_orders = db.query(Order).filter(
            Order.owner_id == owner_id
        ).order_by(
            Order.created_at.desc()
        ).limit(10).all()
        
        for order in recent_orders:
            recent_activity.append({
                "type": "ORDER",
                "id": order.id,
                "description": f"Đơn hàng {order.order_code} - {order.total_amount:,.0f} VND",
                "timestamp": order.created_at,
                "status": order.payment_status.value
            })

        # Add recent debt payments
        from infrastructure.database.models import DebtPayment
        # Don't re-import Debt here, it's already global
        recent_payments = db.query(DebtPayment).join(Debt).filter(
            Debt.owner_id == owner_id
        ).order_by(
            DebtPayment.created_at.desc()
        ).limit(10).all()

        for pay in recent_payments:
            recent_activity.append({
                "type": "DEBT_PAYMENT",
                "id": pay.id,
                "description": f"Thu nợ: {pay.payment_amount:,.0f} VND ({pay.payment_method})",
                "timestamp": pay.created_at,
                "status": "PAID"
            })
        
        # Sort combined activity by timestamp
        recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
        recent_activity = recent_activity[:10]
            
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
        from infrastructure.database.employee_permission_repository_impl import SQLAlchemyEmployeePermissionRepository
        from infrastructure.database.models import Employee as EmployeeModel
        employee = db.query(EmployeeModel).filter(EmployeeModel.user_id == current_user.user_id).first()
        if employee:
            repo = SQLAlchemyEmployeePermissionRepository(db)
            has_report_perm = await repo.get_permission(employee.id, "can_view_reports")
            if not has_report_perm or not has_report_perm.is_granted:
                import sys
                sys.stderr.write(f"DEBUG_DASHBOARD: Employee {current_user.user_id} lacks report permission. Masking revenue.\n")
                today_revenue = Decimal("0")
                total_debt = Decimal("0")
        else:
            import sys
            sys.stderr.write(f"DEBUG_DASHBOARD: Employee profile not found for user_id={current_user.user_id}\n")
    
    import sys
    sys.stderr.write(f"DEBUG_DASHBOARD_FINAL: owner_id={owner_id}, revenue={today_revenue}, count={today_count}, customers={new_customers}\n")

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
        except Exception as e:
            import logging
            logging.error(f"Dashboard AI Summary Error: {str(e)}")
            ai_summary = f"Tổng kết hôm nay ({target_date.strftime('%d/%m/%Y')}): Doanh thu {today_revenue:,.0f} VND từ {today_count} đơn hàng. Cần lưu ý {low_stock} mặt hàng sắp hết kho."

    return {
        "today_revenue": today_revenue,
        "today_orders_count": today_count,
        "today_orders": today_count, # Alias for frontend
        "total_debt_pending": total_debt,
        "low_stock_count": low_stock,
        "new_customers": new_customers,
        "recent_activity": recent_activity,
        "customer_orders_count": customer_orders_count,
        "customer_debt": customer_debt,
        "new_products_count": new_products_count,
        "ai_summary": ai_summary
    }


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

    # Define time boundaries for filtering
    start_of_period = datetime.combine(start_date, datetime.min.time())
    end_of_period = datetime.combine(end_date, datetime.max.time())

    # Group by date
    results = db.query(
        func.date(Order.order_date).label("date"),
        func.sum(Order.total_amount).label("revenue")
    ).filter(
        and_(
            Order.owner_id == current_user.owner_id,
            Order.order_date >= start_of_period,
            Order.order_date <= end_of_period,
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
