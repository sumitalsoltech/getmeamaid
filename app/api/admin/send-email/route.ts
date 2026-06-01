import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getEmailTemplates, logEmail } from '@/lib/dbStore';

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
    const body = await req.json();
    const {
      recipientEmail,
      templateId,
      orderData = {},
      sentBy = 'administrator',
      force = false
    } = body;

    const templates = getEmailTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return NextResponse.json({ success: false, error: `Email template '${templateId}' not found.` }, { status: 404 });
    }

    if (!template.is_active && !force) {
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
      final_amount: orderData.final_amount || (orderData.pricing ? (typeof orderData.pricing === 'string' ? JSON.parse(orderData.pricing).total : orderData.pricing.total) : '') || '$140.00',
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
    const logged = logEmail({
      email_type: template.name,
      recipient_email: recipientEmail,
      related_entity_id: placeholders.order_id || placeholders.ticket_id,
      template_used: template.id,
      sent_by: sentBy,
      status: sentStatus,
      error_message: errorMessage
    });

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
