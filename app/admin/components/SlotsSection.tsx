'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function SlotsSection() {
  const { slots } = useAdmin();

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <h3 className="text-xs uppercase font-bold font-mono text-neutral-400 border-b pb-1">Arrival Window Timeslots</h3>
      <div className="divide-y divide-neutral-100">
        {slots.map(s => (
          <div key={s.id} className="py-2.5 flex justify-between items-center text-xs font-mono border-b border-neutral-100 last:border-0 text-neutral-800">
            <span>{s.name}</span>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-sans text-[10px] font-bold rounded">
              STATUS: ACTIVE
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
