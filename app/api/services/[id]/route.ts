import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const mysqlClient = getMysql();
    if (!mysqlClient) return NextResponse.json({ error: 'MySQL not configured' }, { status: 500 });
    
    // Get service details
    const { data: service, error: serviceError } = await mysqlClient
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (serviceError) throw serviceError;
    
    // Get associated pricing rules
    const { data: rules, error: rulesError } = await mysqlClient
      .from('service_pricing_rules')
      .select('*, pricing_rule:pricing_rules(*)')
      .eq('service_id', id)
      .eq('is_active', true);
    
    if (rulesError) throw rulesError;
    
    return NextResponse.json({ success: true, service, pricing_rules: rules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
