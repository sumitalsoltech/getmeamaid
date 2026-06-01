'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function JobAllocationSection() {
  const { bookings, staff, handleAssignStaff } = useAdmin();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
        <h3 className="font-mono font-bold text-neutral-950 uppercase text-xs tracking-wider border-b pb-2">Pending Staff Allocations</h3>
        <div className="divide-y divide-neutral-100 space-y-3">
          {bookings.filter(b => b.order_status === 'New' || b.order_status === 'Under Review').map(b => (
            <div key={b.id} className="pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <span className="font-mono text-[9px] font-bold bg-neutral-100 border px-1.5 py-0.5 rounded text-neutral-600 block w-fit mb-1">{b.id}</span>
                <strong className="text-neutral-900 block font-semibold">{b.first_name} {b.last_name}</strong>
                <p className="text-xs text-neutral-500">{b.home_type} • {b.postal_code} • {b.selected_date}</p>
              </div>
              
              {/* Quick alloc inline widget */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  id={`alloc-staff-${b.id}`}
                  className="p-1.5 bg-white border rounded outline-none text-xs text-neutral-700 cursor-pointer"
                >
                  <option value="">Select Staff...</option>
                  {staff.filter(s => String(s.role_id) === '4').map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const selS = (document.getElementById(`alloc-staff-${b.id}`) as HTMLSelectElement)?.value;
                    if (!selS) return alert('Kindly select a staff member first.');
                    handleAssignStaff(b.id, selS, 'Standard dispatch. Please enforce clean bathroom moldings.', b.selected_date, b.selected_time_slot);
                  }}
                  className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 rounded text-xs font-semibold cursor-pointer"
                >
                  Assign Job
                </button>
              </div>
            </div>
          ))}
          {bookings.filter(b => b.order_status === 'New' || b.order_status === 'Under Review').length === 0 && (
            <p className="text-neutral-500 italic text-center py-4">No waiting bookings currently pending allocation.</p>
          )}
        </div>
      </div>

      <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
        <h3 className="font-mono font-bold text-neutral-900 uppercase text-xs tracking-wider border-b pb-2">Curators Activity Tracker</h3>
        <div className="space-y-3.5">
          {staff.filter(s => String(s.role_id) === '4').map(s => {
            const jobs = bookings.filter(b => b.assigned_staff_id === s.id);
            return (
              <div key={s.id} className="p-3 bg-neutral-50 border rounded-lg space-y-2">
                <div className="flex justify-between items-center border-b pb-1.5">
                  <strong className="text-neutral-900 text-xs font-bold">{s.name}</strong>
                  <span className="text-[10px] text-neutral-500 font-mono">{jobs.length} Jobs Assigned</span>
                </div>
                <div className="space-y-1">
                  {jobs.map(j => (
                    <div key={j.id} className="flex justify-between items-center text-[11px]">
                      <span className="font-mono text-neutral-400">{j.id}</span>
                      <span className={`font-semibold uppercase text-[9px] ${j.staff_job_status === 'Issue Reported' ? 'text-red-500' : 'text-neutral-600'}`}>
                        {j.staff_job_status || 'Assigned'}
                      </span>
                    </div>
                  ))}
                  {jobs.length === 0 && <p className="text-[11px] text-neutral-400 italic">No schedules assigned today.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
