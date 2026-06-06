'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';

export default function CouponsSection() {
  const {
    coupons,
    fetchCoupons,
    newCoupon, setNewCoupon
  } = useAdmin();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4 font-sans text-neutral-800">
        <h3 className="text-xs uppercase font-bold font-mono text-neutral-400 border-b pb-1">Coupon Vouchers Library</h3>
        <div className="divide-y divide-neutral-100 space-y-3">
          {coupons.map(c => (
            <div key={c.id} className="pt-3 flex justify-between items-center text-xs font-mono border-b border-neutral-100 pb-3">
              <div>
                <strong className="text-neutral-950 font-black tracking-widest block text-sm">{c.code}</strong>
                <span className="text-neutral-500 text-[10px]">Reward: {c.discount_type === 'percentage' ? `${c.value}% discount` : `$${c.value} OFF`} • Used: {c.used_count || 0} times</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('Are you sure you want to delete this coupon?')) return;
                  try {
                    const res = await fetch(`/api/admin/coupons?id=${c.id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.success) {
                      fetchCoupons();
                    } else {
                      alert(`Delete failed: ${data.error}`);
                    }
                  } catch (err: any) {
                    alert(`API error: ${err.message}`);
                  }
                }}
                className="text-[10px] hover:underline text-red-505 font-bold font-sans cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4 font-sans">
        <h3 className="text-sm font-bold font-mono uppercase text-neutral-900">Add Coupon</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newCoupon.code) return;
          try {
            const res = await fetch('/api/admin/coupons', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: newCoupon.code,
                name: 'Bespoke Promo',
                discount_type: newCoupon.type,
                discount_value: newCoupon.value === '' ? 0 : Number(newCoupon.value),
                is_active: true
              })
            });
            const data = await res.json();
            if (data.success) {
              fetchCoupons();
              setNewCoupon({ code: '', value: 25, type: 'percentage' });
              alert('Coupon saved to database successfully!');
            } else {
              alert(`Failed to add coupon: ${data.error}`);
            }
          } catch (err: any) {
            alert(`API Error: ${err.message}`);
          }
        }} className="space-y-3 text-neutral-800">
          <input
            type="text"
            placeholder="Coupon Code"
            value={newCoupon.code}
            onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
            className="w-full p-2 text-xs bg-neutral-50 border rounded outline-none"
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={newCoupon.type}
              onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value })}
              className="text-xs p-2 bg-neutral-50 border rounded outline-none cursor-pointer"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Rate</option>
            </select>
            <input
              type="number"
              placeholder="Amount value"
              value={newCoupon.value}
              onChange={(e) => setNewCoupon({ ...newCoupon, value: e.target.value === '' ? '' : Number(e.target.value) })}
              className="text-xs p-2 bg-neutral-50 border rounded outline-none"
              required
            />
          </div>
          <button className="w-full py-2 bg-black text-white text-xs font-bold rounded cursor-pointer hover:bg-neutral-800 transition">
            Save Coupon
          </button>
        </form>
      </div>
    </div>
  );
}
