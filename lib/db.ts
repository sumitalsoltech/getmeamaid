import fs from 'fs';
import path from 'path';
import { getMysql, getPool } from './mysql';

// File-based persistence path
const DB_FILE_PATH = path.join('/tmp', 'pristine_db.json');
const ALTERNATE_DB_FILE_PATH = path.join(process.cwd(), 'pristine_db.json');

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  password_hash: string;
  account_source: 'signup' | 'guest_order';
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
  role_id?: number | null;
  is_active?: boolean;
}


export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  base_price: number;
  is_active: boolean;
  is_manual_quote: boolean;
  included_items: string[];
  excluded_items: string[];
  is_featured?: boolean;
  display_order?: number;
  full_description?: string;
  faqs?: string[] | string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AddOn {
  id: string;
  service_id: string; // empty means applies to all services
  name: string;
  price: number;
  pricing_type: 'fixed' | 'quantity';
  is_active: boolean;
}

export interface PricingRule {
  id: string;
  service_id: string; // empty means applies to all services
  rule_type: 'residence_type' | 'bedroom_count' | 'bathroom_count' | 'urgency_charge' | 'location_charge' | 'min_order_value' | 'manual_quote_condition';
  rule_name: string;
  value: string; // e.g. "House / Estate" or "2" bedrooms, or "same_day"
  price_adjustment: number;
  adjustment_type: 'fixed' | 'percentage';
  is_active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order_value: number;
  maximum_discount: number;
  applicable_services: string[]; // empty means all services
  start_date: string;
  end_date: string;
  total_usage_limit: number;
  per_customer_usage_limit: number;
  used_count: number;
  is_active: boolean;
}

export interface Order {
  id: string;
  user_id: number | null;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  service_id: string;
  property_size: {
    homeType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
  };
  selected_addons: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  preferred_date: string;
  preferred_time_slot: string;
  notes: string;
  accessMethod?: string;
  customKeyNotes?: string;
  original_estimated_price: number;
  coupon_code: string | null;
  discount_amount: number;
  final_estimated_price: number;
  final_confirmed_price: number | null;
  payment_status: 'Unpaid' | 'Quote Sent' | 'Payment Link Sent' | 'Payment Pending' | 'Paid' | 'Refund Required';
  order_status: 'New' | 'Under Review' | 'Quote Sent' | 'Scheduled' | 'In Progress' | 'Completed' | 'Settled' | 'Closed' | 'Cancelled' | 'Refund Required';
  settlement_status: 'Payment Pending' | 'Payment Link Sent' | 'Paid' | 'Scheduled' | 'Service Completed' | 'Settled' | 'Closed' | 'Cancelled' | 'Refund Required';
  admin_internal_notes: string;
  customer_visible_notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string;
  new_status: string;
  changed_by: string; // 'admin' | 'user' | 'system'
  note: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: string;
  user_id: number | null;
  order_id?: string;
  category: 'Payment issue' | 'Scheduling issue' | 'Service issue' | 'Coupon issue' | 'Cancellation request' | 'Refund request' | 'Other';
  subject: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Review' | 'Waiting for Customer' | 'Resolved' | 'Closed';
  created_at: string;
  updated_at: string;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  sender_type: 'user' | 'admin';
  sender_id: string;
  message: string;
  attachment?: string;
  created_at: string;
}

export interface PasswordToken {
  id: string;
  user_id: number | null;
  token: string;
  type: 'set_password' | 'reset_password';
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'New' | 'Contacted';
  created_at: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML or plan text with placeholders
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sent_at: string;
}

export interface Slot {
  id: string;
  name: string; // e.g., "Morning: 9 AM - 12 PM"
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
  is_active: boolean;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  phone: string;
  role_id: number;
  is_active: boolean;
}

