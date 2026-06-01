import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const mysqlClient = getMysql();
    if (!mysqlClient) return NextResponse.json({ error: 'MySQL not configured' }, { status: 500 });
    
    const body = await req.json();
    const { is_active } = body;
    
    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ success: false, error: 'is_active must be a boolean' }, { status: 400 });
    }
    
    const { data, error } = await mysqlClient
      .from('services')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({ success: true, service: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
