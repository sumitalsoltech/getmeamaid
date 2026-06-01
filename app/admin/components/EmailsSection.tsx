'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';
import { Search } from 'lucide-react';

export default function EmailsSection() {
  const {
    adminTemplates,
    selectedAdminTpl, setSelectedAdminTpl,
    tplEditSubject, setTplEditSubject,
    tplEditBody, setTplEditBody,
    tplEditActive, setTplEditActive,
    testEmailAddress, setTestEmailAddress,
    isTestSending,
    handleSendTestEmail,
    handleSaveEmailTemplate,
    adminEmailLogs,
    emailLogsSearch, setEmailLogsSearch,
    handleResendFailedEmail,
    fetchCMSAndEmails
  } = useAdmin();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Template List */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
          <h3 className="text-xs uppercase font-extrabold font-mono text-neutral-400 tracking-wider">System Templates ({adminTemplates.length})</h3>
          <p className="text-[10px] text-neutral-500 font-sans">Select a registered communication template context to calibrate subject fields or layout.</p>
          
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {adminTemplates.map((tpl) => {
              const isSel = selectedAdminTpl?.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedAdminTpl(tpl);
                    setTplEditSubject(tpl.subject || '');
                    setTplEditBody(tpl.body || '');
                    setTplEditActive(tpl.is_active !== false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer ${
                    isSel 
                      ? 'bg-[#fbbf24]/10 border-[#fbbf24] text-neutral-900 font-bold' 
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-mono font-semibold truncate max-w-[150px]">{tpl.id}</span>
                    <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase font-sans ${
                      tpl.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tpl.is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <span className="text-[11px] font-sans truncate">{tpl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center & Right Column: Template Composer Editor & Live Envelope Mockup */}
        {selectedAdminTpl ? (
          <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl p-5 space-y-5 shadow-xs">
            
            <div className="flex justify-between items-center border-b pb-2">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 font-sans">{selectedAdminTpl.name}</h3>
                <span className="text-[10px] text-neutral-400 font-mono">ID Reference: {selectedAdminTpl.id}</span>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-1.5 text-xs text-neutral-600 font-semibold select-none cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={tplEditActive}
                    onChange={(e) => setTplEditActive(e.target.checked)}
                    className="rounded border-neutral-300 text-yellow-500 focus:ring-yellow-400 cursor-pointer"
                  />
                  <span>Template Active</span>
                </label>
              </div>
            </div>

            {/* Target Subject line */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700 font-sans">Email Subject Line:</label>
              <input
                type="text"
                value={tplEditSubject}
                onChange={(e) => setTplEditSubject(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-[#fbbf24] outline-none text-neutral-800"
                placeholder="Enter communication subject..."
              />
            </div>

            {/* Target Body line with rich tags injector */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="block text-xs font-bold text-neutral-700 font-sans">Envelope Msg Body:</label>
                <span className="text-[9px] text-[#fbbf24] font-bold font-mono">SUPPORTED DYNAMIC PLACEHOLDERS:</span>
              </div>
              
              {/* Placeholder insertion help badges */}
              <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 rounded-lg border">
                {['customer_name', 'order_id', 'service_name', 'amount', 'date', 'time', 'invoice_no'].map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTplEditBody(tplEditBody + ` {{${item}}}`)}
                    className="px-2 py-1 bg-white hover:bg-neutral-100 border text-[9.5px] font-mono rounded font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer shadow-2xs"
                  >
                    + &#123;&#123;{item}&#125;&#125;
                  </button>
                ))}
              </div>

              <textarea
                value={tplEditBody}
                onChange={(e) => setTplEditBody(e.target.value)}
                rows={8}
                className="w-full text-xs font-mono p-3 border text-neutral-800 rounded-lg focus:ring-2 focus:ring-[#fbbf24] outline-none leading-relaxed"
                placeholder="Format body text..."
              />
            </div>

            {/* Live visual visual envelope card preview */}
            <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-2 font-sans">
              <span className="text-[9px] font-mono text-[#fbbf24] uppercase font-bold tracking-widest block border-b border-white/10 pb-1">Real-Time Message Interpolation Letter Preview</span>
              <div className="space-y-1.5 text-[11px] leading-relaxed">
                <p><span className="text-neutral-400">Subject Preview:</span> <span className="font-semibold">{tplEditSubject
                  .replace(/\{\{customer_name\}\}/g, 'Arthur Pendelton')
                  .replace(/\{\{order_id\}\}/g, 'PRE-849102')
                  .replace(/\{\{invoice_no\}\}/g, 'INV-2041')
                }</span></p>
                <div className="pt-2 border-t border-white/5 whitespace-pre-wrap font-mono text-[10px] text-neutral-300">
                  {tplEditBody
                    .replace(/\{\{customer_name\}\}/g, 'Arthur Pendelton')
                    .replace(/\{\{order_id\}\}/g, 'PRE-849102')
                    .replace(/\{\{service_name\}\}/g, 'Standard Maintenance Curation')
                    .replace(/\{\{amount\}\}/g, '$180.00')
                    .replace(/\{\{date\}\}/g, 'June 10, 2026')
                    .replace(/\{\{time\}\}/g, '09:00 AM')
                    .replace(/\{\{invoice_no\}\}/g, 'INV-2041')
                  }
                </div>
              </div>
            </div>

            {/* Action saves & SMTP Test Sender widget */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2 border-t">
              <div className="flex-1 flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter test recipe email address..."
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="p-2 border rounded text-xs flex-1 outline-none text-neutral-805"
                />
                <button
                  onClick={handleSendTestEmail}
                  disabled={isTestSending}
                  className="px-3 bg-neutral-900 border hover:bg-neutral-800 text-white rounded text-[10.5px] font-bold cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isTestSending ? 'Sending...' : 'Send SMTP Test'}
                </button>
              </div>
              <button
                onClick={handleSaveEmailTemplate}
                className="px-5 py-2 bg-[#fbbf24] text-black font-extrabold rounded-lg text-xs hover:bg-[#d9a21b] cursor-pointer"
              >
                Save Template Configuration
              </button>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-8 bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center text-neutral-400 font-sans italic">
            Select a registered communication template context to load the workspace.
          </div>
        )}

      </div>

      {/* Centralized Email Communications Log Desk */}
      <div className="bg-white border text-neutral-700 border-neutral-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex justify-between items-center border-b pb-2">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 font-sans">Centralized Customer Email Communications Log</h3>
            <p className="text-[10px] text-neutral-500 mt-0.5">Logs all outgoing customer confirm emails, status updates, reset password forms, and invoice letters.</p>
          </div>
          <div className="w-64 relative">
            <input
              type="text"
              placeholder="Search logs by email address..."
              value={emailLogsSearch}
              onChange={(e) => setEmailLogsSearch(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1 text-[11px] border rounded outline-none text-neutral-805"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-[11px] border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-500 font-bold border-b">
                <th className="p-2">Timestamp Date</th>
                <th className="p-2">Template Slug</th>
                <th className="p-2">Recipient Email Address</th>
                <th className="p-2">Linked Dispatch</th>
                <th className="p-2 text-center">Output Status</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {adminEmailLogs
                .filter(l => !emailLogsSearch || l.recipient_email?.toLowerCase().includes(emailLogsSearch.toLowerCase()))
                .map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="p-2 text-neutral-500 font-mono text-[10px]">{log.timestamp ? new Date(log.timestamp).toLocaleString().slice(0, 16) : 'N/A'}</td>
                    <td className="p-2 font-mono text-[10px] text-[#fbbf24] font-extrabold uppercase">{log.template_used}</td>
                    <td className="p-2 font-medium text-neutral-900 font-mono">{log.recipient_email}</td>
                    <td className="p-2 font-mono text-[10px]">{log.related_entity_id || 'SYSTEM'}</td>
                    <td className="p-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wide inline-block ${
                        log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => handleResendFailedEmail(log.id)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-[4px] text-[9.5px] font-bold cursor-pointer shadow-2xs"
                        >
                          Resend Communications
                        </button>
                      )}
                      {log.status === 'sent' && (
                        <span className="text-neutral-400 text-[9.5px]">Receipt verified</span>
                      )}
                    </td>
                  </tr>
                ))}

              {adminEmailLogs.filter(l => !emailLogsSearch || l.recipient_email?.toLowerCase().includes(emailLogsSearch.toLowerCase())).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-400 italic">No communication logs recorded. Submit a booking or click manual dispatch inside helper sheets!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
