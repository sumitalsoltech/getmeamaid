'use client';

import React from 'react';
import { useAdmin, PERMISSION_SECTIONS } from '../AdminContext';
import { Plus, Shield, Edit2, Trash2, X } from 'lucide-react';

export default function RolesSection() {
  const {
    roles, setRoles,
    isRoleModalOpen, setIsRoleModalOpen,
    editingRoleId, setEditingRoleId,
    newRole, setNewRole,
    handleCreateRole,
    togglePermissionInNewRole,
    isSectionSelected,
    toggleSection,
    areAllPermissionsSelected,
    toggleAllPermissions
  } = useAdmin();

  // Helper to save state (placeholder function for compatibility, in AdminContext we do live updates)
  const saveState = (key: string, data: any) => {};

  return (
    <div className="space-y-4">
      {/* Header Actions Bar */}
      <div className="flex justify-between items-center bg-white border rounded-xl p-4 shadow-xs">
        <div>
          <h3 className="text-sm font-bold font-mono text-neutral-900 uppercase">Configured Authorization Roles</h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">Configure access permissions per organizational role dynamically.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingRoleId(null);
            setNewRole({ name: '', permissions: [] });
            setIsRoleModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4.5 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-lg cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Custom Role
        </button>
      </div>

      {/* Roles List Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-mono uppercase text-neutral-400">
                <th className="py-3 px-4 font-semibold w-48">Role Profile</th>
                <th className="py-3 px-4 font-semibold">Accessible Permissions</th>
                <th className="py-3 px-4 text-right w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-xs text-neutral-800">
              {roles.map(r => (
                <tr key={r.id} className="hover:bg-neutral-50/50 transition-all">
                  {/* Role Profile */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-neutral-600" />
                      </div>
                      <div>
                        <strong className="text-sm text-neutral-900 font-bold block">{r.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">#{r.id}</span>
                      </div>
                    </div>
                  </td>

                  {/* Accessible Permissions */}
                  <td className="py-4 px-4">
                    {(() => {
                      const labelMap: Record<string, string> = {};
                      PERMISSION_SECTIONS.forEach(s => {
                        s.permissions.forEach(p => {
                          if (!labelMap[p.key]) labelMap[p.key] = p.label;
                        });
                      });
                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {String(r.id) === '1' ? (
                            <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[9px] uppercase tracking-wider">
                              Full Bypass Access — All {Object.keys(labelMap).length} Modules
                            </span>
                          ) : r.permissions.length === 0 ? (
                            <span className="text-neutral-400 italic text-xs">No access enabled</span>
                          ) : (
                            r.permissions.map(p => (
                              <span key={p} className="inline-flex items-center px-2 py-0.5 rounded bg-neutral-50 text-neutral-700 border border-neutral-200 text-[10px] font-medium">
                                {labelMap[p] || p}
                              </span>
                            ))
                          )}
                        </div>
                      );
                    })()}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Edit Role Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoleId(String(r.id));
                          setNewRole({ name: r.name, permissions: r.permissions });
                          setIsRoleModalOpen(true);
                        }}
                        className="p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-blue-600 transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
                        title="Edit Role Schema"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Role Button */}
                      <button
                        type="button"
                        disabled={String(r.id) === '1'}
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete role "${r.name}"?`)) {
                            try {
                              const res = await fetch(`/api/admin/roles?id=${r.id}`, {
                                method: 'DELETE'
                              });
                              const data = await res.json();
                              if (data.success) {
                                const rlist = roles.filter(role => String(role.id) !== String(r.id));
                                setRoles(rlist);
                                saveState('roles', rlist);
                              } else {
                                alert(`Failed to delete role: ${data.error}`);
                              }
                            } catch (err: any) {
                              alert(`Error deleting role: ${err.message}`);
                            }
                          }
                        }}
                        className={`p-1 hover:bg-neutral-100 rounded text-neutral-500 hover:text-rose-600 transition-colors border border-transparent ${
                          String(r.id) === '1'
                            ? 'opacity-30 cursor-not-allowed' 
                            : 'hover:border-neutral-200 cursor-pointer'
                        }`}
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal dialog for creating/editing roles */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[1000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  {editingRoleId ? 'Edit Role' : 'Create New Role'}
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Configure module access permissions for this role</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="flex flex-col flex-1 overflow-hidden">
              {/* Name field + Select All */}
              <div className="px-7 pt-5 pb-4 space-y-4 shrink-0 border-b border-gray-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter Role Name"
                    value={newRole.name}
                    disabled={String(editingRoleId) === '1'}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg outline-none disabled:opacity-50 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all text-neutral-900 placeholder:text-neutral-400 font-semibold"
                  />
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none group w-fit">
                  <input
                    type="checkbox"
                    id="select-all-permissions-chk"
                    checked={areAllPermissionsSelected()}
                    onChange={toggleAllPermissions}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                    Select All Permissions
                  </span>
                </label>
              </div>

              {/* Scrollable section list */}
              <div className="overflow-y-auto flex-1">
                {PERMISSION_SECTIONS.map((section, sIdx) => {
                  const isGroupChecked = isSectionSelected(section);
                  return (
                    <div key={sIdx}>
                      {/* Group Header */}
                      <div className="flex items-center justify-between px-7 py-2.5 bg-gray-55 border-y border-gray-100">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                          {section.title}
                        </span>
                        <label className="flex items-center gap-2 cursor-pointer select-none group">
                          <input
                            type="checkbox"
                            checked={isGroupChecked}
                            onChange={() => toggleSection(section)}
                            className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer"
                          />
                          <span className="text-[11px] text-neutral-400 group-hover:text-neutral-600 transition-colors font-medium">
                            Select Group
                          </span>
                        </label>
                      </div>

                      {/* Module row */}
                      <div className="flex items-center justify-between px-7 py-3.5 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isGroupChecked}
                            onChange={() => toggleSection(section)}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer shrink-0"
                          />
                          <span className="text-sm text-neutral-800 font-medium">
                            {section.title}
                          </span>
                        </label>

                        {/* Action pill checkboxes */}
                        <div className="flex items-center gap-2 flex-wrap justify-end ml-4">
                          {section.permissions.map((perm) => {
                            const isActive = newRole.permissions.includes(perm.key);
                            const short = perm.label.split(' ')[0];
                            return (
                              <label
                                key={perm.key}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer select-none transition-all text-xs font-medium ${
                                  isActive
                                    ? 'bg-neutral-900 text-white border-neutral-900'
                                    : 'bg-white text-neutral-500 border-gray-200 hover:border-neutral-400 hover:text-neutral-800'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isActive}
                                  onChange={() => togglePermissionInNewRole(perm.key)}
                                  className="w-3 h-3 rounded border-gray-300 cursor-pointer"
                                />
                                {short}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-7 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-bold bg-neutral-900 text-white rounded-lg hover:bg-neutral-700 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  {editingRoleId ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
