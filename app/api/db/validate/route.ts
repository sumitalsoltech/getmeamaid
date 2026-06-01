import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

const KNOWN_TABLES = [
  'users',
  'services',
  'addons',
  'pricing_rules',
  'coupons',
  'orders',
  'order_status_history',
  'tickets',
  'ticket_replies',
  'password_tokens',
  'enquiries',
  'email_templates',
  'email_logs',
  'slots',
  'blocked_dates',
  'bookings',
  'gift_cards',
  'cms_content',
  'service_pricing_rules',
  'roles',
  'permissions',
  'role_permissions'
];

export async function GET(req: NextRequest) {
  try {
    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({
        success: false,
        is_mysql_connected: false,
        error: "MySQL database URL (URL/Key) are not configured. The application is falling back to local files.",
        tables: KNOWN_TABLES.map(t => ({ table: t, exists: false, error: 'MySQL URL/Key missing' })),
        sql_script: generateSqlScript()
      });
    }

    // Try to query schema integrity via RPC helper
    let integrity: any = null;
    let rpcSupported = false;
    try {
      const { data, error } = await mysqlClient.rpc('check_db_integrity');
      if (!error && data) {
        integrity = data;
        rpcSupported = true;
      }
    } catch (e) {
      // Ignored, fallback to standard checking
    }

    // We execute queries in parallel to speed up checking
    const checks = KNOWN_TABLES.map(async (table) => {
      try {
        const { error } = await mysqlClient
          .from(table)
          .select('*')
          .limit(0);
          
        if (error) {
          return {
            table,
            exists: false,
            error: error.message,
            code: error.code
          };
        }
        return {
          table,
          exists: true,
          error: null
        };
      } catch (err: any) {
        return {
          table,
          exists: false,
          error: err.message || String(err)
        };
      }
    });

    const results = await Promise.all(checks);
    const healthyCount = results.filter(r => r.exists).length;
    const allHealthy = healthyCount === KNOWN_TABLES.length;

    // Build lists of active and missing foreign key constraints
    const expectedForeignKeys = [
      { constraint_name: 'orders_user_id_fkey', table_name: 'orders', referenced_table: 'users' },
      { constraint_name: 'orders_service_id_fkey', table_name: 'orders', referenced_table: 'services' },
      { constraint_name: 'order_status_history_order_id_fkey', table_name: 'order_status_history', referenced_table: 'orders' },
      { constraint_name: 'tickets_user_id_fkey', table_name: 'tickets', referenced_table: 'users' },
      { constraint_name: 'tickets_order_id_fkey', table_name: 'tickets', referenced_table: 'orders' },
      { constraint_name: 'ticket_replies_ticket_id_fkey', table_name: 'ticket_replies', referenced_table: 'tickets' },
      { constraint_name: 'password_tokens_user_id_fkey', table_name: 'password_tokens', referenced_table: 'users' },
      { constraint_name: 'service_pricing_rules_service_id_fkey', table_name: 'service_pricing_rules', referenced_table: 'services' },
      { constraint_name: 'service_pricing_rules_pricing_rule_id_fkey', table_name: 'service_pricing_rules', referenced_table: 'pricing_rules' },
      { constraint_name: 'users_role_id_fkey', table_name: 'users', referenced_table: 'roles' },
      { constraint_name: 'role_permissions_role_id_fkey', table_name: 'role_permissions', referenced_table: 'roles' },
      { constraint_name: 'role_permissions_permission_id_fkey', table_name: 'role_permissions', referenced_table: 'permissions' }
    ];

    let actualForeignKeys: any[] = [];
    if (rpcSupported && integrity && Array.isArray(integrity.foreign_keys)) {
      actualForeignKeys = integrity.foreign_keys;
    }

    const foreignKeyChecks = expectedForeignKeys.map(fk => {
      const active = !rpcSupported 
        ? null // null means unchecked via RPC (need script execution for detailed diagnostic checking)
        : actualForeignKeys.some(afk => 
            String(afk.table_name).toLowerCase() === fk.table_name &&
            String(afk.referenced_table).toLowerCase() === fk.referenced_table
          );
      
      return {
        ...fk,
        active
      };
    });

    return NextResponse.json({
      success: true,
      is_mysql_connected: true,
      all_healthy: allHealthy,
      healthy_count: healthyCount,
      total_count: KNOWN_TABLES.length,
      tables: results,
      rpc_supported: rpcSupported,
      foreign_keys: foreignKeyChecks,
      sql_script: generateSqlScript()
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Validation execution failed',
      sql_script: generateSqlScript()
    }, { status: 500 });
  }
}

