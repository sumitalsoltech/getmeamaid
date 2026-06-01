import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { authorize } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorize(req, 'manage_pricing');
    if (!auth.authorized) {
      return auth.response!;
    }
    const mysqlClient = getMysql();
    if (!mysqlClient) {
      return NextResponse.json({ success: true, mappings: [] });
    }
    
    const { data, error } = await mysqlClient
      .from('service_pricing_rules')
      .select('*, service:services(id, title), pricing_rule:pricing_rules(id, rule_name)');
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, mappings: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
