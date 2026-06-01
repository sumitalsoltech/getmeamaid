'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="max-w-md w-full bg-white border border-neutral-200 rounded-2xl shadow-sm p-10 text-center space-y-6"
      >
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-red-50 rounded-full text-red-500 border border-red-100">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-mono text-neutral-900 uppercase">
            Access Denied
          </h1>
          <p className="text-xs text-neutral-500 font-mono">Error 403 — Forbidden Module Area</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-neutral-500 leading-relaxed">
            Your current session does not have the necessary permissions to view this section.
          </p>
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1 font-mono">Advice</span>
            <p className="text-[11px] text-neutral-500 leading-normal">
              Contact your system administrator to have your role permissions updated.
            </p>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="w-full py-3 rounded-xl bg-[#fbbf24] text-black font-semibold uppercase text-xs tracking-widest hover:bg-[#fbbf24]/85 transition-all shadow font-bold cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </motion.div>
    </div>
  );
}
