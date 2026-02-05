-- ============================================
-- BizFlow Seed Data for Demo
-- ============================================
-- Demo data for testing and demonstration
-- ============================================

SET NAMES utf8mb4;

-- ============================================
-- 1. SUBSCRIPTION PLANS
-- ============================================
INSERT INTO
    SUBSCRIPTION_PLAN (
        name,
        description,
        price,
        max_employees,
        max_products,
        max_orders_per_month,
        features,
        is_active
    )
VALUES (
        'Free Trial',
        'Dùng thử miễn phí 30 ngày',
        0.00,
        1,
        50,
        100,
        '["Quản lý đơn hàng cơ bản", "Quản lý tồn kho", "Báo cáo đơn giản"]',
        TRUE
    ),
    (
        'Basic',
        'Gói cơ bản cho hộ kinh doanh nhỏ',
        299000.00,
        3,
        500,
        1000,
        '["Quản lý đơn hàng", "Quản lý tồn kho", "Quản lý công nợ", "Báo cáo TT88", "Hỗ trợ email"]',
        TRUE
    ),
    (
        'Pro',
        'Gói chuyên nghiệp',
        599000.00,
        10,
        2000,
        5000,
        '["Tất cả tính năng Basic", "AI nhận đơn tự động", "Báo cáo nâng cao", "Multi-device", "Hỗ trợ ưu tiên"]',
        TRUE
    ),
    (
        'Enterprise',
        'Gói doanh nghiệp',
        1299000.00,
        50,
        10000,
        50000,
        '["Tất cả tính năng Pro", "API tích hợp", "Tùy chỉnh báo cáo", "Dedicated support", "SLA 99.9%"]',
        TRUE
    );

-- ============================================
-- 2. USERS
-- ============================================
-- Password for all demo users: "password123"
-- Hash generated with pbkdf2_sha256
INSERT INTO
    USER (
        email,
        password_hash,
        full_name,
        phone,
        role,
        is_active
    )
VALUES
    -- Admin
    (
        'admin@bizflow.vn',
        '$pbkdf2-sha256$29000$xHjvPSfknBMC4JxTCiFkbA$9Ff6yllu/9lr8bXuWrzswqP5U5GOg5ZJRvCUNzTebHA',
        'System Administrator',
        '0901234567',
        'ADMIN',
        TRUE
    ),

-- Owner 1: Cửa hàng VLXD Hòa Bình
(
    'owner1@example.com',
    '$pbkdf2-sha256$29000$xHjvPSfknBMC4JxTCiFkbA$9Ff6yllu/9lr8bXuWrzswqP5U5GOg5ZJRvCUNzTebHA',
    'Nguyễn Văn Hòa',
    '0912345678',
    'OWNER',
    TRUE
),

-- Employees for Owner 1
(
    'employee1@example.com',
    '$pbkdf2-sha256$29000$xHjvPSfknBMC4JxTCiFkbA$9Ff6yllu/9lr8bXuWrzswqP5U5GOg5ZJRvCUNzTebHA',
    'Trần Thị Bình',
    '0923456789',
    'EMPLOYEE',
    TRUE
),
(
    'employee2@example.com',
    '$pbkdf2-sha256$29000$xHjvPSfknBMC4JxTCiFkbA$9Ff6yllu/9lr8bXuWrzswqP5U5GOg5ZJRvCUNzTebHA',
    'Lê Văn An',
    '0934567890',
    'EMPLOYEE',
    TRUE
),

-- Owner 2: Cửa hàng tạp hóa Minh Phương
(
    'owner2@example.com',
    '$pbkdf2-sha256$29000$xHjvPSfknBMC4JxTCiFkbA$9Ff6yllu/9lr8bXuWrzswqP5U5GOg5ZJRvCUNzTebHA',
    'Phạm Thị Minh',
    '0945678901',
    'OWNER',
    TRUE
),

-- Employee for Owner 2
(
    'employee3@example.com',
    '$pbkdf2-sha256$29000$xHjvPSfknBMC4JxTCiFkbA$9Ff6yllu/9lr8bXuWrzswqP5U5GOg5ZJRvCUNzTebHA',
    'Hoàng Văn Phương',
    '0956789012',
    'EMPLOYEE',
    TRUE
);

