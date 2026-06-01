'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';

export default function StaffSection() {
  const {
    staff, setStaff,
    roles,
    staffSearchQuery, setStaffSearchQuery,
    newStaff, setNewStaff,
    editingStaffId, setEditingStaffId,
    isStaffModalOpen, setIsStaffModalOpen,
    handleCreateStaff
  } = useAdmin();

  // Helper to save state (placeholder function for compatibility, in AdminContext we do live updates)
  const saveState = (key: string, data: any) => {};

  return (
    <div className="space-y-4">
      {/* Action Header bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white border rounded-xl p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold font-mono text-neutral-900 uppercase">Active Curators Staff List</h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">Manage administrative and field crew curation staff profiles.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff roster..."
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-neutral-200 rounded-lg text-xs w-full focus:outline-none focus:ring-1 focus:ring-[#fbbf24] bg-neutral-50 focus:bg-white transition-all text-neutral-800"
            />
          </div>
          {/* Add staff button */}
          <button
            type="button"
            onClick={() => {
              setEditingStaffId(null);
              setNewStaff({ name: '', email: '', phone: '', role_id: '4', password: '' });
              setIsStaffModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-lg cursor-pointer shadow-xs whitespace-nowrap justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Staff User
          </button>
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-mono uppercase text-neutral-400">
                <th className="py-3 px-4 font-semibold">User Personal Profile</th>
                <th className="py-3 px-4 font-semibold">Registered Email</th>
                <th className="py-3 px-4 font-semibold">Direct Phone</th>
                <th className="py-3 px-4 font-semibold text-center">Assigned Role</th>
                <th className="py-3 px-4 font-semibold text-center">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs text-neutral-800">
              {staff
                .filter(s => 
                  s.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                  s.email.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                  (s.phone || '').toLowerCase().includes(staffSearchQuery.toLowerCase())
                )
                .map(s => {
                  const roleObj = roles.find(r => String(r.id) === String(s.role_id));
                  const roleName = roleObj ? roleObj.name : 'Field Staff';
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50/50 transition-all">
                      {/* User Personal Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center font-bold text-neutral-700">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm leading-tight">{s.name}</p>
                            <p className="text-[10px] text-neutral-400 font-mono">#{s.id}</p>
                          </div>
                        </div>
                      </td>
                      
                      {/* Registered Email */}
                      <td className="py-3.5 px-4 font-mono text-neutral-600">{s.email}</td>
                      
                      {/* Direct Phone */}
                      <td className="py-3.5 px-4 text-neutral-500 font-mono">{s.phone || '—'}</td>
                      
                      {/* Assigned Role */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fbbf24]/10 text-[#c2931a] border border-[#fbbf24]/20 uppercase">
                          {roleName}
                        </span>
                      </td>
                      
                      {/* Account Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          s.is_active !== false 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          ● {s.is_active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      
                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Deactivate/Activate Status Button */}
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/admin/staff', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: s.id, is_active: !s.is_active })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  const updated = staff.map(st => st.id === s.id ? { ...st, is_active: !st.is_active } : st);
                                  setStaff(updated);
                                  saveState('staff', updated);
                                } else {
                                  alert(`Failed to update staff status: ${data.error}`);
                                }
                              } catch (err: any) {
                                alert(`Error updating staff: ${err.message}`);
                              }
                            }}
                            className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer ${
                              s.is_active !== false 
                                ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300' 
                                : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300'
                            }`}
                          >
                            {s.is_active !== false ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStaffId(String(s.id));
                              setNewStaff({
                                name: s.name,
                                email: s.email,
                                phone: s.phone || '',
                                role_id: String(s.role_id),
                                password: ''
                              });
                              setIsStaffModalOpen(true);
                            }}
                            className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-blue-600 transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            disabled={String(s.id) === '1'}
                            onClick={async () => {
                              if (confirm(`Are you sure you want to delete staff member ${s.name}?`)) {
                                try {
                                  const res = await fetch(`/api/admin/staff?id=${s.id}`, {
                                    method: 'DELETE'
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    const updated = staff.filter(st => String(st.id) !== String(s.id));
                                    setStaff(updated);
                                    saveState('staff', updated);
                                  } else {
                                    alert(`Failed to delete staff: ${data.error}`);
                                  }
                                } catch (err: any) {
                                  alert(`Error deleting staff: ${err.message}`);
                                }
                              }
                            }}
                            className={`p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-rose-600 transition-colors border border-transparent ${
                              String(s.id) === '1' 
                                ? 'opacity-30 cursor-not-allowed' 
                                : 'hover:border-neutral-200 cursor-pointer'
                            }`}
                            title="Delete Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Staff Add/Edit Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="bg-slate-950 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider">
                  {editingStaffId ? 'Edit Staff Profile' : 'Enroll New Staff Member'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure user personal details and access role</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsStaffModalOpen(false);
                  setEditingStaffId(null);
                  setNewStaff({ name: '', email: '', phone: '', role_id: '4', password: '' });
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              await handleCreateStaff(e);
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Chen"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full text-xs p-2.5 bg-neutral-50 border rounded-lg outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full text-xs p-2.5 bg-neutral-50 border rounded-lg outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (416) 555-0199"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full text-xs p-2.5 bg-neutral-50 border rounded-lg outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-neutral-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Assigned Access Role</label>
                <select
                  value={newStaff.role_id}
                  disabled={editingStaffId === '1'}
                  onChange={(e) => setNewStaff({ ...newStaff, role_id: e.target.value })}
                  className="w-full text-xs p-2.5 bg-neutral-50 border rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-[#fbbf24] transition-all text-neutral-800"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">
                  {editingStaffId ? 'Password (Leave blank to keep unchanged)' : 'Initial Password *'}
                </label>
                <input
                  type="password"
                  required={!editingStaffId}
                  placeholder={editingStaffId ? '••••••••' : 'Enter password'}
                  value={newStaff.password || ''}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full text-xs p-2.5 bg-neutral-50 border rounded-lg outline-none focus:ring-1 focus:ring-[#fbbf24] transition-all text-neutral-800"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsStaffModalOpen(false);
                    setEditingStaffId(null);
                    setNewStaff({ name: '', email: '', phone: '', role_id: '4', password: '' });
                  }}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                >
                  {editingStaffId ? 'Save Changes' : 'Enroll Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
