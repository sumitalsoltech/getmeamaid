'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function CustomersSection() {
  const { bookings } = useAdmin();

  return (
    <div className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase font-mono text-neutral-500 tracking-wider">Registered Client Directory</h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {bookings.map((b, i) => (
          <div key={`${b.id}-${i}`} className="py-3 flex justify-between items-center border-b border-neutral-100/50">
            <div>
              <strong className="text-neutral-900 block font-semibold">{b.first_name} {b.last_name}</strong>
              <span className="text-xs font-mono text-neutral-400">{b.email} • {b.phone}</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded">
              Source: Account SignUp
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
