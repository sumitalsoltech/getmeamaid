'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';
import { Printer, Send } from 'lucide-react';

export default function InvoicesSection() {
  const {
    invoices,
    selectedInvoice, setSelectedInvoice,
    bookings
  } = useAdmin();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
      <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4 print:hidden font-sans text-neutral-800">
        <h3 className="text-xs uppercase font-bold font-mono text-neutral-400 border-b pb-1">Ledger Generated Invoices</h3>
        <div className="bg-white border overflow-x-auto rounded-lg">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                <th className="p-3">Invoice No.</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Settle Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-neutral-700">
              {invoices.map((i, idx) => (
                <tr key={`${i.id}-${idx}`} className="hover:bg-neutral-50/50">
                  <td className="p-3 font-mono font-bold text-neutral-900">{i.invoice_number}</td>
                  <td className="p-3">{i.customer_name}</td>
                  <td className="p-3 font-mono">${i.total_amount.toFixed(2)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${i.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setSelectedInvoice(i)}
                      className="px-2 py-1 bg-black text-white hover:bg-neutral-800 rounded text-xs font-semibold cursor-pointer"
                    >
                      Statement Print View
                    </button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-neutral-400 italic">No invoices compiled. Mark an order as &quot;Completed&quot; inside detail panels to generate invoices.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Printable Invoice Sheet */}
      <div className="bg-white border rounded-xl p-6 space-y-5 shadow-sm print:border-none print:shadow-none print:-mt-10 text-neutral-800 font-sans">
        {selectedInvoice ? (
          <div id="invoice-printable-container" className="space-y-4 text-xs">
            {/* invoice shell brand header */}
            <div className="flex justify-between items-start border-b pb-3.5">
              <div>
                <h2 className="text-base font-extrabold tracking-widest text-[#0f172a] uppercase font-mono">getmeamaid Co.</h2>
                <p className="text-[10px] text-neutral-400 uppercase font-mono mt-0.5">Premium Curation Suite</p>
                <span className="text-[9px] text-neutral-550 block mt-1.5 leading-tight font-semibold">100 King St West, Toronto, ON M5X 1A9</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-neutral-400 uppercase block font-mono">Invoice Number</span>
                <strong className="text-sm font-semibold text-neutral-900 font-mono tracking-wider">{selectedInvoice.invoice_number}</strong>
                <span className="text-[9px] text-neutral-400 block mt-1 font-mono">{selectedInvoice.created_at.slice(0, 10)}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-neutral-600 bg-neutral-50 p-3 rounded">
              <span className="text-[9px] uppercase font-serif font-black text-neutral-400 tracking-wider font-semibold">Statement For Customer</span>
              <div className="text-neutral-900 font-bold block">{selectedInvoice.customer_name}</div>
              <div className="text-[10px] text-neutral-500 font-mono italic">{selectedInvoice.customer_email}</div>
            </div>

            <div className="border border-neutral-200/50 rounded overflow-hidden">
              <div className="bg-neutral-50 p-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex justify-between">
                <span>Service Summary</span>
                <span>Billed Charge</span>
              </div>
              <div className="p-2.5 flex justify-between">
                <div>
                  <strong className="font-semibold block text-neutral-900">{bookings.find(b => b.id === selectedInvoice.order_id)?.home_type || 'Eco Sanitation Suite'}</strong>
                  <span className="text-[11px] text-neutral-400 font-mono">Reference: {selectedInvoice.order_id}</span>
                </div>
                <span className="font-mono font-bold">${(selectedInvoice.total_amount / 1.18).toFixed(2)}</span>
              </div>
              <div className="p-2.5 border-t border-neutral-100 flex justify-between text-neutral-500 text-[11px]">
                <span>Tax calibration (13%) & Fee (5%):</span>
                <span className="font-mono">${(selectedInvoice.total_amount - (selectedInvoice.total_amount / 1.18)).toFixed(2)}</span>
              </div>
              <div className="p-2.5 bg-neutral-50 border-t flex justify-between font-bold text-neutral-900 text-sm">
                <span>Total Invoice Amount:</span>
                <span className="font-mono">${selectedInvoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="border border-neutral-100 p-2.5 rounded bg-neutral-50/30 text-[10.5px]">
              <span className="font-mono uppercase font-black text-neutral-400 block mb-0.5">Settle Status:</span>
              <p className="font-semibold">Settlement: <span className="text-amber-600 font-bold uppercase">{selectedInvoice.status}</span></p>
            </div>

            <div className="flex gap-2 print:hidden pt-4 border-t">
              <button
                onClick={() => window.print()}
                className="flex-grow p-2.5 bg-black text-white hover:bg-neutral-850 rounded text-xs font-bold inline-flex justify-center items-center gap-2 cursor-pointer transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Standard Invoice</span>
              </button>
              <button
                onClick={() => {
                  alert(`Emailed statement successfully back to customer address: ${selectedInvoice.customer_email}.`);
                }}
                className="p-2.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded text-xs font-bold cursor-pointer"
                title="E-mail Statement"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-neutral-500 italic py-12 text-center print:hidden">Select any generated invoice statement from ledger list to open the print view.</p>
        )}
      </div>
    </div>
  );
}
