'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'motion/react';
import { Mail, Lock, User, Phone, CheckCircle, ArrowRight, ShieldCheck, Sparkles, KeyRound } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query Actions: 'set-password', 'reset'
  const actionParam = searchParams.get('action');
  const tokenParam = searchParams.get('token');

  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'set-password' | 'reset-password'>('login');
  
  // Form coordinates
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Token handlers
  const [token, setToken] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-detect secure link params
  useEffect(() => {
    const handle = setTimeout(() => {
      if (actionParam === 'set-password' && tokenParam) {
        setMode('set-password');
        setToken(tokenParam);
      } else if (actionParam === 'reset' && tokenParam) {
        setMode('reset-password');
        setToken(tokenParam);
      }
    }, 0);
    return () => clearTimeout(handle);
  }, [actionParam, tokenParam]);

  // Auth Submit Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      let endpoint = '/api/auth/login';
      let payload = {};

      if (mode === 'login') {
        endpoint = '/api/auth/login';
        payload = { email, password };
      } else if (mode === 'signup') {
        endpoint = '/api/auth/register';
        payload = { name, email, phone, password, confirmPassword };
      } else if (mode === 'forgot') {
        endpoint = '/api/auth/forgot-password';
        payload = { email };
      } else if (mode === 'set-password') {
        endpoint = '/api/auth/set-password';
        payload = { token, password };
      } else if (mode === 'reset-password') {
        endpoint = '/api/auth/reset-password';
        payload = { token, password };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Request validation exception.');
      }

      if (mode === 'login' || mode === 'signup') {
        setSuccessMsg('Session initialized. Welcome.');
        // Refresh and redirect to dashboard, or admin panel if admin
        setTimeout(() => {
          if (data.user?.is_admin) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
          router.refresh();
        }, 800);
      } else if (mode === 'forgot') {
        setSuccessMsg(data.msg || 'If the email exists, a password reset link has been dispatched to email. You can check email logs in Admin Panel.');
        setEmail('');
      } else if (mode === 'set-password' || mode === 'reset-password') {
        setSuccessMsg('Your security credentials are configured. Page redirecting to login...');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('login');
        }, 2000);
      }

    } catch (err: any) {
      setErrorMsg(err.message || 'Verification exception occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-accent selection:text-primary flex flex-col justify-between">
      <Header />

      <main className="flex-1 flex items-center justify-center pt-32 pb-20 px-6 sm:px-12 relative">
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_top_right] from-secondary-fixed/5 via-transparent to-transparent pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-surface-low p-6 sm:p-10 rounded-3xl border border-outline-variant/15 shadow-sm space-y-8 relative"
        >
          {/* Secured branding header */}
          <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-accent text-primary text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-secondary" /> SECURE GATE
          </div>

          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
              {mode === 'login' && 'Atelier Member Entrance'}
              {mode === 'signup' && 'Register Member Curation'}
              {mode === 'forgot' && 'Credential Restoration'}
              {mode === 'set-password' && 'Configure Direct Access'}
              {mode === 'reset-password' && 'Reset Secure Access'}
            </h1>
            <p className="text-[11px] font-mono tracking-widest text-on-surface-variant uppercase">
              {mode === 'login' && 'ENTER YOUR CREDENTIALS TO LOAD INBOX'}
              {mode === 'signup' && 'CREATE ACCOUNT TO TRACK RESTORATIONS'}
              {mode === 'forgot' && 'REQUEST ACCESS RESTORATION TOKEN'}
              {mode === 'set-password' && 'ESTABLISH ENTRY PASSPHRASE FOR ACCREDITED SERVICES'}
              {mode === 'reset-password' && 'ENTER NEW PASSPHRASE COORDINATES'}
            </p>
          </div>

          {/* Feedback alerts */}
          {(errorMsg || successMsg) && (
            <div className="text-xs font-sans">
              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-700 font-medium">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/25 text-primary font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Signup Only Fields */}
            {mode === 'signup' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                    <input
                      type="text"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="e.g., Jean-Paul Leclerc"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-primary">Phone coordinates *</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                    <input
                      type="tel"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="e.g., +1 (416) 555-0149"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Standard Email fields */}
            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary">Email Coordinates *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                  <input
                    type="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                    placeholder="e.g., j.leclerc@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Standard Passphrase fields */}
            {(mode === 'login' || mode === 'signup' || mode === 'set-password' || mode === 'reset-password') && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-primary">Security Passphrase *</label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-[10px] hover:underline hover:text-secondary text-on-surface-variant"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                    placeholder="Enter security passphrase"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Double Confirm inputs for Signup */}
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary">Confirm Security Passphrase *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                  <input
                    type="password"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                    placeholder="Repeat passphrase"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Set or Reset Token inputs if not set via URL */}
            {(mode === 'set-password' || mode === 'reset-password') && !tokenParam && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-primary">Secure Action-Token Coordinate *</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                  <input
                    type="text"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                    placeholder="Paste secure token here"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            {/* Submission button details */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-full bg-primary text-surface font-display text-xs tracking-widest uppercase font-bold hover:bg-secondary cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Curation verified...</span>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Authenticate & Load'}
                    {mode === 'signup' && 'Register Profile'}
                    {mode === 'forgot' && 'Dispatch Restoration Email'}
                    {mode === 'set-password' && 'Configure Credentials'}
                    {mode === 'reset-password' && 'Update Credentials'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Bottom routing prompts links */}
          <div className="pt-6 border-t border-outline-variant/10 text-center text-[10.5px] font-sans text-on-surface-variant space-y-2">
            {mode === 'login' && (
              <p>
                Not a member?{' '}
                <button 
                  onClick={() => setMode('signup')} 
                  className="font-bold text-primary hover:text-secondary underline"
                >
                  Create account profile
                </button>
              </p>
            )}

            {mode === 'signup' && (
              <p>
                Already registered?{' '}
                <button 
                  onClick={() => setMode('login')} 
                  className="font-bold text-primary hover:text-secondary underline"
                >
                  Enter gate
                </button>
              </p>
            )}

            {(mode === 'forgot' || mode === 'set-password' || mode === 'reset-password') && (
              <p>
                Return to{' '}
                <button 
                  onClick={() => setMode('login')} 
                  className="font-bold text-primary hover:text-secondary underline"
                >
                  Secure Log in
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs font-mono">Loading authentication checkpoints...</div>}>
      <LoginContent />
    </Suspense>
  );
}
