'use client';

import React from 'react';

export default function SettingsSection() {
  return (
    <div className="bg-white border text-neutral-700 border-neutral-200 rounded-xl p-5 space-y-4 shadow-xs font-sans">
      <h4 className="text-sm font-bold text-neutral-900">Control Settings Panel parameters</h4>
      <p className="text-xs text-neutral-500">Live API and SMTP microservices configured correctly under sandboxed test networks.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
        <div className="p-3.5 bg-neutral-50 border rounded-lg space-y-1">
          <span className="text-[10px] font-bold text-neutral-400">SMTP Sandbox Node</span>
          <p className="text-neutral-700">Host: sandbox.smtp.mailtrap.io</p>
          <p className="text-neutral-700">Port: 2525</p>
          <p className="text-neutral-700">State: Connected / Secure</p>
        </div>
      </div>
    </div>
  );
}
