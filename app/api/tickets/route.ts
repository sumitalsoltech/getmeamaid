import { NextRequest, NextResponse } from 'next/server';
import { getDbAsync, saveDb, triggerEmail, Ticket, TicketReply } from '@/lib/db';
import { checkPermission } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    const db = await getDbAsync();
    const userIdCookie = req.cookies.get('pristine_user_id')?.value;
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = db.users.find(u => String(u.id) === userIdCookie);
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId');

    if (ticketId) {
      const ticket = db.tickets.find(t => t.id === ticketId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
      }

      if (!user.is_admin && ticket.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }

      const replies = db.ticketReplies.filter(r => r.ticket_id === ticketId).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return NextResponse.json({ ticket, replies });
    }

    const canViewAll = user.is_admin || (user.role_id ? await checkPermission(user.role_id, 'manage_tickets') : false);
    if (canViewAll) {
      const enrichedTickets = db.tickets.map(t => {
        const owner = db.users.find(u => u.id === t.user_id);
        const customer_name = owner ? owner.name : 'Valued Client';
        const replies = db.ticketReplies
          .filter(r => r.ticket_id === t.id)
          .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map(r => ({
            sender: r.sender_type === 'admin' ? 'Support Administrator' : 'Customer',
            message: r.message,
            date: r.created_at
          }));
        return { ...t, customer_name, replies };
      });
      return NextResponse.json({ tickets: enrichedTickets });
    }

    const myTickets = db.tickets.filter(t => t.user_id === user.id).map(t => {
      const owner = db.users.find(u => u.id === t.user_id);
      const customer_name = owner ? owner.name : 'Valued Client';
      const replies = db.ticketReplies
        .filter(r => r.ticket_id === t.id)
        .sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .map(r => ({
          sender: r.sender_type === 'admin' ? 'Support Administrator' : 'Customer',
          message: r.message,
          date: r.created_at
        }));
      return { ...t, customer_name, replies };
    });
    return NextResponse.json({ tickets: myTickets });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error occurred listing tickets.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDbAsync();
    const userIdCookie = req.cookies.get('pristine_user_id')?.value;
    if (!userIdCookie) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = db.users.find(u => String(u.id) === userIdCookie);
    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    // A. REPLY TO AN EXISTING TICKET
    if (action === 'reply') {
      const { ticketId, message, attachment } = body;
      if (!ticketId || !message) {
        return NextResponse.json({ error: 'Ticket ID and message content are required.' }, { status: 400 });
      }

      const ticket = db.tickets.find(t => t.id === ticketId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
      }

      // Check access permission
      const isSupportReply = user.is_admin || (user.role_id ? await checkPermission(user.role_id, 'manage_tickets') : false);
      if (!isSupportReply && ticket.user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }

      const senderType = isSupportReply ? 'admin' : 'user';

      const newReply: TicketReply = {
        id: `rep-${Math.floor(100000 + Math.random() * 900000)}`,
        ticket_id: ticketId,
        sender_type: senderType,
        sender_id: String(user.id),
        message,
        attachment: attachment || '',
        created_at: new Date().toISOString()
      };

      db.ticketReplies.push(newReply);

      // Adjust ticket status
      if (isSupportReply) {
        ticket.status = 'Waiting for Customer';
      } else {
        ticket.status = 'Open';
      }
      ticket.updated_at = new Date().toISOString();

      saveDb(db);

      // Trigger Email Events
      if (isSupportReply) {
        // Find owner of ticket to notify
        const ticketOwner = db.users.find(u => u.id === ticket.user_id);
        if (ticketOwner) {
          triggerEmail('tpl-ticket-replied', ticketOwner.email, {
            customer_name: ticketOwner.name,
            ticket_id: ticket.ticket_number
          });
        }
      } else {
        // Notify admin
        triggerEmail('tpl-ticket-replied', 'admin@gmail.com', {
          customer_name: `ADMIN [Reply from ${user.name}]`,
          ticket_id: ticket.ticket_number
        });
      }

      return NextResponse.json({ success: true, reply: newReply });
    }

    // B. UPDATE TICKET STATUS (Admin Only)
    if (action === 'status') {
      const isSupport = user.is_admin || (user.role_id ? await checkPermission(user.role_id, 'manage_tickets') : false);
      if (!isSupport) {
        return NextResponse.json({ error: 'Forbidden administrative operations.' }, { status: 403 });
      }

      const { ticketId, status } = body;
      if (!ticketId || !status) {
        return NextResponse.json({ error: 'Ticket ID and target status are required.' }, { status: 400 });
      }

      const ticket = db.tickets.find(t => t.id === ticketId);
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
      }

      const oldStatus = ticket.status;
      ticket.status = status;
      ticket.updated_at = new Date().toISOString();
      saveDb(db);

      const ticketOwner = db.users.find(u => u.id === ticket.user_id);

      if (ticketOwner) {
        if (status === 'Closed' && oldStatus !== 'Closed') {
          triggerEmail('tpl-ticket-closed', ticketOwner.email, {
            customer_name: ticketOwner.name,
            ticket_id: ticket.ticket_number
          });
        } else {
          // General change notify
          triggerEmail('tpl-ticket-created', ticketOwner.email, {
            customer_name: ticketOwner.name,
            ticket_id: ticket.ticket_number,
            status: ticket.status
          });
        }
      }

      return NextResponse.json({ success: true, ticket });
    }

    // C. CREATE A NEW TICKET
    const { orderId, category, subject, message, priority = 'Medium', attachment } = body;

    if (!category || !subject || !message) {
      return NextResponse.json({ error: 'Category, subject, and message description are required.' }, { status: 400 });
    }

    const ticketNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTicket: Ticket = {
      id: `tkt-${Math.floor(100000 + Math.random() * 900000)}`,
      ticket_number: ticketNumber,
      user_id: user.id,
      order_id: orderId || '',
      category,
      subject,
      message,
      priority,
      status: 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.tickets.push(newTicket);
    saveDb(db);

    // Dynamic notify
    triggerEmail('tpl-ticket-created', user.email, {
      customer_name: user.name,
      ticket_id: newTicket.ticket_number,
      status: 'UNDER REVIEW'
    });

    // Notify Admin
    triggerEmail('tpl-ticket-created', 'admin@gmail.com', {
      customer_name: `ADMIN [New Ticket - ${user.name}]`,
      ticket_id: newTicket.ticket_number,
      status: 'PENDING CLIENT ASSIGNMENTS'
    });

    return NextResponse.json({ success: true, ticket: newTicket });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error occurred modifying ticket logs.' }, { status: 500 });
  }
}
