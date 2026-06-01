'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function TicketsSection() {
  const {
    tickets, setTickets,
    selectedTicket, setSelectedTicket,
    ticketReplyText, setTicketReplyText
  } = useAdmin();

  // Helper to save state (placeholder function for compatibility, in AdminContext we do live updates)
  const saveState = (key: string, data: any) => {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4 font-sans text-neutral-800">
        <h3 className="text-xs uppercase font-bold font-mono text-neutral-400 border-b pb-1">Active Client Tickets</h3>
        <div className="divide-y divide-neutral-100">
          {tickets.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className={`py-3.5 flex justify-between items-start text-xs cursor-pointer hover:bg-neutral-50 p-2.5 rounded-lg transition-all ${selectedTicket?.id === t.id ? 'bg-[#fbbf24]/5 border-l-2 border-[#fbbf24]' : ''}`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-950">{t.ticket_number}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${t.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-neutral-100 text-neutral-600'}`}>
                    {t.priority}
                  </span>
                </div>
                <strong className="text-neutral-900 text-sm block">{t.subject}</strong>
                <p className="text-neutral-500 line-clamp-1">{t.message}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-[10px] font-bold text-[9px] uppercase ${t.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-500'}`}>
                {t.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Customer ticket reply workflow */}
      <div className="bg-white border rounded-xl p-5 space-y-4 font-sans text-neutral-800">
        <h3 className="text-sm font-bold font-mono uppercase">Ticket Reply Control</h3>
        {selectedTicket ? (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
              <span className="font-mono text-[9px] block text-neutral-400">Subject: {selectedTicket.ticket_number}</span>
              <strong className="text-neutral-950 text-sm">{selectedTicket.subject}</strong>
              <p className="text-neutral-600 mt-2 font-medium">From: {selectedTicket.customer_name}</p>
              <p className="italic text-neutral-505 bg-white p-2 border rounded mt-1.5">&quot;{selectedTicket.message}&quot;</p>
            </div>

            <div className="space-y-1 bg-neutral-50 p-2 border rounded max-h-36 overflow-y-auto font-sans">
              <span className="text-[9px] uppercase font-bold text-neutral-400 font-semibold">Reply History:</span>
              {selectedTicket.replies?.map((r, i) => (
                <div key={i} className="mt-1 border-t pt-1">
                  <strong>{r.sender}:</strong> <p className="text-neutral-605 mt-0.5">{r.message}</p>
                </div>
              ))}
              {(!selectedTicket.replies || selectedTicket.replies.length === 0) && <p className="text-neutral-400 italic">No replies posted yet.</p>}
            </div>

            <div className="space-y-1.5">
              <span className="block font-bold text-neutral-700">Write response template:</span>
              <textarea
                placeholder="Type response back to customer..."
                value={ticketReplyText}
                onChange={(e) => setTicketReplyText(e.target.value)}
                className="w-full h-20 p-2 border bg-neutral-50 rounded outline-none"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!ticketReplyText) return;
                  try {
                    const replyRes = await fetch('/api/tickets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'reply',
                        ticketId: selectedTicket.id,
                        message: ticketReplyText
                      })
                    });
                    const replyData = await replyRes.json();
                    
                    if (!replyData.success) {
                      alert(`Failed to submit reply: ${replyData.error}`);
                      return;
                    }

                    const statusRes = await fetch('/api/tickets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'status',
                        ticketId: selectedTicket.id,
                        status: 'Resolved'
                      })
                    });
                    const statusData = await statusRes.json();

                    if (statusData.success) {
                      const updated = tickets.map(t => {
                        if (t.id === selectedTicket.id) {
                          return {
                            ...t,
                            status: 'Resolved' as const,
                            replies: [...(t.replies || []), { sender: 'Support Administrator', message: ticketReplyText, date: new Date().toISOString() }]
                          };
                        }
                        return t;
                      });
                      setTickets(updated);
                      saveState('tickets', updated);
                      setTicketReplyText('');
                      setSelectedTicket(updated.find(t => t.id === selectedTicket.id) || null);
                      alert('Reply submitted and ticket marked Resolved in MySQL database.');
                    } else {
                      alert(`Failed to update ticket status: ${statusData.error}`);
                    }
                  } catch (err: any) {
                    alert(`Error resolving ticket: ${err.message}`);
                  }
                }}
                className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded cursor-pointer transition text-xs uppercase font-semibold"
              >
                Submit & Settle Ticket
              </button>
            </div>
          </div>
        ) : (
          <p className="text-neutral-500 italic py-6 text-center">Select any support ticket to handle replies.</p>
        )}
      </div>
    </div>
  );
}
