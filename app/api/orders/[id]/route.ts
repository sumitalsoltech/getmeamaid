import { NextRequest, NextResponse } from 'next/server';
import { getMysql, getPool } from '@/lib/mysql';
import { getDbAsync, triggerEmail } from '@/lib/db';
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

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  try {
    await ensureMigrationColumns();
    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({ error: 'Database client not initialized.' }, { status: 500 });
    }

    // Fetch existing booking from database
    const { data: existingBookingList } = await mysqlClient.from('bookings').select('*').eq('id', id);
    const existing = existingBookingList?.[0];
    if (!existing) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const body = await req.json();

    // 1. Check if they have a valid admin session
    const auth = await authorize(req);
    let isAuthorizedAdmin = false;
    let user = null;

    if (auth.authorized && auth.user) {
      isAuthorizedAdmin = true;
      user = auth.user;
    } else {
      // 2. If not admin, check if they are the customer
      const userIdCookie = req.cookies.get('pristine_user_id')?.value;
      if (userIdCookie) {
        const { data: usersList } = await mysqlClient.from('users').select('*').eq('id', userIdCookie);
        user = usersList?.[0];
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Standard client cancellation (for non-admins)
    if (!isAuthorizedAdmin) {
      if (body.action === 'cancel') {
        if (existing.email !== user.email && existing.user_id !== user.id) {
          return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
        }
        if (['In Progress', 'Completed', 'Settled', 'Closed'].includes(existing.status)) {
          return NextResponse.json({ error: 'Schedules are already in progress and cannot be cancelled automatically. Please raise a ticket.' }, { status: 400 });
        }

        const oldStatus = existing.status;
        
        await mysqlClient.from('bookings').update({
          status: 'Cancelled',
        }).eq('id', id);

        // Log history
        const statusLog = {
          id: `hst-${Math.floor(100000 + Math.random() * 900000)}`,
          order_id: id,
          old_status: oldStatus,
          new_status: 'Cancelled',
          changed_by: 'user',
          note: body.note || 'Cancelled by customer from dashboard.',
          created_at: new Date().toISOString()
        };
        await mysqlClient.from('order_status_history').insert([statusLog]);

        // email admin
        triggerEmail('tpl-ticket-closed', 'admin@gmail.com', {
          customer_name: 'System Alert',
          ticket_id: existing.id,
          status: 'Cancelled [By Customer]'
        });

        const { data: updatedList } = await mysqlClient.from('bookings').select('*').eq('id', id);
        return NextResponse.json({ success: true, order: updatedList?.[0] });
      }

      return NextResponse.json({ error: 'Forbidden administrative operations.' }, { status: 403 });
    }

    // Admin updates
    const oldStatus = existing.status;
    const oldPayment = existing.payment_status;

    // Check permissions for administrative operations
    if (isAuthorizedAdmin) {
      const isStaffUser = String(user.role_id) === '4';

      if (isStaffUser) {
        // Staff can only update their own assigned booking
        if (String(existing.assigned_staff_id) !== String(user.id)) {
          return NextResponse.json({ error: 'Forbidden. You can only update jobs assigned to yourself.' }, { status: 403 });
        }

        // Validate that staff is not attempting to change disallowed fields
        if (body.assigned_staff_id !== undefined && String(body.assigned_staff_id) !== String(existing.assigned_staff_id || '')) {
          return NextResponse.json({ error: 'Forbidden. Staff cannot reassign jobs.' }, { status: 403 });
        }
        if (body.confirmed_date !== undefined && String(body.confirmed_date) !== String(existing.confirmed_date || '')) {
          return NextResponse.json({ error: 'Forbidden. Staff cannot change confirmed date.' }, { status: 403 });
        }
        if (body.confirmed_time !== undefined && String(body.confirmed_time) !== String(existing.confirmed_time || '')) {
          return NextResponse.json({ error: 'Forbidden. Staff cannot change confirmed time.' }, { status: 403 });
        }
        if (body.payment_status !== undefined && String(body.payment_status) !== String(existing.payment_status || '')) {
          return NextResponse.json({ error: 'Forbidden. Staff cannot edit payment status.' }, { status: 403 });
        }
        if (body.final_confirmed_price !== undefined) {
          return NextResponse.json({ error: 'Forbidden. Staff cannot edit price details.' }, { status: 403 });
        }
      } else {
        let requiredPermission = 'edit_orders';
        if (body.assigned_staff_id !== undefined) {
          requiredPermission = 'assign_jobs';
        } else if (body.order_status !== undefined) {
          requiredPermission = 'update_order_status';
        }

        const hasPerm = await checkPermission(user.role_id, requiredPermission);
        if (!hasPerm) {
          return NextResponse.json({ error: `Forbidden. Missing required permission: ${requiredPermission}` }, { status: 403 });
        }
      }
    }

    // Body could contain standard updates or a full booking payload
    const {
      order_status,
      payment_status,
      final_confirmed_price,
      admin_internal_notes,
      customer_visible_notes,
      action
    } = body;

    const updatePayload: any = {};
    if (order_status !== undefined) updatePayload.status = order_status;
    if (payment_status !== undefined) updatePayload.payment_status = payment_status;
    if (body.assigned_staff_id !== undefined) updatePayload.assigned_staff_id = body.assigned_staff_id;
    if (body.job_instructions !== undefined) updatePayload.job_instructions = body.job_instructions;
    if (body.confirmed_date !== undefined) updatePayload.confirmed_date = body.confirmed_date;
    if (body.confirmed_time !== undefined) updatePayload.confirmed_time = body.confirmed_time;
    if (body.staff_job_status !== undefined) updatePayload.staff_job_status = body.staff_job_status;
    if (body.staff_reported_issue !== undefined) updatePayload.staff_reported_issue = body.staff_reported_issue;
    if (admin_internal_notes !== undefined) updatePayload.internal_notes = admin_internal_notes;
    if (body.internal_notes !== undefined) updatePayload.internal_notes = body.internal_notes;
    if (customer_visible_notes !== undefined) updatePayload.customer_visible_notes = customer_visible_notes;
    
    if (final_confirmed_price !== undefined) {
      let pricingObj: any = {};
      try {
        pricingObj = typeof existing.pricing === 'string' ? JSON.parse(existing.pricing) : (existing.pricing || {});
      } catch (e) {}
      pricingObj.total = Number(final_confirmed_price);
      updatePayload.pricing = JSON.stringify(pricingObj);
    }

    // Perform database update
    await mysqlClient.from('bookings').update(updatePayload).eq('id', id);

    // Logger histories
    const logs: string[] = [];
    const newStatus = order_status || existing.status;
    const newPayment = payment_status || existing.payment_status;

    if (order_status && order_status !== oldStatus) logs.push(`Status changed from ${oldStatus} to ${order_status}`);
    if (payment_status && payment_status !== oldPayment) logs.push(`Payment changed from ${oldPayment} to ${payment_status}`);

    if (logs.length > 0) {
      const statusLog = {
        id: `hst-${Math.floor(100000 + Math.random() * 900000)}`,
        order_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: 'admin',
        note: logs.join(', '),
        created_at: new Date().toISOString()
      };
      await mysqlClient.from('order_status_history').insert([statusLog]);
    }

    const { data: finalBookingList } = await mysqlClient.from('bookings').select('*').eq('id', id);
    const updatedOrder = finalBookingList?.[0] || existing;

    const serviceName = updatedOrder.restoration_level || 'Luxury Clean Suite';

    // Manual notifications triggers
    if (action === 'send-quote') {
      triggerEmail('tpl-quote-sent', updatedOrder.email, {
        customer_name: `${updatedOrder.first_name} ${updatedOrder.last_name}`,
        order_id: updatedOrder.id,
        service_name: serviceName,
        preferred_date: updatedOrder.selected_date,
        preferred_slot: updatedOrder.selected_time_slot,
        final_price: `$${updatedOrder.pricing?.total || updatedOrder.pricing || '0.00'}`,
        payment_link: `${req.nextUrl.origin}/dashboard`
      });
    }

    if (action === 'send-payment-link') {
      triggerEmail('tpl-payment-sent', updatedOrder.email, {
        customer_name: `${updatedOrder.first_name} ${updatedOrder.last_name}`,
        order_id: updatedOrder.id,
        service_name: serviceName,
        preferred_date: updatedOrder.selected_date,
        preferred_slot: updatedOrder.selected_time_slot,
        final_price: `$${updatedOrder.pricing?.total || updatedOrder.pricing || '0.00'}`,
        payment_link: `${req.nextUrl.origin}/dashboard?view=payment&id=${updatedOrder.id}`
      });
    }

    // Automated reactive notifications
    if (payment_status === 'Paid' && oldPayment !== 'Paid') {
      triggerEmail('tpl-payment-confirm', updatedOrder.email, {
        customer_name: `${updatedOrder.first_name} ${updatedOrder.last_name}`,
        order_id: updatedOrder.id,
        final_price: `$${updatedOrder.pricing?.total || updatedOrder.pricing || '0.00'}`,
        service_name: serviceName
      });
    }

    if (order_status === 'Scheduled' && oldStatus !== 'Scheduled') {
      triggerEmail('tpl-order-schedule', updatedOrder.email, {
        customer_name: `${updatedOrder.first_name} ${updatedOrder.last_name}`,
        order_id: updatedOrder.id,
        preferred_date: updatedOrder.selected_date,
        preferred_slot: updatedOrder.selected_time_slot,
        final_price: `$${updatedOrder.pricing?.total || updatedOrder.pricing || '0.00'}`,
        service_name: serviceName
      });
    }

    if (order_status === 'Completed' && oldStatus !== 'Completed') {
      triggerEmail('tpl-order-complete', updatedOrder.email, {
        customer_name: `${updatedOrder.first_name} ${updatedOrder.last_name}`,
        order_id: updatedOrder.id,
        service_name: serviceName,
        preferred_date: updatedOrder.selected_date,
        preferred_slot: updatedOrder.selected_time_slot,
        final_price: `$${updatedOrder.pricing?.total || updatedOrder.pricing || '0.00'}`
      });
    }

    return NextResponse.json({ success: true, order: updatedOrder });

  } catch (err: any) {
    console.error('Error modifying order:', err);
    return NextResponse.json({ error: err.message || 'Error occurred modifying order.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  try {
    await ensureMigrationColumns();
    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({ error: 'Database client not initialized.' }, { status: 500 });
    }

    const { data: bookingsList } = await mysqlClient.from('bookings').select('*').eq('id', id);
    const order = bookingsList?.[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 1. Check if they have an admin session
    const auth = await authorize(req, 'view_orders');
    let isAuthorizedAdmin = auth.authorized;
    let user = auth.user;

    // Check if the user is a staff member assigned to this job
    if (!isAuthorizedAdmin && user && String(user.role_id) === '4') {
      if (String(order.assigned_staff_id) === String(user.id)) {
        isAuthorizedAdmin = true;
      }
    }

    if (!isAuthorizedAdmin) {
      // 2. If not admin/assigned staff, check if they are the customer
      const userIdCookie = req.cookies.get('pristine_user_id')?.value;
      if (userIdCookie) {
        const { data: usersList } = await mysqlClient.from('users').select('*').eq('id', userIdCookie);
        user = usersList?.[0];
      }
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
      }

      if (order.email !== user.email && order.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    }

    // Get order status timeline
    const { data: history } = await mysqlClient.from('order_status_history').select('*').eq('order_id', id);

    return NextResponse.json({ order, history: history || [] });

  } catch (err: any) {
    console.error('Error loading order details:', err);
    return NextResponse.json({ error: err.message || 'Error occurred loading order details.' }, { status: 500 });
  }
}
