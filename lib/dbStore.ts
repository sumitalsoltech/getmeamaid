export interface BookingRecord {
  id: string;
  postal_code: string;
  home_type: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  restoration_level: string;
  frequency: string;
  addons: string; // JSON string
  selected_date: string;
  selected_time_slot: string;
  entry_method: string;
  custom_key_notes: string;
  customer_special_notes: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  card_name: string;
  pricing: string; // JSON string
  status?: string;
  created_at: string;
}

export interface GiftCardRecord {
  id: string;
  amount: number;
  from_name: string;
  to_name: string;
  recipient_email: string;
  created_at: string;
}

// Global caching container to preserve in-memory additions across page changes in dev server
declare global {
  var __bookingsStore: BookingRecord[] | undefined;
  var __vouchersStore: GiftCardRecord[] | undefined;
}

export const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    id: "PRE-892104",
    first_name: "Charlotte",
    last_name: "Mercer",
    email: "charlotte@mercer.com",
    phone: "+1 (416) 555-0178",
    postal_code: "M5V 2H1",
    home_type: "High-rise Condo",
    bedrooms: 2,
    bathrooms: 2,
    square_footage: 1200,
    restoration_level: "Maintenance Program",
    frequency: "Weekly",
    entry_method: "Concierge / Key Left on File",
    selected_date: "2026-05-30",
    selected_time_slot: "09:00 AM - 12:00 PM",
    addons: JSON.stringify(["Deep Oven Curation", "Premium Lavender-Sage Scent Selection"]),
    pricing: JSON.stringify({
      baseService: 220,
      roomModifiers: 40,
      addonsTotal: 55,
      frequencyDiscount: 31.5,
      serviceFee: 14.18,
      tax: 38.68,
      total: 336.36
    }),
    customer_special_notes: "Our high-rise condo requires meticulous treatment for wide-plank oak floors and brass fittings. The lavender-sage scent selection is incredibly elegant.",
    custom_key_notes: "Please buzzer code 4820 at front gate.",
    card_name: "Charlotte Mercer",
    created_at: "2026-05-25T14:32:00.000Z"
  },
  {
    id: "PRE-102945",
    first_name: "Marcus",
    last_name: "Goldman",
    email: "marcus.g@goldmanholdings.ca",
    phone: "+1 (647) 555-9012",
    postal_code: "M4W 1A5",
    home_type: "Bespoke Townhouse",
    bedrooms: 4,
    bathrooms: 3,
    square_footage: 2800,
    restoration_level: "Complete Deep Curation",
    frequency: "Bi-Weekly",
    entry_method: "Direct Handover / Curator Entry",
    selected_date: "2026-06-02",
    selected_time_slot: "01:00 PM - 04:00 PM",
    addons: JSON.stringify(["Interior Window Polishing", "Fibre Cabinet Detailing"]),
    pricing: JSON.stringify({
      baseService: 450,
      roomModifiers: 80,
      addonsTotal: 120,
      frequencyDiscount: 65,
      serviceFee: 29.25,
      tax: 79.82,
      total: 694.07
    }),
    customer_special_notes: "Please pay close attention to the custom walnut cabinetry in the living room.",
    custom_key_notes: "Will meet curator on site.",
    card_name: "Marcus Goldman",
    created_at: "2026-05-26T09:15:00.000Z"
  },
  {
    id: "PRE-774012",
    first_name: "Seraphina",
    last_name: "Vance",
    email: "s.vance@vanceeditorial.ca",
    phone: "+1 (416) 555-8833",
    postal_code: "M5R 1C3",
    home_type: "Penthouse Loft",
    bedrooms: 1,
    bathrooms: 1,
    square_footage: 850,
    restoration_level: "Complete Deep Curation",
    frequency: "One-Time Selection",
    entry_method: "Keybox Lock Entry Code",
    selected_date: "2026-05-28",
    selected_time_slot: "11:00 AM - 02:00 PM",
    addons: JSON.stringify(["Deep Refrigerator Hand-wash"]),
    pricing: JSON.stringify({
      baseService: 320,
      roomModifiers: 10,
      addonsTotal: 40,
      frequencyDiscount: 0,
      serviceFee: 18.5,
      tax: 50.51,
      total: 439.01
    }),
    customer_special_notes: "Delicate glass chandelier in double-height dining room needs careful dust alignment.",
    custom_key_notes: "Key lock box code is 2841 in standard service entry lane.",
    card_name: "Seraphina Vance",
    created_at: "2026-05-26T18:44:00.000Z"
  }
];

