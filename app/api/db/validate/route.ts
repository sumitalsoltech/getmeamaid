import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';

export const dynamic = 'force-dynamic';

const KNOWN_TABLES = [
  'app_users',
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
  'staff'
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
      { constraint_name: 'orders_user_id_fkey', table_name: 'orders', referenced_table: 'app_users' },
      { constraint_name: 'orders_service_id_fkey', table_name: 'orders', referenced_table: 'services' },
      { constraint_name: 'order_status_history_order_id_fkey', table_name: 'order_status_history', referenced_table: 'orders' },
      { constraint_name: 'tickets_user_id_fkey', table_name: 'tickets', referenced_table: 'app_users' },
      { constraint_name: 'tickets_order_id_fkey', table_name: 'tickets', referenced_table: 'orders' },
      { constraint_name: 'ticket_replies_ticket_id_fkey', table_name: 'ticket_replies', referenced_table: 'tickets' },
      { constraint_name: 'password_tokens_user_id_fkey', table_name: 'password_tokens', referenced_table: 'app_users' },
      { constraint_name: 'service_pricing_rules_service_id_fkey', table_name: 'service_pricing_rules', referenced_table: 'services' },
      { constraint_name: 'service_pricing_rules_pricing_rule_id_fkey', table_name: 'service_pricing_rules', referenced_table: 'pricing_rules' }
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
-- All table IDs use matched TEXT definitions to resolve key-constraint errors.
--
-- INSTRUCTIONS:
-- 1. Open HeidiSQL or your preferred local MySQL client.
-- 2. Connect to localhost:3306 and select the \`getmeamaid\` database.
-- 3. Open a "New Query" tab, paste this entire script, and click "Run" (F9).
-- 4. Reload your application database settings or sync page to verify health.

-- ==========================================
-- STEP 1: DROP TABLES (IN REVERSE DEPENDENCY ORDER)
-- ==========================================
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS service_pricing_rules;
DROP TABLE IF EXISTS ticket_replies;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS password_tokens;
DROP TABLE IF EXISTS app_users;
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
-- STEP 2: CREATE INDEPENDENT SCHEMA TABLES
-- ==========================================

-- 1. Create app_users table
CREATE TABLE app_users (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT,
    email VARCHAR(255) UNIQUE,
    phone TEXT,
    password_hash TEXT,
    account_source TEXT DEFAULT 'signup',
    email_verified_at DATETIME,
    is_admin BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 2. Create services table
CREATE TABLE services (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    image TEXT,
    base_price NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_manual_quote BOOLEAN DEFAULT false,
    included_items TEXT, -- JSON Array Text
    excluded_items TEXT, -- JSON Array Text
    is_featured BOOLEAN DEFAULT false,
    is_instant_pricing_enabled BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    full_description TEXT,
    faqs TEXT, -- JSON Array Text
    notes TEXT,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- Ensure columns exist if schema is already created
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_instant_pricing_enabled BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS full_description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS faqs TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Create addons table
CREATE TABLE addons (
    id VARCHAR(255) PRIMARY KEY,
    service_id TEXT, -- Empty matches all or reference. TEXT for code srv-xxx ids
    name TEXT NOT NULL,
    price NUMERIC(10,2) DEFAULT 0,
    pricing_type TEXT DEFAULT 'fixed',
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 4. Create pricing_rules table
CREATE TABLE pricing_rules (
    id VARCHAR(255) PRIMARY KEY,
    service_id TEXT, -- empty means global
    rule_type TEXT, -- residence_type, bedroom_count, bathroom_count, occupancy, etc
    rule_name TEXT,
    value TEXT,
    price_adjustment NUMERIC(10,2) DEFAULT 0,
    adjustment_type TEXT DEFAULT 'fixed',
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 5. Create coupons table
CREATE TABLE coupons (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    name TEXT,
    discount_type TEXT DEFAULT 'fixed',
    discount_value NUMERIC(10,2) DEFAULT 0,
    minimum_order_value NUMERIC(10,2) DEFAULT 0,
    maximum_discount NUMERIC(10,2) DEFAULT 0,
    applicable_services TEXT, -- JSON Array service IDs
    start_date TEXT,
    end_date TEXT,
    total_usage_limit INTEGER DEFAULT 0,
    per_customer_usage_limit INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 6. Create enquiries table
CREATE TABLE enquiries (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'New',
    created_at DATETIME DEFAULT now()
);

-- 7. Create email_templates table
CREATE TABLE email_templates (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT,
    subject TEXT,
    body TEXT
);

-- 8. Create email_logs table
CREATE TABLE email_logs (
    id VARCHAR(255) PRIMARY KEY,
    to_email TEXT,
    subject TEXT,
    body TEXT,
    sent_at DATETIME DEFAULT now()
);

-- 9. Create slots table
CREATE TABLE slots (
    id VARCHAR(255) PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- 10. Create blocked_dates table
CREATE TABLE blocked_dates (
    id VARCHAR(255) PRIMARY KEY,
    blocked_date TEXT NOT NULL
);

-- 11. Create Bookings table 
CREATE TABLE bookings (
  id VARCHAR(255) PRIMARY KEY,
  postal_code TEXT,
  home_type TEXT,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  square_footage INTEGER,
  restoration_level TEXT,
  frequency TEXT,
  addons TEXT, -- JSON Array string
  selected_date TEXT,
  selected_time_slot TEXT,
  entry_method TEXT,
  custom_key_notes TEXT,
  customer_special_notes TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  card_name TEXT,
  pricing TEXT, -- JSON Object string
  status TEXT DEFAULT 'Confirmed',
  created_at DATETIME DEFAULT now()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Confirmed';

-- 12. Create Gift Cards table
CREATE TABLE gift_cards (
  id VARCHAR(255) PRIMARY KEY,
  amount NUMERIC NOT NULL,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  created_at DATETIME DEFAULT now()
);

-- 13. Create CMS Content table
CREATE TABLE cms_content (
  id VARCHAR(255) PRIMARY KEY,
  content JSONB NOT NULL,
  created_at DATETIME DEFAULT now(),
  updated_at DATETIME DEFAULT now()
);

-- ==========================================
-- STEP 3: CREATE DELEGEE SCHEMA TABLES (WITH CONSTRAINTS)
-- ==========================================

-- 14. Create orders table (uses app_users.id and services.id)
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    order_number VARCHAR(255) UNIQUE NOT NULL,
    customer_name TEXT,
    email TEXT,
    phone TEXT,
    service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
    property_size TEXT, -- JSON Object
    selected_addons TEXT, -- JSON Array
    preferred_date TEXT,
    preferred_time_slot TEXT,
    notes TEXT,
    access_method TEXT,
    custom_key_notes TEXT,
    original_estimated_price NUMERIC(10,2) DEFAULT 0,
    coupon_code TEXT,
    discount_amount NUMERIC(10,2) DEFAULT 0,
    final_estimated_price NUMERIC(10,2) DEFAULT 0,
    final_confirmed_price NUMERIC(10,2),
    payment_status TEXT, -- 'Unpaid', 'Paid', etc.
    order_status TEXT, -- 'New', 'Completed', etc.
    settlement_status TEXT,
    admin_internal_notes TEXT,
    customer_visible_notes TEXT,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 15. Create order_status_history table
CREATE TABLE order_status_history (
    id VARCHAR(255) PRIMARY KEY,
    order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
    old_status TEXT,
    new_status TEXT,
    changed_by TEXT,
    note TEXT,
    created_at DATETIME DEFAULT now()
);

-- 16. Create tickets table
CREATE TABLE tickets (
    id VARCHAR(255) PRIMARY KEY,
    ticket_number VARCHAR(255) UNIQUE NOT NULL,
    user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    category TEXT,
    subject TEXT,
    message TEXT,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'Open',
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 17. Create ticket_replies table
CREATE TABLE ticket_replies (
    id VARCHAR(255) PRIMARY KEY,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment TEXT,
    created_at DATETIME DEFAULT now()
);

-- 18. Create password_tokens table
CREATE TABLE password_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    type TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    created_at DATETIME DEFAULT now()
);

-- 19. Create service_pricing_rules table (mapping table)
-- Resolves the TEXT/UUID incompatibilities perfectly by aligning matching primary key TEXT definitions
CREATE TABLE service_pricing_rules (
    id VARCHAR(255) PRIMARY KEY,
    service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
    pricing_rule_id TEXT REFERENCES pricing_rules(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT false,
    default_selected BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 20. Create roles table
CREATE TABLE roles (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    permissions TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- 21. Create staff table
CREATE TABLE staff (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(255),
    role_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT now(),
    updated_at DATETIME DEFAULT now()
);

-- ==========================================
-- STEP 4: SEED INITIAL DATA RECORDS
-- ==========================================

-- Seed app_users
INSERT INTO app_users (id, name, email, phone, password_hash, account_source, email_verified_at, is_admin) VALUES
('usr-admin', 'Pristine Atelier Admin', 'curator@pristineeditorial.com', '+1 (416) 555-0100', 'admin', 'signup', NOW(), true),
('usr-user1', 'Jean-Paul Leclerc', 'j.leclerc@gmail.com', '+1 (416) 555-0149', 'user123', 'signup', NOW(), false)
ON CONFLICT (id) DO NOTHING;

-- Seed services
INSERT INTO services (id, title, slug, description, image, base_price, is_active, is_manual_quote, included_items, excluded_items) VALUES
('srv-standard', 'Standard Maintenance Curation', 'standard-maintenance', 'A meticulous maintenance sweeps encompassing dusting, bespoke organizing, systematic vacuuming, sanitizing high-touch surfaces, and precision bathroom polishing.', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800', 1000.00, true, false, '["Sweeping, mopping, and vacuuming all floor layers","Fine-bristle hand dusting of high-fidelity frames, shelving, and surfaces","Full kitchen exterior sanitization & deep range-hood degreasing","Deep bath/shower chrome polishing and glass micro-wipe","Linen changes & bespoke textile precision alignments"]', '["Deep lime or mold grout remediation","Vents interior shaft vacuum extraction","Inside oven or inside refrigerator (available as Add-on only)","Empty drawer/closet vacuum clearances (unless Move-In requested)"]'),
('srv-deep', 'Deep Restoration Suite', 'deep-cleaning', 'An exhaustive physical overhaul targeting cumulative dust, deep lime and mold remediation, vents detailing, grout deep scrubbing, window-interior polishing, and inside-appliance curations based on diagnostic requirements.', 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=800', 2500.00, true, false, '["All Standard Maintenance inclusion items","Inside of oven and oven-hood structural grease extraction","Inside refrigerator detailed shelving scrub & fresh sterilization","100% steam localized bath grout sanitization","Detailed hand-wiping of doors, trims, frames, and wide baseboards","Interior dry-vacuuming of heating vents and filter plates"]', '["Chandelier deep glass crystal removal and dismantling","Heavy debris, commercial trash, or post-construction paint stripping"]'),
('srv-move', 'Move In / Out Choreography', 'move-in-out', 'Designed for buyers, renters, and listing agents. We curate complete vertical extraction, empty drawer disinfection, inside all shelves, drawers, cabinets, closet resets.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800', 3500.00, true, false, '["Complete empty home bottom-to-ceiling vertical sweep","Vacuuming, wiping, and sterilizing all inside closets, drawers, and cabinetry","Complete structural reset of luxury appliances (Oven, Fridge, Dishwasher, Microwave)","Deep tracking detail of window sliders & glass panes","Precision spot-cleaning of walls, staircases rails, and baseboards"]', '["Exterior window washers requiring scaffolding or ladders","Post-flood mold restorations"]')
ON CONFLICT (id) DO NOTHING;

-- Seed slots
INSERT INTO slots (id, name, is_active) VALUES
('sl-morning', '09:00 AM - 12:00 PM (Morning Slot)', true),
('sl-afternoon', '12:00 PM - 03:00 PM (Afternoon Slot)', true),
('sl-evening', '03:00 PM - 06:00 PM (Evening Slot)', true),
('sl-twilight', '06:00 PM - 09:00 PM (Twilight Care)', true)
ON CONFLICT (id) DO NOTHING;

-- Seed addons
INSERT INTO addons (id, service_id, name, price, pricing_type, is_active) VALUES
('add-fridge', '', 'Inside Refrigerator Detailing', 300.00, 'fixed', true),
('add-oven', '', 'Inside Oven Degrease', 350.00, 'fixed', true),
('add-cabinets', '', 'Inside Drawer & Cabinets', 500.00, 'fixed', true),
('add-windows', '', 'All Interior Window Panes', 400.00, 'fixed', true),
('add-pethair', '', 'Deep Pet Hair Allergen Extract', 450.00, 'fixed', true)
ON CONFLICT (id) DO NOTHING;

-- Seed pricing_rules
INSERT INTO pricing_rules (id, service_id, rule_type, rule_name, value, price_adjustment, adjustment_type, is_active) VALUES
('pr-res-condo', '', 'residence_type', 'Apartment / Condominium', 'Apartment / Condo', 0.00, 'fixed', true),
('pr-res-house', '', 'residence_type', 'House / Estate Premium', 'House / Estate', 1000.00, 'fixed', true),
('pr-res-town', '', 'residence_type', 'Townhouse / Duplex', 'Townhouse / Duplex', 500.00, 'fixed', true),
('pr-res-office', '', 'residence_type', 'Office / Commercial', 'Office / Commercial', 1500.00, 'fixed', true),
('pr-bed', '', 'bedroom_count', 'Per Bedroom Modification', 'bedroom', 250.00, 'fixed', true),
('pr-bath', '', 'bathroom_count', 'Per Bathroom Modification', 'bathroom', 350.00, 'fixed', true),
('pr-urg-same', '', 'urgency_charge', 'Same-Day Dispatch Charge', 'same_day', 20.00, 'percentage', true),
('pr-urg-next', '', 'urgency_charge', 'Next-Day Priority Charge', 'next_day', 10.00, 'percentage', true),
('pr-loc-normal', '', 'location_charge', 'Normal Service Zone', 'normal', 0.00, 'fixed', true),
('pr-loc-out', '', 'location_charge', 'Outside Postal Zone', 'outside', 400.00, 'fixed', true),
('pr-loc-far', '', 'location_charge', 'Far Boundary Hub', 'far', 1.00, 'percentage', true),
('pr-min-order', '', 'min_order_value', 'Minimum Atelier Guarantee', '999', 999.00, 'fixed', true)
ON CONFLICT (id) DO NOTHING;

-- Seed coupons
INSERT INTO coupons (id, code, name, discount_type, discount_value, minimum_order_value, maximum_discount, applicable_services, start_date, end_date, total_usage_limit, per_customer_usage_limit, used_count, is_active) VALUES
('cp-welcome100', 'WELCOME100', 'Atelier Inauguration Discount', 'fixed', 100.00, 999.00, 100.00, '[]', '2026-01-01', '2030-12-31', 1000, 1, 5, true),
('cp-spring15', 'SPRING15', 'Spring Renewal Suite Discount', 'percentage', 15.00, 2000.00, 1000.00, '[]', '2026-03-01', '2026-06-31', 500, 1, 2, true)
ON CONFLICT (id) DO NOTHING;

-- Seed main CMS content
INSERT INTO cms_content (id, content) VALUES
('main', '{"hero":{"heading":"Professional Cleaning Services You Can Depend On","subheading":"A systematic, clinical approach to restoration. Designed for modern living, budgeted dynamically, and calibrated in exquisite details for Toronto, Vancouver, and Calgary homes.","ctaText":"Book Curation Now","ctaLink":"/book","bannerImage":"https://images.unsplash.com/photo-1603796846097-bee99e4a60c9?auto=format&fit=crop&q=80&w=1200","status":"published"},"contact":{"phone":"+1 (800) 555-MAID (6243)","email":"concierge@getmeamaid.ca","area":"Metropolitan Toronto, Vancouver waterfront, Calgary Foothills","hours":"Monday - Sunday: 08:00 AM - 08:00 PM EST","mapLink":"https://maps.google.com","socials":{"twitter":"@getmeamaid","facebook":"getmeamaid.premium","instagram":"getmeamaid.curations"}},"footer":{"copyright":"© 2026 getmeamaid Labs. Absolute Luxury Curation.","desc":"Experience bespoke premium cleaning curation. Serving Toronto, Vancouver, and Calgary with an uncompromising standard of high-fidelity restoration."},"howItWorks":[{"id":"step-1","title":"Select Fine Details","description":"Toggle high-fidelity curation additions corresponding to spaces recursively.","display_order":1,"is_active":true},{"id":"step-2","title":"Verify Automatic Valuation","description":"Our instant math matches exact pricing breakdown transparency.","display_order":2,"is_active":true},{"id":"step-3","title":"Behold Immaculate Restoration","description":"Elite vetted specialists perform clinical-grade cleanings.","display_order":3,"is_active":true}],"testimonials":[{"id":"test-1","customer_name":"Charlotte Mercer","review_text":"Their Deep Restoration Curation is absolute magic. The baseboards, cabinet alignments, and lavender-sage scent selections made our high-rise condo look pristine as a surgical laboratory. Highly recommended.","rating":5,"display_order":1,"is_active":true},{"id":"test-2","customer_name":"Marcus Goldman","review_text":"Consistent, uncompromising quality. Standard maintenance program saves our townhouse incredible logistics load weekly. Vetted staff members present extraordinary standards.","rating":5,"display_order":2,"is_active":true}],"faqs":[{"id":"faq-1","question":"What is your high-fidelity restoration level difference?","answer":"Our signature deep restoration focuses on critical air purification, deep sanitizing of cabinets, clinical vent detailed wipes, and hand-polishing metals, surpassing traditional cleanings by several orders of volume.","display_order":1,"is_active":true},{"id":"faq-2","question":"How does the manual quote condition work?","answer":"For estates exceeding standard bedroom sizes or far zones, our backend calculator assigns high-touch manual indicators. We email final quotes within minutes of submit logs.","display_order":2,"is_active":true}],"terms":{"title":"Terms of Service Agreement","content":"All home reservations are subject to standard 24 hours cancellation policies. Security authorization forms clear payments upon dispatch schedule completions."},"privacy":{"title":"Privacy and Security Assurances","content":"Your home security lockbox parameters and physical property details are encrypted locally under TLS 1.3 standards. No telemetry details are ever shared with third-party servers."},"servicesContent":[{"id":"srv-standard","title":"Standard Maintenance Curation","rate":140,"duration":"2.5 - 4 Hours","desc":"A meticulous maintenance sweeps encompassing dusting, bespoke organizing, systematic vacuuming, sanitizing high-touch surfaces, and precision bathroom polishing.","highlights":["Scent choices: Fresh Herb or Citrus","Textile precision alignment","Double-polished metal faucets"],"is_active":true},{"id":"srv-deep","title":"Deep Restoration Suite","rate":210,"duration":"4 - 7 Hours","desc":"An exhaustive physical overhaul targeting cumulative dust, deep lime and mold remediation, vents detailing, grout deep scrubbing, window-interior polishing, and inside-appliance curations.","highlights":["Grout 100% steam cleaning","Vents detailing wipes","Localized extraction cleanings"],"is_active":true},{"id":"srv-move","title":"Move In / Out Choreography","rate":340,"duration":"5 - 9 Hours","desc":"Designed for buyers, renters, and listing agents. We curate complete vertical extraction, empty drawer disinfection, inside all shelves, drawers, cabinets, closet resets.","highlights":["Oven & Refrigerator detailing","Meticulous sanitization","Air purification sweep"],"is_active":true}],"seo":{"home":{"pageTitle":"Home","metaTitle":"getmeamaid | Bespoke Premium Cleaning Curations","metaDescription":"Elite home restoration and maintenance services throughout Toronto, Vancouver, and Calgary.","slug":"/"},"book":{"pageTitle":"Book Appointment","metaTitle":"Reserve Luxury Clean - getmeamaid","metaDescription":"Configure details and book instant home curators.","slug":"/book"}}}')
ON CONFLICT (id) DO NOTHING;

-- Seed email_templates
INSERT INTO email_templates (id, name, subject, body) VALUES
('tpl-order-confirm', 'Order Confirmation', 'Your Pristine Atelier Dispatch Receipt [#{order_id}]', 'Hello {customer_name},\n\nWe have received your luxury maintenance request #{order_id} for a meticulously curated {service_name}.\n\nPreferred Date: {preferred_date}\nPreferred Time: {preferred_slot}\nOriginal Estimate Code: {final_price}\n\nOur curation team is currently reviewing your schedule request. We will finalize your slot allocations and deliver dispatch quotes promptly. Thank you for selecting The Pristine Editorial.\n\nWarm regards,\nThe Pristine Atelier Core'),
('tpl-set-password', 'Set Password (Guest Auto)', 'Complete Your Pristine Atelier Account Setup', 'Hello {customer_name},\n\nWe created an account so you can track your order #{order_id} and raise support tickets with ease.\n\nPlease select the link below to configure your custom entry password securely within 24 hours:\n{payment_link}\n\nThank you,\nThe Pristine Core'),
('tpl-quote-sent', 'Quote Sent', 'Your Customized Editorial Sweep Dispatch Quote [#{order_id}]', 'Hello {customer_name},\n\nOur team has reviewed your order #{order_id} for {service_name}.\n\nYour customized total dispatch price has been locked at {final_price}.\n\nPreferred Date: {preferred_date} ({preferred_slot})\n\nPlease finalize this dispatch block prior to our booking threshold by referencing instructions: {payment_link}\n\nWarmest regards,\nThe Pristine Editorial Team')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STEP 5: DISABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE IF EXISTS app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS addons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pricing_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ticket_replies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS password_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enquiries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blocked_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gift_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cms_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_pricing_rules DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- STEP 6: INTRODUCE INTEGRITY CHECK FUNCTIONS
-- ==========================================
-- Helper RPC to securely inspect tables and foreign key schemas via REST API
CREATE OR REPLACE FUNCTION check_db_integrity()
RETURNS JSONB
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT json_build_object(
        'tables', (
            SELECT json_agg(t.table_name)
            FROM information_schema.tables t
            WHERE t.table_schema = 'public'
        ),
        'foreign_keys', (
            SELECT json_agg(json_build_object(
                'constraint_name', tc.constraint_name,
                'table_name', tc.table_name,
                'referenced_table', ccu.table_name
            ))
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        )
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- RE RESET COMPLETE
-- ==========================================
`;
}
