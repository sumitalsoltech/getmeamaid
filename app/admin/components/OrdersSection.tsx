'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';
import { Search } from 'lucide-react';

export default function OrdersSection() {
  const {
    bookings,
    staff,
    setSelectedBooking,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    serviceDateFilter, setServiceDateFilter,
    serviceTypeFilter, setServiceTypeFilter,
    serviceLocationFilter, setServiceLocationFilter
  } = useAdmin();

  return (
    <div className="space-y-4">
      {/* Integrated Filter Bar with Date, Service Type, & Service Location */}
      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-xs font-bold font-mono text-neutral-800 uppercase tracking-widest">Active Dispatch Filter Desk</h4>
          <span className="text-[10px] text-neutral-400 font-mono">Real-time parameters rendering</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Search Text</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search customer, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-full text-xs rounded-md border border-neutral-200 outline-none bg-white focus:border-[#fbbf24] transition font-medium text-neutral-800"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-neutral-200 rounded-md outline-none font-semibold text-neutral-700 text-xs cursor-pointer focus:border-[#fbbf24] transition text-ellipsis"
            >
              <option value="all">All Statuses</option>
              {['New', 'Under Review', 'Quote Sent', 'Payment Pending', 'Paid', 'Job Assigned', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Date of Service Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Date of Service</label>
            <div className="flex gap-1.5">
              <input
                type="date"
                value={serviceDateFilter}
                onChange={(e) => setServiceDateFilter(e.target.value)}
                className="w-full p-1 bg-white border border-neutral-200 rounded-md outline-none text-neutral-700 text-xs cursor-pointer focus:border-[#fbbf24] transition"
              />
              {serviceDateFilter && (
                <button
                  onClick={() => setServiceDateFilter('')}
                  className="p-1 px-2 border border-neutral-300 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-md text-xs font-bold transition cursor-pointer"
                  title="Clear date"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Service Type Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Service Type</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full p-1.5 bg-white border border-neutral-200 rounded-md outline-none font-semibold text-neutral-700 text-xs cursor-pointer focus:border-[#fbbf24] transition text-ellipsis"
            >
              <option value="all">All Service Types</option>
              {Array.from(new Set(bookings.map(b => b.restoration_level).filter(Boolean))).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Service Location (Postal Code) Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 font-mono uppercase">Service Location</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. M5V"
                value={serviceLocationFilter}
                onChange={(e) => setServiceLocationFilter(e.target.value)}
                className="w-full p-1.5 bg-white border border-neutral-200 rounded-md outline-none text-neutral-700 text-xs text-mono pr-7 focus:border-[#fbbf24] transition uppercase font-semibold"
              />
              {serviceLocationFilter && (
                <button
                  onClick={() => setServiceLocationFilter('')}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600 text-xs transition cursor-pointer"
                  title="Clear location"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-x-auto">
        <table className="w-full text-xs text-left text-neutral-700">
          <thead className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="p-4">ID / Ref</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Structure</th>
              <th className="p-4">Target Date</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Order Status</th>
              <th className="p-4">Assigned Staff</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/80">
            {bookings
              .filter(b => statusFilter === 'all' || b.order_status === statusFilter)
              .filter(b => !serviceDateFilter || b.selected_date === serviceDateFilter)
              .filter(b => serviceTypeFilter === 'all' || b.restoration_level === serviceTypeFilter)
              .filter(b => {
                if (!serviceLocationFilter) return true;
                return b.postal_code.toLowerCase().includes(serviceLocationFilter.toLowerCase());
              })
              .filter(b => {
                let full = `${b.first_name} ${b.last_name} ${b.postal_code} ${b.id}`.toLowerCase();
                return full.includes(searchQuery.toLowerCase());
              })
              .map(b => (
                <tr key={b.id} className="hover:bg-neutral-50/50 transition border-b border-neutral-200/40">
                  <td className="p-4 font-mono font-bold text-neutral-900">{b.id}</td>
                  <td className="p-4">
                    <div className="font-semibold">{b.first_name} {b.last_name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{b.email}</div>
                  </td>
                  <td className="p-4">{b.home_type}</td>
                  <td className="p-4">
                    <div>{b.selected_date}</div>
                    <div className="text-[10px] text-neutral-400">{b.selected_time_slot}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-100 border border-neutral-200/50">
                      {b.order_status}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-neutral-700">
                    {staff.find(s => s.id === b.assigned_staff_id)?.name || <span className="text-neutral-400">Not Assigned</span>}
                    {b.staff_job_status && (
                      <div className="text-[9px] text-[#fbbf24] font-bold uppercase">{b.staff_job_status}</div>
                    )}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-2.5 py-1 rounded border border-neutral-200 hover:border-black font-semibold text-neutral-900 transition cursor-pointer"
                    >
                      Edit / Review
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