export const INITIAL_VOUCHERS: GiftCardRecord[] = [
  {
    id: "GFT-482104",
    amount: 250,
    from_name: "Olivia Vance",
    to_name: "Charlotte Mercer",
    recipient_email: "charlotte@mercer.com",
    created_at: "2026-05-24T10:00:00.000Z"
  },
  {
    id: "GFT-891230",
    amount: 500,
    from_name: "Harrison Sterling",
    to_name: "Eleanor Sterling",
    recipient_email: "e.sterling@icloud.com",
    created_at: "2026-05-25T11:20:00.000Z"
  },
  {
    id: "GFT-112049",
    amount: 150,
    from_name: "Arthur Pendelton",
    to_name: "Beatrice Pendelton",
    recipient_email: "beatrice.p@gmail.com",
    created_at: "2026-05-26T15:10:00.000Z"
  }
];

if (!globalThis.__bookingsStore) {
  globalThis.__bookingsStore = [...INITIAL_BOOKINGS];
}
if (!globalThis.__vouchersStore) {
  globalThis.__vouchersStore = [...INITIAL_VOUCHERS];
}

export function getLocalBookings(): BookingRecord[] {
  return globalThis.__bookingsStore!;
}

export function saveLocalBooking(booking: BookingRecord) {
  globalThis.__bookingsStore!.unshift(booking);
}

export function getLocalVouchers(): GiftCardRecord[] {
  return globalThis.__vouchersStore!;
}

export function saveLocalVoucher(voucher: GiftCardRecord) {
  globalThis.__vouchersStore!.unshift(voucher);
}

export function resetLocalSeedStore() {
  globalThis.__bookingsStore = [...INITIAL_BOOKINGS];
  globalThis.__vouchersStore = [...INITIAL_VOUCHERS];
}

// ---------------- NEW REFINED WORKSPACE SCHEMAS & HELPERS ----------------

export interface EmailTemplateType {
  id: string;
  name: string;
  subject: string;
  body: string;
  is_active: boolean;
}

export interface EmailLogType {
  id: string;
  email_type: string;
  recipient_email: string;
  related_entity_id: string; // Order or Ticket ID
  template_used: string;
  sent_by: string; // 'system' or 'administrator'
  created_at: string;
  status: 'sent' | 'failed';
  error_message?: string;
}

export interface CmsContentStoreType {
  hero: {
    heading: string;
    subheading: string;
    ctaText: string;
    ctaLink: string;
    bannerImage: string;
    status: 'draft' | 'published' | 'inactive';
  };
  contact: {
    phone: string;
    email: string;
    area: string;
    hours: string;
    mapLink: string;
    socials: { twitter: string; facebook: string; instagram: string };
  };
  footer: {
    copyright: string;
    desc: string;
  };
  howItWorks: Array<{
    id: string;
    title: string;
    description: string;
    display_order: number;
    is_active: boolean;
  }>;
  testimonials: Array<{
    id: string;
    customer_name: string;
    review_text: string;
    rating: number;
    display_order: number;
    is_active: boolean;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    display_order: number;
    is_active: boolean;
  }>;
  terms: { title: string; content: string };
  privacy: { title: string; content: string };
  servicesContent: Array<{
    id: string;
    title: string;
    rate: number;
    duration: string;
    desc: string;
    highlights: string[];
    is_active: boolean;
  }>;
  seo: Record<string, {
    pageTitle: string;
    metaTitle: string;
    metaDescription: string;
    slug: string;
  }>;
}

export interface PricingRuleType {
  id: string;
  name: string;
  rule_type: 'service_base' | 'size_charge' | 'addon_pricing' | 'urgency_charge' | 'location_charge' | 'min_order' | 'manual_quote';
  match_key: string;
  price_adjustment: number;
  adjustment_type: 'percentage' | 'fixed' | 'manual' | 'unavailable' | string;
  is_active: boolean;
  service_name?: string;
  currency?: string;
  quantity_allowed?: boolean;
  quantity_label?: string;
  condition?: string;
  postal_code?: string;
  service_available?: boolean;
  manual_quote?: boolean;
  apply_before_coupon?: boolean;
  message?: string;
  [key: string]: any;
}

