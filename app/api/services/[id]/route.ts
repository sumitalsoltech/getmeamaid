import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { getDbAsync } from '@/lib/db';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const mysqlClient = getMysql();
    if (mysqlClient) {
      // Get service details
      const { data: service, error: serviceError } = await mysqlClient
        .from('services')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!serviceError && service) {
        // Get associated pricing rules
        const { data: rules, error: rulesError } = await mysqlClient
          .from('service_pricing_rules')
          .select('*, pricing_rule:pricing_rules(*)')
          .eq('service_id', id)
          .eq('is_active', true);
        
        if (!rulesError && rules) {
          const { data: allPricingRules } = await mysqlClient.from('pricing_rules').select('*');
          const enrichedRules = rules.map((r: any) => ({
            ...r,
            pricing_rule: allPricingRules?.find((pr: any) => pr.id === r.pricing_rule_id) || null
          }));
          return NextResponse.json({ success: true, service, pricing_rules: enrichedRules });
        }
      }
    }
    
    // Fallback to local DB
    const db = await getDbAsync();
    const service = db.services.find(s => s.id === id);
    if (!service) {
      return NextResponse.json({ success: false, error: 'Service not found.' }, { status: 404 });
    }
    
    // In local db schema, we resolve linked rules by filtering pricingRules
    const rules = db.pricingRules
      .filter((r: any) => r.service_id === id || (r.service_name && r.service_name.toLowerCase() === service.title.toLowerCase()))
      .map((r: any) => ({
        id: `link-${r.id}`,
        service_id: id,
        pricing_rule_id: r.id,
        is_required: false,
        default_selected: false,
        is_active: r.is_active !== false,
        pricing_rule: r
      }));
      
    return NextResponse.json({ success: true, service, pricing_rules: rules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
