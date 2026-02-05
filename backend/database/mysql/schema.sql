-- ============================================
-- BizFlow Database Schema (MySQL 8.0)
-- ============================================
-- Multi-tenant SaaS for Vietnamese household businesses
-- Compliance: TT88/2021/TT-BTC
-- ============================================

SET NAMES utf8mb4;

SET CHARACTER SET utf8mb4;

SET collation_connection = utf8mb4_unicode_ci;

-- ============================================
-- TABLE 1: SUBSCRIPTION_PLAN
-- ============================================
CREATE TABLE IF NOT EXISTS SUBSCRIPTION_PLAN (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Plan name (e.g., Free, Basic, Pro)',
    description TEXT COMMENT 'Plan description',
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Monthly price in VND',
    max_employees INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Maximum number of employees',
    max_products INT UNSIGNED NOT NULL DEFAULT 100 COMMENT 'Maximum number of products',
    max_orders_per_month INT UNSIGNED NOT NULL DEFAULT 1000 COMMENT 'Maximum orders per month',
    features JSON COMMENT 'JSON array of features',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_price (price)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Subscription plans for multi-tenant SaaS';

-- ============================================
-- TABLE 2: USER
-- ============================================
CREATE TABLE IF NOT EXISTS USER (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'User email (login)',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    full_name VARCHAR(255) NOT NULL COMMENT 'Full name',
    phone VARCHAR(20) COMMENT 'Phone number',
    role ENUM(
        'ADMIN',
        'OWNER',
        'EMPLOYEE',
        'CUSTOMER'
    ) NOT NULL COMMENT 'User role',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'System users (Admin, Owner, Employee)';

-- ============================================
-- TABLE 3: OWNER
-- ============================================
CREATE TABLE IF NOT EXISTS OWNER (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'Reference to USER table',
    business_name VARCHAR(255) NOT NULL COMMENT 'Business name',
    business_address TEXT COMMENT 'Business address',
    tax_code VARCHAR(50) COMMENT 'Tax identification number',
    subscription_plan_id BIGINT UNSIGNED NOT NULL COMMENT 'Current subscription plan',
    subscription_start_date DATE NOT NULL COMMENT 'Subscription start date',
    subscription_end_date DATE NOT NULL COMMENT 'Subscription end date',
    is_trial BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is trial account',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER (id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_plan_id) REFERENCES SUBSCRIPTION_PLAN (id),
    INDEX idx_subscription (subscription_plan_id),
    INDEX idx_subscription_dates (subscription_end_date),
    INDEX idx_tax_code (tax_code)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Business owners (tenant)';

-- ============================================
-- TABLE 4: EMPLOYEE
-- ============================================
CREATE TABLE IF NOT EXISTS EMPLOYEE (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'Reference to USER table',
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Belongs to which owner (tenant isolation)',
    position VARCHAR(100) COMMENT 'Job position',
    hire_date DATE NOT NULL COMMENT 'Hire date',
    salary DECIMAL(15, 2) COMMENT 'Monthly salary',
    permissions JSON COMMENT 'JSON array of permissions',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER (id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    INDEX idx_owner (owner_id),
    INDEX idx_hire_date (hire_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Employees working for owners';

-- ============================================
-- TABLE 5: CUSTOMER
-- ============================================
CREATE TABLE IF NOT EXISTS CUSTOMER (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    user_id BIGINT UNSIGNED NULL UNIQUE COMMENT 'Reference to USER table (for self-registration)',
    customer_code VARCHAR(50) NOT NULL COMMENT 'Customer code (auto-generated)',
    full_name VARCHAR(255) NOT NULL COMMENT 'Customer full name',
    phone VARCHAR(20) COMMENT 'Phone number',
    email VARCHAR(255) COMMENT 'Email',
    address TEXT COMMENT 'Address',
    tax_code VARCHAR(50) COMMENT 'Tax code (for business customers)',
    customer_type ENUM('INDIVIDUAL', 'BUSINESS') NOT NULL DEFAULT 'INDIVIDUAL',
    credit_limit DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Maximum debt allowed',
    notes TEXT COMMENT 'Additional notes',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USER (id) ON DELETE SET NULL,
    UNIQUE INDEX idx_owner_customer_code (owner_id, customer_code),
    INDEX idx_owner (owner_id),
    INDEX idx_phone (phone),
    INDEX idx_active (is_active)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Customers for each business owner';

-- ============================================
-- TABLE 6: PRODUCT
-- ============================================
CREATE TABLE IF NOT EXISTS PRODUCT (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    product_code VARCHAR(50) NOT NULL COMMENT 'Product code (SKU)',
    name VARCHAR(255) NOT NULL COMMENT 'Product name',
    description TEXT COMMENT 'Product description',
    category VARCHAR(100) COMMENT 'Product category',
    base_unit_id BIGINT UNSIGNED NOT NULL COMMENT 'Base unit for inventory',
    base_price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Base price in base unit',
    cost_price DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Cost price for profit calculation',
    barcode VARCHAR(100) COMMENT 'Barcode',
    image_url VARCHAR(500) COMMENT 'Product image URL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    UNIQUE INDEX idx_owner_product_code (owner_id, product_code),
    INDEX idx_owner (owner_id),
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_barcode (barcode),
    FULLTEXT INDEX idx_name_search (name, description)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Products for each business owner';

-- ============================================
-- TABLE 7: UNIT
-- ============================================
CREATE TABLE IF NOT EXISTS UNIT (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    name VARCHAR(50) NOT NULL COMMENT 'Unit name (e.g., kg, thùng, cái)',
    abbreviation VARCHAR(20) NOT NULL COMMENT 'Short form (e.g., kg, box, pcs)',
    description TEXT COMMENT 'Unit description',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    UNIQUE INDEX idx_owner_name (owner_id, name),
    INDEX idx_owner (owner_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Units of measurement';

-- ============================================
-- TABLE 8: PRODUCT_UNIT
-- ============================================
CREATE TABLE IF NOT EXISTS PRODUCT_UNIT (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to product',
    unit_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to unit',
    conversion_rate DECIMAL(15, 4) NOT NULL DEFAULT 1.0000 COMMENT 'Conversion to base unit',
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Price in this unit',
    is_default BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Is default selling unit',
    barcode VARCHAR(100) COMMENT 'Barcode for this unit',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES PRODUCT (id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES UNIT (id) ON DELETE CASCADE,
    UNIQUE INDEX idx_product_unit (product_id, unit_id),
    INDEX idx_product (product_id),
    INDEX idx_barcode (barcode)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Product unit conversions (e.g., 1 thùng = 12 chai)';

-- ============================================
-- TABLE 9: INVENTORY
-- ============================================
CREATE TABLE IF NOT EXISTS INVENTORY (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    product_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to product',
    quantity DECIMAL(15, 4) NOT NULL DEFAULT 0.0000 COMMENT 'Current quantity in base unit',
    reserved_quantity DECIMAL(15, 4) NOT NULL DEFAULT 0.0000 COMMENT 'Reserved for pending orders',
    available_quantity DECIMAL(15, 4) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    low_stock_threshold DECIMAL(15, 4) DEFAULT 10.0000 COMMENT 'Alert threshold',
    last_stock_check_at TIMESTAMP NULL COMMENT 'Last physical stock check',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT (id) ON DELETE CASCADE,
    UNIQUE INDEX idx_owner_product (owner_id, product_id),
    INDEX idx_owner (owner_id),
    INDEX idx_low_stock (
        available_quantity,
        low_stock_threshold
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Current inventory levels';

-- ============================================
-- TABLE 10: STOCK_MOVEMENT
-- ============================================
CREATE TABLE IF NOT EXISTS STOCK_MOVEMENT (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    product_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to product',
    movement_type ENUM(
        'IMPORT',
        'EXPORT',
        'ADJUSTMENT',
        'RETURN'
    ) NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL COMMENT 'Quantity in base unit (positive or negative)',
    unit_id BIGINT UNSIGNED NOT NULL COMMENT 'Unit used in transaction',
    reference_type ENUM(
        'ORDER',
        'PURCHASE',
        'ADJUSTMENT',
        'OTHER'
    ) COMMENT 'Source of movement',
    reference_id BIGINT UNSIGNED COMMENT 'ID of source document',
    notes TEXT COMMENT 'Movement notes',
    created_by BIGINT UNSIGNED NOT NULL COMMENT 'User who created this movement',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT (id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES UNIT (id),
    FOREIGN KEY (created_by) REFERENCES USER (id),
    INDEX idx_owner (owner_id),
    INDEX idx_product (product_id),
    INDEX idx_movement_type (movement_type),
    INDEX idx_created_at (created_at),
    INDEX idx_reference (reference_type, reference_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Stock movement history (audit trail)';

-- ============================================
-- TABLE 11: DRAFT_ORDER
-- ============================================
CREATE TABLE IF NOT EXISTS DRAFT_ORDER (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    draft_code VARCHAR(50) NOT NULL COMMENT 'Draft order code',
    source ENUM(
        'AI_TEXT',
        'AI_VOICE',
        'MANUAL'
    ) NOT NULL COMMENT 'How was this draft created',
    original_input TEXT COMMENT 'Original user input (Vietnamese)',
    parsed_data JSON NOT NULL COMMENT 'AI parsed data (customer, items, etc.)',
    confidence_score DECIMAL(5, 4) COMMENT 'AI confidence (0.0000 to 1.0000)',
    missing_fields JSON COMMENT 'Fields that need clarification',
    questions JSON COMMENT 'Questions to ask user',
    status ENUM(
        'PENDING',
        'CONFIRMED',
        'REJECTED',
        'EXPIRED'
    ) NOT NULL DEFAULT 'PENDING',
    created_by BIGINT UNSIGNED NOT NULL COMMENT 'User who received this draft',
    confirmed_by BIGINT UNSIGNED COMMENT 'User who confirmed/rejected',
    confirmed_at TIMESTAMP NULL,
    final_order_id BIGINT UNSIGNED COMMENT 'Created order ID if confirmed',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL COMMENT 'Auto-expire if not confirmed',
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES USER (id),
    FOREIGN KEY (confirmed_by) REFERENCES USER (id),
    UNIQUE INDEX idx_owner_draft_code (owner_id, draft_code),
    INDEX idx_owner (owner_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'AI-generated draft orders awaiting confirmation';

-- ============================================
-- TABLE 12: ORDER
-- ============================================
CREATE TABLE IF NOT EXISTS `ORDER` (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    order_code VARCHAR(50) NOT NULL COMMENT 'Order code (auto-generated)',
    customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to customer',
    order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Order date',
    order_type ENUM('SALE', 'RETURN') NOT NULL DEFAULT 'SALE',
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Subtotal before tax',
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tax rate (%)',
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Tax amount',
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Discount amount',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Final total',
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Amount paid',
    debt_amount DECIMAL(15, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    payment_method ENUM(
        'CASH',
        'BANK_TRANSFER',
        'CREDIT',
        'MIXED'
    ) NOT NULL DEFAULT 'CASH',
    payment_status ENUM('PAID', 'PARTIAL', 'UNPAID') NOT NULL DEFAULT 'UNPAID',
    notes TEXT COMMENT 'Order notes',
    created_by BIGINT UNSIGNED NOT NULL COMMENT 'Employee who created order',
    draft_order_id BIGINT UNSIGNED COMMENT 'Source draft order if from AI',
    is_invoiced BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Invoice printed',
    is_accounted BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Accounting entry created',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES CUSTOMER (id),
    FOREIGN KEY (created_by) REFERENCES USER (id),
    FOREIGN KEY (draft_order_id) REFERENCES DRAFT_ORDER (id),
    UNIQUE INDEX idx_owner_order_code (owner_id, order_code),
    INDEX idx_owner (owner_id),
    INDEX idx_customer (customer_id),
    INDEX idx_order_date (order_date),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_by (created_by)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Sales orders';

-- ============================================
-- TABLE 13: ORDER_ITEM
-- ============================================
CREATE TABLE IF NOT EXISTS ORDER_ITEM (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to order',
    product_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to product',
    unit_id BIGINT UNSIGNED NOT NULL COMMENT 'Unit used in this order',
    quantity DECIMAL(15, 4) NOT NULL COMMENT 'Quantity ordered',
    unit_price DECIMAL(15, 2) NOT NULL COMMENT 'Price per unit',
    discount_percent DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Discount %',
    discount_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'Discount amount',
    subtotal DECIMAL(15, 2) GENERATED ALWAYS AS (
        quantity * unit_price - discount_amount
    ) STORED,
    notes TEXT COMMENT 'Item notes',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES `ORDER` (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES PRODUCT (id),
    FOREIGN KEY (unit_id) REFERENCES UNIT (id),
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Order line items';

-- ============================================
-- TABLE 14: NOTIFICATION
-- ============================================
CREATE TABLE IF NOT EXISTS NOTIFICATION (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Recipient user',
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    notification_type ENUM(
        'DRAFT_ORDER',
        'LOW_STOCK',
        'DEBT_WARNING',
        'SYSTEM',
        'OTHER'
    ) NOT NULL,
    title VARCHAR(255) NOT NULL COMMENT 'Notification title',
    message TEXT NOT NULL COMMENT 'Notification message',
    reference_type VARCHAR(50) COMMENT 'Related entity type',
    reference_id BIGINT UNSIGNED COMMENT 'Related entity ID',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES USER (id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_owner (owner_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_reference (reference_type, reference_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'User notifications';

-- ============================================
-- TABLE 15: DEBT
-- ============================================
CREATE TABLE IF NOT EXISTS DEBT (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT UNSIGNED NOT NULL COMMENT 'Tenant isolation',
    customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer with debt',
    order_id BIGINT UNSIGNED NOT NULL COMMENT 'Source order',
    debt_amount DECIMAL(15, 2) NOT NULL COMMENT 'Original debt amount',
    paid_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Amount paid so far',
    remaining_amount DECIMAL(15, 2) GENERATED ALWAYS AS (debt_amount - paid_amount) STORED,
    due_date DATE COMMENT 'Payment due date',
    status ENUM(
        'PENDING',
        'PARTIAL',
        'PAID',
        'OVERDUE'
    ) NOT NULL DEFAULT 'PENDING',
    notes TEXT COMMENT 'Debt notes',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES OWNER (id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES CUSTOMER (id),
    FOREIGN KEY (order_id) REFERENCES `ORDER` (id),
    INDEX idx_owner (owner_id),
    INDEX idx_customer (customer_id),
    INDEX idx_order (order_id),
    INDEX idx_status (status),
    INDEX idx_due_date (due_date)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Customer debts';

-- ============================================
-- TABLE 16: DEBT_PAYMENT
-- ============================================
CREATE TABLE IF NOT EXISTS DEBT_PAYMENT (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    debt_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to debt',
    payment_amount DECIMAL(15, 2) NOT NULL COMMENT 'Payment amount',
    payment_method ENUM(
        'CASH',
        'BANK_TRANSFER',
        'OTHER'
    ) NOT NULL DEFAULT 'CASH',
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100) COMMENT 'Bank transfer reference',
    notes TEXT COMMENT 'Payment notes',
    created_by BIGINT UNSIGNED NOT NULL COMMENT 'User who recorded payment',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES DEBT (id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES USER (id),
    INDEX idx_debt (debt_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_created_by (created_by)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci COMMENT = 'Debt payment history';

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE
-- ============================================

-- Update DEBT status based on payments
DELIMITER $$

CREATE TRIGGER trg_debt_payment_after_insert
AFTER INSERT ON DEBT_PAYMENT
FOR EACH ROW
BEGIN
    DECLARE v_debt_amount DECIMAL(15,2);
    DECLARE v_paid_amount DECIMAL(15,2);
    DECLARE v_due_date DATE;
    
    SELECT debt_amount, paid_amount, due_date 
    INTO v_debt_amount, v_paid_amount, v_due_date
    FROM DEBT WHERE id = NEW.debt_id;
    
    IF v_paid_amount >= v_debt_amount THEN
        UPDATE DEBT SET status = 'PAID' WHERE id = NEW.debt_id;
    ELSEIF v_paid_amount > 0 THEN
        UPDATE DEBT SET status = 'PARTIAL' WHERE id = NEW.debt_id;
    ELSEIF v_due_date < CURDATE() THEN
        UPDATE DEBT SET status = 'OVERDUE' WHERE id = NEW.debt_id;
    END IF;
END$$

-- Update ORDER payment status
CREATE TRIGGER trg_order_update_payment_status
BEFORE UPDATE ON `ORDER`
FOR EACH ROW
BEGIN
    IF NEW.paid_amount >= NEW.total_amount THEN
        SET NEW.payment_status = 'PAID';
    ELSEIF NEW.paid_amount > 0 THEN
        SET NEW.payment_status = 'PARTIAL';
    ELSE
        SET NEW.payment_status = 'UNPAID';
    END IF;
END$$

DELIMITER;

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Add base unit constraint to PRODUCT table
ALTER TABLE PRODUCT
ADD CONSTRAINT fk_product_base_unit FOREIGN KEY (base_unit_id) REFERENCES UNIT (id);

-- ============================================
-- END OF SCHEMA
-- ============================================