// Global caching container to preserve in-memory additions across pages
declare global {
  var __emailTemplatesStore: EmailTemplateType[] | undefined;
  var __emailLogsStore: EmailLogType[] | undefined;
  var __cmsContentStore: CmsContentStoreType | undefined;
  var __pricingRulesStore: PricingRuleType[] | undefined;
}

export const INITIAL_EMAIL_TEMPLATES: EmailTemplateType[] = [
  {
    id: 'order_confirmation',
    name: 'Order confirmation',
    subject: 'getmeamaid Appointment Confirmed - Order #{{order_id}}',
    body: `<div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px;">\n  <h2 style="color: #0f172a;">Appointment Securely Processed!</h2>\n  <p>Dear <strong>{{customer_name}}</strong>,</p>\n  <p>Thank you for choosing getmeamaid. Your reservation for <strong>{{service_name}}</strong> on <strong>{{preferred_date}}</strong> during <strong>{{preferred_slot}}</strong> is verified.</p>\n  <p>Order Summary Ref: <strong>#{{order_id}}</strong></p>\n  <p>Total Pricing: <strong>{{final_amount}}</strong></p>\n  <p>If you need to make scheduling edits, visit your client panel prior to 24 hours of service.</p>\n</div>`,
    is_active: true
  },
  {
    id: 'guest_account_created',
    name: 'Guest account created',
    subject: 'Welcome to getmeamaid - Access Your Client Desk',
    body: `<div style="font-family: sans-serif; max-width: 600px; padding: 24px; border: 1px solid #eaeaea;">\n  <h2>Welcome to getmeamaid!</h2>\n  <p>Dear {{customer_name}},</p>\n  <p>We created a guest curator account under your email to help you oversee dispatches. Access your portal details and set up security password parameters at any time.</p>\n  <a href="{{set_password_link}}" style="display: inline-block; background: #000; color: #fff; padding: 8px 16px; text-decoration: none; border-radius: 4px;">Initialize Account Setup</a>\n</div>`,
    is_active: true
  },
  {
    id: 'set_password_link',
    name: 'Set password link',
    subject: 'Initialize Your Curator Account Password',
    body: `<p>Dear {{customer_name}},</p>\n<p>Please establish your new password to verify credentials: <a href="{{set_password_link}}">{{set_password_link}}</a></p>`,
    is_active: true
  },
  {
    id: 'quote_sent',
    name: 'Quote sent',
    subject: 'Your Bespoke Cleaner Estimate Quote is Ready',
    body: `<p>Dear {{customer_name}},</p>\n<p>Our audit team completed estimation metrics for Order #{{order_id}}. Your proposed quote breakdown of <strong>{{final_amount}}</strong> is ready for verification.</p>\n<p>Link: <a href="{{payment_link}}">View Estimator Quote</a></p>`,
    is_active: true
  },
  {
    id: 'payment_link_sent',
    name: 'Payment link sent',
    subject: 'Payment Link Prepared for Order #{{order_id}}',
    body: `<p>Dear {{customer_name}},</p>\n<p>We have compiled your payment schedule of <strong>{{final_amount}}</strong>. Please access the secure portal gateway to authorize billing:</p>\n<a href="{{payment_link}}">Submit Payment Authorization</a>`,
    is_active: true
  },
  {
    id: 'payment_reminder',
    name: 'Payment reminder',
    subject: 'Action Required: Outstanding Reconcile Reminder',
    body: `<p>Dear {{customer_name}},</p>\n<p>This is an automated prompt that payment for order #{{order_id}} (Amount: {{final_amount}}) is pending allocation.</p>\n<a href="{{payment_link}}">Reconcile Now</a>`,
    is_active: true
  },
  {
    id: 'payment_confirmed',
    name: 'Payment confirmed',
    subject: 'Payment Confirmed - Ledger Verified',
    body: `<p>Dear {{customer_name}},</p>\n<p>Your payment of <strong>{{final_amount}}</strong> is confirmed. All dispatch services will proceed as scheduled.</p>`,
    is_active: true
  },
  {
    id: 'schedule_confirmed',
    name: 'Schedule confirmed',
    subject: 'Staff Dispatch Schedule Confirmed #{{order_id}}',
    body: `<p>Dear {{customer_name}},</p>\n<p>Your arrival window is set for <strong>{{preferred_date}}</strong> within <strong>{{preferred_slot}}</strong>. Our elite curators look forward to presenting absolute luxury.</p>`,
    is_active: true
  },
  {
    id: 'job_assigned_to_staff',
    name: 'Job assigned to staff',
    subject: 'Curator Assignment: Schedule #{{order_id}}',
    body: `<p>Hello {{staff_name}},</p>\n<p>You are officially assigned to perform Curation order #{{order_id}} at service location (postal: {{customer_name}}) on {{preferred_date}} at {{preferred_slot}}.</p>`,
    is_active: true
  },
  {
    id: 'order_completed',
    name: 'Order completed',
    subject: 'Home Curation Complete - Experience Verified',
    body: `<p>Dear {{customer_name}},</p>\n<p>Your systematic home curation of {{service_name}} is completed. We have generated your high-fidelity review logs.</p>`,
    is_active: true
  },
  {
    id: 'invoice_sent',
    name: 'Invoice sent',
    subject: 'Pristine Ledger Invoice INV-{{order_id}}',
    body: `<p>Dear {{customer_name}},</p>\n<p>Please find attached invoice for Order #{{order_id}} amounting to {{final_amount}}: <a href="{{invoice_link}}">{{invoice_link}}</a></p>`,
    is_active: true
  },
  {
    id: 'settlement_completed',
    name: 'Settlement completed',
    subject: 'Accounts Settlement Processed',
    body: `<p>Dear {{customer_name}},</p>\n<p>Your account invoice statement is reconciled and settled successfully. We thank you for choosing getmeamaid.</p>`,
    is_active: true
  },
  {
    id: 'ticket_created',
    name: 'Ticket created',
    subject: 'Support Desk Registered - Ticket #{{ticket_id}}',
    body: `<p>Dear {{customer_name}},</p>\n<p>We registered your support filing #{{ticket_id}} regarding: <strong>{{status}}</strong>. A concierge analyst will correspond immediately.</p>`,
    is_active: true
  },
  {
    id: 'ticket_replied',
    name: 'Ticket replied',
    subject: 'Analyst Reply Received: Ticket #{{ticket_id}}',
    body: `<p>Dear {{customer_name}},</p>\n<p>Our desk updated ticket {{ticket_id}}. Correspondence: </p><p style="padding: 10px; background: #eee;">{{status}}</p>`,
    is_active: true
  },
  {
    id: 'ticket_closed',
    name: 'Ticket closed',
    subject: 'Support File #{{ticket_id}} Closed',
    body: `<p>Dear {{customer_name}},</p>\n<p>This support inquiry has been resolved and closed from active consoles.</p>`,
    is_active: true
  },
  {
    id: 'password_reset',
    name: 'Password reset',
    subject: 'Curator Password Reset Link',
    body: `<p>Please restore account access through reset dashboard links: <a href="{{set_password_link}}">Reset Password link</a></p>`,
    is_active: true
  }
];