export interface DbSchema {
  users: User[];
  services: Service[];
  addons: AddOn[];
  pricingRules: PricingRule[];
  coupons: Coupon[];
  orders: Order[];
  orderStatusHistory: OrderStatusHistory[];
  tickets: Ticket[];
  ticketReplies: TicketReply[];
  passwordTokens: PasswordToken[];
  enquiries: ContactEnquiry[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailLog[];
  slots: Slot[];
  blockedDates: string[]; // Array of "YYYY-MM-DD"
  servicePricingRules?: any[];
  roles: Role[];
  staff: Staff[];
}

// Global variable to maintain data across reloads in Next.js development
const globalForDb = global as unknown as { pristineDb: DbSchema | null };

const initialDb: DbSchema = {
  users: [
    {
      id: 1,
      name: "Pristine Atelier Admin",
      email: "curator@pristineeditorial.com",
      phone: "+1 (416) 555-0100",
      password_hash: "admin", // Simple plaintext login for review dashboard, or we can secure it.
      account_source: "signup",
      email_verified_at: "2026-05-26T19:39:20Z",
      created_at: "2026-05-26T19:39:20Z",
      updated_at: "2026-05-26T19:39:20Z",
      is_admin: true,
      role_id: 1
    },
    {
      id: 201,
      name: "Jean-Paul Leclerc",
      email: "j.leclerc@gmail.com",
      phone: "+1 (416) 555-0149",
      password_hash: "user123",
      account_source: "signup",
      email_verified_at: "2026-05-26T19:39:20Z",
      created_at: "2026-05-26T19:39:20Z",
      updated_at: "2026-05-26T19:39:20Z",
      is_admin: false,
      role_id: null
    }
  ],
  services: [
    {
      id: "srv-standard",
      title: "Standard Maintenance Curation",
      slug: "standard-maintenance",
      description: "A meticulous maintenance sweeps encompassing dusting, bespoke organizing, systematic vacuuming, sanitizing high-touch surfaces, and precision bathroom polishing.",
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
      base_price: 1000, // ₹ or CAD depending on locale. We can store it as base rates.
      is_active: true,
      is_manual_quote: false,
      included_items: [
        "Sweeping, mopping, and vacuuming all floor layers",
        "Fine-bristle hand dusting of high-fidelity frames, shelving, and surfaces",
        "Full kitchen exterior sanitization & deep range-hood degreasing",
        "Deep bath/shower chrome polishing and glass micro-wipe",
        "Linen changes & bespoke textile precision alignments"
      ],
      excluded_items: [
        "Deep lime or mold grout remediation",
        "Vents interior shaft vacuum extraction",
        "Inside oven or inside refrigerator (available as Add-on only)",
        "Empty drawer/closet vacuum clearances (unless Move-In requested)"
      ],
      created_at: "2026-05-26T19:39:20Z",
      updated_at: "2026-05-26T19:39:20Z"
    },
    {
      id: "srv-deep",
      title: "Deep Restoration Suite",
      slug: "deep-cleaning",
      description: "An exhaustive physical overhaul targeting cumulative dust, deep lime and mold remediation, vents detailing, grout deep scrubbing, window-interior polishing, and inside-appliance curations based on diagnostic requirements.",
      image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=800",
      base_price: 2500,
      is_active: true,
      is_manual_quote: false,
      included_items: [
        "All Standard Maintenance inclusion items",
        "Inside of oven and oven-hood structural grease extraction",
        "Inside refrigerator detailed shelving scrub & fresh sterilization",
        "100% steam localized bath grout sanitization",
        "Detailed hand-wiping of doors, trims, frames, and wide baseboards",
        "Interior dry-vacuuming of heating vents and filter plates"
      ],
      excluded_items: [
        "Chandelier deep glass crystal removal and dismantling",
        "Heavy debris, commercial trash, or post-construction paint stripping"
      ],
      created_at: "2026-05-26T19:39:20Z",
      updated_at: "2026-05-26T19:39:20Z"
    },
    {
      id: "srv-move",
      title: "Move In / Out Choreography",
      slug: "move-in-out",
      description: "Designed for buyers, renters, and listing agents. We curate complete vertical extraction, inside all shelves, drawers, cabinets, closets, detailing of vents, appliance resets, and standard wall spot cleansing to verify a spotless standard.",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
      base_price: 3500,
      is_active: true,
      is_manual_quote: false,
      included_items: [
        "Complete empty home bottom-to-ceiling vertical sweep",
        "Vacuuming, wiping, and sterilizing all inside closets, drawers, and cabinetry",
        "Complete structural reset of luxury appliances (Oven, Fridge, Dishwasher, Microwave)",
        "Deep tracking detail of window sliders & glass panes",
        "Precision spot-cleaning of walls, staircases rails, and baseboards"
      ],
      excluded_items: [
        "Exterior window washers requiring scaffolding or ladders",
        "Post-flood mold restorations"
      ],
      created_at: "2026-05-26T19:39:20Z",
      updated_at: "2026-05-26T19:39:20Z"
    }
  ],
  addons: [
    { id: "add-fridge", service_id: "", name: "Inside Refrigerator Detailing", price: 300, pricing_type: "fixed", is_active: true },
    { id: "add-oven", service_id: "", name: "Inside Oven Degrease", price: 350, pricing_type: "fixed", is_active: true },
    { id: "add-cabinets", service_id: "", name: "Inside Drawer & Cabinets", price: 500, pricing_type: "fixed", is_active: true },
    { id: "add-windows", service_id: "", name: "All Interior Window Panes", price: 400, pricing_type: "fixed", is_active: true },
    { id: "add-pethair", service_id: "", name: "Deep Pet Hair Allergen Extract", price: 450, pricing_type: "fixed", is_active: true }
  ],
  pricingRules: [
    { id: "pr-res-condo", service_id: "", rule_type: "residence_type", rule_name: "Apartment / Condominium", value: "Apartment / Condo", price_adjustment: 0, adjustment_type: "fixed", is_active: true },
    { id: "pr-res-house", service_id: "", rule_type: "residence_type", rule_name: "House / Estate Premium", value: "House / Estate", price_adjustment: 1000, adjustment_type: "fixed", is_active: true },
    { id: "pr-res-town", service_id: "", rule_type: "residence_type", rule_name: "Townhouse / Duplex", value: "Townhouse / Duplex", price_adjustment: 500, adjustment_type: "fixed", is_active: true },
    { id: "pr-res-office", service_id: "", rule_type: "residence_type", rule_name: "Office / Commercial", value: "Office / Commercial", price_adjustment: 1500, adjustment_type: "fixed", is_active: true },
    
    { id: "pr-bed", service_id: "", rule_type: "bedroom_count", rule_name: "Per Bedroom Modification", value: "bedroom", price_adjustment: 250, adjustment_type: "fixed", is_active: true },
    { id: "pr-bath", service_id: "", rule_type: "bathroom_count", rule_name: "Per Bathroom Modification", value: "bathroom", price_adjustment: 350, adjustment_type: "fixed", is_active: true },
    
    { id: "pr-urg-same", service_id: "", rule_type: "urgency_charge", rule_name: "Same-Day Dispatch Charge", value: "same_day", price_adjustment: 20, adjustment_type: "percentage", is_active: true },
    { id: "pr-urg-next", service_id: "", rule_type: "urgency_charge", rule_name: "Next-Day Priority Charge", value: "next_day", price_adjustment: 10, adjustment_type: "percentage", is_active: true },
    
    { id: "pr-loc-normal", service_id: "", rule_type: "location_charge", rule_name: "Normal Service Zone", value: "normal", price_adjustment: 0, adjustment_type: "fixed", is_active: true },
    { id: "pr-loc-out", service_id: "", rule_type: "location_charge", rule_name: "Outside Postal Zone", value: "outside", price_adjustment: 400, adjustment_type: "fixed", is_active: true },
    { id: "pr-loc-far", service_id: "", rule_type: "location_charge", rule_name: "Far Boundary Hub", value: "far", price_adjustment: 1, adjustment_type: "percentage", is_active: true }, // manual quote
    
    { id: "pr-min-order", service_id: "", rule_type: "min_order_value", rule_name: "Minimum Atelier Guarantee", value: "999", price_adjustment: 999, adjustment_type: "fixed", is_active: true }
  ],
  coupons: [
    {
      id: "cp-welcome100",
      code: "WELCOME100",
      name: "Atelier Inauguration Discount",
      discount_type: "fixed",
      discount_value: 100,
      minimum_order_value: 999,
      maximum_discount: 100,
      applicable_services: [],
      start_date: "2026-01-01",
      end_date: "2030-12-31",
      total_usage_limit: 1000,
      per_customer_usage_limit: 1,
      used_count: 5,
      is_active: true
    },
    {
      id: "cp-spring15",
      code: "SPRING15",
      name: "Spring Renewal Suite Discount",
      discount_type: "percentage",
      discount_value: 15,
      minimum_order_value: 2000,
      maximum_discount: 1000,
      applicable_services: [],
      start_date: "2026-03-01",
      end_date: "2026-06-31",
      total_usage_limit: 500,
      per_customer_usage_limit: 1,
      used_count: 2,
      is_active: true
    }
  ],
  orders: [
    {
      id: "ord-829104",
      user_id: 201,
      order_number: "PST-829104",
      customer_name: "Jean-Paul Leclerc",
      email: "j.leclerc@gmail.com",
      phone: "+1 (416) 555-0149",
      service_id: "srv-deep",
      property_size: {
        homeType: "Apartment / Condo",
        bedrooms: 2,
        bathrooms: 2,
        squareFootage: 950
      },
      selected_addons: [
        { id: "add-fridge", name: "Inside Refrigerator Detailing", price: 300, quantity: 1 },
        { id: "add-oven", name: "Inside Oven Degrease", price: 350, quantity: 1 }
      ],
      preferred_date: "June 10, 2026",
      preferred_time_slot: "09:00 AM - 12:00 PM (Morning Slot)",
      notes: "Marble tiles in vestibule have slight fissures; sweep hand-curated only. No citric solvent.",
      accessMethod: "Provide lockbox key coordinates",
      customKeyNotes: "Lockbox is left of the water mains feed pipe, security code is 4920.",
      original_estimated_price: 3650,
      coupon_code: "WELCOME100",
      discount_amount: 100,
      final_estimated_price: 3550,
      final_confirmed_price: 3550,
      payment_status: "Paid",
      order_status: "Scheduled",
      settlement_status: "Scheduled",
      admin_internal_notes: "Elite client verified. Dispatched primary team lead.",
      customer_visible_notes: "Your luxury cleaner chef is scheduled. Expect entry exactly at 9:00 AM.",
      created_at: "2026-05-26T18:00:20Z",
      updated_at: "2026-05-26T18:25:00Z"
    }
  ],
  orderStatusHistory: [
    {
      id: "h-1",
      order_id: "ord-829104",
      old_status: "New",
      new_status: "Under Review",
      changed_by: "system",
      note: "Order initialized dynamically. Sent to queue review.",
      created_at: "2026-05-26T18:00:20Z"
    },
    {
      id: "h-2",
      order_id: "ord-829104",
      old_status: "Under Review",
      new_status: "Scheduled",
      changed_by: "admin",
      note: "Confirmed dates after manual phone verification. Settled queue booking.",
      created_at: "2026-05-26T18:25:00Z"
    }
  ],
  tickets: [
    {
      id: "tkt-001",
      ticket_number: "TKT-590021",
      user_id: 201,
      order_id: "ord-829104",
      category: "Scheduling issue",
      subject: "Coordinating concierges lift booking window",
      message: "Hello curator, our condo concierge requires a dedicated lift booking voucher to haul clean extraction steam plates. Is this handled by your chef or should I notify our landlord office?",
      priority: "Medium",
      status: "In Review",
      created_at: "2026-05-26T18:30:00Z",
      updated_at: "2026-05-26T18:45:00Z"
    }
  ],
  ticketReplies: [
    {
      id: "rep-1",
      ticket_id: "tkt-001",
      sender_type: "admin",
      sender_id: "usr-admin",
      message: "Dear Jean-Paul, our crew lifts all sanitization items as lightweight hand packs. No major freight elevator reservations are necessary! Let us know if you need certificates details.",
      created_at: "2026-05-26T18:45:00Z"
    }
  ],
  passwordTokens: [],
  enquiries: [
    {
      id: "enq-1",
      name: "Sophia Montenegro",
      email: "sophia@montenegrosigns.ca",
      phone: "+1 (416) 998-2910",
      message: "Enquiring about regular weekly office sanitization packages for our bespoke architecture loft in central Queen West.",
      status: "New",
      created_at: "2026-05-26T14:20:00Z"
    }
  ],
  emailTemplates: [
    {
      id: "tpl-order-confirm",
      name: "Order Confirmation",
      subject: "Your Pristine Atelier Dispatch Receipt [#{order_id}]",
      body: "Hello {customer_name},\n\nWe have received your luxury maintenance request #{order_id} for a meticulously curated {service_name}.\n\nPreferred Date: {preferred_date}\nPreferred Time: {preferred_slot}\nOriginal Estimate Code: {final_price}\n\nOur curation team is currently reviewing your schedule request. We will finalize your slot allocations and deliver dispatch quotes promptly. Thank you for selecting The Pristine Editorial.\n\nWarm regards,\nThe Pristine Atelier Core"
    },
    {
      id: "tpl-set-password",
      name: "Set Password (Guest Auto)",
      subject: "Complete Your Pristine Atelier Account Setup",
      body: "Hello {customer_name},\n\nWe created an account so you can track your order #{order_id} and raise support tickets with ease.\n\nPlease select the link below to configure your custom entry password securely within 24 hours:\n{payment_link}\n\nThank you,\nThe Pristine Core"
    },
    {
      id: "tpl-quote-sent",
      name: "Quote Sent",
      subject: "Your Customized Editorial Sweep Dispatch Quote [#{order_id}]",
      body: "Hello {customer_name},\n\nOur team has reviewed your order #{order_id} for {service_name}.\n\nYour customized total dispatch price has been locked at {final_price}.\n\nPreferred Date: {preferred_date} ({preferred_slot})\n\nPlease finalize this dispatch block prior to our booking threshold by referencing instructions: {payment_link}\n\nWarmest regards,\nThe Pristine Editorial Team"
    },
    {
      id: "tpl-payment-sent",
      name: "Payment Link Sent",
      subject: "Pending Payments Verification - Pristine Atelier #{order_id}",
      body: "Dear {customer_name},\n\nWe have generated a manual invoice payment guide for Order #{order_id}.\n\nLocked Amount: {final_price}\n\nPlease proceed with transfer/transfer coordinates according to our guidelines: {payment_link}\n\nOur team will manually audit payment confirmations within 1 business cycle."
    },
    {
      id: "tpl-payment-confirm",
      name: "Payment Confirmed",
      subject: "Payments Verification Certified - Order #{order_id} Paid",
      body: "Dear {customer_name},\n\nThis certifies that payments for Order #{order_id} have been audited successfully and marked as PAID.\n\nThank you for choosing luxury, bespoke cleanings."
    },
    {
      id: "tpl-order-schedule",
      name: "Order Scheduled",
      subject: "Atelier Schedule Finalized - Dispatch #{order_id}",
      body: "Hello {customer_name},\n\nGood news! Your suite curation is finalized for {preferred_date} ({preferred_slot}). We have confirmed entry coordinates. Our verified crew chief will contact you upon dispatch. Thank you!"
    },
    {
      id: "tpl-order-complete",
      name: "Order Completed",
      subject: "Atelier Restoration Sweep Certified - #{order_id}",
      body: "Dear {customer_name},\n\nYour luxury restoration sweep #{order_id} is completed. Our team has polished every surface. Please rate your experience in your dashboard or raise ticket if any detail requires supplementary touch."
    },
    {
      id: "tpl-settlement-confirm",
      name: "Settlement Completed",
      subject: "Pristine Dispatch Reference #{order_id} Settled",
      body: "Hello {customer_name},\n\nThis confirms that order #{order_id} is now settled, completed, and closed. We thank you for choosing Pristine. Let us know of your next maintenance curation block."
    },
    {
      id: "tpl-ticket-created",
      name: "Ticket Created",
      subject: "[#{ticket_id}] Ticket Received - Support Module",
      body: "Hello {customer_name},\n\nWe have received your ticket request regarding priority {status}. Our curators are looking into this details and will message you via dashboard inbox shortly."
    },
    {
      id: "tpl-ticket-replied",
      name: "Ticket Replied",
      subject: "[#{ticket_id}] Support Curator Reply Alert",
      body: "Hello {customer_name},\n\nAn administrator has posted an update to your ticket #{ticket_id}. Read the reply and update comments inside your customer dashboard support logs."
    },
    {
      id: "tpl-ticket-closed",
      name: "Ticket Closed",
      subject: "[#{ticket_id}] Support Ticket Resolved & Closed",
      body: "Hello {customer_name},\n\nThis is to notify you that support ticket #{ticket_id} is now closed. Thank you."
    },
    {
      id: "tpl-password-reset",
      name: "Password Reset",
      subject: "Pristine Atelier Reset Password Request",
      body: "Hello {customer_name},\n\nYou requested a password reset. Configure your new password entry code inside 1 hour: {payment_link}"
    }
  ],
  emailLogs: [],
  slots: [
    { id: "sl-morning", name: "09:00 AM - 12:00 PM (Morning Slot)", is_active: true },
    { id: "sl-afternoon", name: "12:00 PM - 03:00 PM (Afternoon Slot)", is_active: true },
    { id: "sl-evening", name: "03:00 PM - 06:00 PM (Evening Slot)", is_active: true },
    { id: "sl-twilight", name: "06:00 PM - 09:00 PM (Twilight Care)", is_active: true }
  ],
  blockedDates: [],
  servicePricingRules: [],
  roles: [],
  staff: []
};

// Retrieve loaded database or parse from file
export function getDb(): DbSchema {
  if (globalForDb.pristineDb) {
    return globalForDb.pristineDb;
  }

  // Attempt to load from /tmp or /app
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      globalForDb.pristineDb = JSON.parse(raw);
      return globalForDb.pristineDb!;
    } else if (fs.existsSync(ALTERNATE_DB_FILE_PATH)) {
      const raw = fs.readFileSync(ALTERNATE_DB_FILE_PATH, 'utf-8');
      globalForDb.pristineDb = JSON.parse(raw);
      return globalForDb.pristineDb!;
    }
  } catch (err) {
    console.warn("Failed reading DB, re-initializing database standard details.", err);
  }

  // Fallback to initial
  globalForDb.pristineDb = { ...initialDb };
  saveDb(globalForDb.pristineDb);
  return globalForDb.pristineDb;
}

