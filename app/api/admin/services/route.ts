import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync, saveDb } from '@/lib/db';
import { authorize } from '@/lib/authMiddleware';

export async function GET(req: NextRequest) {
  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (!error) {
        return NextResponse.json({ success: true, services: data });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    return NextResponse.json({ success: true, services: db.services });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req, 'manage_services');
    if (!auth.authorized) {
      return auth.response!;
    }

    const body = await req.json();
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('services')
        .insert(body)
        .select()
        .single();
      
      if (!error) {
        return NextResponse.json({ success: true, service: data });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    const newService = {
      id: body.id || `srv-${Math.floor(100000 + Math.random() * 900000)}`,
      title: body.title || body.name,
      slug: body.slug || (body.title || body.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description || '',
      image: body.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800',
      base_price: Number(body.base_price || 140),
      is_active: body.is_active !== false,
      is_manual_quote: body.is_manual_quote === true,
      included_items: body.included_items || [],
      excluded_items: body.excluded_items || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.services.push(newService);
    saveDb(db);
    return NextResponse.json({ success: true, service: newService });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
