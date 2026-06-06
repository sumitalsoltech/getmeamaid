'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';
import { DollarSign, Search, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PricingSection() {
  const {
    services,
    selectedPricingService, setSelectedPricingService,
    pricingSubTab, setPricingSubTab,
    pricingSearch, setPricingSearch,
    pricingStatusFilter, setPricingStatusFilter,
    ruleForm, setRuleForm,
    editingRuleId, setEditingRuleId,
    pricingRulesLoading,
    serverPricingRules,
    handleToggleRuleStatus,
    handleDeletePricingRule,
    handleSavePricingRule,
    calcService, setCalcService,
    calcBedrooms, setCalcBedrooms,
    calcBathrooms, setCalcBathrooms,
    calcPostal, setCalcPostal,
    calcUrgency, setCalcUrgency,
    calcCoupon, setCalcCoupon,
    calcAddons, setCalcAddons,
    handleTestPreviewPrice,
    calcLoading,
    calcResult
  } = useAdmin();

  return (
    <div className="space-y-6 font-sans text-neutral-800">
      
      {/* Selected Service Dropdown Header */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#fbbf24] shrink-0" />
            Pricing & Rule Architect
          </h2>
          <p className="text-xs text-neutral-500">Configure systemic fine-tuning pricing matrices, travel zones, add-ons, and booking overrides.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-neutral-700 whitespace-nowrap">Selected Service:</span>
          <div className="relative">
            <select
              value={selectedPricingService}
              onChange={(e) => {
                setSelectedPricingService(e.target.value);
                setEditingRuleId(null);
                setPricingSearch('');
              }}
              className="bg-neutral-50 px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#fbbf24] cursor-pointer text-neutral-900 font-semibold"
            >
              {services.map((service: any) => (
                <option key={service.id} value={service.title || service.name}>
                  {service.title || service.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sub Tabs Controller */}
      <div className="flex flex-wrap gap-1 border-b border-neutral-200">
        {['Base Price', 'Size / Property Rules', 'Add-ons', 'Urgency Rules', 'Location Rules', 'Minimum Order', 'Manual Quote Rules'].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setPricingSubTab(tab);
              setEditingRuleId(null);
              setPricingSearch('');
            }}
            className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
              pricingSubTab === tab
                ? 'border-[#fbbf24] text-neutral-900 font-extrabold'
                : 'border-transparent text-neutral-500 hover:text-neutral-850 hover:border-neutral-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Table List of Rules */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls Bar for Multi-item Tabs */}
          {pricingSubTab !== 'Base Price' && pricingSubTab !== 'Minimum Order' && (
            <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search ${pricingSubTab}...`}
                  value={pricingSearch}
                  onChange={(e) => setPricingSearch(e.target.value)}
                  className="w-full bg-neutral-50 pl-9 pr-4 py-1.5 rounded-lg border border-neutral-200 text-xs focus:ring-1 focus:ring-[#fbbf24] outline-none text-neutral-800"
                />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-[11px] font-bold text-neutral-500 whitespace-nowrap">Status:</span>
                <select
                  value={pricingStatusFilter}
                  onChange={(e) => setPricingStatusFilter(e.target.value)}
                  className="bg-neutral-50 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 font-semibold cursor-pointer text-neutral-800 focus:outline-none"
                >
                  <option value="all">All States</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          )}

          {/* Table content block */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
            {pricingSubTab === 'Base Price' ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-[#fbbf24]">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-sm font-extrabold text-neutral-950">Starting Price Standard</h3>
                  <p className="text-xs text-neutral-500">
                    The service base price specifies the standard initial cost for **{selectedPricingService}** before applying dynamic modifiers, sizes, or extra addon selections.
                  </p>
                  <div className="mt-4 p-4 bg-neutral-50 border rounded-xl inline-block">
                    <p className="text-[11px] font-bold uppercase text-neutral-400 tracking-wider">Current Live Base Price</p>
                    <p className="text-3xl font-black text-neutral-900 mt-1">
                      {ruleForm.currency === 'USD' ? '$' : 'CAD $'}{ruleForm.price_adjustment}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1 flex items-center justify-center gap-1 font-semibold">
                      <CheckCircle2 className={`w-3 h-3 ${ruleForm.is_active ? 'text-emerald-500' : 'text-neutral-300'}`} />
                      Rate is {ruleForm.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            ) : pricingSubTab === 'Minimum Order' ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mx-auto text-sky-500">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-sm font-extrabold text-neutral-950">Minimum Booking Order Guard</h3>
                  <p className="text-xs text-neutral-500">
                    Protects the business model by capping low-value appointments. If the total calculated service cost is less than this value, the customer pays this minimum limit.
                  </p>
                  <div className="mt-4 p-4 bg-neutral-50 border rounded-xl inline-block">
                    <p className="text-[11px] font-bold uppercase text-neutral-400 tracking-wider">Service Minimum Billing</p>
                    <p className="text-3xl font-black text-neutral-900 mt-1">
                      CAD ${ruleForm.price_adjustment}
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-1 flex items-center justify-center gap-2 font-semibold">
                      <span>Apply before coupon: **{ruleForm.apply_before_coupon ? 'Yes' : 'No'}**</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className={`w-3 h-3 ${ruleForm.is_active ? 'text-emerald-500' : 'text-neutral-300'}`} />
                        {ruleForm.is_active ? 'Enabled' : 'Disabled'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-700">
                  <thead className="bg-neutral-50 text-[10px] text-neutral-500 font-bold uppercase border-b border-neutral-100">
                    <tr>
                      <th className="p-4">Rule / Metric Name</th>
                      <th className="p-4">Match Key / Condition</th>
                      {pricingSubTab === 'Add-ons' && <th className="p-4">Quantity Rule</th>}
                      {pricingSubTab === 'Location Rules' && <th className="p-4">Area / Details</th>}
                      <th className="p-4">Modifier Value</th>
                      <th className="p-4">Manual Quote</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-808">
                    {serverPricingRules.filter(r => {
                      const isCorrectType = r.rule_type === (
                        pricingSubTab === 'Size / Property Rules' ? 'size_charge' :
                        pricingSubTab === 'Add-ons' ? 'addon_pricing' :
                        pricingSubTab === 'Urgency Rules' ? 'urgency_charge' :
                        pricingSubTab === 'Location Rules' ? 'location_charge' :
                        pricingSubTab === 'Manual Quote Rules' ? 'manual_quote' : 'service_base'
                      );
                      const isCorrectService = !r.service_name || r.service_name === selectedPricingService;
                      const matchesSearch = !pricingSearch || r.name.toLowerCase().includes(pricingSearch.toLowerCase()) || (r.match_key && r.match_key.toLowerCase().includes(pricingSearch.toLowerCase()));
                      const matchesStatus = pricingStatusFilter === 'all' || 
                                            (pricingStatusFilter === 'active' && r.is_active) || 
                                            (pricingStatusFilter === 'inactive' && !r.is_active);
                      return isCorrectType && isCorrectService && matchesSearch && matchesStatus;
                    }).map((rule) => {
                      return (
                        <tr key={rule.id} className="hover:bg-neutral-50/50 transition">
                          <td className="p-4 font-extrabold text-neutral-900 max-w-[170px] truncate">
                            {rule.name}
                          </td>
                          <td className="p-4 font-mono font-bold text-neutral-600">
                            <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10.5px]">
                              {rule.match_key}
                            </span>
                          </td>
                          
                          {pricingSubTab === 'Add-ons' && (
                            <td className="p-4 text-neutral-500">
                              {rule.quantity_allowed ? (
                                <span className="text-[10.5px] text-amber-705 bg-amber-50 px-1.5 py-0.5 rounded font-semibold">
                                  Yes ({rule.quantity_label || 'per unit'})
                                </span>
                              ) : 'No'}
                            </td>
                          )}

                          {pricingSubTab === 'Location Rules' && (
                            <td className="p-4 font-medium text-neutral-600">
                              <span className="text-[10.5px] bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded max-w-[120px] truncate block">
                                {rule.postal_code || rule.match_key}
                              </span>
                            </td>
                          )}

                          <td className="p-4 font-bold text-neutral-800 font-mono">
                            {rule.adjustment_type === 'unavailable' ? (
                              <span className="text-red-650 text-[10px] font-bold">Blocked Out</span>
                            ) : rule.adjustment_type === 'manual' || rule.manual_quote ? (
                              <span className="text-amber-650 text-[10px] font-bold">Shared Quote</span>
                            ) : rule.adjustment_type === 'percentage' ? (
                              `+${rule.price_adjustment}%`
                            ) : (
                              `+$${rule.price_adjustment}`
                            )}
                          </td>
                          <td className="p-4">
                            {rule.manual_quote || rule.adjustment_type === 'manual' || rule.adjustment_type === 'unavailable' ? (
                              <span className="text-amber-500 bg-amber-50 text-[10px] font-black uppercase px-1.5 py-0.5 rounded">Yes</span>
                            ) : (
                              <span className="text-neutral-400">No</span>
                            )}
                          </td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => handleToggleRuleStatus(rule)}
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition cursor-pointer ${
                                rule.is_active
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                              }`}
                            >
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="p-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRuleId(rule.id);
                                setRuleForm({
                                  name: rule.name || '',
                                  match_key: rule.match_key || '',
                                  price_adjustment: rule.price_adjustment || 0,
                                  adjustment_type: rule.adjustment_type || 'fixed',
                                  is_active: rule.is_active !== false,
                                  currency: rule.currency || 'CAD',
                                  quantity_allowed: rule.quantity_allowed || false,
                                  quantity_label: rule.quantity_label || '',
                                  condition: rule.condition || 'Custom',
                                  postal_code: rule.postal_code || '',
                                  service_available: rule.service_available !== false,
                                  manual_quote: rule.manual_quote || false,
                                  apply_before_coupon: rule.apply_before_coupon !== false,
                                  message: rule.message || ''
                                });
                              }}
                              className="hover:underline text-sky-600 font-bold hover:text-sky-800 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePricingRule(rule.id)}
                              className="hover:underline text-red-500 font-bold hover:text-red-750 cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {serverPricingRules.filter(r => {
                      const isCorrectType = r.rule_type === (
                        pricingSubTab === 'Size / Property Rules' ? 'size_charge' :
                        pricingSubTab === 'Add-ons' ? 'addon_pricing' :
                        pricingSubTab === 'Urgency Rules' ? 'urgency_charge' :
                        pricingSubTab === 'Location Rules' ? 'location_charge' :
                        pricingSubTab === 'Manual Quote Rules' ? 'manual_quote' : 'service_base'
                      );
                      const isCorrectService = !r.service_name || r.service_name === selectedPricingService;
                      return isCorrectType && isCorrectService;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-neutral-400 italic">
                          No configuration rules registered under {pricingSubTab} yet. Apply settings inside the card on the right!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Form and Testing Simulator */}
        <div className="space-y-6">
          
          {/* Form Card */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
                {editingRuleId ? 'Modify Curation Rule' : 'Add New Pricing Rule'}
              </h3>
              <p className="text-[10px] text-neutral-500 mt-1">
                {pricingSubTab === 'Base Price'
                  ? 'Tune the standard initial billing value.'
                  : pricingSubTab === 'Minimum Order'
                  ? 'Curb small dispatch margins.'
                  : `Configure rules and adjustments for service ${pricingSubTab}.`}
              </p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSavePricingRule(
                  pricingSubTab === 'Base Price' ? 'service_base' :
                  pricingSubTab === 'Size / Property Rules' ? 'size_charge' :
                  pricingSubTab === 'Add-ons' ? 'addon_pricing' :
                  pricingSubTab === 'Urgency Rules' ? 'urgency_charge' :
                  pricingSubTab === 'Location Rules' ? 'location_charge' :
                  pricingSubTab === 'Minimum Order' ? 'min_order' :
                  pricingSubTab === 'Manual Quote Rules' ? 'manual_quote' : 'service_base'
                );
              }}
              className="space-y-4 text-xs text-neutral-800"
            >
              {pricingSubTab !== 'Base Price' && pricingSubTab !== 'Minimum Order' && (
                <div className="space-y-1">
                  <span className="font-bold text-neutral-700">Rule Display Name:</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Bedroom Addition"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs text-neutral-800"
                  />
                </div>
              )}

              {/* Render custom form controls based on category */}
              {pricingSubTab === 'Base Price' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Starting Base Rate ($):</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={ruleForm.price_adjustment}
                      onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold text-neutral-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Currency Option:</span>
                    <input
                      type="text"
                      required
                      value={ruleForm.currency}
                      onChange={(e) => setRuleForm({ ...ruleForm, currency: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono text-neutral-800"
                    />
                  </div>
                </div>
              )}

              {pricingSubTab === 'Minimum Order' && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Min Order Val ($):</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={ruleForm.price_adjustment}
                      onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold text-neutral-900"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Apply Pre-coupon?</span>
                    <select
                      value={ruleForm.apply_before_coupon ? 'yes' : 'no'}
                      onChange={(e) => setRuleForm({ ...ruleForm, apply_before_coupon: e.target.value === 'yes' })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs text-neutral-800"
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              )}

              {pricingSubTab === 'Size / Property Rules' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Matching Option:</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1 Bedroom, bathrooms"
                        value={ruleForm.match_key}
                        onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono text-neutral-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Adjustment Style:</span>
                      <select
                        value={ruleForm.adjustment_type}
                        onChange={(e) => setRuleForm({ ...ruleForm, adjustment_type: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs text-neutral-800"
                      >
                        <option value="fixed">Fixed Flat ($)</option>
                        <option value="percentage">Percentage (%)</option>
                        <option value="manual">Manual Quote Needed</option>
                      </select>
                    </div>
                  </div>
                  {ruleForm.adjustment_type !== 'manual' && (
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Price Modifier Value:</span>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 20"
                        value={ruleForm.price_adjustment}
                        onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold text-neutral-900"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="size_manual"
                      checked={ruleForm.manual_quote}
                      onChange={(e) => setRuleForm({ ...ruleForm, manual_quote: e.target.checked })}
                      className="cursor-pointer font-semibold"
                    />
                    <label htmlFor="size_manual" className="font-bold text-neutral-700 cursor-pointer">
                      Trigger Manual Concierge Review?
                    </label>
                  </div>
                </div>
              )}

              {pricingSubTab === 'Add-ons' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Add-on Item Key:</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Window Polishing"
                        value={ruleForm.match_key}
                        onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono text-neutral-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Price Fee ($):</span>
                      <input
                        type="number"
                        required
                        value={ruleForm.price_adjustment}
                        onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold text-neutral-900"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="qty_allowed"
                        checked={ruleForm.quantity_allowed}
                        onChange={(e) => setRuleForm({ ...ruleForm, quantity_allowed: e.target.checked })}
                        className="cursor-pointer"
                      />
                      <label htmlFor="qty_allowed" className="font-bold text-neutral-700 cursor-pointer">
                        Allow multiple quantities?
                      </label>
                    </div>
                    {ruleForm.quantity_allowed && (
                      <div className="space-y-1 pt-1.5 border-t border-neutral-200 mt-1">
                        <span className="font-bold text-neutral-600 block">Quantity Suffix Label:</span>
                        <input
                          type="text"
                          placeholder="e.g. per window, per bathroom"
                          value={ruleForm.quantity_label}
                          onChange={(e) => setRuleForm({ ...ruleForm, quantity_label: e.target.value })}
                          className="w-full bg-white border border-neutral-200 rounded-lg p-2 outline-none text-xs text-neutral-805"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {pricingSubTab === 'Urgency Rules' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Match Date / Urgency:</span>
                      <select
                        value={ruleForm.match_key}
                        onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs text-neutral-800"
                      >
                        <option value="">-- Select option --</option>
                        <option value="Same-day">Same-day (today)</option>
                        <option value="Next-day">Next-day (tomorrow)</option>
                        <option value="Saturday">Saturday</option>
                        <option value="Sunday">Sunday</option>
                        <option value="Custom">Custom urgency</option>
                      </select>
                    </div>
                    {ruleForm.match_key === 'Custom' && (
                      <div className="space-y-1">
                        <span className="font-bold text-neutral-700">Custom Value:</span>
                        <input
                          type="text"
                          required
                          value={ruleForm.match_key}
                          onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono text-neutral-800"
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Adjustment Type:</span>
                      <select
                        value={ruleForm.adjustment_type}
                        onChange={(e) => setRuleForm({ ...ruleForm, adjustment_type: e.target.value })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs text-neutral-850"
                      >
                        <option value="fixed">Fixed Flat ($)</option>
                        <option value="percentage">Percentage (%)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Change Value:</span>
                    <input
                      type="number"
                      required
                      value={ruleForm.price_adjustment}
                      onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold text-neutral-900"
                    />
                  </div>
                </div>
              )}

              {pricingSubTab === 'Location Rules' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Postal Code / prefix (comma separated):</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. M5V, M4B or L5B"
                      value={ruleForm.postal_code || ruleForm.match_key}
                      onChange={(e) => setRuleForm({ ...ruleForm, postal_code: e.target.value, match_key: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono text-neutral-800 uppercase font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Curation Service Availability:</span>
                      <select
                        value={ruleForm.service_available ? 'yes' : 'no'}
                        onChange={(e) => setRuleForm({ ...ruleForm, service_available: e.target.value === 'yes', adjustment_type: e.target.value === 'yes' ? 'fixed' : 'unavailable' })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs text-neutral-850 font-semibold"
                      >
                        <option value="yes">Available and supported</option>
                        <option value="no">Not available / Rejected</option>
                      </select>
                    </div>
                    {ruleForm.service_available && (
                      <div className="space-y-1">
                        <span className="font-bold text-neutral-700">Pricing Mode:</span>
                        <select
                          value={ruleForm.adjustment_type}
                          onChange={(e) => setRuleForm({ ...ruleForm, adjustment_type: e.target.value })}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs text-neutral-850 font-semibold"
                        >
                          <option value="fixed">Fixed Flat ($)</option>
                          <option value="percentage">Percentage (%)</option>
                          <option value="manual">Manual Quote Needed</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  {ruleForm.service_available && ruleForm.adjustment_type !== 'manual' && (
                    <div className="space-y-1">
                      <span className="font-bold text-neutral-700">Location Value Adjustment:</span>
                      <input
                        type="number"
                        required
                        value={ruleForm.price_adjustment}
                        onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold text-neutral-900"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id="loc_manual"
                      checked={ruleForm.manual_quote}
                      onChange={(e) => setRuleForm({ ...ruleForm, manual_quote: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor="loc_manual" className="font-bold text-neutral-700 cursor-pointer">
                      Force manual review quote?
                    </label>
                  </div>
                </div>
              )}

              {pricingSubTab === 'Manual Quote Rules' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Condition Scenario Key:</span>
                    <select
                      value={ruleForm.match_key}
                      onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-205 p-2.5 rounded-lg text-xs text-neutral-800 font-semibold"
                    >
                      <option value="">-- Select scenario --</option>
                      <option value="large_size">Property size too large (ext. ranges)</option>
                      <option value="commercial">Commercial job selected</option>
                      <option value="outside_zone">Unsupported location coordinates</option>
                      <option value="custom">Custom administrator trigger</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-700">Custom Alert Message displayed to client:</span>
                    <textarea
                      required
                      rows={3}
                      placeholder="Estimated price starts from $X. Final quote will be shared by email after concierge review..."
                      value={ruleForm.message}
                      onChange={(e) => setRuleForm({ ...ruleForm, message: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none text-xs focus:ring-1 focus:ring-[#fbbf24] text-neutral-800"
                    ></textarea>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    id="rule_active"
                    checked={ruleForm.is_active}
                    onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })}
                    className="cursor-pointer"
                  />
                  <label htmlFor="rule_active" className="text-[11px] font-bold text-neutral-700 cursor-pointer">
                    Save as Active
                  </label>
                </div>
                
                <div className="flex items-center gap-2">
                  {editingRuleId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRuleId(null);
                        setRuleForm({
                          name: '',
                          match_key: '',
                          price_adjustment: 0,
                          adjustment_type: 'fixed',
                          is_active: true,
                          currency: 'CAD',
                          quantity_allowed: false,
                          quantity_label: '',
                          condition: 'Custom',
                          postal_code: '',
                          service_available: true,
                          manual_quote: false,
                          apply_before_coupon: true,
                          message: ''
                        });
                      }}
                      className="px-3 py-2 border rounded-lg font-bold hover:bg-neutral-55 transition cursor-pointer text-[10.5px]"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={pricingRulesLoading}
                    className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer text-[10.5px]"
                  >
                    {pricingRulesLoading ? 'Saving...' : editingRuleId ? 'Update Rule' : 'Save Rule Entry'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* PRICE TEST CALCULATOR / PREVIEW WIDGET (HIDDEN FOR NOW) */}
          {/*
          <div className="bg-[#FAF9F6] border border-amber-200/50 rounded-xl p-5 shadow-xs space-y-4 font-sans text-neutral-800">
            <div className="flex items-center gap-2 border-b pb-2 border-amber-200/30 font-sans text-neutral-900">
              <Activity className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-black uppercase tracking-wider">
                Live Pricing Simulator Tester
              </h3>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              Test and audit how all active service rules combine. Enter simulated booking metrics to verify calculations immediately.
            </p>

            <div className="space-y-3 text-[11px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-neutral-600 block mb-1">Service Level:</span>
                  <select
                    value={calcService}
                    onChange={(e) => setCalcService(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-semibold cursor-pointer text-neutral-800"
                  >
                    {services.map((service: any) => (
                      <option key={service.id} value={service.title || service.name}>
                        {service.title || service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block mb-1 font-sans">Property size:</span>
                  <select
                    value={`${calcBedrooms} Bed`}
                    onChange={(e) => {
                      const beds = Number(e.target.value.split(' ')[0]);
                      setCalcBedrooms(beds);
                    }}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-semibold cursor-pointer text-neutral-800"
                  >
                    <option value="1 Bed">1 Bedroom</option>
                    <option value="2 Bed">2 Bedrooms</option>
                    <option value="3 Bed">3 Bedrooms</option>
                    <option value="4 Bed">4 Bedrooms</option>
                    <option value="5 Bed">5+ Bedrooms</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-neutral-600 block mb-1 font-sans">Bathrooms count:</span>
                  <input
                    type="number"
                    min={1}
                    value={calcBathrooms}
                    onChange={(e) => setCalcBathrooms(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-1 text-neutral-800 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block mb-1">Postal / Area Code:</span>
                  <input
                    type="text"
                    placeholder="e.g. M5V"
                    value={calcPostal}
                    onChange={(e) => setCalcPostal(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 uppercase text-neutral-800 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-neutral-600 block mb-1 font-sans">Service Urgency:</span>
                  <select
                    value={calcUrgency}
                    onChange={(e) => setCalcUrgency(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-semibold cursor-pointer text-neutral-850"
                  >
                    <option value="Normal">Normal dispatch</option>
                    <option value="Same-day">Same-day service</option>
                    <option value="Next-day">Next-day service</option>
                    <option value="Saturday">Saturday service</option>
                  </select>
                </div>
                <div>
                  <span className="font-bold text-neutral-600 block mb-1 font-sans">Coupon code:</span>
                  <input
                    type="text"
                    placeholder="PRISTINE15"
                    value={calcCoupon}
                    onChange={(e) => setCalcCoupon(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 uppercase font-mono text-neutral-808 focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1 bg-white p-2.5 border border-neutral-200/65 rounded-xl">
                <span className="font-bold text-neutral-650 block">Simulate Add-ons:</span>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {['Deep Oven Curation', 'Premium Lavender-Sage Scent Selection', 'Interior Window Polishing', 'Deep Refrigerator Hand-wash'].map(addon => {
                    const checked = calcAddons.includes(addon);
                    return (
                      <button
                        type="button"
                        key={addon}
                        onClick={() => {
                          if (checked) {
                            setCalcAddons(calcAddons.filter(x => x !== addon));
                          } else {
                            setCalcAddons([...calcAddons, addon]);
                          }
                        }}
                        className={`px-2 py-1.5 border text-[9.5px] rounded-lg text-left line-clamp-1 truncate cursor-pointer ${
                          checked 
                            ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' 
                            : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
                        }`}
                      >
                        {addon}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestPreviewPrice}
                disabled={calcLoading}
                className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-neutral-950 font-black rounded-lg transition tracking-wide text-xs cursor-pointer shadow-xs uppercase mt-3"
              >
                {calcLoading ? 'Calculating Breakdowns...' : 'Preview Live Price Estimate'}
              </button>
              
              {calcResult && (
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-neutral-900 text-neutral-100 rounded-xl space-y-2 border border-neutral-800"
                  >
                    <h4 className="text-[10px] font-black uppercase text-amber-400 border-b border-neutral-800 pb-1 flex items-center justify-between">
                      <span>Calculation Math Output</span>
                      {calcResult.manualQuoteFlag && <span className="text-red-400 font-extrabold font-sans text-[8px] bg-red-950 px-1 py-0.2 rounded">MANUAL RE-ROUTE</span>}
                    </h4>
                    
                    <div className="space-y-1 font-mono text-[10px] text-neutral-300">
                      <div className="flex justify-between">
                        <span>Base Service Initial Rate:</span>
                        <span className="text-neutral-150 font-bold">${calcResult.basePrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size modifier offset:</span>
                        <span className="text-neutral-150 font-bold">+${calcResult.sizeCharge}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extras addon total:</span>
                        <span className="text-neutral-150 font-bold">+${calcResult.addOnTotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Urgency level offset:</span>
                        <span className="text-neutral-150 font-bold">+${calcResult.urgencyCharge}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Travel zone billing charge:</span>
                        <span className="text-neutral-150 font-bold">+${calcResult.locationCharge}</span>
                      </div>
                      
                      {calcResult.minOrderAdjustment > 0 && (
                        <div className="flex justify-between border-t border-dashed border-neutral-800 pt-1 text-amber-400 font-bold">
                          <span>Min Order Adjust Cap:</span>
                          <span>+${calcResult.minOrderAdjustment}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between border-t border-neutral-800 pt-1 text-xs">
                        <span className="font-sans font-bold text-neutral-400">Rate subtotal:</span>
                        <span className="text-white font-black">${calcResult.subtotal}</span>
                      </div>
                      
                      <div className="flex justify-between text-neutral-400">
                        <span>HST Tax (13%) & cleaner trust:</span>
                        <span>+${(calcResult.tax + calcResult.trustFee).toFixed(2)}</span>
                      </div>
                      {calcResult.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-400">
                          <span>Coupon discount ({calcResult.couponCode || 'Promo'}):</span>
                          <span>-${calcResult.discountAmount}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-neutral-800 pt-1.5 mt-1.5 flex justify-between items-center bg-neutral-950 p-2 rounded-lg">
                      <span className="text-xs font-sans font-extrabold text-white text-[10px] uppercase">Final Estimated Charge:</span>
                      <span className="text-emerald-400 font-black text-sm">${calcResult.finalEstimatedPrice.toFixed(2)} CAD</span>
                    </div>

                    {calcResult.manualQuoteFlag && (
                      <div className="mt-2 p-2 bg-red-950/60 border border-red-900 text-red-300 text-[9.5px] rounded-lg font-sans">
                        <span className="font-extrabold uppercase block text-[8px] text-red-400">Auditor Notice:</span>
                        {calcResult.manualQuoteMessage}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
          */}

        </div>
        
      </div>

    </div>
  );
}
