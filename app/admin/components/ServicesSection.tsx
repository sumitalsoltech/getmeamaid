'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function ServicesSection() {
  const {
    services,
    allPricingMappings,
    handleOpenServiceDrawer,
    handleDeleteService,
    isServiceDrawerOpen, setIsServiceDrawerOpen,
    editingService,
    serviceFormTitle, setServiceFormTitle,
    serviceFormSlug, setServiceFormSlug,
    serviceFormDesc, setServiceFormDesc,
    serviceFormFullDesc, setServiceFormFullDesc,
    serviceFormImage, setServiceFormImage,
    serviceFormBasePrice, setServiceFormBasePrice,
    serviceFormDisplayOrder, setServiceFormDisplayOrder,
    serviceFormIsFeatured, setServiceFormIsFeatured,
    serviceFormIsActive, setServiceFormIsActive,
    serviceFormIsInstantPricing, setServiceFormIsInstantPricing,
    serviceFormIsManualQuote, setServiceFormIsManualQuote,
    serviceFormIncluded, setServiceFormIncluded,
    serviceFormExcluded, setServiceFormExcluded,
    serviceFormFAQs, setServiceFormFAQs,
    serviceFormNotes, setServiceFormNotes,
    serviceLinkedRules,
    isAddRuleModalOpen, setIsAddRuleModalOpen,
    pricingRules,
    handleAddPricingRuleLink,
    handleUpdateRuleLink,
    handleRemoveRuleLink,
    handleSaveService
  } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Header & Create Button */}
      <div className="bg-white border hover:shadow-xs transition-all rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-sm uppercase font-bold font-mono text-neutral-800">Bespoke Curation Suites</h3>
          <p className="text-xs text-neutral-500">Create, revise, and customize dynamic architectural cleaning services. Link rules to define estimation behavior.</p>
        </div>
        <button
          onClick={() => handleOpenServiceDrawer(null)}
          className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer"
        >
          <span className="text-sm">+</span>
          Create Curation Suite
        </button>
      </div>

      {/* Services List Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-mono uppercase text-neutral-400">
                <th className="py-3 px-4 font-semibold">Curation Service</th>
                <th className="py-3 px-4 font-semibold">Short Description</th>
                <th className="py-3 px-4 font-semibold text-center">Base Price</th>
                <th className="py-3 px-4 font-semibold text-center">Execution Mode</th>
                <th className="py-3 px-4 font-semibold text-center">Display Order</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs text-neutral-808">
              {services.map(s => {
                const linkedRulesCount = allPricingMappings.filter(m => m.service_id === s.id).length;
                return (
                  <tr key={s.id} className="hover:bg-neutral-50/50 transition-all">
                    {/* Service Detail */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {s.image ? (
                          <img
                            src={s.image}
                            alt={s.title || s.name}
                            className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold border font-mono">
                            S
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-neutral-905 font-bold">{s.title || s.name}</strong>
                            {s.is_featured && (
                              <span className="px-1.5 py-0.5 bg-[#85f6e5]/20 text-[#0f172a] font-mono text-[8px] font-extrabold rounded uppercase tracking-wider">
                                FEATURED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-neutral-400">slug: {s.slug || '-'}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.is_active !== false ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                            <span className="text-[10px] uppercase font-mono text-neutral-400">{s.is_active !== false ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Description */}
                    <td className="py-4 px-4 text-neutral-500 max-w-sm font-sans truncate">
                      {s.description || s.short_description || <span className="text-neutral-300 italic">No description filled</span>}
                    </td>

                    {/* Pricing */}
                    <td className="py-4 px-4 text-center font-mono font-bold text-neutral-905">
                      ${s.base_price || 0}
                    </td>

                    {/* Execution Type */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-1">
                        {s.is_manual_quote ? (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/50 font-mono text-[9px] font-bold rounded">
                            MANUAL ESTIMATOR
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200/50 font-mono text-[9px] font-bold rounded">
                            INSTANT PRICING
                          </span>
                        )}
                        <span className="text-[9px] font-mono text-neutral-400">{linkedRulesCount} rules associated</span>
                      </div>
                    </td>

                    {/* Sort Order */}
                    <td className="py-4 px-4 text-center font-mono font-bold text-neutral-500">
                      {s.display_order || 0}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenServiceDrawer(s)}
                          className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-bold font-mono uppercase bg-transparent rounded border border-blue-100 transition-all cursor-pointer"
                        >
                          REVISE / RULES
                        </button>
                        <button
                          onClick={() => handleDeleteService(s.id)}
                          className="px-2 py-1 text-red-605 hover:bg-red-50 hover:text-red-700 text-[10px] font-bold font-mono uppercase bg-transparent rounded border border-red-200 transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL SUITE CMS DRAWER MODAL */}
      {isServiceDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border">
            {/* Modal Title Banner */}
            <div className="bg-neutral-900 text-white px-6 py-4 flex justify-between items-center sm:rounded-t-2xl">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase">CURATION WORKSPACE EXPERT</span>
                <h4 className="text-sm font-bold">{editingService ? `Revise Suite Detail: ${serviceFormTitle}` : 'Create New Curation Suite'}</h4>
              </div>
              <button
                onClick={() => setIsServiceDrawerOpen(false)}
                className="text-neutral-400 hover:text-white font-mono text-base font-bold cursor-pointer transition-all"
              >
                ✖
              </button>
            </div>

            {/* Form Contents Container */}
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Section 1: Basic details */}
              <div className="space-y-4">
                <h5 className="text-[11px] uppercase tracking-wider font-extrabold font-mono text-neutral-400 border-b pb-1">SECTION 1: BASIC DETAILS</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Suite Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Premium Lavender Suite"
                      value={serviceFormTitle}
                      onChange={(e) => setServiceFormTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 hover:bg-neutral-100 focus:bg-white text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold text-neutral-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Custom URL Slug (leave blank to auto-generate)</label>
                    <input
                      type="text"
                      placeholder="e.g. premium-lavender-suite"
                      value={serviceFormSlug}
                      onChange={(e) => setServiceFormSlug(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-mono text-neutral-850"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Starting Base Price (CAD) *</label>
                    <input
                      type="number"
                      placeholder="140"
                      value={serviceFormBasePrice}
                      onChange={(e) => setServiceFormBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-mono font-bold text-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Service Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={serviceFormImage}
                      onChange={(e) => setServiceFormImage(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none text-neutral-600 overflow-ellipsis"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Display sorting order</label>
                    <input
                      type="number"
                      value={serviceFormDisplayOrder}
                      onChange={(e) => setServiceFormDisplayOrder(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-mono font-bold text-neutral-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Short Description Summary</label>
                  <input
                    type="text"
                    placeholder="A concise, beautiful summary seen in marketing grids and layouts..."
                    value={serviceFormDesc}
                    onChange={(e) => setServiceFormDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-sans text-neutral-850"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                    <input
                      type="checkbox"
                      checked={serviceFormIsFeatured}
                      onChange={(e) => setServiceFormIsFeatured(e.target.checked)}
                      className="rounded border-neutral-300 pointer-events-auto"
                    />
                    <span className="text-[10px] font-mono uppercase font-bold">Featured Suite?</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                    <input
                      type="checkbox"
                      checked={serviceFormIsActive}
                      onChange={(e) => setServiceFormIsActive(e.target.checked)}
                      className="rounded border-neutral-300 pointer-events-auto"
                    />
                    <span className="text-[10px] font-mono uppercase font-bold">Active Station?</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                    <input
                      type="checkbox"
                      checked={serviceFormIsInstantPricing}
                      onChange={(e) => setServiceFormIsInstantPricing(e.target.checked)}
                      className="rounded border-neutral-300 pointer-events-auto"
                    />
                    <span className="text-[10px] font-mono uppercase font-bold">Instant Pricing?</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                    <input
                      type="checkbox"
                      checked={serviceFormIsManualQuote}
                      onChange={(e) => setServiceFormIsManualQuote(e.target.checked)}
                      className="rounded border-neutral-300 pointer-events-auto"
                    />
                    <span className="text-[10px] font-mono uppercase font-bold">Manual Quote Req?</span>
                  </label>
                </div>
              </div>

              {/* Section 2: Service Content */}
              <div className="space-y-4">
                <h5 className="text-[11px] uppercase tracking-wider font-extrabold font-mono text-neutral-400 border-b pb-1">SECTION 2: DETAILS CHOREOGRAPHY CONTENT</h5>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Full Deep Description</label>
                  <textarea
                    rows={3}
                    placeholder="Elaborated long-form details explaining the clinical, comprehensive steps of restoration included..."
                    value={serviceFormFullDesc}
                    onChange={(e) => setServiceFormFullDesc(e.target.value)}
                    className="w-full p-3 bg-neutral-50 text-sm border rounded-xl focus:outline-none text-neutral-800"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inclusions */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Dynamic Inclusions list</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Press Enter or Click [+] to Add"
                        id="newInclusion"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const el = e.target as HTMLInputElement;
                            if (el.value.trim()) {
                              setServiceFormIncluded([...serviceFormIncluded, el.value.trim()]);
                              el.value = '';
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none text-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('newInclusion') as HTMLInputElement;
                          if (el && el.value.trim()) {
                            setServiceFormIncluded([...serviceFormIncluded, el.value.trim()]);
                            el.value = '';
                          }
                        }}
                        className="px-3 bg-neutral-900 text-white rounded-lg text-xs cursor-pointer font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {serviceFormIncluded.map((inc, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-sans">
                          <span>✓ {inc}</span>
                          <button
                            type="button"
                            onClick={() => setServiceFormIncluded(serviceFormIncluded.filter((_, idx) => idx !== i))}
                            className="text-emerald-400 hover:text-emerald-900 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Exclusions */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Dynamic Exclusions list</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Press Enter or Click [+] to Add"
                        id="newExclusion"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const el = e.target as HTMLInputElement;
                            if (el.value.trim()) {
                              setServiceFormExcluded([...serviceFormExcluded, el.value.trim()]);
                              el.value = '';
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none text-neutral-800"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('newExclusion') as HTMLInputElement;
                          if (el && el.value.trim()) {
                            setServiceFormExcluded([...serviceFormExcluded, el.value.trim()]);
                            el.value = '';
                          }
                        }}
                        className="px-3 bg-neutral-950 text-white rounded-lg text-xs cursor-pointer font-bold"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {serviceFormExcluded.map((exc, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-705 border border-red-200 rounded text-[10px] font-sans">
                          <span>✗ {exc}</span>
                          <button
                            type="button"
                            onClick={() => setServiceFormExcluded(serviceFormExcluded.filter((_, idx) => idx !== i))}
                            className="text-red-400 hover:text-red-900 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Pricing Rules Linking Panel */}
              {editingService && (
                <div className="space-y-4">
                  <h5 className="text-[11px] uppercase tracking-wider font-extrabold font-mono text-neutral-400 border-b pb-1">SECTION 3: SERVICE PRICING RULE ASSOCIATIONS</h5>
                  
                  <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg">
                    <span className="text-[11px] text-neutral-500 font-mono">Select and link existing base calculations, size factors, add-ons, location charges, or min limits:</span>
                    
                    <button
                      type="button"
                      onClick={() => setIsAddRuleModalOpen(true)}
                      className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold font-mono rounded cursor-pointer uppercase transition-all"
                    >
                      + Associate Existing Rule
                    </button>
                  </div>

                  {/* Mapped Associated Rules Table */}
                  <div className="border border-neutral-100 rounded-lg overflow-hidden shrink-0">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-400 border-b">
                          <th className="py-2.5 px-3">Rule Name</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3 text-center">Required?</th>
                          <th className="py-2.5 px-3 text-center">Default Selected?</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-xs text-neutral-808">
                        {serviceLinkedRules.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-neutral-300 italic">No pricing rules associated with this service yet. All default global estimations rule rules will operate.</td>
                          </tr>
                        ) : (
                          serviceLinkedRules.map((link: any) => {
                            return (
                              <tr key={link.id} className="hover:bg-neutral-50/50 transition-all text-xs">
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-neutral-900">{link.pricing_rules?.rule_name || link.pricing_rule?.rule_name || 'Associated Formula'}</div>
                                  <span className="text-[9px] text-neutral-400 font-mono">id: {link.pricing_rule_id}</span>
                                </td>
                                <td className="py-3 px-3 font-mono text-[10px] text-neutral-500">
                                  {link.pricing_rules?.rule_type || link.pricing_rule?.rule_type || 'global'}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRuleLink(link.id, { is_required: !link.is_required })}
                                    className={`px-2 py-0.5 font-mono text-[10px] rounded font-bold cursor-pointer uppercase transition-all ${
                                      link.is_required ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-neutral-100 text-neutral-400'
                                    }`}
                                  >
                                    {link.is_required ? 'YES' : 'NO'}
                                  </button>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRuleLink(link.id, { default_selected: !link.default_selected })}
                                    className={`px-2 py-0.5 font-mono text-[10px] rounded font-bold cursor-pointer uppercase transition-all ${
                                      link.default_selected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-400'
                                    }`}
                                  >
                                    {link.default_selected ? 'YES' : 'NO'}
                                  </button>
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRuleLink(link.id, { is_active: !link.is_active })}
                                    className={`px-2 py-0.5 font-mono text-[10px] rounded font-bold cursor-pointer uppercase transition-all ${
                                      link.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {link.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                  </button>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRuleLink(link.id)}
                                    className="text-red-500 hover:text-red-700 hover:underline font-mono text-[10px] uppercase font-bold cursor-pointer"
                                  >
                                    Unlink
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Foot controls */}
            <div className="bg-neutral-50 px-6 py-4 border-t flex justify-between items-center sm:rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsServiceDrawerOpen(false)}
                className="px-4 py-2 text-xs font-bold ring-1 ring-neutral-200 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                className="px-5 py-2 bg-neutral-900 text-white font-bold text-xs rounded-lg hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
              >
                Save Curation Suite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE MODAL: CHOOSE EXIST PRICING RULE TO LINK */}
      {isAddRuleModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-neutral-950 text-white p-4 flex justify-between items-center">
              <h6 className="text-xs font-mono font-bold uppercase tracking-wider">Select Rules To Associate</h6>
              <button
                type="button"
                onClick={() => setIsAddRuleModalOpen(false)}
                className="hover:text-amber-400 font-bold"
              >
                ✖
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
              <p className="text-[11px] text-neutral-500 font-semibold">Select any pre-configured base rate modifiers or property add-ons configuration formulas below to apply onto {serviceFormTitle}:</p>
              
              <div className="space-y-4 divide-y">
                {['service_base', 'size_charge', 'addon_pricing', 'urgency_charge', 'location_charge', 'min_order', 'manual_quote'].map((type) => {
                  const matched = pricingRules.filter(r => r.rule_type === type);
                  if (matched.length === 0) return null;
                  
                  return (
                    <div key={type} className="pt-3 first:pt-0 space-y-1.5">
                      <span className="text-[9px] font-mono tracking-widest font-extrabold text-neutral-400 bg-neutral-100 rounded px-1.5 py-0.5 uppercase">
                        {type.replace('_', ' ')}
                      </span>
                      <div className="space-y-1 pt-1">
                        {matched.map((rule) => {
                          const isLinked = serviceLinkedRules.some((r: any) => r.pricing_rule_id === rule.id);
                          return (
                            <div key={rule.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-neutral-50 gap-2">
                              <div>
                                <span className="font-semibold text-neutral-805">{rule.name || rule.rule_name}</span>
                                <div className="text-[9px] text-neutral-400 font-mono">match: &quot;{rule.match_key || rule.value}&quot; | adjust: {rule.adjustment_type === 'percentage' ? `${rule.price_adjustment}%` : `$${rule.price_adjustment}`}</div>
                              </div>
                              <button
                                type="button"
                                disabled={isLinked}
                                onClick={async () => {
                                  await handleAddPricingRuleLink(rule.id);
                                  setIsAddRuleModalOpen(false);
                                }}
                                className={`px-2 py-1 font-mono text-[9px] font-bold uppercase cursor-pointer rounded border ${
                                  isLinked
                                    ? 'text-neutral-400 bg-neutral-100 border-neutral-200'
                                    : 'text-neutral-808 hover:text-white border-neutral-300 hover:bg-neutral-900 transition-all'
                                }`}
                              >
                                {isLinked ? 'Linked' : 'Associate'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-neutral-50 p-4 font-mono text-[10px] text-neutral-400 text-center border-t">
              Associated formulas will govern real-time online estimation quotes.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
