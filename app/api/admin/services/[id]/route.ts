import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync, saveDb } from '@/lib/db';
import { authorize } from '@/lib/authMiddleware';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(req, 'manage_services');
    if (!auth.authorized) {
      return auth.response!;
    }
    const { id } = await props.params;
    const body = await req.json();
    
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('services')
        .update(body)
        .eq('id', id)
        .select()
        .single();
      
      if (!error) {
        return NextResponse.json({ success: true, service: data });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    const serviceIndex = db.services.findIndex(s => s.id === id);
    if (serviceIndex === -1) {
      return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
    }
    const srv = db.services[serviceIndex];
    if (body.title !== undefined) srv.title = body.title;
    if (body.description !== undefined) srv.description = body.description;
    if (body.image !== undefined) srv.image = body.image;
    if (body.base_price !== undefined) srv.base_price = Number(body.base_price);
    if (body.is_active !== undefined) srv.is_active = body.is_active;
    if (body.is_manual_quote !== undefined) srv.is_manual_quote = body.is_manual_quote;
    if (body.is_featured !== undefined) srv.is_featured = body.is_featured;
    if (body.included_items !== undefined) srv.included_items = body.included_items;
    if (body.excluded_items !== undefined) srv.excluded_items = body.excluded_items;
    if (body.display_order !== undefined) srv.display_order = Number(body.display_order);
    if (body.full_description !== undefined) srv.full_description = body.full_description;
    if (body.faqs !== undefined) srv.faqs = body.faqs;
    if (body.notes !== undefined) srv.notes = body.notes;
    srv.updated_at = new Date().toISOString();
    
    saveDb(db);
    return NextResponse.json({ success: true, service: srv });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(req, 'manage_services');
    if (!auth.authorized) {
      return auth.response!;
    }
    const { id } = await props.params;
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { error } = await mysqlClient
        .from('services')
        .delete()
        .eq('id', id);
      
      if (!error) {
        return NextResponse.json({ success: true });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    db.services = db.services.filter(s => s.id !== id);
    saveDb(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
