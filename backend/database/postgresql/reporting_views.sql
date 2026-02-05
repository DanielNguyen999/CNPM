-- ============================================
-- BizFlow PostgreSQL Reporting Views
-- ============================================
-- Reporting database for analytics and TT88 compliance
-- Data synced from MySQL via ETL process
-- ============================================

-- ============================================
-- 1. Revenue Journal View (Sổ doanh thu - TT88)
-- ============================================
CREATE OR REPLACE VIEW v_revenue_journal AS
SELECT
    o.id AS order_id,
    o.owner_id,
    ow.business_name,
    ow.tax_code AS business_tax_code,
    o.order_code,
    o.order_date,
    c.customer_code,
    c.full_name AS customer_name,
    c.tax_code AS customer_tax_code,
    c.address AS customer_address,
    oi.product_id,
    p.product_code,
    p.name AS product_name,
    u.name AS unit_name,
    oi.quantity,
    oi.unit_price,
    oi.discount_amount,
    oi.subtotal AS item_total,
    o.subtotal AS order_subtotal,
    o.tax_rate,
    o.tax_amount,
    o.discount_amount AS order_discount,
    o.total_amount,
    o.paid_amount,
    o.debt_amount,
    o.payment_method,
    o.payment_status,
    u_created.full_name AS created_by_name,
    o.is_invoiced,
    o.is_accounted
FROM
    "ORDER" o
    INNER JOIN OWNER ow ON o.owner_id = ow.id
    INNER JOIN CUSTOMER c ON o.customer_id = c.id
    INNER JOIN ORDER_ITEM oi ON o.id = oi.order_id
    INNER JOIN PRODUCT p ON oi.product_id = p.id
    INNER JOIN UNIT u ON oi.unit_id = u.id
    INNER JOIN "USER" u_created ON o.created_by = u_created.id
WHERE
    o.order_type = 'SALE'
ORDER BY o.order_date DESC, o.order_code, oi.id;

-- ============================================
-- 2. Daily Revenue Summary
-- ============================================
CREATE OR REPLACE VIEW v_daily_revenue_summary AS
SELECT
    o.owner_id,
    ow.business_name,
    DATE(o.order_date) AS sale_date,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.subtotal) AS total_subtotal,
    SUM(o.tax_amount) AS total_tax,
    SUM(o.discount_amount) AS total_discount,
    SUM(o.total_amount) AS total_revenue,
    SUM(o.paid_amount) AS total_paid,
    SUM(o.debt_amount) AS total_debt,
    SUM(
        CASE
            WHEN o.payment_status = 'PAID' THEN 1
            ELSE 0
        END
    ) AS paid_orders,
    SUM(
        CASE
            WHEN o.payment_status = 'PARTIAL' THEN 1
            ELSE 0
        END
    ) AS partial_orders,
    SUM(
        CASE
            WHEN o.payment_status = 'UNPAID' THEN 1
            ELSE 0
        END
    ) AS unpaid_orders
FROM "ORDER" o
    INNER JOIN OWNER ow ON o.owner_id = ow.id
WHERE
    o.order_type = 'SALE'
GROUP BY
    o.owner_id,
    ow.business_name,
    DATE(o.order_date)
ORDER BY sale_date DESC, o.owner_id;

-- ============================================
-- 3. Monthly Revenue Summary
-- ============================================
CREATE OR REPLACE VIEW v_monthly_revenue_summary AS
SELECT
    o.owner_id,
    ow.business_name,
    EXTRACT(
        YEAR
        FROM o.order_date
    ) AS year,
    EXTRACT(
        MONTH
        FROM o.order_date
    ) AS month,
    TO_CHAR (o.order_date, 'YYYY-MM') AS year_month,
    COUNT(DISTINCT o.id) AS total_orders,
    COUNT(DISTINCT o.customer_id) AS unique_customers,
    SUM(o.subtotal) AS total_subtotal,
    SUM(o.tax_amount) AS total_tax,
    SUM(o.discount_amount) AS total_discount,
    SUM(o.total_amount) AS total_revenue,
    SUM(o.paid_amount) AS total_paid,
    SUM(o.debt_amount) AS total_debt,
    AVG(o.total_amount) AS avg_order_value
