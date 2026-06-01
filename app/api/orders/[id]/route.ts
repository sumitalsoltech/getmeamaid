import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync, triggerEmail } from '@/lib/db';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  try {
    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({ error: 'Database client not initialized.' }, { status: 500 });
    }

    const userIdCookie = req.cookies.get('pristine_user_id')?.value;
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Fetch user details from database
    const { data: usersList } = await mysqlClient.from('app_users').select('*').eq('id', userIdCookie);
    const user = usersList?.[0];
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 401 });
    }

    // Fetch existing booking from database
    const { data: existingBookingList } = await mysqlClient.from('bookings').select('*').eq('id', id);
    const existing = existingBookingList?.[0];
    if (!existing) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const body = await req.json();

    // Standard client cancellation
    if (!user.is_admin) {
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
        triggerEmail('tpl-ticket-closed', 'curator@pristineeditorial.com', {
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
    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({ error: 'Database client not initialized.' }, { status: 500 });
    }

    const userIdCookie = req.cookies.get('pristine_user_id')?.value;
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { data: usersList } = await mysqlClient.from('app_users').select('*').eq('id', userIdCookie);
    const user = usersList?.[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 401 });
    }

    const { data: bookingsList } = await mysqlClient.from('bookings').select('*').eq('id', id);
    const order = bookingsList?.[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (!user.is_admin && order.email !== user.email && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // Get order status timeline
    const { data: history } = await mysqlClient.from('order_status_history').select('*').eq('order_id', id);

    return NextResponse.json({ order, history: history || [] });

  } catch (err: any) {
    console.error('Error loading order details:', err);
    return NextResponse.json({ error: err.message || 'Error occurred loading order details.' }, { status: 500 });
  }
}