// Helper to save to file and memory
function writeDbLocal(schema: DbSchema): void {
  globalForDb.pristineDb = schema;
  try {
    const data = JSON.stringify(schema, null, 2);
    // Ensure dir exists
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, data, 'utf-8');
    fs.writeFileSync(ALTERNATE_DB_FILE_PATH, data, 'utf-8');
  } catch (err) {
    console.error("Failed saving file persistence data", err);
  }
}

// Persist state to file and memory
export function saveDb(schema: DbSchema): void {
  writeDbLocal(schema);
  const mysqlClient = getMysql();
  if (mysqlClient) {
    pushToMysqlBackground(schema).catch(err => console.error("Database sync failed:", err));
  }
}

// Asynchronously load and synchronize from MySQL tables
export async function getDbAsync(): Promise<DbSchema> {
  const db = getDb();
  const mysqlClient = getMysql();
  if (!mysqlClient) {
    return db;
  }

  try {
    const [
      usersRes,
      servicesRes,
      addonsRes,
      pricingRulesRes,
      couponsRes,
      ordersRes,
      orderStatusHistoryRes,
      ticketsRes,
      ticketRepliesRes,
      passwordTokensRes,
      enquiriesRes,
      emailTemplatesRes,
      emailLogsRes,
      slotsRes,
      blockedDatesRes,
      rolesRes
    ] = await Promise.all([
      mysqlClient.from('users').select('*'),
      mysqlClient.from('services').select('*'),
      mysqlClient.from('addons').select('*'),
      mysqlClient.from('pricing_rules').select('*'),
      mysqlClient.from('coupons').select('*'),
      mysqlClient.from('orders').select('*'),
      mysqlClient.from('order_status_history').select('*'),
      mysqlClient.from('tickets').select('*'),
      mysqlClient.from('ticket_replies').select('*'),
      mysqlClient.from('password_tokens').select('*'),
      mysqlClient.from('enquiries').select('*'),
      mysqlClient.from('email_templates').select('*'),
      mysqlClient.from('email_logs').select('*'),
      mysqlClient.from('slots').select('*'),
      mysqlClient.from('blocked_dates').select('*'),
      mysqlClient.from('roles').select('*')
    ]);

    // Query role permissions join table directly from pool
    const pool = getPool();
    const [rpRows] = await pool.query(`
      SELECT rp.role_id, p.name AS permission_name 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
    `);
    const permissionsMap: Record<number, string[]> = {};
    for (const row of (rpRows as any[])) {
      const roleId = Number(row.role_id);
      if (!permissionsMap[roleId]) {
        permissionsMap[roleId] = [];
      }
      permissionsMap[roleId].push(row.permission_name);
    }

    if (!usersRes.error && usersRes.data && usersRes.data.length > 0) {
      db.users = usersRes.data.map((u: any) => ({
        ...u,
        id: Number(u.id),
        role_id: u.role_id ? Number(u.role_id) : null,
        is_admin: !!u.is_admin
      }));

      // Populate db.staff dynamically from users who have a role_id
      db.staff = db.users
        .filter(u => u.role_id !== null && u.role_id !== undefined)
        .map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || '',
          role_id: u.role_id!,
          is_active: u.is_active !== false
        }));
    }
    if (!servicesRes.error && servicesRes.data && servicesRes.data.length > 0) {
      db.services = servicesRes.data.map((s: any) => ({
        ...s,
        included_items: typeof s.included_items === 'string' ? JSON.parse(s.included_items) : (Array.isArray(s.included_items) ? s.included_items : []),
        excluded_items: typeof s.excluded_items === 'string' ? JSON.parse(s.excluded_items) : (Array.isArray(s.excluded_items) ? s.excluded_items : []),
        base_price: Number(s.base_price)
      }));
    }
    if (!addonsRes.error && addonsRes.data && addonsRes.data.length > 0) {
      db.addons = addonsRes.data.map((a: any) => ({
        ...a,
        price: Number(a.price)
      }));
    }
    if (!pricingRulesRes.error && pricingRulesRes.data && pricingRulesRes.data.length > 0) {
      db.pricingRules = pricingRulesRes.data.map((r: any) => ({
        ...r,
        price_adjustment: Number(r.price_adjustment)
      }));
    }
    if (!couponsRes.error && couponsRes.data && couponsRes.data.length > 0) {
      db.coupons = couponsRes.data.map((c: any) => ({
        ...c,
        discount_value: Number(c.discount_value),
        minimum_order_value: Number(c.minimum_order_value),
        maximum_discount: Number(c.maximum_discount),
        applicable_services: typeof c.applicable_services === 'string' ? JSON.parse(c.applicable_services) : (Array.isArray(c.applicable_services) ? c.applicable_services : []),
        total_usage_limit: Number(c.total_usage_limit),
        per_customer_usage_limit: Number(c.per_customer_usage_limit),
        used_count: Number(c.used_count)
      }));
    }
    if (!ordersRes.error && ordersRes.data && ordersRes.data.length > 0) {
      db.orders = ordersRes.data.map((o: any) => ({
        ...o,
        user_id: o.user_id ? Number(o.user_id) : null,
        property_size: typeof o.property_size === 'string' ? JSON.parse(o.property_size) : o.property_size,
        selected_addons: typeof o.selected_addons === 'string' ? JSON.parse(o.selected_addons) : o.selected_addons,
        accessMethod: o.access_method || o.accessMethod,
        customKeyNotes: o.custom_key_notes || o.customKeyNotes,
        original_estimated_price: Number(o.original_estimated_price),
        discount_amount: Number(o.discount_amount),
        final_estimated_price: Number(o.final_estimated_price),
        final_confirmed_price: o.final_confirmed_price !== null && o.final_confirmed_price !== undefined ? Number(o.final_confirmed_price) : null
      }));
    }
    if (!orderStatusHistoryRes.error && orderStatusHistoryRes.data && orderStatusHistoryRes.data.length > 0) db.orderStatusHistory = orderStatusHistoryRes.data;
    if (!ticketsRes.error && ticketsRes.data && ticketsRes.data.length > 0) {
      db.tickets = ticketsRes.data.map((t: any) => ({
        ...t,
        user_id: t.user_id ? Number(t.user_id) : null
      }));
    }
    if (!ticketRepliesRes.error && ticketRepliesRes.data && ticketRepliesRes.data.length > 0) db.ticketReplies = ticketRepliesRes.data;
    if (!passwordTokensRes.error && passwordTokensRes.data && passwordTokensRes.data.length > 0) {
      db.passwordTokens = passwordTokensRes.data.map((pt: any) => ({
        ...pt,
        user_id: pt.user_id ? Number(pt.user_id) : null
      }));
    }
    if (!enquiriesRes.error && enquiriesRes.data && enquiriesRes.data.length > 0) db.enquiries = enquiriesRes.data;
    if (!emailTemplatesRes.error && emailTemplatesRes.data && emailTemplatesRes.data.length > 0) db.emailTemplates = emailTemplatesRes.data;
    if (!emailLogsRes.error && emailLogsRes.data && emailLogsRes.data.length > 0) {
      db.emailLogs = emailLogsRes.data.map((el: any) => ({
        ...el,
        to: el.to_email || el.to
      }));
    }
    if (!slotsRes.error && slotsRes.data && slotsRes.data.length > 0) db.slots = slotsRes.data;
    if (!blockedDatesRes.error && blockedDatesRes.data && blockedDatesRes.data.length > 0) {
      db.blockedDates = blockedDatesRes.data.map((d: any) => d.blocked_date);
    }
    if (!rolesRes.error && rolesRes.data && rolesRes.data.length > 0) {
      db.roles = rolesRes.data.map((r: any) => ({
        ...r,
        id: Number(r.id),
        permissions: permissionsMap[Number(r.id)] || [],
        is_active: !!r.is_active
      }));
    }

    // Persist loaded copy locally
    writeDbLocal(db);
  } catch (err) {
    console.warn("Could not synchronize with MySQL tables:", err);
  }

  return db;
}

