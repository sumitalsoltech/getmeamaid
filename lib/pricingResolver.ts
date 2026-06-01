import { getMysql } from './mysql';
import { getPricingRules, savePricingRules, PricingRuleType } from './dbStore';

export async function resolvePricingRules(): Promise<PricingRuleType[]> {
  try {
    const mysqlClient = getMysql();
    if (mysqlClient) {
      const { data, error } = await mysqlClient
        .from('pricing_rules')
        .select('*');
      
      if (!error && data && data.length > 0) {
        // Map MySQL columns to local memory scheme
        return data.map((r: any) => ({
          id: r.id,
          name: r.rule_name || r.name || 'Unnamed Rule',
          rule_type: r.rule_type,
          match_key: r.value || r.match_key || '',
          price_adjustment: Number(r.price_adjustment) || 0,
          adjustment_type: r.adjustment_type || 'fixed',
          is_active: r.is_active !== false,
          service_id: r.service_id,
          ...r
        }));
      }
    }
  } catch (err) {
    console.error('Failure resolving pricing rules from database:', err);
  }
  return getPricingRules();
}

export async function upsertPricingRule(rule: PricingRuleType): Promise<any> {
  const mysqlClient = getMysql();
  
  const id = rule.id || `${rule.rule_type}-${Date.now()}`;
  const dbPayload = {
    id,
    rule_name: rule.name || rule.rule_name || 'Unnamed Rule',
    rule_type: rule.rule_type,
    value: rule.match_key || rule.value || '',
    price_adjustment: Number(rule.price_adjustment) || 0,
    adjustment_type: rule.adjustment_type,
    is_active: rule.is_active !== false,
    service_id: rule.service_id || null,
    updated_at: new Date().toISOString()
  };

  if (mysqlClient) {
    try {
      const { data, error } = await mysqlClient
        .from('pricing_rules')
        .upsert(dbPayload)
        .select()
        .single();
      
      if (!error) return { success: true, rule: data };
      console.error('MySQL rule save error, falling back to dbStore:', error);
    } catch (e) {
      console.error('MySQL exception saving rule:', e);
    }
  }

  // Fallback to dbStore
  const currentMemory = [...getPricingRules()];
  const index = currentMemory.findIndex(r => r.id === id);
  const memoryObj = {
    ...rule,
    id,
    name: rule.name || rule.rule_name || 'Unnamed Rule',
    match_key: rule.match_key || rule.value || '',
    is_active: rule.is_active !== false
  };

  if (index !== -1) {
    currentMemory[index] = memoryObj;
  } else {
    currentMemory.push(memoryObj);
  }
  savePricingRules(currentMemory);
  return { success: true, rule: memoryObj };
}

export async function deletePricingRule(id: string): Promise<boolean> {
  const mysqlClient = getMysql();
  if (mysqlClient) {
    try {
      const { error } = await mysqlClient
        .from('pricing_rules')
        .delete()
        .eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.error('Exception deleting from MySQL:', e);
    }
  }

  const currentMemory = getPricingRules().filter(r => r.id !== id);
  savePricingRules(currentMemory);
  return true;
}
