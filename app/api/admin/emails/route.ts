import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getEmailTemplates, saveEmailTemplate, getEmailLogs, deleteEmailLogs } from '@/lib/dbStore';
import nodemailer from 'nodemailer';
import { authorize } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, 'manage_email_templates');
    if (!auth.authorized) {
      return auth.response!;
    }
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data: templatesData, error: tplError } = await mysqlClient
        .from('email_templates')
        .select('*');
        
      const { data: logsData, error: logsError } = await mysqlClient
        .from('email_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (!tplError && !logsError && templatesData) {
        // Map templates
        const templates = templatesData.map((t: any) => ({
          ...t,
          is_active: t.is_active === undefined || t.is_active === null ? true : !!t.is_active
        }));
        
        // Map logs as expected by frontend
        const logs = (logsData || []).map((l: any) => ({
          id: l.id,
          email_type: l.email_type || l.subject || 'Standard Curation Email',
          recipient_email: l.recipient_email || l.to_email || 'Client',
          related_entity_id: l.related_entity_id || '-',
          template_used: l.template_used || '-',
          sent_by: l.sent_by || 'system',
          created_at: l.sent_at,
          timestamp: l.sent_at,
          status: l.status || 'sent',
          error_message: l.error_message
        }));

        return NextResponse.json({ success: true, templates, logs });
      }
    }

    const templates = getEmailTemplates();
    const logs = getEmailLogs();
    return NextResponse.json({ success: true, templates, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, 'manage_email_templates');
    if (!auth.authorized) {
      return auth.response!;
    }
    const body = await req.json();
    const { action, id, subject, body: emailBody, is_active } = body;
    const mysqlClient = getMysql();

    if (action === 'clear_logs') {
      if (mysqlClient) {
        const { error } = await mysqlClient.from('email_logs').delete();
        if (!error) {
          return NextResponse.json({ success: true, logs: [] });
        }
      }
      deleteEmailLogs();
      return NextResponse.json({ success: true, logs: [] });
    }

    if (action === 'resend_log') {
      const { logId } = body;
      if (!logId) {
        return NextResponse.json({ success: false, error: 'logId parameter is required' }, { status: 400 });
      }

      let logObj: any = null;
      if (mysqlClient) {
        const { data } = await mysqlClient.from('email_logs').select('*').eq('id', logId);
        logObj = data?.[0];
      }
      if (!logObj) {
        const localLogs = getEmailLogs();
        logObj = localLogs.find(l => l.id === logId);
      }

      if (!logObj) {
        return NextResponse.json({ success: false, error: `Email log '${logId}' not found.` }, { status: 404 });
      }

      const recipient = logObj.recipient_email || logObj.to_email || logObj.to;
      const finalSubject = logObj.subject || 'getmeamaid Re-dispatch';
      const finalBody = logObj.body || '';

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
          to: recipient,
          subject: finalSubject,
          html: finalBody
        });
      } catch (mailError: any) {
        console.error('Resend delivery failure:', mailError);
        sentStatus = 'failed';
        errorMessage = mailError.message || 'SMTP Handshake Error';
      }

      const newLogId = `log-${Math.floor(100000 + Math.random() * 900000)}`;
      const timestamp = new Date().toISOString();

      if (mysqlClient) {
        await mysqlClient.from('email_logs').insert([{
          id: newLogId,
          email_type: logObj.email_type || 'Resend',
          recipient_email: recipient,
          to_email: recipient,
          subject: finalSubject,
          body: finalBody,
          related_entity_id: logObj.related_entity_id,
          template_used: logObj.template_used,
          sent_by: 'administrator',
          status: sentStatus,
          error_message: errorMessage,
          sent_at: timestamp
        }]);
      } else {
        const loggedObj = {
          id: newLogId,
          email_type: logObj.email_type || 'Resend',
          recipient_email: recipient,
          related_entity_id: logObj.related_entity_id || '-',
          template_used: logObj.template_used || '-',
          sent_by: 'administrator',
          created_at: timestamp,
          status: sentStatus,
          error_message: errorMessage
        };
        if (globalThis.__emailLogsStore) {
          globalThis.__emailLogsStore.unshift(loggedObj);
        }
      }

      return NextResponse.json({ success: sentStatus === 'sent', error: errorMessage });
    }

    if (id) {
      if (mysqlClient) {
        const { error } = await mysqlClient.from('email_templates').update({
          subject: subject ?? undefined,
          body: emailBody ?? undefined,
          is_active: is_active !== undefined ? (is_active ? 1 : 0) : undefined
        }).eq('id', id);
        
        if (!error) {
          const { data } = await mysqlClient.from('email_templates').select('*');
          const templates = (data || []).map((t: any) => ({
            ...t,
            is_active: t.is_active === undefined || t.is_active === null ? true : !!t.is_active
          }));
          return NextResponse.json({ success: true, templates });
        }
      }

      saveEmailTemplate(id, {
        subject: subject ?? undefined,
        body: emailBody ?? undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined
      });
      const templates = getEmailTemplates();
      return NextResponse.json({ success: true, templates });
    }

    return NextResponse.json({ success: false, error: 'Invalid operation parameters' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