export const INITIAL_CMS_CONTENT: CmsContentStoreType = {
  hero: {
    heading: "Professional Cleaning Services You Can Depend On",
    subheading: "A systematic, clinical approach to restoration. Designed for modern living, budgeted dynamically, and calibrated in exquisite details for Toronto, Vancouver, and Calgary homes.",
    ctaText: "Book Curation Now",
    ctaLink: "/book",
    bannerImage: "https://images.unsplash.com/photo-1603796846097-bee99e4a60c9?auto=format&fit=crop&q=80&w=1200",
    status: "published"
  },
  contact: {
    phone: "+1 (800) 555-MAID (6243)",
    email: "concierge@getmeamaid.ca",
    area: "Metropolitan Toronto, Vancouver waterfront, Calgary Foothills",
    hours: "Monday - Sunday: 08:00 AM - 08:00 PM EST",
    mapLink: "https://maps.google.com",
    socials: {
      twitter: "@getmeamaid",
      facebook: "getmeamaid.premium",
      instagram: "getmeamaid.curations"
    }
  },
  footer: {
    copyright: "© 2026 getmeamaid Labs. Absolute Luxury Curation.",
    desc: "Experience bespoke premium cleaning curation. Serving Toronto, Vancouver, and Calgary with an uncompromising standard of high-fidelity restoration."
  },
  howItWorks: [
    { id: "step-1", title: "Select Fine Details", description: "Toggle high-fidelity curation additions corresponding to spaces recursively.", display_order: 1, is_active: true },
    { id: "step-2", title: "Verify Automatic Valuation", description: "Our instant math matches exact pricing breakdown transparency.", display_order: 2, is_active: true },
    { id: "step-3", title: "Behold Immaculate Restoration", description: "Elite vetted specialists perform clinical-grade cleanings.", display_order: 3, is_active: true }
  ],
  testimonials: [
    { id: "test-1", customer_name: "Charlotte Mercer", review_text: "Their Deep Restoration Curation is absolute magic. The baseboards, cabinet alignments, and lavender-sage scent selections made our high-rise condo look pristine as a surgical laboratory. Highly recommended.", rating: 5, display_order: 1, is_active: true },
    { id: "test-2", customer_name: "Marcus Goldman", review_text: "Consistent, uncompromising quality. Standard maintenance program saves our townhouse incredible logistics load weekly. Vetted staff members present extraordinary standards.", rating: 5, display_order: 2, is_active: true }
  ],
  faqs: [
    { id: "faq-1", question: "What is your high-fidelity restoration level difference?", answer: "Our signature deep restoration focuses on critical air purification, deep sanitizing of cabinets, clinical vent detailed wipes, and hand-polishing metals, surpassing traditional cleanings by several orders of volume.", display_order: 1, is_active: true },
    { id: "faq-2", question: "How does the manual quote condition work?", answer: "For estates exceeding standard bedroom sizes or far zones, our backend calculator assigns high-touch manual indicators. We email final quotes within minutes of submit logs.", display_order: 2, is_active: true }
  ],
  terms: {
    title: "Terms of Service Agreement",
    content: "All home reservations are subject to standard 24 hours cancellation policies. Security authorization forms clear payments upon dispatch schedule completions."
  },
  privacy: {
    title: "Privacy and Security Assurances",
    content: "Your home security lockbox parameters and physical property details are encrypted locally under TLS 1.3 standards. No telemetry details are ever shared with third-party servers."
  },
  servicesContent: [
    { id: "srv-standard", title: "Standard Maintenance Curation", rate: 140, duration: "2.5 - 4 Hours", desc: "A meticulous maintenance sweeps encompassing dusting, bespoke organizing, systematic vacuuming, sanitizing high-touch surfaces, and precision bathroom polishing.", highlights: ["Scent choices: Fresh Herb or Citrus", "Textile precision alignment", "Double-polished metal faucets"], is_active: true },
    { id: "srv-deep", title: "Deep Restoration Suite", rate: 210, duration: "4 - 7 Hours", desc: "An exhaustive physical overhaul targeting cumulative dust, deep lime and mold remediation, vents detailing, grout deep scrubbing, window-interior polishing, and inside-appliance curations.", highlights: ["Grout 100% steam cleaning", "Vents detailing wipes", "Localized extraction cleanings"], is_active: true },
    { id: "srv-move", title: "Move In / Out Choreography", rate: 340, duration: "5 - 9 Hours", desc: "Designed for buyers, renters, and listing agents. We curate complete vertical extraction, empty drawer disinfection, inside all shelves, drawers, cabinets, closet resets.", highlights: ["Oven & Refrigerator detailing", "Meticulous sanitization", "Air purification sweep"], is_active: true }
  ],
  seo: {
    home: { pageTitle: 'Home', metaTitle: 'getmeamaid | Bespoke Premium Cleaning Curations', metaDescription: 'Elite home restoration and maintenance services throughout Toronto, Vancouver, and Calgary.', slug: '/' },
    book: { pageTitle: 'Book Appointment', metaTitle: 'Reserve Luxury Clean - getmeamaid', metaDescription: 'Configure details and book instant home curators.', slug: '/book' }
  }
};