FROM "ORDER" o
    INNER JOIN OWNER ow ON o.owner_id = ow.id
WHERE
    o.order_type = 'SALE'
GROUP BY
    o.owner_id,
    ow.business_name,
    EXTRACT(
        YEAR
        FROM o.order_date
    ),
    EXTRACT(
        MONTH
        FROM o.order_date
    ),
    TO_CHAR (o.order_date, 'YYYY-MM')
ORDER BY year DESC, month DESC, o.owner_id;

-- ============================================
-- 4. Debt Aging Report (Báo cáo công nợ)
-- ============================================
CREATE OR REPLACE VIEW v_debt_aging_report AS
SELECT
    d.owner_id,
    ow.business_name,
    c.customer_code,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    c.customer_type,
    c.credit_limit,
    COUNT(d.id) AS total_debts,
    SUM(d.debt_amount) AS total_debt_amount,
    SUM(d.paid_amount) AS total_paid_amount,
    SUM(d.remaining_amount) AS total_remaining,
    SUM(
        CASE
            WHEN d.status = 'PENDING' THEN d.remaining_amount
            ELSE 0
        END
    ) AS pending_amount,
    SUM(
        CASE
            WHEN d.status = 'PARTIAL' THEN d.remaining_amount
            ELSE 0
        END
    ) AS partial_amount,
    SUM(
        CASE
            WHEN d.status = 'OVERDUE' THEN d.remaining_amount
            ELSE 0
        END
    ) AS overdue_amount,
    SUM(
        CASE
            WHEN d.due_date < CURRENT_DATE THEN d.remaining_amount
            ELSE 0
        END
    ) AS past_due_amount,
    SUM(
        CASE
            WHEN d.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE  + INTERVAL '30 days' THEN d.remaining_amount
            ELSE 0
        END
    ) AS due_within_30_days,
    SUM(
        CASE
            WHEN d.due_date BETWEEN CURRENT_DATE + INTERVAL '31 days' AND CURRENT_DATE  + INTERVAL '60 days' THEN d.remaining_amount
            ELSE 0
        END
    ) AS due_31_60_days,
    MIN(d.created_at) AS oldest_debt_date,
    MAX(d.due_date) AS latest_due_date
FROM
    DEBT d
    INNER JOIN OWNER ow ON d.owner_id = ow.id
    INNER JOIN CUSTOMER c ON d.customer_id = c.id
WHERE
    d.remaining_amount > 0
GROUP BY
    d.owner_id,
    ow.business_name,
    c.customer_code,
    c.full_name,
    c.phone,
    c.customer_type,
    c.credit_limit
ORDER BY total_remaining DESC;

-- ============================================
-- 5. Product Performance Report
-- ============================================
CREATE OR REPLACE VIEW v_product_performance AS
SELECT
    p.owner_id,
    ow.business_name,
    p.product_code,
    p.name AS product_name,
    p.category,
    u.name AS base_unit,
    p.base_price,
    p.cost_price,
    i.quantity AS current_stock,
    i.available_quantity,
    i.low_stock_threshold,
    CASE
        WHEN i.available_quantity <= i.low_stock_threshold THEN 'LOW_STOCK'
        WHEN i.available_quantity <= i.low_stock_threshold * 2 THEN 'WARNING'
        ELSE 'NORMAL'
    END AS stock_status,
    COUNT(DISTINCT oi.order_id) AS total_orders,
    SUM(oi.quantity) AS total_quantity_sold,
    SUM(oi.subtotal) AS total_revenue,
    SUM(oi.quantity * p.cost_price) AS total_cost,
    SUM(oi.subtotal) - SUM(oi.quantity * p.cost_price) AS total_profit,
    CASE
        WHEN SUM(oi.quantity * p.cost_price) > 0 THEN (
            (
                SUM(oi.subtotal) - SUM(oi.quantity * p.cost_price)
            ) / SUM(oi.quantity * p.cost_price) * 100
        )
        ELSE 0
    END AS profit_margin_percent
