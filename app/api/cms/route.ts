import { NextRequest, NextResponse } from 'next/server';
import { getCmsContent, saveCmsContent } from '@/lib/dbStore';
import { getMysql } from '@/lib/mysql';

export async function GET(req: NextRequest) {
  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('cms_content')
        .select('content')
        .eq('id', 'main')
        .single();
      
      if (!error && data) {
        return NextResponse.json({ success: true, cms: data.content });
      }
    }
    const cms = getCmsContent();
    return NextResponse.json({ success: true, cms });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    saveCmsContent(body);
    
    const mysqlClient = getMysql();
    if (mysqlClient) {
      await mysqlClient
        .from('cms_content')
        .upsert({ id: 'main', content: body });
    }
    
    const updated = getCmsContent();
    return NextResponse.json({ success: true, cms: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