export const INITIAL_PRICING_RULES: PricingRuleType[] = [
  { id: 'base-standard', name: 'Standard Cleaning Base', rule_type: 'service_base', match_key: 'Standard Maintenance Curation', price_adjustment: 140, adjustment_type: 'fixed', is_active: true },
  { id: 'base-deep', name: 'Deep Cleaning Base', rule_type: 'service_base', match_key: 'Deep Clean', price_adjustment: 210, adjustment_type: 'fixed', is_active: true },
  { id: 'base-move', name: 'Move In/Out Cleaning Base', rule_type: 'service_base', match_key: 'Move In/Out', price_adjustment: 340, adjustment_type: 'fixed', is_active: true },
  
  { id: 'room-bed', name: 'Extra Bedroom Factor', rule_type: 'size_charge', match_key: 'bedrooms', price_adjustment: 20, adjustment_type: 'fixed', is_active: true },
  { id: 'room-bath', name: 'Extra Bathroom Factor', rule_type: 'size_charge', match_key: 'bathrooms', price_adjustment: 30, adjustment_type: 'fixed', is_active: true },
  
  { id: 'add-oven', name: 'Deep Oven Curation Addon', rule_type: 'addon_pricing', match_key: 'Deep Oven Curation', price_adjustment: 40, adjustment_type: 'fixed', is_active: true },
  { id: 'add-scent', name: 'Premium Lavender Scent Addon', rule_type: 'addon_pricing', match_key: 'Premium Lavender-Sage Scent Selection', price_adjustment: 15, adjustment_type: 'fixed', is_active: true },
  { id: 'add-window', name: 'Interior Window Polishing Addon', rule_type: 'addon_pricing', match_key: 'Interior Window Polishing', price_adjustment: 50, adjustment_type: 'fixed', is_active: true },
  { id: 'add-refrig', name: 'Deep Refrigerator Addon', rule_type: 'addon_pricing', match_key: 'Deep Refrigerator Hand-wash', price_adjustment: 40, adjustment_type: 'fixed', is_active: true },

  { id: 'urg-saturday', name: 'Saturday Premium Charge', rule_type: 'urgency_charge', match_key: 'Saturday', price_adjustment: 45, adjustment_type: 'fixed', is_active: true },
  { id: 'urg-sameday', name: 'Same-day Urgency Uplift', rule_type: 'urgency_charge', match_key: 'Same-day', price_adjustment: 20, adjustment_type: 'percentage', is_active: true },
  { id: 'urg-nextday', name: 'Next-day Urgency Uplift', rule_type: 'urgency_charge', match_key: 'Next-day', price_adjustment: 10, adjustment_type: 'percentage', is_active: true },
  
  { id: 'loc-travel', name: 'Outside Core Delivery Zone', rule_type: 'location_charge', match_key: 'Outside Zone', price_adjustment: 35, adjustment_type: 'fixed', is_active: true },
  { id: 'min-ord-value', name: 'Atelier Minimum Billing Threshold', rule_type: 'min_order', match_key: 'min', price_adjustment: 120, adjustment_type: 'fixed', is_active: true },
  { id: 'cond-large', name: 'Manual Review Trigger: Size Limit', rule_type: 'manual_quote', match_key: 'large_size', price_adjustment: 5, adjustment_type: 'fixed', is_active: true }
];