-- ============================================
-- 3. OWNERS
-- ============================================
INSERT INTO
    OWNER (
        user_id,
        business_name,
        business_address,
        tax_code,
        subscription_plan_id,
        subscription_start_date,
        subscription_end_date,
        is_trial
    )
VALUES (
        2,
        'Cửa hàng VLXD Hòa Bình',
        '123 Đường Lê Lợi, Phường 1, Quận Gò Vấp, TP.HCM',
        '0123456789',
        3,
        '2024-01-01',
        '2025-01-01',
        FALSE
    ),
    (
        5,
        'Cửa hàng tạp hóa Minh Phương',
        '456 Đường Nguyễn Trãi, Phường 2, Quận 5, TP.HCM',
        '9876543210',
        2,
        '2024-06-01',
        '2024-12-01',
        FALSE
    );

-- ============================================
-- 4. EMPLOYEES
-- ============================================
INSERT INTO
    EMPLOYEE (
        user_id,
        owner_id,
        position,
        hire_date,
        salary,
        permissions
    )
VALUES (
        3,
        1,
        'Nhân viên bán hàng',
        '2024-01-15',
        8000000.00,
        '["create_order", "view_products", "view_customers"]'
    ),
    (
        4,
        1,
        'Thủ kho',
        '2024-02-01',
        7500000.00,
        '["create_order", "manage_inventory", "view_products"]'
    ),
    (
        6,
        2,
        'Nhân viên bán hàng',
        '2024-06-15',
        7000000.00,
        '["create_order", "view_products", "view_customers"]'
    );

-- ============================================
-- 5. UNITS (for Owner 1 - VLXD)
-- ============================================
INSERT INTO
    UNIT (
        owner_id,
        name,
        abbreviation,
        description
    )
VALUES
    -- Owner 1 units
    (1, 'Cái', 'cái', 'Đơn vị đếm'),
    (
        1,
        'Bao',
        'bao',
        'Bao xi măng, bao vữa'
    ),
    (
        1,
        'Thùng',
        'thùng',
        'Thùng sơn, thùng keo'
    ),
    (1, 'Mét', 'm', 'Mét dài'),
    (
        1,
        'Mét vuông',
        'm²',
        'Mét vuông'
    ),
    (
        1,
        'Kilogram',
        'kg',
        'Kilogram'
    ),
    (1, 'Tấn', 'tấn', 'Tấn'),
    (1, 'Lít', 'lít', 'Lít'),

-- Owner 2 units
(2, 'Cái', 'cái', 'Đơn vị đếm'),
(
    2,
    'Thùng',
    'thùng',
    'Thùng nước ngọt'
),
(2, 'Gói', 'gói', 'Gói snack'),
(
    2,
    'Chai',
    'chai',
    'Chai nước'
),
(2, 'Hộp', 'hộp', 'Hộp bánh');

-- ============================================
-- 6. PRODUCTS (for Owner 1 - VLXD)
-- ============================================
INSERT INTO
    PRODUCT (
        owner_id,
        product_code,
        name,
        description,
        category,
        base_unit_id,
        base_price,
        cost_price,
        is_active
    )
