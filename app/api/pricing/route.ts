import { NextRequest, NextResponse } from 'next/server';
import { resolvePricingRules, upsertPricingRule, deletePricingRule } from '@/lib/pricingResolver';
import { getDbAsync } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = await getDbAsync();


    const rules = await resolvePricingRules();
    return NextResponse.json({ success: true, pricingRules: rules });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Case 1: Saving a whole array (e.g., matching older bulk save patterns)
    if (Array.isArray(body)) {
      for (const rule of body) {
        await upsertPricingRule(rule);
      }
      const updated = await resolvePricingRules();
      return NextResponse.json({ success: true, pricingRules: updated });
    }

    // Case 2: Post a single rule (either Add or Edit)
    const { success, rule, error } = await upsertPricingRule(body);
    if (!success) {
      return NextResponse.json({ success: false, error }, { status: 400 });
    }

    const updated = await resolvePricingRules();
    return NextResponse.json({ success: true, pricingRules: updated });
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
    return NextResponse.json({ success: true, pricingRules: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
