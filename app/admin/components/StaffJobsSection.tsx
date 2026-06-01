'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function StaffJobsSection() {
  const {
    staff,
    actingStaffId, setActingStaffId,
    bookings,
    handleStaffJobUpdate
  } = useAdmin();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-neutral-500">Field Curator Dispatch Board</h3>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] uppercase font-mono">
            Live Worker View
          </span>
        </div>
        <div>
          <span className="text-[11px] text-neutral-400 font-mono">Simulated Account</span>
          <h2 className="text-lg font-bold text-neutral-900">
            {staff.find(s => s.id === actingStaffId)?.name} (Field Staff)
          </h2>
        </div>
        
        {/* Simulated staff select */}
        <div className="flex items-center gap-2 border-t pt-3 text-xs">
          <span className="text-neutral-500">Pick Active Worker:</span>
          <select
            value={actingStaffId}
            onChange={(e) => setActingStaffId(e.target.value)}
            className="p-1 bg-white border rounded outline-none text-neutral-700 cursor-pointer font-semibold"
          >
            {staff.filter(s => String(s.role_id) === '4').map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.filter(b => b.assigned_staff_id === actingStaffId).map(b => (
          <div key={b.id} className="p-6 bg-white border border-neutral-200 rounded-xl space-y-4 shadow-sm text-neutral-808">
            <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-wider bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded leading-none">
                  {b.id}
                </span>
                <h3 className="font-display font-extrabold text-[#0f172a] mt-1.5 text-base">
                  {b.first_name} {b.last_name}
                </h3>
                <span className="text-xs text-neutral-500 font-mono">{b.phone}</span>
              </div>
              <span className={`px-2 py-1 text-xs font-black uppercase tracking-wider rounded border ${b.staff_job_status === 'Issue Reported' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-neutral-50 text-neutral-700'}`}>
                {b.staff_job_status || 'Allocated'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>Location Address / Post: <strong className="block text-neutral-950 font-semibold">{b.postal_code || 'Central Toronto'}</strong></div>
              <div>Time slot: <strong className="block text-neutral-950 font-semibold">{b.selected_date} ({b.selected_time_slot})</strong></div>
              <div className="col-span-2">Instructions: <p className="italic text-neutral-600 mt-1 font-medium bg-neutral-50 p-2.5 rounded border border-neutral-100">&quot;{b.job_instructions || 'Please clean with premium allergen suite.'}&quot;</p></div>
            </div>

            {/* Action trigger buttons */}
            <div className="border-t border-neutral-100 pt-4 flex flex-wrap gap-2 justify-end">
              {(!b.staff_job_status || b.staff_job_status === 'Pending') && (
                <button
                  onClick={() => handleStaffJobUpdate(b.id, 'Accepted')}
                  className="px-4 py-2 bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 rounded-lg text-xs font-bold shadow-sm cursor-pointer animate-pulse"
                >
                  Accept Dispatch Job
                </button>
              )}
              {b.staff_job_status === 'Accepted' && (
                <button
                  onClick={() => handleStaffJobUpdate(b.id, 'On the Way')}
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-bold cursor-pointer animate-pulse"
                >
                  Mark: On the Way
                </button>
              )}
              {b.staff_job_status === 'On the Way' && (
                <button
                  onClick={() => handleStaffJobUpdate(b.id, 'Started')}
                  className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Mark: Started
                </button>
              )}
              {b.staff_job_status === 'Started' && (
                <button
                  onClick={() => handleStaffJobUpdate(b.id, 'Completed')}
                  className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Verify Completed
                </button>
              )}

              {b.staff_job_status !== 'Completed' && b.staff_job_status !== 'Issue Reported' && (
                <button
                  onClick={() => {
                    const text = prompt('Kindly describe the dispatch issue detail:');
                    if (text) handleStaffJobUpdate(b.id, 'Issue Reported', text);
                  }}
                  className="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Flag/Report Issue
                </button>
              )}
            </div>
          </div>
        ))}
        {bookings.filter(b => b.assigned_staff_id === actingStaffId).length === 0 && (
          <p className="text-neutral-500 italic text-center py-12">No dispatch jobs allocated to your curator account today.</p>
        )}
      </div>
    </div>
  );
}
