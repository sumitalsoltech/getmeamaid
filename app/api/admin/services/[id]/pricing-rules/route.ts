import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { authorize } from '@/lib/authMiddleware';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authorize(req, 'manage_services');
    if (!auth.authorized) {
      return auth.response!;
    }
    const { id } = await props.params;
    const mysqlClient = getMysql();
    if (mysqlClient) {
      // Join with pricing_rules table
      const { data, error } = await mysqlClient
        .from('service_pricing_rules')
        .select('*, pricing_rule:pricing_rules(*)')
        .eq('service_id', id);
      
      if (!error && data) {
        const { data: allPricingRules } = await mysqlClient.from('pricing_rules').select('*');
        const mappingWithRule = data.map((m: any) => ({
          ...m,
          pricing_rule: allPricingRules?.find((pr: any) => pr.id === m.pricing_rule_id) || null
        }));
        return NextResponse.json({ success: true, mapping: mappingWithRule });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    const rules = db.pricingRules || [];
    const mappings = db.servicePricingRules || [];
    const filteredMappings = mappings.filter((m: any) => m.service_id === id);
    const mappingWithRule = filteredMappings.map((m: any) => {
      const prule = rules.find((r: any) => r.id === m.pricing_rule_id);
      return {
        ...m,
        pricing_rule: prule || null
      };
    });
    
    return NextResponse.json({ success: true, mapping: mappingWithRule });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
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
        .from('service_pricing_rules')
        .insert({ ...body, service_id: id })
        .select()
        .single();
      
      if (!error) {
        return NextResponse.json({ success: true, mapping: data });
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    if (!db.servicePricingRules) {
      db.servicePricingRules = [];
    }
    const newMapping = {
      id: body.id || `spr-${Math.floor(100000 + Math.random() * 900000)}`,
      service_id: id,
      pricing_rule_id: body.pricing_rule_id,
      is_required: body.is_required === true,
      default_selected: body.default_selected === true,
      display_order: Number(body.display_order || 0),
      is_active: body.is_active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.servicePricingRules.push(newMapping);
    await saveDbAsync(db);
    
    const prule = (db.pricingRules || []).find((r: any) => r.id === newMapping.pricing_rule_id);
    const mappingWithRule = {
      ...newMapping,
      pricing_rule: prule || null
    };
    
    return NextResponse.json({ success: true, mapping: mappingWithRule });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