FROM
    PRODUCT p
    INNER JOIN OWNER ow ON p.owner_id = ow.id
    INNER JOIN UNIT u ON p.base_unit_id = u.id
    LEFT JOIN INVENTORY i ON p.id = i.product_id
    LEFT JOIN ORDER_ITEM oi ON p.id = oi.product_id
    LEFT JOIN "ORDER" o ON oi.order_id = o.id
    AND o.order_type = 'SALE'
WHERE
    p.is_active = TRUE
GROUP BY
    p.owner_id,
    ow.business_name,
    p.product_code,
    p.name,
    p.category,
    u.name,
    p.base_price,
    p.cost_price,
    i.quantity,
    i.available_quantity,
    i.low_stock_threshold
ORDER BY total_revenue DESC NULLS LAST;

-- ============================================
-- 6. Inventory Movement Report
-- ============================================
CREATE OR REPLACE VIEW v_inventory_movement_report AS
SELECT
    sm.owner_id,
    ow.business_name,
    p.product_code,
    p.name AS product_name,
    u.name AS unit_name,
    sm.movement_type,
    sm.quantity,
    sm.reference_type,
    sm.reference_id,
    sm.notes,
    u_created.full_name AS created_by_name,
    sm.created_at,
    DATE(sm.created_at) AS movement_date
FROM
    STOCK_MOVEMENT sm
    INNER JOIN OWNER ow ON sm.owner_id = ow.id
    INNER JOIN PRODUCT p ON sm.product_id = p.id
    INNER JOIN UNIT u ON sm.unit_id = u.id
    INNER JOIN "USER" u_created ON sm.created_by = u_created.id
ORDER BY sm.created_at DESC;

-- ============================================
-- 7. Customer Purchase History
-- ============================================
CREATE OR REPLACE VIEW v_customer_purchase_history AS
SELECT
    c.owner_id,
    ow.business_name,
    c.customer_code,
    c.full_name AS customer_name,
    c.phone,
    c.customer_type,
    c.credit_limit,
    COUNT(DISTINCT o.id) AS total_orders,
    SUM(o.total_amount) AS total_purchase_amount,
    SUM(o.paid_amount) AS total_paid,
    SUM(o.debt_amount) AS total_debt,
    AVG(o.total_amount) AS avg_order_value,
    MAX(o.order_date) AS last_order_date,
    MIN(o.order_date) AS first_order_date,
    EXTRACT(
        DAY
        FROM (
                CURRENT_TIMESTAMP - MAX(o.order_date)
            )
    ) AS days_since_last_order
FROM
    CUSTOMER c
    INNER JOIN OWNER ow ON c.owner_id = ow.id
    LEFT JOIN "ORDER" o ON c.id = o.customer_id
    AND o.order_type = 'SALE'
WHERE
    c.is_active = TRUE
GROUP BY
    c.owner_id,
    ow.business_name,
    c.customer_code,
    c.full_name,
    c.phone,
    c.customer_type,
    c.credit_limit
ORDER BY
    total_purchase_amount DESC NULLS LAST;

-- ============================================
-- 8. Business Activity Report (TT88)
-- ============================================
CREATE OR REPLACE VIEW v_business_activity_report AS
SELECT
    o.owner_id,
    ow.business_name,
    ow.tax_code,
    ow.business_address,
    TO_CHAR (o.order_date, 'YYYY-MM') AS period,
    -- Revenue metrics
    COUNT(DISTINCT o.id) AS total_transactions,
    SUM(o.subtotal) AS revenue_before_tax,
    SUM(o.tax_amount) AS tax_collected,
    SUM(o.total_amount) AS revenue_after_tax,
    SUM(o.discount_amount) AS total_discounts,

-- Payment metrics
SUM(
    CASE
        WHEN o.payment_method = 'CASH' THEN o.paid_amount
        ELSE 0
    END
) AS cash_received,
SUM(
    CASE
        WHEN o.payment_method = 'BANK_TRANSFER' THEN o.paid_amount
        ELSE 0
    END
) AS bank_transfer_received,
SUM(
    CASE
        WHEN o.payment_method = 'CREDIT' THEN o.total_amount
        ELSE 0
    END
) AS credit_sales,

