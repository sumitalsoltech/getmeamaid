import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('addons')
        .select('*')
        .eq('is_active', true);
      
      if (!error) {
        return NextResponse.json({ success: true, addons: data });
      }
    }
    
    // Fallback to local DB and filter active
    const db = await getDbAsync();
    const activeAddons = db.addons.filter(a => a.is_active !== false);
    return NextResponse.json({ success: true, addons: activeAddons });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
