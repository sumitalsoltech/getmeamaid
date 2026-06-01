import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getEmailTemplates, logEmail } from '@/lib/dbStore';
import { getMysql } from '@/lib/mysql';
import { authorize } from '@/lib/authMiddleware';

function replacePlaceholders(text: string, data: Record<string, any>): string {
  let result = text;
  for (const key of Object.keys(data)) {
    const value = data[key];
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value !== undefined && value !== null ? String(value) : '');
  }
  // Remove any remaining unused placeholders
  result = result.replace(/\{\{\s*\w+\s*\}\}/gi, '');
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, 'manage_email_templates');
    if (!auth.authorized) {
      return auth.response!;
    }

    if (auth.user && Number(auth.user.role_id) === 4) {
      return NextResponse.json({ success: false, error: 'Forbidden. Field staff are not permitted to dispatch manual emails.' }, { status: 403 });
    }

    const body = await req.json();
    const recipientEmail = body.recipientEmail || body.recipient_email || body.to_email;
    const templateId = body.templateId || body.email_type || body.template_used;
    const orderData = body.orderData || body || {};
    const sentBy = auth.user?.name || body.sentBy || body.sent_by || 'administrator';
    const force = body.force || false;

    const mysqlClient = getMysql();
    let template: any = null;
    if (mysqlClient) {
      const { data } = await mysqlClient.from('email_templates').select('*').eq('id', templateId);
      template = data?.[0];
    }
    if (!template) {
      const templates = getEmailTemplates();
      template = templates.find(t => t.id === templateId);
    }

    if (!template) {
      return NextResponse.json({ success: false, error: `Email template '${templateId}' not found.` }, { status: 404 });
    }

    const isActive = template.is_active === undefined || template.is_active === null || !!template.is_active;
    if (!isActive && !force) {
      return NextResponse.json({ success: false, error: 'Template is inactive.' }, { status: 400 });
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json({ success: false, error: 'Invalid recipient email address.' }, { status: 400 });
    }

    // Standard high-fidelity placeholder dictionary compilation
    const placeholders: Record<string, any> = {
      customer_name: orderData.customer_name || `${orderData.first_name || ''} ${orderData.last_name || ''}`.trim() || 'Client',
      order_id: orderData.order_id || orderData.id || 'PRE-NEW',
      service_name: orderData.service_name || orderData.restoration_level || 'Atelier Standard',
      final_amount: orderData.final_amount || orderData.amount || (orderData.pricing ? (typeof orderData.pricing === 'string' ? JSON.parse(orderData.pricing).total : orderData.pricing.total) : '') || '$180.00',
      coupon_code: orderData.coupon_code || orderData.coupon || '-',
      discount_amount: orderData.discount_amount || '$0.00',
      payment_link: orderData.payment_link || `https://getmeamaid.ca/payment/${orderData.id || 'new'}`,
      preferred_date: orderData.preferred_date || orderData.selected_date || 'TBD',
      preferred_slot: orderData.preferred_slot || orderData.selected_time_slot || 'TBD',
      invoice_link: orderData.invoice_link || `https://getmeamaid.ca/invoice/${orderData.id || 'new'}`,
      ticket_id: orderData.ticket_id || 'TKT-NEW',
      status: orderData.status || orderData.order_status || 'Active',
      set_password_link: orderData.set_password_link || `https://getmeamaid.ca/setup-credentials?email=${encodeURIComponent(recipientEmail)}`,
      staff_name: orderData.staff_name || 'Assigned Curator'
    };

    const finalSubject = replacePlaceholders(template.subject, placeholders);
    const finalHtmlBody = replacePlaceholders(template.body, placeholders);

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST || "sandbox.smtp.mailtrap.io",
      port: Number(process.env.MAILTRAP_SMTP_PORT) || 2525,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER || "1df975b5e35782",
        pass: process.env.MAILTRAP_SMTP_PASS || "b7dc1e0a878045"
      }
    });

    let sentStatus: 'sent' | 'failed' = 'sent';
    let errorMessage: string | undefined = undefined;

    try {
      await transporter.sendMail({
        from: '"getmeamaid Console" <concierge@getmeamaid.ca>',
        to: recipientEmail,
        subject: finalSubject,
        html: finalHtmlBody
      });
    } catch (mailError: any) {
      console.error('Mail delivery failure:', mailError);
      sentStatus = 'failed';
      errorMessage = mailError.message || 'SMTP Handshake Error';
    }

    // Save transaction in logs
    const newLogId = `log-${Math.floor(100000 + Math.random() * 900000)}`;
    const timestamp = new Date().toISOString();
    let logged: any = null;

    if (mysqlClient) {
      const { error } = await mysqlClient.from('email_logs').insert([{
        id: newLogId,
        email_type: template.name,
        recipient_email: recipientEmail,
        to_email: recipientEmail,
        subject: finalSubject,
        body: finalHtmlBody,
        related_entity_id: placeholders.order_id || placeholders.ticket_id,
        template_used: template.id,
        sent_by: sentBy,
        status: sentStatus,
        error_message: errorMessage,
        sent_at: timestamp
      }]);
      if (!error) {
        logged = {
          id: newLogId,
          email_type: template.name,
          recipient_email: recipientEmail,
          related_entity_id: placeholders.order_id || placeholders.ticket_id,
          template_used: template.id,
          sent_by: sentBy,
          created_at: timestamp,
          status: sentStatus,
          error_message: errorMessage
        };
      }
    }

    if (!logged) {
      logged = logEmail({
        email_type: template.name,
        recipient_email: recipientEmail,
        related_entity_id: placeholders.order_id || placeholders.ticket_id,
        template_used: template.id,
        sent_by: sentBy,
        status: sentStatus,
        error_message: errorMessage
      });
    }

    return NextResponse.json({
      success: sentStatus === 'sent',
      log: logged,
      subject: finalSubject,
      htmlBody: finalHtmlBody,
      error: errorMessage
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