VALUES
    -- Owner 1 products
    (
        1,
        'XM001',
        'Xi măng Hà Tiên PCB40',
        'Xi măng bao 50kg',
        'Xi măng',
        2,
        95000.00,
        88000.00,
        TRUE
    ),
    (
        1,
        'XM002',
        'Xi măng Long Sơn PC30',
        'Xi măng bao 50kg',
        'Xi măng',
        2,
        92000.00,
        85000.00,
        TRUE
    ),
    (
        1,
        'ST001',
        'Sơn Dulux nội thất trắng',
        'Sơn nước nội thất 18L',
        'Sơn',
        3,
        1850000.00,
        1650000.00,
        TRUE
    ),
    (
        1,
        'ST002',
        'Sơn Jotun ngoại thất',
        'Sơn ngoại thất 18L',
        'Sơn',
        3,
        2100000.00,
        1900000.00,
        TRUE
    ),
    (
        1,
        'GT001',
        'Gạch Đồng Tâm 60x60',
        'Gạch lát nền 60x60cm',
        'Gạch',
        1,
        185000.00,
        165000.00,
        TRUE
    ),
    (
        1,
        'GT002',
        'Gạch Prime 80x80',
        'Gạch lát nền 80x80cm',
        'Gạch',
        1,
        295000.00,
        270000.00,
        TRUE
    ),
    (
        1,
        'ST003',
        'Sắt thép D10',
        'Sắt thép phi 10',
        'Sắt thép',
        4,
        18500.00,
        17000.00,
        TRUE
    ),
    (
        1,
        'ST004',
        'Sắt thép D12',
        'Sắt thép phi 12',
        'Sắt thép',
        4,
        19500.00,
        18000.00,
        TRUE
    ),
    (
        1,
        'DA001',
        'Đá 1x2',
        'Đá xây dựng 1x2',
        'Đá',
        7,
        450000.00,
        400000.00,
        TRUE
    ),
    (
        1,
        'CA001',
        'Cát xây dựng',
        'Cát vàng xây dựng',
        'Cát',
        7,
        380000.00,
        350000.00,
        TRUE
    ),

-- Owner 2 products
(
    2,
    'NC001',
    'Nước ngọt Coca Cola',
    'Coca Cola lon 330ml',
    'Nước ngọt',
    10,
    180000.00,
    165000.00,
    TRUE
),
(
    2,
    'NC002',
    'Nước ngọt Pepsi',
    'Pepsi lon 330ml',
    'Nước ngọt',
    10,
    175000.00,
    160000.00,
    TRUE
),
(
    2,
    'SN001',
    'Snack Ostar',
    'Snack khoai tây',
    'Snack',
    11,
    85000.00,
    75000.00,
    TRUE
),
(
    2,
    'MI001',
    'Mì Hảo Hảo',
    'Mì gói Hảo Hảo',
    'Mì ăn liền',
    13,
    72000.00,
    65000.00,
    TRUE
),
(
    2,
    'NU001',
    'Nước suối Lavie',
    'Nước suối 500ml',
    'Nước uống',
    10,
    60000.00,
    52000.00,
    TRUE
);

-- ============================================
-- 7. PRODUCT_UNIT (Multi-unit conversions)
-- ============================================
INSERT INTO
    PRODUCT_UNIT (
        product_id,
        unit_id,
        conversion_rate,
        price,
        is_default
    )
VALUES
    -- Xi măng: bao (base), tấn
    (1, 2, 1.0000, 95000.00, TRUE), -- 1 bao = 1 bao
    (
        1,
        7,
        20.0000,
        1900000.00,
        FALSE
    ), -- 1 tấn = 20 bao
    (2, 2, 1.0000, 92000.00, TRUE),
    (
        2,
        7,
        20.0000,
        1840000.00,
        FALSE
    ),

-- Sơn: thùng (base), lít
(
    3,
    3,
    1.0000,
    1850000.00,
    TRUE
), -- 1 thùng = 1 thùng
(
    3,
    8,
    0.0556,
    105000.00,
    FALSE
), -- 1 lít = 1/18 thùng
(
    4,
    3,
    1.0000,
    2100000.00,
    TRUE
),
(
    4,
    8,
    0.0556,
    120000.00,
    FALSE
),

-- Gạch: cái (base)
(5, 1, 1.0000, 185000.00, TRUE), (6, 1, 1.0000, 295000.00, TRUE),

-- Nước ngọt: thùng (base), chai
(
    11,
    10,
    1.0000,
    180000.00,
    TRUE
), -- 1 thùng = 24 chai
(
    11,
    12,
    0.0417,
    8000.00,
    FALSE
), -- 1 chai = 1/24 thùng
(
    12,
    10,
    1.0000,
    175000.00,
    TRUE
),
(
    12,
    12,
    0.0417,
    7500.00,
    FALSE
);

-- ============================================
-- 8. INVENTORY (Initial stock)
-- ============================================
INSERT INTO
    INVENTORY (
        owner_id,
        product_id,
        quantity,
        reserved_quantity,
        low_stock_threshold
    )