// Asynchronously save and synchronize changes with MySQL tables
export async function saveDbAsync(schema: DbSchema): Promise<void> {
  writeDbLocal(schema);
  await pushToMysqlBackground(schema);
}

// Private helper to push mapped objects to MySQL
async function pushToMysqlBackground(schema: DbSchema): Promise<void> {
  const mysqlClient = getMysql();
  if (!mysqlClient) return;

  try {
    const mappedServices = schema.services.map(s => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      description: s.description,
      image: s.image,
      base_price: s.base_price,
      is_active: s.is_active,
      is_manual_quote: s.is_manual_quote,
      included_items: JSON.stringify(s.included_items),
      excluded_items: JSON.stringify(s.excluded_items),
      created_at: s.created_at,
      updated_at: s.updated_at
    }));

    const mappedCoupons = schema.coupons.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      minimum_order_value: c.minimum_order_value,
      maximum_discount: c.maximum_discount,
      applicable_services: JSON.stringify(c.applicable_services),
      start_date: c.start_date,
      end_date: c.end_date,
      total_usage_limit: c.total_usage_limit,
      per_customer_usage_limit: c.per_customer_usage_limit,
      used_count: c.used_count,
      is_active: c.is_active
    }));

    const mappedOrders = schema.orders.map(o => ({
      id: o.id,
      user_id: o.user_id,
      order_number: o.order_number,
      customer_name: o.customer_name,
      email: o.email,
      phone: o.phone,
      service_id: o.service_id,
      property_size: JSON.stringify(o.property_size),
      selected_addons: JSON.stringify(o.selected_addons),
      preferred_date: o.preferred_date,
      preferred_time_slot: o.preferred_time_slot,
      notes: o.notes,
      access_method: o.accessMethod || null,
      custom_key_notes: o.customKeyNotes || null,
      original_estimated_price: o.original_estimated_price,
      coupon_code: o.coupon_code,
      discount_amount: o.discount_amount,
      final_estimated_price: o.final_estimated_price,
      final_confirmed_price: o.final_confirmed_price,
      payment_status: o.payment_status,
      order_status: o.order_status,
      settlement_status: o.settlement_status,
      admin_internal_notes: o.admin_internal_notes,
      customer_visible_notes: o.customer_visible_notes,
      created_at: o.created_at,
      updated_at: o.updated_at
    }));

    const mappedEmailLogs = schema.emailLogs.map(el => ({
      id: el.id,
      to_email: el.to,
      subject: el.subject,
      body: el.body,
      sent_at: el.sent_at
    }));

    const mappedBlockedDates = (schema.blockedDates || []).map(d => ({
      id: d,
      blocked_date: d
    }));

    const mappedRoles = (schema.roles || []).map(r => ({
      id: Number(r.id),
      name: r.name,
      is_active: r.is_active ? 1 : 0
    }));

    const mappedUsers = (schema.users || []).map(u => ({
      id: Number(u.id),
      name: u.name,
      email: u.email,
      phone: u.phone,
      password_hash: u.password_hash,
      role_id: u.role_id ? Number(u.role_id) : null,
      account_source: u.account_source,
      email_verified_at: u.email_verified_at,
      is_active: u.is_active !== false ? 1 : 0,
      is_admin: u.is_admin ? 1 : 0,
      created_at: u.created_at,
      updated_at: u.updated_at
    }));

    await Promise.all([
      (mysqlClient.from('users') as any).sync(mappedUsers),
      (mysqlClient.from('services') as any).sync(mappedServices),
      (mysqlClient.from('addons') as any).sync(schema.addons),
      (mysqlClient.from('pricing_rules') as any).sync(schema.pricingRules),
      (mysqlClient.from('coupons') as any).sync(mappedCoupons),
      (mysqlClient.from('orders') as any).sync(mappedOrders),
      (mysqlClient.from('order_status_history') as any).sync(schema.orderStatusHistory),
      (mysqlClient.from('tickets') as any).sync(schema.tickets),
      (mysqlClient.from('ticket_replies') as any).sync(schema.ticketReplies),
      (mysqlClient.from('password_tokens') as any).sync(schema.passwordTokens),
      (mysqlClient.from('enquiries') as any).sync(schema.enquiries),
      (mysqlClient.from('email_templates') as any).sync(schema.emailTemplates),
      (mysqlClient.from('email_logs') as any).sync(mappedEmailLogs),
      (mysqlClient.from('slots') as any).sync(schema.slots),
      (mysqlClient.from('blocked_dates') as any).sync(mappedBlockedDates),
      (mysqlClient.from('roles') as any).sync(mappedRoles)
    ]);

    // Update permissions & role_permissions in pivot table
    const uniquePermissions = Array.from(
      new Set((schema.roles || []).flatMap(r => r.permissions || []))
    );

    const pool = getPool();
    if (uniquePermissions.length > 0) {
      const insertPerms = uniquePermissions.map(p => [p]);
      await pool.query('INSERT IGNORE INTO permissions (name) VALUES ?', [insertPerms]);
    }

    const [permRows] = await pool.query('SELECT id, name FROM permissions');
    const permNameToIdMap: Record<string, number> = {};
    for (const row of (permRows as any[])) {
      permNameToIdMap[row.name] = row.id;
    }

    const rpMappings: Array<[number, number]> = [];
    for (const r of (schema.roles || [])) {
      const roleId = Number(r.id);
      for (const pName of (r.permissions || [])) {
        const pId = permNameToIdMap[pName];
        if (pId) {
          rpMappings.push([roleId, pId]);
        }
      }
    }

    await pool.query('DELETE FROM role_permissions');
    if (rpMappings.length > 0) {
      await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [rpMappings]);
    }
  } catch (err) {
    console.error("Could not write updates directly to MySQL tables:", err);
  }
}

// Helper to trigger email logs
export function triggerEmail(templateId: string, toEmail: string, placeholders: Record<string, string>): void {
  const db = getDb();
  const template = db.emailTemplates.find(t => t.id === templateId);
  if (!template) {
    console.warn(`Template ${templateId} not found.`);
    return;
  }

  let body = template.body;
  let subject = template.subject;

  // Replace placeholders
  Object.entries(placeholders).forEach(([key, val]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    body = body.replace(regex, val);
    subject = subject.replace(regex, val);
  });

  const emailLog: EmailLog = {
    id: `eml-${Math.floor(100000 + Math.random() * 900000)}`,
    to: toEmail,
    subject: subject,
    body: body,
    sent_at: new Date().toISOString()
  };

  db.emailLogs.unshift(emailLog);
  saveDb(db);
}
