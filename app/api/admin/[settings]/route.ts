import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, triggerEmail, Service, AddOn, PricingRule, Coupon, Slot, EmailTemplate, getDbAsync, saveDbAsync } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { authorize } from '@/lib/authMiddleware';

const SETTINGS_PERMISSIONS: Record<string, string> = {
  'services': 'manage_services',
  'pricing-rules': 'manage_pricing',
  'coupons': 'manage_coupons',
  'slots': 'view_slots',
  'staff': 'manage_staff',
  'roles': 'manage_roles',
  'users': 'view_customers',
  'enquiries': 'view_customers',
  'email-templates': 'manage_email_templates',
  'email-logs': 'manage_email_templates'
};


// Generic CRUD endpoint for Admin settings
export async function GET(req: NextRequest, props: { params: Promise<{ settings: string }> }) {
  const params = await props.params;
  const settings = params.settings;
  const db = await getDbAsync();

  const reqPermission = SETTINGS_PERMISSIONS[settings];
  const auth = await authorize(req, reqPermission);
  if (!auth.authorized) {
    return auth.response!;
  }

  if (settings === 'services') {
    return NextResponse.json({ services: db.services, addons: db.addons });
  }

  if (settings === 'pricing-rules') {
    return NextResponse.json({ pricingRules: db.pricingRules });
  }

  if (settings === 'coupons') {

    return NextResponse.json({ coupons: db.coupons });
  }

  if (settings === 'slots') {
    return NextResponse.json({ slots: db.slots, blockedDates: db.blockedDates || [] });
  }

  if (settings === 'staff') {
    return NextResponse.json({ staff: db.staff || [] });
  }

  if (settings === 'roles') {
    return NextResponse.json({ roles: db.roles || [] });
  }

  if (settings === 'users') {
    // Return users cleanly, hiding hashes
    const sanitizedUsers = db.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      account_source: u.account_source,
      created_at: u.created_at,
      email_verified_at: u.email_verified_at,
      is_admin: u.is_admin
    }));
    return NextResponse.json({ users: sanitizedUsers });
  }

  if (settings === 'enquiries') {
    return NextResponse.json({ enquiries: db.enquiries });
  }

  if (settings === 'email-templates') {
    return NextResponse.json({ emailTemplates: db.emailTemplates });
  }

  if (settings === 'email-logs') {
    return NextResponse.json({ emailLogs: db.emailLogs });
  }

  return NextResponse.json({ error: 'Invalid settings module parameters.' }, { status: 400 });
}