VALUES
    -- Owner 1 inventory
    (
        1,
        1,
        500.0000,
        0.0000,
        50.0000
    ), -- Xi măng Hà Tiên: 500 bao
    (
        1,
        2,
        300.0000,
        0.0000,
        50.0000
    ), -- Xi măng Long Sơn: 300 bao
    (1, 3, 45.0000, 0.0000, 5.0000), -- Sơn Dulux: 45 thùng
    (1, 4, 30.0000, 0.0000, 5.0000), -- Sơn Jotun: 30 thùng
    (
        1,
        5,
        1200.0000,
        0.0000,
        100.0000
    ), -- Gạch Đồng Tâm: 1200 viên
    (
        1,
        6,
        800.0000,
        0.0000,
        100.0000
    ), -- Gạch Prime: 800 viên
    (
        1,
        7,
        5000.0000,
        0.0000,
        500.0000
    ), -- Sắt D10: 5000m
    (
        1,
        8,
        3000.0000,
        0.0000,
        500.0000
    ), -- Sắt D12: 3000m
    (1, 9, 50.0000, 0.0000, 5.0000), -- Đá: 50 tấn
    (
        1,
        10,
        40.0000,
        0.0000,
        5.0000
    ), -- Cát: 40 tấn

-- Owner 2 inventory
(
    2,
    11,
    100.0000,
    0.0000,
    10.0000
), -- Coca: 100 thùng
(
    2,
    12,
    80.0000,
    0.0000,
    10.0000
), -- Pepsi: 80 thùng
(
    2,
    13,
    200.0000,
    0.0000,
    20.0000
), -- Snack: 200 gói
(
    2,
    14,
    150.0000,
    0.0000,
    30.0000
), -- Mì: 150 hộp
(
    2,
    15,
    120.0000,
    0.0000,
    20.0000
);
-- Nước suối: 120 thùng

-- ============================================
-- 9. CUSTOMERS
-- ============================================
INSERT INTO
    CUSTOMER (
        owner_id,
        customer_code,
        full_name,
        phone,
        email,
        address,
        tax_code,
        customer_type,
        credit_limit,
        is_active
    )
VALUES
    -- Owner 1 customers
    (
        1,
        'KH001',
        'Công ty TNHH Xây dựng Phát Đạt',
        '0909111222',
        'phatdat@example.com',
        '789 Đường Võ Văn Tần, Quận 3, TP.HCM',
        '0123456789-001',
        'BUSINESS',
        50000000.00,
        TRUE
    ),
    (
        1,
        'KH002',
        'Anh Nguyễn Văn Thành',
        '0909222333',
        NULL,
        '12 Đường Lý Thường Kiệt, Quận 10, TP.HCM',
        NULL,
        'INDIVIDUAL',
        10000000.00,
        TRUE
    ),
    (
        1,
        'KH003',
        'Công ty CP Đầu tư Hưng Thịnh',
        '0909333444',
        'hungthinh@example.com',
        '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        '0123456789-002',
        'BUSINESS',
        100000000.00,
        TRUE
    ),
    (
        1,
        'KH004',
        'Chị Trần Thị Lan',
        '0909444555',
        NULL,
        '78 Đường Phan Xích Long, Phú Nhuận, TP.HCM',
        NULL,
        'INDIVIDUAL',
        5000000.00,
        TRUE
    ),

-- Owner 2 customers
(
    2,
    'KH001',
    'Quán ăn Bình Dân',
    '0909555666',
    NULL,
    '23 Đường An Dương Vương, Quận 5, TP.HCM',
    NULL,
    'BUSINESS',
    5000000.00,
    TRUE
),
(
    2,
    'KH002',
    'Anh Lê Văn Minh',
    '0909666777',
    NULL,
    '45 Đường Trần Hưng Đạo, Quận 1, TP.HCM',
    NULL,
    'INDIVIDUAL',
    2000000.00,
    TRUE
),
(
    2,
    'KH003',
    'Cô Phạm Thị Hoa',
    '0909777888',
    NULL,
    '67 Đường Lê Văn Sỹ, Quận 3, TP.HCM',
    NULL,
    'INDIVIDUAL',
    1000000.00,
    TRUE
);