function generateSqlScript(): string {
  return `-- ==========================================
-- PRISTINE ATELIER & GETMEAMAID COMPLETE DB RESET
-- ==========================================
-- This script safely drops ALL existing tables in dependency-cascade order,
-- and recreates them with EXACT compatibility.
-- All table IDs use numeric primary keys where requested.
--
-- INSTRUCTIONS:
-- 1. Open HeidiSQL or your preferred local MySQL client.
-- 2. Connect to localhost:3306 and select the \`getmeamaid\` database.
-- 3. Open a "New Query" tab, paste this entire script, and click "Run" (F9).
-- 4. Reload your application database settings or sync page to verify health.

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- STEP 1: DROP TABLES
-- ==========================================
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS ticket_replies;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS password_tokens;
DROP TABLE IF EXISTS service_pricing_rules;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS addons;
DROP TABLE IF EXISTS pricing_rules;
DROP TABLE IF EXISTS coupons;
DROP TABLE IF EXISTS enquiries;
DROP TABLE IF EXISTS email_templates;
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS slots;
DROP TABLE IF EXISTS blocked_dates;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS gift_cards;
DROP TABLE IF EXISTS cms_content;

-- ==========================================
-- STEP 2: CREATE SCHEMA TABLES
-- ==========================================

-- 1. Create roles table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Create permissions table
CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create role_permissions pivot table
CREATE TABLE role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    UNIQUE KEY role_permission_unique (role_id, permission_id),
    CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);


-- 4. Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255),
    password_hash VARCHAR(255),
    role_id INT,
    account_source VARCHAR(255) DEFAULT 'signup',
    email_verified_at DATETIME,
    is_active TINYINT(1) DEFAULT 1,
    is_admin TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
);

-- 5. Create services table
CREATE TABLE services (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    base_price DECIMAL(10,2) DEFAULT 0.00,
    is_active TINYINT(1) DEFAULT 1,
    is_manual_quote TINYINT(1) DEFAULT 0,
    included_items TEXT, -- JSON Array Text
    excluded_items TEXT, -- JSON Array Text
    is_featured TINYINT(1) DEFAULT 0,
    is_instant_pricing_enabled TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    full_description TEXT,
    faqs TEXT, -- JSON Array Text
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 6. Create addons table
CREATE TABLE addons (
    id VARCHAR(255) PRIMARY KEY,
    service_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    pricing_type VARCHAR(255) DEFAULT 'fixed',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Create pricing_rules table
CREATE TABLE pricing_rules (
    id VARCHAR(255) PRIMARY KEY,
    service_id VARCHAR(255),
    rule_type VARCHAR(255), -- residence_type, bedroom_count, etc
    rule_name VARCHAR(255),
    value VARCHAR(255),
    price_adjustment DECIMAL(10,2) DEFAULT 0.00,
    adjustment_type VARCHAR(255) DEFAULT 'fixed',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Create coupons table
CREATE TABLE coupons (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    discount_type VARCHAR(255) DEFAULT 'fixed',
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    minimum_order_value DECIMAL(10,2) DEFAULT 0.00,
    maximum_discount DECIMAL(10,2) DEFAULT 0.00,
    applicable_services TEXT, -- JSON Array service IDs
    start_date VARCHAR(255),
    end_date VARCHAR(255),
    total_usage_limit INT DEFAULT 0,
    per_customer_usage_limit INT DEFAULT 1,
    used_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 9. Create enquiries table
CREATE TABLE enquiries (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    message TEXT,
    status VARCHAR(255) DEFAULT 'New',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Create email_templates table
CREATE TABLE email_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    is_active TINYINT(1) DEFAULT 1
);

-- 11. Create email_logs table
CREATE TABLE email_logs (
    id VARCHAR(255) PRIMARY KEY,
    to_email VARCHAR(255),
    subject VARCHAR(255),
    body TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    email_type VARCHAR(191),
    recipient_email VARCHAR(191),
    related_entity_id VARCHAR(191),
    template_used VARCHAR(191),
    sent_by VARCHAR(191),
    status VARCHAR(191),
    error_message TEXT
);

-- 12. Create slots table
CREATE TABLE slots (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1
);

-- 13. Create blocked_dates table
CREATE TABLE blocked_dates (
    id VARCHAR(255) PRIMARY KEY,
    blocked_date VARCHAR(255) NOT NULL
);

-- 14. Create Bookings table 
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  postal_code VARCHAR(255),
  home_type VARCHAR(255),
  bedrooms INT DEFAULT 1,
  bathrooms INT DEFAULT 1,
  square_footage INT,
  restoration_level VARCHAR(255),
  frequency VARCHAR(255),
  addons TEXT, -- JSON Array string
  selected_date VARCHAR(255),
  selected_time_slot VARCHAR(255),
  entry_method VARCHAR(255),
  custom_key_notes TEXT,
  customer_special_notes TEXT,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(255),
  card_name VARCHAR(255),
  pricing TEXT, -- JSON Object string
  status VARCHAR(255) DEFAULT 'Confirmed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_status VARCHAR(191),
  assigned_staff_id VARCHAR(191),
  job_instructions TEXT,
  confirmed_date VARCHAR(191),
  confirmed_time VARCHAR(191),
  staff_job_status VARCHAR(191),
  internal_notes TEXT,
  customer_visible_notes TEXT
);

-- 15. Create Gift Cards table
CREATE TABLE gift_cards (
  id VARCHAR(255) PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  from_name VARCHAR(255) NOT NULL,
  to_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Create CMS Content table
CREATE TABLE cms_content (
  id VARCHAR(255) PRIMARY KEY,
  content JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 17. Create orders table
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT,
    order_number VARCHAR(255) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(255),
    service_id VARCHAR(255),
    property_size TEXT, -- JSON Object
    selected_addons TEXT, -- JSON Array
    preferred_date VARCHAR(255),
    preferred_time_slot VARCHAR(255),
    notes TEXT,
    access_method VARCHAR(255),
    custom_key_notes TEXT,
    original_estimated_price DECIMAL(10,2) DEFAULT 0.00,
    coupon_code VARCHAR(255),
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    final_estimated_price DECIMAL(10,2) DEFAULT 0.00,
    final_confirmed_price DECIMAL(10,2),
    payment_status VARCHAR(255),
    order_status VARCHAR(255),
    settlement_status VARCHAR(255),
    admin_internal_notes TEXT,
    customer_visible_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT orders_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

-- 18. Create order_status_history table
CREATE TABLE order_status_history (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255),
    old_status VARCHAR(255),
    new_status VARCHAR(255),
    changed_by VARCHAR(255),
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 19. Create tickets table
CREATE TABLE tickets (
    id VARCHAR(255) PRIMARY KEY,
    ticket_number VARCHAR(255) UNIQUE NOT NULL,
    user_id INT,
    order_id VARCHAR(255),
    category VARCHAR(255),
    subject VARCHAR(255),
    message TEXT,
    priority VARCHAR(255) DEFAULT 'Medium',
    status VARCHAR(255) DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT tickets_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- 20. Create ticket_replies table
CREATE TABLE ticket_replies (
    id VARCHAR(255) PRIMARY KEY,
    ticket_id VARCHAR(255),
    sender_type VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    attachment VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ticket_replies_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- 21. Create password_tokens table
CREATE TABLE password_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id INT,
    token VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT password_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 22. Create service_pricing_rules table
CREATE TABLE service_pricing_rules (
    id VARCHAR(255) PRIMARY KEY,
    service_id VARCHAR(255),
    pricing_rule_id VARCHAR(255),
    is_required TINYINT(1) DEFAULT 0,
    default_selected TINYINT(1) DEFAULT 0,
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT service_pricing_rules_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
    CONSTRAINT service_pricing_rules_pricing_rule_id_fkey FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id) ON DELETE CASCADE
);

-- ==========================================
-- STEP 4: SEED INITIAL DATA RECORDS
-- ==========================================

-- Seed permissions
INSERT INTO permissions (id, name) VALUES
(1, 'view_orders'),
(2, 'edit_orders'),
(3, 'update_order_status'),
(4, 'assign_jobs'),
(5, 'view_customers'),
(6, 'manage_services'),
(7, 'manage_pricing'),
(8, 'manage_coupons'),
(9, 'view_reports'),
(10, 'download_invoices'),
(11, 'manage_tickets'),
(12, 'manage_staff'),
(13, 'manage_roles'),
(14, 'manage_email_templates'),
(15, 'view_staff_jobs'),
(16, 'view_dashboard'),
(17, 'view_slots'),
(18, 'manage_cms'),
(19, 'manage_settings')
ON DUPLICATE KEY UPDATE id=id;

-- Seed roles
INSERT INTO roles (id, name, is_active) VALUES
(1, 'Super Admin', 1),
(2, 'Manager', 1),
(3, 'Support Staff', 1),
(4, 'Field Staff', 1),
(5, 'Accounts Staff', 1)
ON DUPLICATE KEY UPDATE id=id;

-- Seed role_permissions pivot mapping
INSERT INTO role_permissions (role_id, permission_id) VALUES
-- Super Admin (gets all 1-19)
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17), (1, 18), (1, 19),
-- Manager (gets 1-11, plus dashboard 16 and slots 17)
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 16), (2, 17),
-- Support Staff (view_orders, edit_orders, update_order_status, manage_tickets, manage_coupons, view_dashboard, view_slots)
(3, 1), (3, 2), (3, 3), (3, 8), (3, 11), (3, 16), (3, 17),
-- Field Staff (view_staff_jobs, view_customers)
(4, 15), (4, 5),
-- Accounts Staff (view_orders, update_order_status, view_reports, download_invoices, view_dashboard)
(5, 1), (5, 3), (5, 9), (5, 10), (5, 16)
ON DUPLICATE KEY UPDATE role_id=role_id;

-- Seed users
INSERT INTO users (id, name, email, phone, password_hash, role_id, account_source, email_verified_at, is_admin, is_active) VALUES
(1, 'Pristine Atelier Admin', 'admin@gmail.com', '+1 (416) 555-0100', '$2b$10$uMR2Js.0TDTFDoJgDBmGKOwtJN5uy6apahpgVguo8bF/WfBP2.RCq', 1, 'signup', NOW(), 1, 1),
(101, 'Arthur Pendelton', 'arthur@pristine.com', '+1 (416) 555-0101', '$2b$10$RucF42j3vtCvBuLScfSo7udIlrERaksxwcBG1j.OqN0nr0bzNrZ9u', 4, 'signup', NOW(), 0, 1),
(102, 'Jessica Vance', 'jessica@pristine.com', '+1 (416) 555-0102', '$2b$10$wrlNPTFbJgj8yu4haWw7QujVWUcV4VsNUD6.Ty70O.wQLjQF43aAq', 4, 'signup', NOW(), 0, 1),
(103, 'Michael Chen', 'michael@pristine.com', '+1 (416) 555-0103', '$2b$10$gueOvzLe8oVwBaNPrg3hP.Zfiq2Sfl9d20AUHo6HJQD6h2oiVwVq2', 2, 'signup', NOW(), 0, 1),
(104, 'Sarah Connor', 'sarah@pristine.com', '+1 (416) 555-0104', '$2b$10$6AetMH3bGUGhHoBvBFYk.O8yPtwrx3tjuqu8BqlPYkin64qC4Q0a2', 3, 'signup', NOW(), 0, 1),
(201, 'Jean-Paul Leclerc', 'j.leclerc@gmail.com', '+1 (416) 555-0149', 'user123', NULL, 'signup', NOW(), 0, 1)
ON DUPLICATE KEY UPDATE id=id;

-- Seed services
INSERT INTO services (id, title, slug, description, image, base_price, is_active, is_manual_quote, included_items, excluded_items) VALUES
('srv-standard', 'Standard Maintenance Curation', 'standard-maintenance', 'A meticulous maintenance sweeps encompassing dusting, bespoke organizing, systematic vacuuming, sanitizing high-touch surfaces, and precision bathroom polishing.', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800', 1000.00, 1, 0, '["Sweeping, mopping, and vacuuming all floor layers","Fine-bristle hand dusting of high-fidelity frames, shelving, and surfaces","Full kitchen exterior sanitization & deep range-hood degreasing","Deep bath/shower chrome polishing and glass micro-wipe","Linen changes & bespoke textile precision alignments"]', '["Deep lime or mold grout remediation","Vents interior shaft vacuum extraction","Inside oven or inside refrigerator (available as Add-on only)","Empty drawer/closet vacuum clearances (unless Move-In requested)"]'),
('srv-deep', 'Deep Restoration Suite', 'deep-cleaning', 'An exhaustive physical overhaul targeting cumulative dust, deep lime and mold remediation, vents detailing, grout deep scrubbing, window-interior polishing, and inside-appliance curations based on diagnostic requirements.', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=800', 2500.00, 1, 0, '["All Standard Maintenance inclusion items","Inside of oven and oven-hood structural grease extraction","Inside refrigerator detailed shelving scrub & fresh sterilization","100% steam localized bath grout sanitization","Detailed hand-wiping of doors, trims, frames, and wide baseboards","Interior dry-vacuuming of heating vents and filter plates"]', '["Chandelier deep glass crystal removal and dismantling","Heavy debris, commercial trash, or post-construction paint stripping"]'),
('srv-move', 'Move In / Out Choreography', 'move-in-out', 'Designed for buyers, renters, and listing agents. We curate complete vertical extraction, empty drawer disinfection, inside all shelves, drawers, cabinets, closet resets.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800', 3500.00, 1, 0, '["Complete empty home bottom-to-ceiling vertical sweep","Vacuuming, wiping, and sterilizing all inside closets, drawers, and cabinetry","Complete structural reset of luxury appliances (Oven, Fridge, Dishwasher, Microwave)","Deep tracking detail of window sliders & glass panes","Precision spot-cleaning of walls, staircases rails, and baseboards"]', '["Exterior window washers requiring scaffolding or ladders","Post-flood mold restorations"]')
ON DUPLICATE KEY UPDATE id=id;

-- Seed slots
INSERT INTO slots (id, name, is_active) VALUES
('sl-morning', '09:00 AM - 12:00 PM (Morning Slot)', 1),
('sl-afternoon', '12:00 PM - 03:00 PM (Afternoon Slot)', 1),
('sl-evening', '03:00 PM - 06:00 PM (Evening Slot)', 1),
('sl-twilight', '06:00 PM - 09:00 PM (Twilight Care)', 1)
ON DUPLICATE KEY UPDATE id=id;

-- Seed addons
INSERT INTO addons (id, service_id, name, price, pricing_type, is_active) VALUES
('add-fridge', '', 'Inside Refrigerator Detailing', 300.00, 'fixed', 1),
('add-oven', '', 'Inside Oven Degrease', 350.00, 'fixed', 1),
('add-cabinets', '', 'Inside Drawer & Cabinets', 500.00, 'fixed', 1),
('add-windows', '', 'All Interior Window Panes', 400.00, 'fixed', 1),
('add-pethair', '', 'Deep Pet Hair Allergen Extract', 450.00, 'fixed', 1)
ON DUPLICATE KEY UPDATE id=id;

-- Seed pricing_rules
INSERT INTO pricing_rules (id, service_id, rule_type, rule_name, value, price_adjustment, adjustment_type, is_active) VALUES
('pr-res-condo', '', 'residence_type', 'Apartment / Condominium', 'Apartment / Condo', 0.00, 'fixed', 1),
('pr-res-house', '', 'residence_type', 'House / Estate Premium', 'House / Estate', 1000.00, 'fixed', 1),
('pr-res-town', '', 'residence_type', 'Townhouse / Duplex', 'Townhouse / Duplex', 500.00, 'fixed', 1),
('pr-res-office', '', 'residence_type', 'Office / Commercial', 'Office / Commercial', 1500.00, 'fixed', 1),
('pr-bed', '', 'bedroom_count', 'Per Bedroom Modification', 'bedroom', 250.00, 'fixed', 1),
('pr-bath', '', 'bathroom_count', 'Per Bathroom Modification', 'bathroom', 350.00, 'fixed', 1),
('pr-urg-same', '', 'urgency_charge', 'Same-Day Dispatch Charge', 'same_day', 20.00, 'percentage', 1),
('pr-urg-next', '', 'urgency_charge', 'Next-Day Priority Charge', 'next_day', 10.00, 'percentage', 1),
('pr-loc-normal', '', 'location_charge', 'Normal Service Zone', 'normal', 0.00, 'fixed', 1),
('pr-loc-out', '', 'location_charge', 'Outside Postal Zone', 'outside', 400.00, 'fixed', 1),
('pr-loc-far', '', 'location_charge', 'Far Boundary Hub', 'far', 1.00, 'percentage', 1),
('pr-min-order', '', 'min_order_value', 'Minimum Atelier Guarantee', '999', 999.00, 'fixed', 1)
ON DUPLICATE KEY UPDATE id=id;

-- Seed coupons
INSERT INTO coupons (id, code, name, discount_type, discount_value, minimum_order_value, maximum_discount, applicable_services, start_date, end_date, total_usage_limit, per_customer_usage_limit, used_count, is_active) VALUES
('cp-welcome100', 'WELCOME100', 'Atelier Inauguration Discount', 'fixed', 100.00, 999.00, 100.00, '[]', '2026-01-01', '2030-12-31', 1000, 1, 5, 1),
('cp-spring15', 'SPRING15', 'Spring Renewal Suite Discount', 'percentage', 15.00, 2000.00, 1000.00, '[]', '2026-03-01', '2026-06-31', 500, 1, 2, 1)
ON DUPLICATE KEY UPDATE id=id;

-- Seed main CMS content
INSERT INTO cms_content (id, content) VALUES
('main', '{"hero":{"heading":"Professional Cleaning Services You Can Depend On","subheading":"A systematic, clinical approach to restoration. Designed for modern living, budgeted dynamically, and calibrated in exquisite details for Toronto, Vancouver, and Calgary homes.","ctaText":"Book Curation Now","ctaLink":"/book","bannerImage":"https://images.unsplash.com/photo-1603796846097-bee99e4a60c9?auto=format&fit=crop&q=80&w=1200","status":"published"},"contact":{"phone":"+1 (800) 555-MAID (6243)","email":"concierge@getmeamaid.ca","area":"Metropolitan Toronto, Vancouver waterfront, Calgary Foothills","hours":"Monday - Sunday: 08:00 AM - 08:00 PM EST","mapLink":"https://maps.google.com","socials":{"twitter":"@getmeamaid","facebook":"getmeamaid.premium","instagram":"getmeamaid.curations"}},"footer":{"copyright":"© 2026 getmeamaid Labs. Absolute Luxury Curation.","desc":"Experience bespoke premium cleaning curation. Serving Toronto, Vancouver, and Calgary with an uncompromising standard of high-fidelity restoration."},"howItWorks":[{"id":"step-1","title":"Select Fine Details","description":"Toggle high-fidelity curation additions corresponding to spaces recursively.","display_order":1,"is_active":true},{"id":"step-2","title":"Verify Automatic Valuation","description":"Our math matches exact pricing breakdown transparency.","display_order":2,"is_active":true},{"id":"step-3","title":"Behold Immaculate Restoration","description":"Elite vetted specialists perform clinical-grade cleanings.","display_order":3,"is_active":true}],"testimonials":[{"id":"test-1","customer_name":"Charlotte Mercer","review_text":"Their Deep Restoration Curation is absolute magic. The baseboards, cabinet alignments, and lavender-sage scent selections made our high-rise condo look pristine as a surgical laboratory. Highly recommended.","rating":5,"display_order":1,"is_active":true},{"id":"test-2","customer_name":"Marcus Goldman","review_text":"Consistent, uncompromising quality. Standard maintenance program saves our townhouse incredible logistics load weekly. Vetted staff members present extraordinary standards.","rating":5,"display_order":2,"is_active":true}],"faqs":[{"id":"faq-1","question":"What is your high-fidelity restoration level difference?","answer":"Our deep restoration focuses on critical air purification, deep sanitizing of cabinets, clinical vent detailed wipes, and hand-polishing metals, surpassing traditional cleanings by several orders of volume.","display_order":1,"is_active":true},{"id":"faq-2","question":"How does the manual quote condition work?","answer":"For estates exceeding standard bedroom sizes or far zones, our backend calculator assigns high-touch manual indicators. We email final quotes within minutes of submit logs.","display_order":2,"is_active":true}],"terms":{"title":"Terms of Service Agreement","content":"All home reservations are subject to standard 24 hours cancellation policies. Security authorization forms clear payments upon dispatch schedule completions."},"privacy":{"title":"Privacy and Security Assurances","content":"Your home security lockbox parameters and physical property details are encrypted locally under TLS 1.3 standards. No telemetry details are ever shared with third-party servers."},"servicesContent":[{"id":"srv-standard","title":"Standard Maintenance Curation","rate":140,"duration":"2.5 - 4 Hours","desc":"A meticulous maintenance sweeps encompassing dusting, bespoke organizing, systematic vacuuming, sanitizing high-touch surfaces, and precision bathroom polishing.","highlights":["Scent choices: Fresh Herb or Citrus","Textile precision alignment","Double-polished metal faucets"],"is_active":true},{"id":"srv-deep","title":"Deep Restoration Suite","rate":210,"duration":"4 - 7 Hours","desc":"An overhaul targeting cumulative dust, deep lime and mold remediation, vents detailing, grout deep scrubbing, window-interior polishing, and inside-appliance curations.","highlights":["Grout 100% steam cleaning","Vents detailing wipes","Localized extraction cleanings"],"is_active":true},{"id":"srv-move","title":"Move In / Out Choreography","rate":340,"duration":"5 - 9 Hours","desc":"Designed for buyers, renters, and listing agents. We curate complete vertical extraction, empty drawer disinfection, inside all shelves, drawers, cabinets, closet resets.","highlights":["Oven & Refrigerator detailing","Meticulous sanitization","Air purification sweep"],"is_active":true}],"seo":{"home":{"pageTitle":"Home","metaTitle":"getmeamaid | Bespoke Premium Cleaning Curations","metaDescription":"Elite home restoration and maintenance services throughout Toronto, Vancouver, and Calgary.","slug":"/"},"book":{"pageTitle":"Book Appointment","metaTitle":"Reserve Luxury Clean - getmeamaid","metaDescription":"Configure details and book instant home curators.","slug":"/book"}}}'')
ON DUPLICATE KEY UPDATE id=id;

-- Seed email_templates
INSERT INTO email_templates (id, name, subject, body, is_active) VALUES
('tpl-order-confirm', 'Order Confirmation', 'Your Pristine Atelier Dispatch Receipt [#{order_id}]', 'Hello {customer_name},\n\nWe have received your luxury maintenance request #{order_id} for a meticulously curated {service_name}.\n\nPreferred Date: {preferred_date}\nPreferred Time: {preferred_slot}\nOriginal Estimate Code: {final_price}\n\nOur curation team is currently reviewing your schedule request. We will finalize your slot allocations and deliver dispatch quotes promptly. Thank you for selecting The Pristine Editorial.\n\nWarm regards,\nThe Pristine Atelier Core', 1),
('tpl-set-password', 'Set Password (Guest Auto)', 'Complete Your Pristine Atelier Account Setup', 'Hello {customer_name},\n\nWe created an account so you can track your order #{order_id} and raise support tickets with ease.\n\nPlease select the link below to configure your custom entry password securely within 24 hours:\n{payment_link}\n\nThank you,\nThe Pristine Core', 1),
('tpl-quote-sent', 'Quote Sent', 'Your Customized Editorial Sweep Dispatch Quote [#{order_id}]', 'Hello {customer_name},\n\nOur team has reviewed your order #{order_id} for {service_name}.\n\nYour customized total dispatch price has been locked at {final_price}.\n\nPreferred Date: {preferred_date} ({preferred_slot})\n\nPlease finalize this dispatch block prior to our booking threshold by referencing instructions: {payment_link}\n\nWarmest regards,\nThe Pristine Editorial Team', 1)
ON DUPLICATE KEY UPDATE id=id;

SET FOREIGN_KEY_CHECKS = 1;
`;
}

