import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync, saveDbAsync } from '@/lib/db';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string; mapping_id: string }> }) {
  try {
    const { id, mapping_id } = await props.params;
    const body = await req.json();
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('service_pricing_rules')
        .update(body)
        .eq('id', mapping_id)
        .select()
        .single();
      
      if (!error) {
        return NextResponse.json({ success: true, mapping: data });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    if (!db.servicePricingRules) db.servicePricingRules = [];
    const index = db.servicePricingRules.findIndex((m: any) => m.id === mapping_id);
    if (index === -1) {
      return NextResponse.json({ error: 'Mapping not found' }, { status: 404 });
    }
    const item = db.servicePricingRules[index];
    if (body.is_required !== undefined) item.is_required = body.is_required === true;
    if (body.default_selected !== undefined) item.default_selected = body.default_selected === true;
    if (body.display_order !== undefined) item.display_order = Number(body.display_order);
    if (body.is_active !== undefined) item.is_active = body.is_active === true;
    item.updated_at = new Date().toISOString();
    
    await saveDbAsync(db);
    return NextResponse.json({ success: true, mapping: item });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string; mapping_id: string }> }) {
  try {
    const { id, mapping_id } = await props.params;
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { error } = await mysqlClient
        .from('service_pricing_rules')
        .delete()
        .eq('id', mapping_id);
      
      if (!error) {
        return NextResponse.json({ success: true });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    if (!db.servicePricingRules) db.servicePricingRules = [];
    db.servicePricingRules = db.servicePricingRules.filter((m: any) => m.id !== mapping_id);
    await saveDbAsync(db);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
