'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, AlertTriangle, Copy, Check, FileText, Info
} from 'lucide-react';

interface TableStatus {
  table: string;
  exists: boolean;
  error: string | null;
  code?: string;
}

interface ForeignKeyStatus {
  constraint_name: string;
  table_name: string;
  referenced_table: string;
  active: boolean | null;
}

interface ValidationResponse {
  success: boolean;
  is_mysql_connected: boolean;
  all_healthy?: boolean;
  healthy_count?: number;
  total_count?: number;
  tables?: TableStatus[];
  rpc_supported?: boolean;
  foreign_keys?: ForeignKeyStatus[];
  sql_script: string;
  error?: string;
}

export default function DatabaseHealthPanel() {
  const [data, setData] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/db/validate');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Error validating database:', err);
      setError(err.message || 'Failed to fetch database health credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    
    fetch('/api/db/validate')
      .then(res => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (active) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || 'Failed to fetch database health credentials.');
          setLoading(false);
        }
      });
      
    return () => {
      active = false;
    };
  }, []);

  const handleCopySql = () => {
    if (!data?.sql_script) return;
    navigator.clipboard.writeText(data.sql_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-neutral-200 text-neutral-800 rounded-xl p-6 space-y-6 shadow-xs font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            MySQL Database Integrity Validator
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Validating active foreign key constraints, table parameters, and entity types in local MySQL nodes.
          </p>
        </div>
        
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 text-white text-xs font-bold py-2 px-3.5 rounded-lg transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking...' : 'Run Integrity Check'}
        </button>
      </div>

      {/* Main Status Hero */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-3">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
          <p className="text-xs text-neutral-500 font-mono">Querying database metadata & relations...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-xs flex gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
          <div>
            <strong className="font-semibold block">Integrity Check Failed</strong>
            <p className="mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Diagnostic overview blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-xl bg-neutral-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">MySQL Connection</span>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${data.is_mysql_connected ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-xs font-bold text-neutral-900">
                  {data.is_mysql_connected ? 'Connected' : 'Offline / Mocks'}
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-neutral-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Overall Health</span>
              <div className="flex items-center gap-2">
                {data.all_healthy ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                )}
                <span className="text-xs font-bold text-neutral-900">
                  {data.all_healthy ? '100% Integrity Secure' : 'Action Required'}
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-neutral-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider font-mono">Healthy Tables Verified</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-neutral-900 font-mono">
                  {data.healthy_count || 0}
                </span>
                <span className="text-xs text-neutral-500">/ {data.total_count || 0} tables ok</span>
              </div>
            </div>
          </div>

          {/* Table Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-400 font-mono">Table Matrix Health & Relationship Validation Checks</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.tables?.map((t) => (
                <div 
                  key={t.table} 
                  className={`p-3 border rounded-lg flex items-start justify-between text-xs transition-all ${
                    t.exists 
                      ? 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50' 
                      : 'bg-red-50/30 border-red-100 hover:bg-red-50/50'
                  }`}
                >
                  <div className="space-y-1 truncate pr-2">
                    <span className="font-semibold block font-mono text-neutral-900 truncate">
                      {t.table}
                    </span>
                    {t.exists ? (
                      <span className="text-[10px] text-emerald-600 block">Verified & Queryable</span>
                    ) : (
                      <span className="text-[10px] text-red-600 font-mono block leading-tight truncate" title={t.error || ''}>
                        {t.error || 'Missing'}
                      </span>
                    )}
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {t.exists ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Foreign Keys Integrity Matrix */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs uppercase tracking-wider font-bold text-neutral-400 font-mono flex items-center gap-1.5 flex-wrap">
              <span>Foreign Key Constraints Verification Matrix</span>
              {!data.rpc_supported && (
                <span className="text-[10px] bg-amber-50 text-amber-800 font-sans py-0.5 px-2.5 rounded-full font-semibold italic normal-case border border-amber-100/60">
                  Run SQL setup script below to activate check function and verify relationships
                </span>
              )}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {data.foreign_keys?.map((fk) => (
                <div 
                  key={fk.constraint_name} 
                  className={`p-3 border rounded-lg flex items-start justify-between text-xs transition-all ${
                    fk.active === true
                      ? 'bg-emerald-50/20 border-emerald-100 hover:bg-emerald-50/40' 
                      : fk.active === false
                        ? 'bg-red-50/20 border-red-100 hover:bg-red-50/40'
                        : 'bg-neutral-50/30 border-neutral-100/85 hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="space-y-1 truncate pr-2">
                    <span className="font-semibold block font-mono text-neutral-900 truncate" title={fk.constraint_name}>
                      {fk.constraint_name}
                    </span>
                    <span className="text-[10px] text-neutral-500 block leading-tight">
                      Table: <strong className="font-mono text-neutral-700">{fk.table_name}</strong> → <strong className="font-mono text-neutral-700">{fk.referenced_table}</strong>
                    </span>
                    {fk.active === true ? (
                      <span className="text-[9px] font-bold text-emerald-600 block mt-1 uppercase tracking-wider">✓ Active & Enforced</span>
                    ) : fk.active === false ? (
                      <span className="text-[9px] font-bold text-red-600 block mt-1 uppercase tracking-wider">✗ Missing Constraint</span>
                    ) : (
                      <span className="text-[9px] text-neutral-400 block italic mt-1 font-mono">Unchecked (run script to verify)</span>
                    )}
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {fk.active === true ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : fk.active === false ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-dashed border-neutral-300 mt-0.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Zone - Database Healing Procedures */}
          <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-5 space-y-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs uppercase font-extrabold text-amber-800 font-mono tracking-wider">How to Self-Heal Database & Recreate All Tables from Scratch</h4>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  To drop all existing conflicting tables, enforce modern entity typing, create primary/foreign keys with perfect column compatibility (TEXT type matching), disable RLS protection for developer ease of operation, and seed all real pristine data, simply run our comprehensive reset script.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  Drop, Recreate, & Safe-Seed SQL Script
                </span>
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-white text-[10px] font-bold py-1 px-3 rounded-lg transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400 font-bold" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-neutral-300" />
                      Copy SQL Script
                    </>
                  )}
                </button>
              </div>

              {/* Console window */}
              <div className="bg-neutral-900 text-neutral-300 p-4 rounded-xl font-mono text-xs select-all overflow-y-auto max-h-60 border border-neutral-800 leading-relaxed shadow-inner">
                <pre>{data.sql_script}</pre>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[10px] leading-tight text-neutral-500 pt-1 font-sans">
                <div>
                  <strong className="font-bold text-neutral-700 block mb-1">Step 1: Copy</strong>
                  Click &quot;Copy SQL Script&quot; button above to pull the full SQL block.
                </div>
                <div>
                  <strong className="font-bold text-neutral-700 block mb-1">Step 2: Database console</strong>
                  Open HeidiSQL or your MySQL client and connect to local DB.
                </div>
                <div>
                  <strong className="font-bold text-neutral-700 block mb-1">Step 3: Paste & Run</strong>
                  Paste this script into a new query window and press &quot;Run&quot;.
                </div>
                <div>
                  <strong className="font-bold text-neutral-700 block mb-1">Step 4: Verify</strong>
                  Click the &quot;Run Integrity Check&quot; button above to verify all tables are verified.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
