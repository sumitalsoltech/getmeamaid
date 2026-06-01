'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';
import { Activity, DollarSign, MessageSquare, Users, ChevronRight } from 'lucide-react';

export default function DashboardSection() {
  const { bookings, tickets, staff, navigateTo } = useAdmin();

  return (
    <div className="space-y-6">
      {/* Dynamic Stat Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
          <Activity className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
          <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Registered Dispatches</span>
          <h3 className="text-2xl font-bold font-mono text-neutral-900">{bookings.length}</h3>
          <span className="text-[10px] text-neutral-500">Aggregate customer dispatches</span>
        </div>
        <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
          <DollarSign className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
          <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Accounting Revenue</span>
          <h3 className="text-2xl font-bold font-mono text-neutral-900 text-amber-600">
            ${bookings.reduce((sum, b) => {
              try {
                const pr = typeof b.pricing === 'string' ? JSON.parse(b.pricing) : b.pricing;
                return sum + (pr?.total || 0);
              } catch { return sum; }
            }, 0).toFixed(2)}
          </h3>
          <span className="text-[10px] text-neutral-500">Total transaction values</span>
        </div>
        <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
          <MessageSquare className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
          <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Active Support Tickets</span>
          <h3 className="text-2xl font-bold font-mono text-neutral-900">
            {tickets.filter(t => t.status !== 'Closed').length}
          </h3>
          <span className="text-[10px] text-neutral-500">Unresolved client tickets</span>
        </div>
        <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
          <Users className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
          <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Registered Staff Curators</span>
          <h3 className="text-2xl font-bold font-mono text-neutral-900">{staff.length}</h3>
          <span className="text-[10px] text-[#fbbf24] font-semibold">Active staff assignments</span>
        </div>
      </div>

      {/* Bento segment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
          <div className="flex justify-between items-center text-xs font-bold uppercase font-mono tracking-wider border-b border-neutral-100 pb-2">
            <span>New Order Queues</span>
            <span className="text-amber-600">Action Required</span>
          </div>
          <div className="divide-y divide-neutral-100">
            {bookings.slice(0, 3).map(b => (
              <div key={b.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <strong className="text-neutral-900 block font-semibold">{b.first_name} {b.last_name}</strong>
                  <span className="text-xs text-neutral-500">{b.home_type} • {b.selected_date}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                  {b.order_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
          <span className="block font-bold font-mono uppercase text-xs text-neutral-500 tracking-wider">Quick Actions</span>
          <div className="flex flex-col gap-2">
            <button onClick={() => navigateTo('Job Allocation')} className="w-full text-left p-3 hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer">
              <span>Assign Waiting Orders</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
            <button onClick={() => navigateTo('Roles & Permissions')} className="w-full text-left p-3 hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer">
              <span>Calibrate Security Roles</span>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>
            <button onClick={() => navigateTo('Reports')} className="w-full text-left p-3 hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-semibold cursor-pointer">
              <span>Download Excel/CSV Reports</span>
              <ChevronRight className="w-4 h-4 text-[#fbbf24]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