-- ============================================
-- 10. ORDERS (Sample orders)
-- ============================================
INSERT INTO
    `ORDER` (
        owner_id,
        order_code,
        customer_id,
        order_date,
        order_type,
        subtotal,
        tax_rate,
        tax_amount,
        discount_amount,
        total_amount,
        paid_amount,
        payment_method,
        payment_status,
        created_by,
        is_invoiced,
        is_accounted
    )
VALUES
    -- Owner 1 orders
    (
        1,
        'DH2024010001',
        1,
        '2024-01-15 09:30:00',
        'SALE',
        19000000.00,
        10.00,
        1900000.00,
        0.00,
        20900000.00,
        20900000.00,
        'BANK_TRANSFER',
        'PAID',
        3,
        TRUE,
        TRUE
    ),
    (
        1,
        'DH2024010002',
        2,
        '2024-01-16 14:20:00',
        'SALE',
        5550000.00,
        10.00,
        555000.00,
        0.00,
        6105000.00,
        3000000.00,
        'CREDIT',
        'PARTIAL',
        3,
        TRUE,
        FALSE
    ),
    (
        1,
        'DH2024010003',
        3,
        '2024-01-17 10:15:00',
        'SALE',
        45000000.00,
        10.00,
        4500000.00,
        2000000.00,
        47500000.00,
        47500000.00,
        'BANK_TRANSFER',
        'PAID',
        4,
        TRUE,
        TRUE
    ),
    (
        1,
        'DH2024010004',
        4,
        '2024-01-18 16:45:00',
        'SALE',
        2220000.00,
        10.00,
        222000.00,
        0.00,
        2442000.00,
        0.00,
        'CREDIT',
        'UNPAID',
        3,
        FALSE,
        FALSE
    ),

-- Owner 2 orders
(
    2,
    'DH2024060001',
    5,
    '2024-06-20 08:00:00',
    'SALE',
    1800000.00,
    10.00,
    180000.00,
    0.00,
    1980000.00,
    1980000.00,
    'CASH',
    'PAID',
    6,
    TRUE,
    TRUE
),
(
    2,
    'DH2024060002',
    6,
    '2024-06-21 11:30:00',
    'SALE',
    540000.00,
    10.00,
    54000.00,
    0.00,
    594000.00,
    594000.00,
    'CASH',
    'PAID',
    6,
    TRUE,
    TRUE
),
(
    2,
    'DH2024060003',
    7,
    '2024-06-22 15:20:00',
    'SALE',
    350000.00,
    10.00,
    35000.00,
    0.00,
    385000.00,
    0.00,
    'CREDIT',
    'UNPAID',
    6,
    FALSE,
    FALSE
);

-- ============================================
-- 11. ORDER_ITEMS
-- ============================================
INSERT INTO
    ORDER_ITEM (
        order_id,
        product_id,
        unit_id,
        quantity,
        unit_price,
        discount_percent,
        discount_amount
    )
VALUES
    -- Order 1 items (Owner 1)
    (
        1,
        1,
        7,
        10.0000,
        1900000.00,
        0.00,
        0.00
    ), -- 10 tấn xi măng Hà Tiên

-- Order 2 items (Owner 1)
(
    2,
    3,
    3,
    3.0000,
    1850000.00,
    0.00,
    0.00
), -- 3 thùng sơn Dulux

-- Order 3 items (Owner 1)
(
    3,
    5,
    1,
    200.0000,
    185000.00,
    0.00,
    0.00
), -- 200 viên gạch Đồng Tâm
(
    3,
    6,
    1,
    100.0000,
    295000.00,
    0.00,
    0.00
), -- 100 viên gạch Prime
(
    3,
    1,
    2,
    50.0000,
    95000.00,
    0.00,
    0.00
), -- 50 bao xi măng

-- Order 4 items (Owner 1)
(
    4,
    5,
    1,
    12.0000,
    185000.00,
    0.00,
    0.00
), -- 12 viên gạch