-- Debt metrics
SUM(o.debt_amount) AS outstanding_debt,

-- Customer metrics
COUNT(DISTINCT o.customer_id) AS unique_customers
FROM "ORDER" o
    INNER JOIN OWNER ow ON o.owner_id = ow.id
WHERE
    o.order_type = 'SALE'
GROUP BY
    o.owner_id,
    ow.business_name,
    ow.tax_code,
    ow.business_address,
    TO_CHAR (o.order_date, 'YYYY-MM')
ORDER BY period DESC, o.owner_id;

-- ============================================
-- 9. Top Customers Report
-- ============================================
CREATE OR REPLACE VIEW v_top_customers AS
SELECT
    c.owner_id,
    ow.business_name,
    c.customer_code,
    c.full_name AS customer_name,
    c.phone,
    c.customer_type,
    COUNT(o.id) AS order_count,
    SUM(o.total_amount) AS total_revenue,
    SUM(o.paid_amount) AS total_paid,
    SUM(o.debt_amount) AS current_debt,
    AVG(o.total_amount) AS avg_order_value,
    MAX(o.order_date) AS last_order_date,
    RANK() OVER (
        PARTITION BY
            c.owner_id
        ORDER BY SUM(o.total_amount) DESC
    ) AS revenue_rank
FROM
    CUSTOMER c
    INNER JOIN OWNER ow ON c.owner_id = ow.id
    LEFT JOIN "ORDER" o ON c.id = o.customer_id
    AND o.order_type = 'SALE'
WHERE
    c.is_active = TRUE
GROUP BY
    c.owner_id,
    ow.business_name,
    c.customer_code,
    c.full_name,
    c.phone,
    c.customer_type
ORDER BY c.owner_id, total_revenue DESC NULLS LAST;

-- ============================================
-- 10. Low Stock Alert View
-- ============================================
CREATE OR REPLACE VIEW v_low_stock_alert AS
SELECT
    i.owner_id,
    ow.business_name,
    p.product_code,
    p.name AS product_name,
    p.category,
    u.name AS unit_name,
    i.quantity AS current_quantity,
    i.reserved_quantity,
    i.available_quantity,
    i.low_stock_threshold,
    (
        i.available_quantity - i.low_stock_threshold
    ) AS quantity_difference,
    CASE
        WHEN i.available_quantity <= 0 THEN 'OUT_OF_STOCK'
        WHEN i.available_quantity <= i.low_stock_threshold * 0.5 THEN 'CRITICAL'
        WHEN i.available_quantity <= i.low_stock_threshold THEN 'LOW'
        ELSE 'NORMAL'
    END AS alert_level,
    i.last_stock_check_at
FROM
    INVENTORY i
    INNER JOIN OWNER ow ON i.owner_id = ow.id
    INNER JOIN PRODUCT p ON i.product_id = p.id
    INNER JOIN UNIT u ON p.base_unit_id = u.id
WHERE
    p.is_active = TRUE
    AND i.available_quantity <= i.low_stock_threshold
ORDER BY i.available_quantity ASC, i.owner_id;

-- ============================================
-- Create indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_order_owner_date ON "ORDER" (owner_id, order_date);

CREATE INDEX IF NOT EXISTS idx_order_item_order ON ORDER_ITEM (order_id);

CREATE INDEX IF NOT EXISTS idx_debt_owner_status ON DEBT (owner_id, status);

CREATE INDEX IF NOT EXISTS idx_stock_movement_owner_date ON STOCK_MOVEMENT (owner_id, created_at);

CREATE INDEX IF NOT EXISTS idx_customer_owner_active ON CUSTOMER (owner_id, is_active);

CREATE INDEX IF NOT EXISTS idx_product_owner_active ON PRODUCT (owner_id, is_active);

-- ============================================
-- END OF REPORTING VIEWS
-- ============================================