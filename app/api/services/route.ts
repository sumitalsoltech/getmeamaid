import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!error) {
        return NextResponse.json({ success: true, services: data });
      }
    }
    
    // Fallback to local DB and filter active
    const db = await getDbAsync();
    const activeServices = db.services.filter(s => s.is_active !== false);
    return NextResponse.json({ success: true, services: activeServices });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