export async function POST(req: NextRequest, props: { params: Promise<{ settings: string }> }) {
  const params = await props.params;
  const settings = params.settings;
  const db = await getDbAsync();


  // Enquiries creation can be anonymous
  if (settings === 'enquiries') {
    try {
      const body = await req.json();
      const { name, email, phone, message } = body;
      if (!name || !email || !message) {
        return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
      }

      const newEnq = {
        id: `enq-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        email,
        phone: phone || '',
        message,
        status: 'New' as const,
        created_at: new Date().toISOString()
      };

      db.enquiries.unshift(newEnq);
      saveDb(db);

      // Email Admin
      triggerEmail('tpl-order-confirm', 'curator@pristineeditorial.com', {
        customer_name: `ADMIN [New Enquiry from ${newEnq.name}]`,
        order_id: newEnq.id,
        service_name: 'Contact Enquiry Curation',
        preferred_date: '-',
        preferred_slot: '-',
        final_price: '-'
      });

      return NextResponse.json({ success: true, enquiry: newEnq });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  const reqPermission = SETTINGS_PERMISSIONS[settings];
  const auth = await authorize(req, reqPermission);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json();

    if (settings === 'services') {
      const { title, description, image, base_price, is_active, is_manual_quote, included_items, excluded_items } = body;
      const newService: Service = {
        id: `srv-${Math.floor(100000 + Math.random() * 900000)}`,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description,
        image: image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800',
        base_price: Number(base_price),
        is_active: is_active !== false,
        is_manual_quote: is_manual_quote === true,
        included_items: included_items || [],
        excluded_items: excluded_items || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.services.push(newService);
      saveDb(db);
      return NextResponse.json({ success: true, service: newService });
    }

    if (settings === 'addons') {
      const { name, price, pricing_type, is_active } = body;
      const newAddon: AddOn = {
        id: `add-${Math.floor(100000 + Math.random() * 900000)}`,
        service_id: '',
        name,
        price: Number(price),
        pricing_type: pricing_type || 'fixed',
        is_active: is_active !== false
      };
      db.addons.push(newAddon);
      saveDb(db);
      return NextResponse.json({ success: true, addon: newAddon });
    }

    if (settings === 'pricing-rules') {
      const { rule_type, rule_name, value, price_adjustment, adjustment_type, is_active } = body;
      const newRule: PricingRule = {
        id: `pr-${Math.floor(100000 + Math.random() * 900000)}`,
        service_id: '',
        rule_type,
        rule_name,
        value,
        price_adjustment: Number(price_adjustment),
        adjustment_type: adjustment_type || 'fixed',
        is_active: is_active !== false
      };
      db.pricingRules.push(newRule);
      saveDb(db);
      return NextResponse.json({ success: true, rule: newRule });
    }

    if (settings === 'coupons') {
      const { code, name, discount_type, discount_value, minimum_order_value, maximum_discount, applicable_services, start_date, end_date, total_usage_limit, per_customer_usage_limit, is_active } = body;
      const newCoupon: Coupon = {
        id: `cp-${Math.floor(100000 + Math.random() * 900000)}`,
        code: code.toUpperCase().trim(),
        name,
        discount_type,
        discount_value: Number(discount_value),
        minimum_order_value: Number(minimum_order_value || 0),
        maximum_discount: Number(maximum_discount || 999999),
        applicable_services: applicable_services || [],
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date: end_date || '2030-12-31',
        total_usage_limit: Number(total_usage_limit || 1000),
        per_customer_usage_limit: Number(per_customer_usage_limit || 1),
        used_count: 0,
        is_active: is_active !== false
      };
      db.coupons.push(newCoupon);
      saveDb(db);
      return NextResponse.json({ success: true, coupon: newCoupon });
    }

    if (settings === 'slots') {
      const { name, is_active, blockDate } = body;
      if (blockDate) {
        if (!db.blockedDates) db.blockedDates = [];
        if (!db.blockedDates.includes(blockDate)) {
          db.blockedDates.push(blockDate);
          saveDb(db);
        }
        return NextResponse.json({ success: true, blockedDates: db.blockedDates });
      }

      const newSlot: Slot = {
        id: `sl-${Math.floor(100000 + Math.random() * 900000)}`,
        name,
        is_active: is_active !== false
      };
      db.slots.push(newSlot);
      saveDb(db);
      return NextResponse.json({ success: true, slot: newSlot });
    }

    if (settings === 'staff') {
      const { name, email, phone, role_id, is_active, password } = body;
      if (!name || !email) {
        return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
      }

      // Hash custom password if provided, otherwise default password
      let password_hash: string;
      if (password && password.trim() !== '') {
        password_hash = bcrypt.hashSync(password, 10);
      } else {
        const firstName = name.split(' ')[0].toLowerCase();
        const defaultPassword = `${firstName}123`;
        password_hash = bcrypt.hashSync(defaultPassword, 10);
      }

      const newStaffId = Math.floor(100000 + Math.random() * 900000);
      const newStaffUser = {
        id: newStaffId,
        name,
        email,
        phone: phone || '',
        password_hash,
        role_id: Number(role_id) || 4, // default to Field Staff
        account_source: 'signup' as const,
        email_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_admin: false,
        is_active: is_active !== false
      };
      db.users.push(newStaffUser);
      
      // Update staff list
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

      saveDb(db);
      return NextResponse.json({
        success: true,
        staff: {
          id: newStaffUser.id,
          name: newStaffUser.name,
          email: newStaffUser.email,
          phone: newStaffUser.phone,
          role_id: newStaffUser.role_id,
          is_active: newStaffUser.is_active
        }
      });
    }

    if (settings === 'roles') {
      const { name, permissions, is_active } = body;
      if (!name) {
        return NextResponse.json({ error: 'Role name is required.' }, { status: 400 });
      }
      const newRole = {
        id: Math.floor(100000 + Math.random() * 900000),
        name,
        permissions: permissions || [],
        is_active: is_active !== false
      };
      db.roles.push(newRole);
      saveDb(db);
      return NextResponse.json({ success: true, role: newRole });
    }

    return NextResponse.json({ error: 'Endpoint parameters action unsupported.' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ settings: string }> }) {
  const params = await props.params;
  const settings = params.settings;
  const db = await getDbAsync();

  const reqPermission = SETTINGS_PERMISSIONS[settings];
  const auth = await authorize(req, reqPermission);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id && settings !== 'email-templates' && settings !== 'slots-block') {
      return NextResponse.json({ error: 'Item ID is required for editing.' }, { status: 400 });
    }

    if (settings === 'services') {
      const serviceIndex = db.services.findIndex(s => s.id === id);
      if (serviceIndex === -1) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
      
      const srv = db.services[serviceIndex];
      const { title, description, image, base_price, is_active, is_manual_quote, included_items, excluded_items } = body;
      
      if (title !== undefined) srv.title = title;
      if (description !== undefined) srv.description = description;
      if (image !== undefined) srv.image = image;
      if (base_price !== undefined) srv.base_price = Number(base_price);
      if (is_active !== undefined) srv.is_active = is_active;
      if (is_manual_quote !== undefined) srv.is_manual_quote = is_manual_quote;
      if (included_items !== undefined) srv.included_items = included_items;
      if (excluded_items !== undefined) srv.excluded_items = excluded_items;
      srv.updated_at = new Date().toISOString();

      saveDb(db);
      return NextResponse.json({ success: true, service: srv });
    }

    if (settings === 'addons') {
      const index = db.addons.findIndex(a => a.id === id);
      if (index === -1) return NextResponse.json({ error: 'Addon not found.' }, { status: 404 });
      
      const add = db.addons[index];
      const { name, price, pricing_type, is_active } = body;
      if (name !== undefined) add.name = name;
      if (price !== undefined) add.price = Number(price);
      if (pricing_type !== undefined) add.pricing_type = pricing_type;
      if (is_active !== undefined) add.is_active = is_active;

      saveDb(db);
      return NextResponse.json({ success: true, addon: add });
    }

    if (settings === 'pricing-rules') {
      const index = db.pricingRules.findIndex(r => r.id === id);
      if (index === -1) return NextResponse.json({ error: 'Pricing rule not found.' }, { status: 404 });
      
      const r = db.pricingRules[index];
      const { rule_type, rule_name, value, price_adjustment, adjustment_type, is_active } = body;
      if (rule_type !== undefined) r.rule_type = rule_type;
      if (rule_name !== undefined) r.rule_name = rule_name;
      if (value !== undefined) r.value = value;
      if (price_adjustment !== undefined) r.price_adjustment = Number(price_adjustment);
      if (adjustment_type !== undefined) r.adjustment_type = adjustment_type;
      if (is_active !== undefined) r.is_active = is_active;

      saveDb(db);
      return NextResponse.json({ success: true, rule: r });
    }

    if (settings === 'coupons') {
      const index = db.coupons.findIndex(c => c.id === id);
      if (index === -1) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
      
      const cp = db.coupons[index];
      const { code, name, discount_type, discount_value, minimum_order_value, maximum_discount, applicable_services, start_date, end_date, is_active } = body;
      if (code !== undefined) cp.code = code.toUpperCase().trim();
      if (name !== undefined) cp.name = name;
      if (discount_type !== undefined) cp.discount_type = discount_type;
      if (discount_value !== undefined) cp.discount_value = Number(discount_value);
      if (minimum_order_value !== undefined) cp.minimum_order_value = Number(minimum_order_value);
      if (maximum_discount !== undefined) cp.maximum_discount = Number(maximum_discount);
      if (applicable_services !== undefined) cp.applicable_services = applicable_services;
      if (start_date !== undefined) cp.start_date = start_date;
      if (end_date !== undefined) cp.end_date = end_date;
      if (is_active !== undefined) cp.is_active = is_active;

      saveDb(db);
      return NextResponse.json({ success: true, coupon: cp });
    }

    if (settings === 'slots') {
      const index = db.slots.findIndex(s => s.id === id);
      if (index === -1) return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
      
      const sl = db.slots[index];
      const { name, is_active } = body;
      if (name !== undefined) sl.name = name;
      if (is_active !== undefined) sl.is_active = is_active;

      saveDb(db);
      return NextResponse.json({ success: true, slot: sl });
    }

    if (settings === 'enquiries') {
      const index = db.enquiries.findIndex(e => e.id === id);
      if (index === -1) return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
      
      const enq = db.enquiries[index];
      const { status } = body;
      if (status !== undefined) enq.status = status;

      saveDb(db);
      return NextResponse.json({ success: true, enquiry: enq });
    }

    if (settings === 'email-templates') {
      const { templateId, subject, body: tplBody } = body;
      const index = db.emailTemplates.findIndex(tpl => tpl.id === templateId);
      if (index === -1) return NextResponse.json({ error: 'Email template not found.' }, { status: 404 });

      const tpl = db.emailTemplates[index];
      if (subject !== undefined) tpl.subject = subject;
      if (tplBody !== undefined) tpl.body = tplBody;

      saveDb(db);
      return NextResponse.json({ success: true, template: tpl });
    }

    if (settings === 'staff') {
      const index = db.staff.findIndex(s => String(s.id) === String(id));
      if (index === -1) return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 });
      
      const s = db.staff[index];
      const { name, email, phone, role_id, is_active, password } = body;
      
      const userIndex = db.users.findIndex(u => String(u.id) === String(id));
      if (userIndex !== -1) {
        const u = db.users[userIndex];
        if (name !== undefined) u.name = name;
        if (email !== undefined) u.email = email;
        if (phone !== undefined) u.phone = phone;
        if (role_id !== undefined) u.role_id = Number(role_id);
        if (is_active !== undefined) u.is_active = is_active;
        if (password !== undefined && password.trim() !== '') {
          u.password_hash = bcrypt.hashSync(password, 10);
        }
        u.updated_at = new Date().toISOString();
      }

      if (name !== undefined) s.name = name;
      if (email !== undefined) s.email = email;
      if (phone !== undefined) s.phone = phone;
      if (role_id !== undefined) s.role_id = Number(role_id);
      if (is_active !== undefined) s.is_active = is_active;

      // Update staff list
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

      saveDb(db);
      return NextResponse.json({ success: true, staff: s });
    }

    if (settings === 'roles') {
      const index = db.roles.findIndex(r => String(r.id) === String(id));
      if (index === -1) return NextResponse.json({ error: 'Role not found.' }, { status: 404 });
      
      const r = db.roles[index];
      const { name, permissions, is_active } = body;
      if (name !== undefined) r.name = name;
      if (permissions !== undefined) r.permissions = permissions;
      if (is_active !== undefined) r.is_active = is_active;

      saveDb(db);
      return NextResponse.json({ success: true, role: r });
    }

    return NextResponse.json({ error: 'Parameter endpoint editing unsupported.' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ settings: string }> }) {
  const params = await props.params;
  const settings = params.settings;
  const db = await getDbAsync();

  const reqPermission = SETTINGS_PERMISSIONS[settings];
  const auth = await authorize(req, reqPermission);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const uBlockDate = searchParams.get('blockDate');

    if (settings === 'slots' && uBlockDate) {
      if (db.blockedDates) {
        db.blockedDates = db.blockedDates.filter(d => d !== uBlockDate);
        saveDb(db);
      }
      return NextResponse.json({ success: true, blockedDates: db.blockedDates });
    }

    if (!id) {
      return NextResponse.json({ error: 'Target ID is required to remove items.' }, { status: 400 });
    }

    if (settings === 'services') {
      db.services = db.services.filter(s => s.id !== id);
      db.addons = db.addons.filter(a => a.service_id !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (settings === 'addons') {
      db.addons = db.addons.filter(a => a.id !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (settings === 'pricing-rules') {
      db.pricingRules = db.pricingRules.filter(r => r.id !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (settings === 'coupons') {
      db.coupons = db.coupons.filter(c => c.id !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (settings === 'slots') {
      db.slots = db.slots.filter(s => s.id !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (settings === 'enquiries') {
      db.enquiries = db.enquiries.filter(e => e.id !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (settings === 'staff') {
      db.users = db.users.filter(u => String(u.id) !== id);
      db.staff = db.staff.filter(s => String(s.id) !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    if (settings === 'roles') {
      db.roles = db.roles.filter(r => String(r.id) !== id);
      saveDb(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action parameters unsupported.' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
