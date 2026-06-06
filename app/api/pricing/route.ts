import { NextRequest, NextResponse } from 'next/server';
import { resolvePricingRules, upsertPricingRule, deletePricingRule } from '@/lib/pricingResolver';
import { getDbAsync, saveDbAsync } from '@/lib/db';
import { getMysql } from '@/lib/mysql';

export async function GET(req: NextRequest) {
  try {
    const db = await getDbAsync();
    const rules = await resolvePricingRules();
    const mappedRules = rules.map((r: any) => {
      const svc = db.services.find((s: any) => s.id === r.service_id);
      return {
        ...r,
        service_name: svc ? svc.title : r.service_name || ''
      };
    });
    return NextResponse.json({ success: true, pricingRules: mappedRules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDbAsync();
    const mysqlClient = getMysql();

    // Case 1: Saving a whole array
    if (Array.isArray(body)) {
      for (const rule of body) {
        const { success, rule: savedRule } = await upsertPricingRule(rule);
        if (success && savedRule) {
          if (rule.service_id) {
            const mappingId = `spr-${rule.service_id}-${savedRule.id}`;
            if (mysqlClient) {
              await mysqlClient
                .from('service_pricing_rules')
                .upsert({
                  id: mappingId,
                  service_id: rule.service_id,
                  pricing_rule_id: savedRule.id,
                  is_active: rule.is_active !== false ? 1 : 0
                });
            }
            if (!db.servicePricingRules) db.servicePricingRules = [];
            const exists = db.servicePricingRules.some((m: any) => m.pricing_rule_id === savedRule.id && m.service_id === rule.service_id);
            if (!exists) {
              db.servicePricingRules.push({
                id: mappingId,
                service_id: rule.service_id,
                pricing_rule_id: savedRule.id,
                is_required: false,
                default_selected: false,
                display_order: 0,
                is_active: rule.is_active !== false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          } else {
            if (mysqlClient) {
              await mysqlClient
                .from('service_pricing_rules')
                .delete()
                .eq('pricing_rule_id', savedRule.id);
            }
            if (db.servicePricingRules) {
              db.servicePricingRules = db.servicePricingRules.filter((m: any) => m.pricing_rule_id !== savedRule.id);
            }
          }
        }
      } // Close the for loop

      const updatedRules = await resolvePricingRules();
      db.pricingRules = updatedRules as any;
      await saveDbAsync(db);

      const updated = await resolvePricingRules();
      const mappedRules = updated.map((r: any) => {
        const svc = db.services.find((s: any) => s.id === r.service_id);
        return {
          ...r,
          service_name: svc ? svc.title : r.service_name || ''
        };
      });
      return NextResponse.json({ success: true, pricingRules: mappedRules });
    }

    // Case 2: Post a single rule (either Add or Edit)
    const { success, rule, error } = await upsertPricingRule(body);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    // Update service_pricing_rules mapping table
    if (body.service_id) {
      const mappingId = `spr-${body.service_id}-${rule.id}`;
      if (mysqlClient) {
        await mysqlClient
          .from('service_pricing_rules')
          .upsert({
            id: mappingId,
            service_id: body.service_id,
            pricing_rule_id: rule.id,
            is_active: body.is_active !== false ? 1 : 0
          });
      }
      if (!db.servicePricingRules) db.servicePricingRules = [];
      const exists = db.servicePricingRules.some((m: any) => m.pricing_rule_id === rule.id && m.service_id === body.service_id);
      if (!exists) {
        db.servicePricingRules.push({
          id: mappingId,
          service_id: body.service_id,
          pricing_rule_id: rule.id,
          is_required: false,
          default_selected: false,
          display_order: 0,
          is_active: body.is_active !== false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    } else {
      if (mysqlClient) {
        await mysqlClient
          .from('service_pricing_rules')
          .delete()
          .eq('pricing_rule_id', rule.id);
      }
      if (db.servicePricingRules) {
        db.servicePricingRules = db.servicePricingRules.filter((m: any) => m.pricing_rule_id !== rule.id);
      }
    }

    const updatedRules = await resolvePricingRules();
    db.pricingRules = updatedRules as any;
    await saveDbAsync(db);

    const updated = await resolvePricingRules();
    const mappedRules = updated.map((r: any) => {
      const svc = db.services.find((s: any) => s.id === r.service_id);
      return {
        ...r,
        service_name: svc ? svc.title : r.service_name || ''
      };
    });
    return NextResponse.json({ success: true, pricingRules: mappedRules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing rule ID to delete.' }, { status: 400 });
    }

    await deletePricingRule(id);
    const updated = await resolvePricingRules();
    const db = await getDbAsync();
    db.pricingRules = updated as any;
    if (db.servicePricingRules) {
      db.servicePricingRules = db.servicePricingRules.filter((m: any) => m.pricing_rule_id !== id);
    }
    await saveDbAsync(db);

    const mappedRules = updated.map((r: any) => {
      const svc = db.services.find((s: any) => s.id === r.service_id);
      return {
        ...r,
        service_name: svc ? svc.title : r.service_name || ''
      };
    });
    return NextResponse.json({ success: true, pricingRules: mappedRules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