-- Order 5 items (Owner 2)
(
    5,
    11,
    10,
    10.0000,
    180000.00,
    0.00,
    0.00
), -- 10 thùng Coca

-- Order 6 items (Owner 2)
(
    6,
    12,
    10,
    3.0000,
    175000.00,
    0.00,
    0.00
), -- 3 thùng Pepsi
(
    6,
    15,
    10,
    1.0000,
    60000.00,
    0.00,
    0.00
), -- 1 thùng nước suối

-- Order 7 items (Owner 2)
(
    7,
    13,
    11,
    2.0000,
    85000.00,
    0.00,
    0.00
), -- 2 gói snack
(
    7,
    14,
    13,
    2.0000,
    72000.00,
    0.00,
    0.00
), -- 2 hộp mì
(
    7,
    15,
    10,
    1.0000,
    60000.00,
    0.00,
    0.00
);
-- 1 thùng nước

-- ============================================
-- 12. DEBTS
-- ============================================
INSERT INTO
    DEBT (
        owner_id,
        customer_id,
        order_id,
        debt_amount,
        paid_amount,
        due_date,
        status
    )
VALUES (
        1,
        2,
        2,
        3105000.00,
        3000000.00,
        '2024-02-15',
        'PARTIAL'
    ), -- Order 2 partial payment
    (
        1,
        4,
        4,
        2442000.00,
        0.00,
        '2024-02-18',
        'PENDING'
    ), -- Order 4 unpaid
    (
        2,
        7,
        7,
        385000.00,
        0.00,
        '2024-07-22',
        'PENDING'
    );
-- Order 7 unpaid

-- ============================================
-- 13. DEBT_PAYMENTS
-- ============================================
INSERT INTO
    DEBT_PAYMENT (
        debt_id,
        payment_amount,
        payment_method,
        payment_date,
        created_by
    )
VALUES (
        1,
        3000000.00,
        'CASH',
        '2024-01-20 10:00:00',
        3
    );
-- Partial payment for debt 1

-- ============================================
-- 14. STOCK_MOVEMENTS (from orders)
-- ============================================
INSERT INTO
    STOCK_MOVEMENT (
        owner_id,
        product_id,
        movement_type,
        quantity,
        unit_id,
        reference_type,
        reference_id,
        created_by,
        created_at
    )
VALUES
    -- Order 1 movements
    (
        1,
        1,
        'EXPORT',
        -200.0000,
        2,
        'ORDER',
        1,
        3,
        '2024-01-15 09:30:00'
    ), -- 10 tấn = 200 bao

-- Order 2 movements
( 1, 3, 'EXPORT', -3.0000, 3, 'ORDER', 2, 3, '2024-01-16 14:20:00' ),

-- Order 3 movements
(
    1,
    5,
    'EXPORT',
    -200.0000,
    1,
    'ORDER',
    3,
    4,
    '2024-01-17 10:15:00'
),
(
    1,
    6,
    'EXPORT',
    -100.0000,
    1,
    'ORDER',
    3,
    4,
    '2024-01-17 10:15:00'
),
(
    1,
    1,
    'EXPORT',
    -50.0000,
    2,
    'ORDER',
    3,
    4,
    '2024-01-17 10:15:00'
),

-- Order 4 movements
(
    1,
    5,
    'EXPORT',
    -12.0000,
    1,
    'ORDER',
    4,
    3,
    '2024-01-18 16:45:00'
),

-- Order 5 movements
(
    2,
    11,
    'EXPORT',
    -10.0000,
    10,
    'ORDER',
    5,
    6,
    '2024-06-20 08:00:00'
),

-- Order 6 movements
(
    2,
    12,
    'EXPORT',
    -3.0000,
    10,
    'ORDER',
    6,
    6,
    '2024-06-21 11:30:00'
),
(
    2,
    15,
    'EXPORT',
    -1.0000,
    10,
    'ORDER',
    6,
    6,
    '2024-06-21 11:30:00'
),

-- Order 7 movements
(
    2,
    13,
    'EXPORT',
    -2.0000,
    11,
    'ORDER',
    7,
    6,
    '2024-06-22 15:20:00'
),
(
    2,
    14,
    'EXPORT',
    -2.0000,
    13,
    'ORDER',
    7,
    6,
    '2024-06-22 15:20:00'
),
(
    2,
    15,
    'EXPORT',
    -1.0000,
    10,
    'ORDER',
    7,
    6,
    '2024-06-22 15:20:00'
);