// In-Memory Global Initializers
if (!globalThis.__emailTemplatesStore) {
  globalThis.__emailTemplatesStore = [...INITIAL_EMAIL_TEMPLATES];
}
if (!globalThis.__emailLogsStore) {
  globalThis.__emailLogsStore = [];
}
if (!globalThis.__cmsContentStore) {
  globalThis.__cmsContentStore = { ...INITIAL_CMS_CONTENT };
}
if (!globalThis.__pricingRulesStore) {
  globalThis.__pricingRulesStore = [...INITIAL_PRICING_RULES];
}

export function getEmailTemplates() {
  return globalThis.__emailTemplatesStore!;
}

export function saveEmailTemplate(id: string, updated: Partial<EmailTemplateType>) {
  globalThis.__emailTemplatesStore = globalThis.__emailTemplatesStore!.map(t =>
    t.id === id ? { ...t, ...updated } : t
  );
}

export function getEmailLogs() {
  return globalThis.__emailLogsStore!;
}

export function logEmail(log: Omit<EmailLogType, 'id' | 'created_at'>) {
  const newLog: EmailLogType = {
    id: `log-${Math.floor(100000 + Math.random() * 900000)}`,
    ...log,
    created_at: new Date().toISOString()
  };
  globalThis.__emailLogsStore!.unshift(newLog);
  return newLog;
}

export function deleteEmailLogs() {
  globalThis.__emailLogsStore = [];
}

export function getCmsContent() {
  return globalThis.__cmsContentStore!;
}

export function saveCmsContent(updated: CmsContentStoreType) {
  globalThis.__cmsContentStore = updated;
}

export function getPricingRules() {
  return globalThis.__pricingRulesStore!;
}

export function savePricingRules(updated: PricingRuleType[]) {
  globalThis.__pricingRulesStore = updated;
}

