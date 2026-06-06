import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getMysql, getPool } from '@/lib/mysql';
import { getLocalBookings, saveLocalBooking, BookingRecord, logEmail } from '@/lib/dbStore';
import { authorize, checkPermission } from '@/lib/authMiddleware';

async function ensureMigrationColumns() {
  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const pool = getPool();
      
      // 1. Check bookings table columns for staff_reported_issue
      const [bookingsCols]: any = await pool.query(`
        SHOW COLUMNS FROM \`bookings\` LIKE 'staff_reported_issue'
      `);
      if (Array.isArray(bookingsCols) && bookingsCols.length === 0) {
        console.log('[Migration] Adding staff_reported_issue column to bookings table...');
        await pool.query(`
          ALTER TABLE \`bookings\` ADD COLUMN \`staff_reported_issue\` TEXT NULL
        `);
        console.log('[Migration] Column staff_reported_issue added successfully to bookings table.');
      }

      // 2. Check orders table columns for staff_reported_issue
      const [ordersCols]: any = await pool.query(`
        SHOW COLUMNS FROM \`orders\` LIKE 'staff_reported_issue'
      `);
      if (Array.isArray(ordersCols) && ordersCols.length === 0) {
        console.log('[Migration] Adding staff_reported_issue column to orders table...');
        await pool.query(`
          ALTER TABLE \`orders\` ADD COLUMN \`staff_reported_issue\` TEXT NULL
        `);
        console.log('[Migration] Column staff_reported_issue added successfully to orders table.');
      }

      // 3. Check orders table columns for staff_job_status
      const [ordersStatusCols]: any = await pool.query(`
        SHOW COLUMNS FROM \`orders\` LIKE 'staff_job_status'
      `);
      if (Array.isArray(ordersStatusCols) && ordersStatusCols.length === 0) {
        console.log('[Migration] Adding staff_job_status column to orders table...');
        await pool.query(`
          ALTER TABLE \`orders\` ADD COLUMN \`staff_job_status\` VARCHAR(191) NULL
        `);
        console.log('[Migration] Column staff_job_status added successfully to orders table.');
      }

      // 4. Check bookings table columns for staff_job_status
      const [bookingsStatusCols]: any = await pool.query(`
        SHOW COLUMNS FROM \`bookings\` LIKE 'staff_job_status'
      `);
      if (Array.isArray(bookingsStatusCols) && bookingsStatusCols.length === 0) {
        console.log('[Migration] Adding staff_job_status column to bookings table...');
        await pool.query(`
          ALTER TABLE \`bookings\` ADD COLUMN \`staff_job_status\` VARCHAR(191) NULL
        `);
        console.log('[Migration] Column staff_job_status added successfully to bookings table.');
      }
    }
  } catch (err) {
    console.error('[Migration] Failed to verify or add columns:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureMigrationColumns();
    const auth = await authorize(req);
    if (!auth.authorized || !auth.user) {
      return auth.response || NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = auth.user;
    const isStaffUser = String(user.role_id) === '4';

    // If not a staff user, check if they have 'view_orders' permission
    if (!isStaffUser) {
      const hasPerm = await checkPermission(user.role_id, 'view_orders');
      if (!hasPerm) {
        return NextResponse.json({ error: 'Forbidden. Missing view_orders permission.' }, { status: 403 });
      }
    }

    const mysqlClient = getMysql();
    if (mysqlClient) {
      let query = mysqlClient.from('bookings').select('*');
      
      if (isStaffUser) {
        query = query.eq('assigned_staff_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (!error) {
        const list = data.length > 0 ? data : (isStaffUser ? getLocalBookings().filter(b => String((b as any).assigned_staff_id) === String(user.id)) : getLocalBookings());
        return NextResponse.json({ bookings: list, orders: list });
      }
      console.error('MySQL fetch error, falling back to memory:', error);
    }
    
    let local = getLocalBookings();
    if (isStaffUser) {
      local = local.filter(b => String((b as any).assigned_staff_id) === String(user.id));
    }
    return NextResponse.json({ bookings: local, orders: local });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      postal,
      homeType,
      bedrooms,
      bathrooms,
      squareFootage,
      restorationLevel,
      frequency,
      addons,
      selectedDate,
      selectedTimeSlot,
      entryMethod,
      customKeyNotes,
      customerSpecialNotes,
      firstName,
      lastName,
      email,
      phone,
      cardName,
      pricing,
      dispatchRef,
      status = "Confirmed"
    } = body;

    const cleanEmail = typeof email === 'string' ? email.trim() : '';
    if (!cleanEmail || !cleanEmail.includes('@') || !firstName || !dispatchRef) {
      return NextResponse.json({ error: 'Missing or invalid mandatory fields. Please enter a valid email address.' }, { status: 400 });
    }

    const newBooking: BookingRecord = {
      id: dispatchRef,
      postal_code: postal || "",
      home_type: homeType || "",
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      square_footage: Number(squareFootage) || 0,
      restoration_level: restorationLevel || "",
      frequency: frequency || "",
      addons: addons ? JSON.stringify(addons) : "[]",
      selected_date: selectedDate || "",
      selected_time_slot: selectedTimeSlot || "",
      entry_method: entryMethod || "",
      custom_key_notes: customKeyNotes || "",
      customer_special_notes: customerSpecialNotes || "",
      first_name: firstName,
      last_name: lastName || "",
      email: cleanEmail,
      phone: phone || "",
      card_name: cardName || "",
      pricing: pricing ? JSON.stringify(pricing) : "{}",
      status,
      created_at: new Date().toISOString()
    };

    // 1. Try to save in MySQL
    let savedInMysql = false;
    let dbError = null;
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { error } = await mysqlClient.from('bookings').insert([newBooking]);
      if (!error) {
        savedInMysql = true;
      } else {
        dbError = error;
        console.error('MySQL save error detail:', JSON.stringify(error));
      }
    }

    // Always keep a local copy in memory/sandbox for viewing
    saveLocalBooking(newBooking);

    // 2. Setup mailer with user-specified Mailtrap parameters
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.MAILTRAP_SMTP_PORT) || 2525,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER || "1df975b5e35782",
        pass: process.env.MAILTRAP_SMTP_PASS || "b7dc1e0a878045"
      }
    });

    // Formulate a beautifully branded HTML email matching the high-fidelity getmeamaid design
    const formattedTotal = pricing?.total ? `$${pricing.total.toFixed(2)}` : '$0.00';
    const formattedSubtotal = pricing?.subtotal ? `$${pricing.subtotal.toFixed(2)}` : '$0.00';
    const formattedTax = pricing?.tax ? `$${pricing.tax.toFixed(2)}` : '$0.00';
    const formattedFee = pricing?.service_fee || pricing?.serviceFee ? `$${(pricing.service_fee || pricing.serviceFee).toFixed(2)}` : '$0.00';
    const formattedDiscount = pricing?.frequencyDiscount ? `-$${pricing.frequencyDiscount.toFixed(2)}` : '$0.00';

    const isManualQuote = status === 'Quote Proposed';
    const emailSubject = isManualQuote
      ? `✨ [getmeamaid] Quote Received - Pending Estimation Verification [Ref: ${dispatchRef}]`
      : `✨ [getmeamaid] Your Premium Home Care Booking [Ref: ${dispatchRef}]`;

    const emailGreeting = isManualQuote
      ? `Your Bespoke Quote Request is Received, ${firstName}!`
      : `Thank Your For Choosing getmeamaid, ${firstName}!`;

    const emailDescription = isManualQuote
      ? `Your high-touch home cleaning estimation request has been successfully received. Below is the temporary estimate configuration. Our administrative caretakers will review and verify your layout shortly.`
      : `Your bespoke home cleaning appointment has been registered and confirmed. Below is the active dispatch blueprint detailing our curated approach for your property.`;

    const mailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailSubject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #0f172a;
            padding: 32px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 0.15em;
            color: #ffffff;
            text-transform: uppercase;
            margin: 0;
          }
          .subtitle {
            font-size: 10px;
            letter-spacing: 0.3em;
            color: #fbbf24;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .content {
            padding: 40px 32px;
          }
          .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 8px 0;
          }
          .ref {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-family: monospace;
            margin-bottom: 24px;
          }
          .details-card {
            background: #f1f5f9;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 32px;
          }
          .details-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin: 0 0 12px 0;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 6px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            margin-bottom: 8px;
          }
          .details-row span:first-child {
            color: #64748b;
          }
          .details-row span:last-child {
            font-weight: 600;
            color: #0f172a;
          }
          .price-block {
            border-top: 1px dashed #cbd5e1;
            padding-top: 12px;
            margin-top: 16px;
          }
          .price-total {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">getmeamaid</h1>
            <div class="subtitle">Premium Home Care</div>
          </div>
          <div class="content">
            <h2 class="greeting">${emailGreeting}</h2>
            <div class="ref">Dispatch Code: ${dispatchRef}</div>
            
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
              ${emailDescription}
            </p>
            
            <div class="details-card">
              <h3 class="details-title">Care & Timing Profile</h3>
              <div class="details-row"><span>Scheduled Arrival Date</span><span>${selectedDate}</span></div>
              <div class="details-row"><span>Target Time Window</span><span>${selectedTimeSlot}</span></div>
              <div class="details-row"><span>Curation Suite</span><span>${restorationLevel}</span></div>
              <div class="details-row"><span>Service Frequency</span><span>${frequency}</span></div>
              <div class="details-row"><span>Postal Sector</span><span>${postal}</span></div>
            </div>

            <div class="details-card">
              <h3 class="details-title">Property Scope</h3>
              <div class="details-row"><span>Bedrooms Layout</span><span>${bedrooms}</span></div>
              <div class="details-row"><span>Bathrooms Count</span><span>${bathrooms}</span></div>
              <div class="details-row"><span>Square Footage</span><span>~${squareFootage} sq. ft.</span></div>
              <div class="details-row"><span>Access Method</span><span>${entryMethod}</span></div>
            </div>

            <div class="details-card">
              <h3 class="details-title">Pricing Breakdown</h3>
              <div class="details-row"><span>Base Cleaning Curation</span><span>$${pricing?.baseService?.toFixed(2) || '0.00'}</span></div>
              <div class="details-row"><span>Room Modifiers</span><span>$${pricing?.roomModifiers?.toFixed(2) || '0.00'}</span></div>
              <div class="details-row"><span>Add-ons Surcharge</span><span>$${pricing?.addonsTotal?.toFixed(2) || '0.00'}</span></div>
              ${pricing?.frequencyDiscount ? `<div class="details-row"><span>Frequency Reward</span><span style="color:#10b981;">${formattedDiscount}</span></div>` : ''}
              <div class="details-row"><span>Cleaners Trust Insurance (5%)</span><span>${formattedFee}</span></div>
              <div class="details-row"><span>Provincial Sales Tax (13%)</span><span>${formattedTax}</span></div>
              <div class="details-row price-block"><span class="price-total">Billed Total Billed</span><span class="price-total" style="color: #0f172a;">${formattedTotal}</span></div>
            </div>
            
            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin-top: 32px;">
              *Payment Authorizations carry active custom coverage policies. If cancellation is needed, please perform via client communications over 24 hours in advance to avoid any administrative fees.
            </p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} getmeamaid Co. • 100 King Street West, Toronto, ON M5X 1A9<br/>
            All booking processes are handled under our secure escrow agreements.
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: '"getmeamaid Dispatch" <dispatch@getmeamaid.com>',
      to: cleanEmail,
      subject: emailSubject,
      html: mailHtml,
    });

    // Logging the successful system dispatch automatically
    try {
      logEmail({
        email_type: 'Order confirmation',
        recipient_email: cleanEmail,
        related_entity_id: dispatchRef,
        template_used: 'order_confirmation',
        sent_by: 'system',
        status: 'sent'
      });
    } catch (logErr) {
      console.error('Email logger failure:', logErr);
    }

    return NextResponse.json({
      success: true,
      dispatchRef,
      savedInMysql,
      dbError
    });
  } catch (err: any) {
    console.error('API Orders POST error:', err);
    return NextResponse.json({ error: err.message || 'Unknown server error.' }, { status: 500 });
  }
}