-- ============================================
-- 15. NOTIFICATIONS
-- ============================================
INSERT INTO
    NOTIFICATION (
        user_id,
        owner_id,
        notification_type,
        title,
        message,
        reference_type,
        reference_id,
        is_read
    )
VALUES (
        3,
        1,
        'DEBT_WARNING',
        'Cảnh báo công nợ',
        'Khách hàng "Anh Nguyễn Văn Thành" còn nợ 105,000 VND',
        'DEBT',
        1,
        FALSE
    ),
    (
        3,
        1,
        'DEBT_WARNING',
        'Cảnh báo công nợ',
        'Khách hàng "Chị Trần Thị Lan" còn nợ 2,442,000 VND',
        'DEBT',
        2,
        FALSE
    ),
    (
        6,
        2,
        'DEBT_WARNING',
        'Cảnh báo công nợ',
        'Khách hàng "Cô Phạm Thị Hoa" còn nợ 385,000 VND',
        'DEBT',
        3,
        FALSE
    );

-- ============================================
-- 16. DRAFT_ORDERS (AI-generated samples)
-- ============================================
INSERT INTO
    DRAFT_ORDER (
        owner_id,
        draft_code,
        source,
        original_input,
        parsed_data,
        confidence_score,
        status,
        created_by,
        expires_at
    )
VALUES (
        1,
        'DRAFT2024010001',
        'AI_TEXT',
        'Anh Thành gọi đặt 5 bao xi măng Hà Tiên, giao chiều nay',
        '{"customer": {"name": "Anh Nguyễn Văn Thành", "phone": "0909222333"}, "items": [{"product": "Xi măng Hà Tiên PCB40", "quantity": 5, "unit": "bao"}], "delivery_note": "giao chiều nay"}',
        0.9500,
        'PENDING',
        3,
        DATE_ADD(NOW(), INTERVAL 24 HOUR)
    ),
    (
        2,
        'DRAFT2024060001',
        'AI_VOICE',
        'Quán Bình Dân cần 5 thùng Coca, 3 thùng Pepsi, giao sáng mai',
        '{"customer": {"name": "Quán ăn Bình Dân", "phone": "0909555666"}, "items": [{"product": "Coca Cola", "quantity": 5, "unit": "thùng"}, {"product": "Pepsi", "quantity": 3, "unit": "thùng"}], "delivery_note": "giao sáng mai"}',
        0.8800,
        'PENDING',
        6,
        DATE_ADD(NOW(), INTERVAL 24 HOUR)
    );

-- ============================================
-- Update inventory after stock movements
-- ============================================
UPDATE INVENTORY SET quantity = 250.0000 WHERE product_id = 1;
-- Xi măng: 500 - 250 = 250
UPDATE INVENTORY SET quantity = 42.0000 WHERE product_id = 3;
-- Sơn Dulux: 45 - 3 = 42
UPDATE INVENTORY SET quantity = 988.0000 WHERE product_id = 5;
-- Gạch Đồng Tâm: 1200 - 212 = 988
UPDATE INVENTORY SET quantity = 700.0000 WHERE product_id = 6;
-- Gạch Prime: 800 - 100 = 700
UPDATE INVENTORY SET quantity = 90.0000 WHERE product_id = 11;
-- Coca: 100 - 10 = 90
UPDATE INVENTORY SET quantity = 77.0000 WHERE product_id = 12;
-- Pepsi: 80 - 3 = 77
UPDATE INVENTORY SET quantity = 198.0000 WHERE product_id = 13;
-- Snack: 200 - 2 = 198
UPDATE INVENTORY SET quantity = 148.0000 WHERE product_id = 14;
-- Mì: 150 - 2 = 148
UPDATE INVENTORY SET quantity = 118.0000 WHERE product_id = 15;
-- Nước suối: 120 - 2 = 118

-- ============================================
-- END OF SEED DATA
-- ============================================