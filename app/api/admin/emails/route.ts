import { NextRequest, NextResponse } from 'next/server';
import { getEmailTemplates, saveEmailTemplate, getEmailLogs, deleteEmailLogs } from '@/lib/dbStore';

export async function GET(req: NextRequest) {
  try {
    const templates = getEmailTemplates();
    const logs = getEmailLogs();
    return NextResponse.json({ success: true, templates, logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, subject, body: emailBody, is_active } = body;

    if (action === 'clear_logs') {
      deleteEmailLogs();
      return NextResponse.json({ success: true, logs: [] });
    }

    if (id) {
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
