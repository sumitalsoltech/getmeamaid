'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { AdminProvider, useAdmin, SLUG_TAB } from './AdminContext';
import { 
  Sliders, Activity, FileText, CalendarDays, Briefcase, Users, ShieldAlert,
  Shield, Layers, DollarSign, Tag, Clock, MessageSquare, FileSpreadsheet,
  BarChart3, Mail, Inbox, Settings, Database, LogOut, X, RefreshCw, Lock,
  AlertTriangle, CheckCircle2, Sparkles, MapPin, User
} from 'lucide-react';

import DashboardSection from './components/DashboardSection';
import OrdersSection from './components/OrdersSection';
import AssignedJobSection from './components/AssignedJobSection';
import CustomersSection from './components/CustomersSection';
import StaffSection from './components/StaffSection';
import RolesSection from './components/RolesSection';
import ServicesSection from './components/ServicesSection';
import PricingSection from './components/PricingSection';
import CouponsSection from './components/CouponsSection';
import SlotsSection from './components/SlotsSection';
import TicketsSection from './components/TicketsSection';
import InvoicesSection from './components/InvoicesSection';
import ReportsSection from './components/ReportsSection';
import EmailsSection from './components/EmailsSection';
import CmsSection from './components/CmsSection';
import SettingsSection from './components/SettingsSection';
import DatabaseSection from './components/DatabaseSection';

// All section components mapped to their tab names for instant state-based rendering
const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'Dashboard': DashboardSection,
  'Orders / Bookings': OrdersSection,
  'Assigned Job': AssignedJobSection,
  'Users / Customers': CustomersSection,
  'Staff Management': StaffSection,
  'Roles & Permissions': RolesSection,
  'Services': ServicesSection,
  'Pricing Rules': PricingSection,
  'Coupons': CouponsSection,
  'Slots / Availability': SlotsSection,
  'Tickets': TicketsSection,
  'Invoices': InvoicesSection,
  'Reports': ReportsSection,
  'Email Templates': EmailsSection,
  'Content Management': CmsSection,
  'Settings': SettingsSection,
  'Database Health': DatabaseSection,
};

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isAuthenticated,
    isAuthLoading,
    authEmail, setAuthEmail,
    authPassword, setAuthPassword,
    authError,
    handleLoginSubmit,
    handleLogout,
    hasPermission,
    tickets,
    bookings,
    currentUser,
    roles,
    currentRole,
    activeTab,
    setActiveTab,
    drawerTab,
    setDrawerTab,
    navigateTo,
    handleTriggerSeeding,
    selectedBooking,
    setSelectedBooking,
    history,
    staff,
    handleUpdateOrderStatus,
    handleAssignStaff,
    handleStaffJobUpdate,
    invoices,
    setSelectedInvoice,
    saveBookingToBackend,
    setBookings
  } = useAdmin();

  // Sync activeTab with current URL on mount and browser back/forward (popstate)
  // IMPORTANT: We only call setActiveTab here, NOT navigateTo.
  // navigateTo uses history.pushState which doesn't trigger usePathname — use popstate for back/forward.
  React.useEffect(() => {
    const slug = pathname.split('/').pop() || '';
    const tabName = SLUG_TAB[slug];
    if (tabName) {
      setActiveTab(tabName);
    }
  }, [pathname, setActiveTab]);

  // Popstate listener for browser back/forward button support
  React.useEffect(() => {
    const handlePop = () => {
      const slug = window.location.pathname.split('/').pop() || '';
      const tabName = SLUG_TAB[slug];
      if (tabName) setActiveTab(tabName);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [setActiveTab]);

  // After auth loads, redirect to first permitted module if on root or unknown path
  React.useEffect(() => {
    if (!isAuthenticated || isAuthLoading) return;

    const slug = pathname.split('/').pop() || '';
    const isOnRootAdmin = pathname === '/admin' || pathname === '/admin/';
    const moduleName = SLUG_TAB[slug];

    // Only redirect if we're on root /admin (not already on a section page)
    if (isOnRootAdmin) {
      const ALL_MODULES = [
        'Dashboard', 'Orders / Bookings', 'Assigned Job',
        'Users / Customers', 'Staff Management', 'Roles & Permissions',
        'Services', 'Pricing Rules', 'Coupons', 'Slots / Availability',
        'Tickets', 'Invoices', 'Reports', 'Email Templates',
        'Content Management', 'Settings', 'Database Health'
      ];
      const firstAllowed = ALL_MODULES.find(m => hasPermission(m));
      if (firstAllowed) {
        navigateTo(firstAllowed);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAuthLoading]);


  if (isAuthLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 h-screen bg-[#0e0e11] text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-[#fbbf24] animate-spin" />
          <p className="text-sm font-mono tracking-wider text-neutral-400">Verifying session integrity...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <motion.div
        key="auth-view"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex-grow flex items-center justify-center p-6 min-h-screen bg-[#0e0e11] text-white relative overflow-hidden"
      >
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#fbbf24]/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#fbbf24]/5 blur-[120px] pointer-events-none" />

        <div className="max-w-md w-full bg-[#16161a] p-8 rounded-2xl border border-neutral-800 shadow-2xl space-y-6 relative z-10">
          <div className="flex justify-center flex-col items-center gap-1">
            <div className="p-3 bg-[#fbbf24]/10 rounded-full text-[#fbbf24] mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase tracking-widest font-mono text-white">get me a maid admin</h1>
            <p className="text-xs text-neutral-400">Enterprise Operations Control Console</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-2 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="admin@gmail.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e1e22] border border-neutral-800 text-sm focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] outline-none text-white transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1e1e22] border border-neutral-800 text-sm focus:border-[#fbbf24] focus:ring-1 focus:ring-[#fbbf24] outline-none text-white transition-all font-mono"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-xs text-red-400 text-center font-medium">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#fbbf24] text-black font-semibold uppercase text-xs tracking-wider hover:bg-[#fbbf24]/85 transition-all shadow-lg font-bold cursor-pointer"
            >
              Authenticate Session
            </button>
          </form>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-[#0f172a] font-sans selection:bg-[#fbbf24]/30 flex flex-col antialiased">
      <div className="flex flex-grow h-screen overflow-hidden text-sm">
        
        {/* 1. Side Left-Navigation */}
        <aside className="w-64 bg-[#0d1117] text-neutral-300 flex flex-col border-r border-neutral-800 shrink-0 select-none print:hidden">
          <div className="p-5 border-b border-neutral-800 flex flex-col gap-1 bg-[#161b22]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#fbbf24]" />
              <span className="font-bold tracking-wider uppercase font-mono text-white text-xs">get me a maid ops</span>
            </div>
    
          </div>

          <div className="px-4 py-2 border-b border-neutral-800/40 text-[10px] text-neutral-500 font-mono select-none uppercase tracking-wider">
            Management modules
          </div>

          <nav className="flex-grow overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
            {[
              { name: 'Dashboard', icon: Activity },
              { name: 'Orders / Bookings', icon: FileText },
              { name: 'Assigned Job', icon: Briefcase },
              { name: 'Users / Customers', icon: Users },
              { name: 'Staff Management', icon: ShieldAlert },
              { name: 'Roles & Permissions', icon: Shield },
              { name: 'Services', icon: Layers },
              { name: 'Pricing Rules', icon: DollarSign },
              { name: 'Coupons', icon: Tag },
              { name: 'Slots / Availability', icon: Clock },
              // { name: 'Tickets', icon: MessageSquare },
              { name: 'Invoices', icon: FileSpreadsheet },
              // { name: 'Reports', icon: BarChart3 },
              { name: 'Email Templates', icon: Mail },
              { name: 'Content Management', icon: Inbox },
              { name: 'Settings', icon: Settings },
              // { name: 'Database Health', icon: Database }
            ].map((m) => {
              const visible = hasPermission(m.name);
              if (!visible) return null;
              const Icon = m.icon;
              const isCur = activeTab === m.name;

              return (
                <button
                  key={m.name}
                  onClick={() => navigateTo(m.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs font-semibold tracking-wide transition-all ${
                    isCur 
                      ? 'bg-[#fbbf24] text-black font-extrabold' 
                      : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{m.name}</span>
                  </div>
                  {m.name === 'Tickets' && tickets.filter(t => t.status === 'Open').length > 0 && (
                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {tickets.filter(t => t.status === 'Open').length}
                    </span>
                  )}
                  {m.name === 'Orders / Bookings' && bookings.filter(b => b.order_status === 'New').length > 0 && (
                    <span className="bg-[#fbbf24] text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {bookings.filter(b => b.order_status === 'New').length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-800 bg-[#161b22]/20 flex flex-col gap-2">
            <button
              onClick={handleTriggerSeeding}
              className="w-full py-1.5 text-center bg-red-900/40 text-red-300 text-[10px] font-mono border border-red-500/20 rounded hover:bg-red-900/60 transition-all cursor-pointer"
            >
              Reset & Seed Database
            </button>
            {currentUser && (
              <button
                onClick={handleLogout}
                className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
            <div className="text-[10px] text-neutral-500 text-center font-mono select-none">
              User: {currentUser?.name || 'Local Session'}
              <span className="block text-[8px] text-neutral-600 mt-0.5">Role: {roles.find(r => String(r.id) === String(currentRole))?.name || 'Unknown'}</span>
            </div>
          </div>
        </aside>

        {/* Main view container */}
        <main className="flex-grow flex flex-col overflow-hidden bg-neutral-50 p-6 sm:p-8">
          
          {/* Top Operational Header */}
          <header className="flex justify-between items-center pb-4 border-b border-neutral-200/80 mb-6 shrink-0 print:hidden">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-1.5 font-mono">
                <span>{activeTab}</span>
              </h2>
              <p className="text-xs text-neutral-500">Get me a maid System Panel Management Drawer</p>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <div className="px-3 py-1 bg-neutral-100 border border-neutral-200 rounded text-neutral-800 text-xs font-semibold font-mono">
                  Role: <span className="font-extrabold text-[#0f172a]">{currentUser.role_name}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-all cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Tab Subviews — rendered by activeTab state for instant switching */}
          {/* navigateTo uses history.pushState so no Next.js navigation overhead */}
          <div className="flex-grow overflow-y-auto pr-1">
            <AnimatePresence mode="sync">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="space-y-6"
              >
                {(() => {
                  const SectionComponent = SECTION_COMPONENTS[activeTab] || DashboardSection;
                  return <SectionComponent />;
                })()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Booking Detail Overlay Drawer */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 bg-[#0f172a]/45 backdrop-blur-xs z-50 flex items-center justify-end print:hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-xl h-full bg-white p-6 sm:p-8 overflow-y-auto shadow-2xl flex flex-col justify-between border-l border-neutral-200"
            >
              <div className="space-y-6 text-xs text-neutral-700 font-sans">
                <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
                  <div>
                    <span className="font-mono text-[9px] font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-900 border">
                      {selectedBooking.id}
                    </span>
                    <h2 className="text-lg font-bold text-neutral-950 mt-1">Order Dispatch Blueprint</h2>
                  </div>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="p-1.5 rounded-full border hover:bg-neutral-50 cursor-pointer text-neutral-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tab Selector - only shown to Admins */}
                {String(currentUser?.role_id) !== '4' && (
                  <div className="flex border-b border-neutral-200/80 mb-4 bg-neutral-50 p-1.5 rounded-lg shrink-0">
                    <button
                      onClick={() => setDrawerTab('view')}
                      className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all rounded-md cursor-pointer ${
                        drawerTab === 'view'
                          ? 'bg-[#fbbf24] text-black font-extrabold shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => setDrawerTab('edit')}
                      className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition-all rounded-md cursor-pointer ${
                        drawerTab === 'edit'
                          ? 'bg-[#fbbf24] text-black font-extrabold shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                      }`}
                    >
                      Edit & Allocate
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {String(currentUser?.role_id) === '4' ? (
                    // Field Staff customized view-only sheet
                    <div className="space-y-4">
                      {/* Customer Block info */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5 font-sans text-neutral-800">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          Customer Contact Details
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[11.5px] font-medium">
                          <div>Name: <span className="font-bold text-neutral-950">{selectedBooking.first_name} {selectedBooking.last_name}</span></div>
                          <div>Phone: <span className="font-bold text-neutral-950 font-mono">{selectedBooking.phone}</span></div>
                          <div className="col-span-2">Contact Email: <span className="font-bold text-neutral-950 font-mono text-xs">{selectedBooking.email}</span></div>
                          <div className="col-span-2">Service Sector Address: <span className="font-bold text-neutral-950 font-mono text-xs">{selectedBooking.postal_code || 'Central Toronto'}</span></div>
                        </div>
                      </div>

                      {/* Property & Structure Scope */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 font-sans text-neutral-800">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Property & Service Scope
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[11.5px] font-medium">
                          <div>Home Type: <span className="font-bold text-neutral-950">{selectedBooking.home_type}</span></div>
                          <div>Bedrooms: <span className="font-bold text-neutral-950">{selectedBooking.bedrooms}</span></div>
                          <div>Bathrooms: <span className="font-bold text-neutral-950">{selectedBooking.bathrooms}</span></div>
                          <div>Square Footage: <span className="font-bold text-neutral-950 font-mono">{selectedBooking.square_footage ? `${selectedBooking.square_footage} sq. ft.` : 'Not Specified'}</span></div>
                          <div>Service Level: <span className="font-bold text-neutral-950">{selectedBooking.restoration_level}</span></div>
                          <div>Frequency: <span className="font-bold text-neutral-950">{selectedBooking.frequency}</span></div>
                          <div className="col-span-2">Access Method: <span className="font-bold text-neutral-950">{selectedBooking.entry_method || 'Not Specified'}</span></div>
                          {selectedBooking.custom_key_notes && (
                            <div className="col-span-2 mt-1">
                              <span className="text-[10px] text-neutral-400 font-semibold block flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Lockbox / Key Instructions:
                              </span>
                              <p className="italic text-neutral-600 font-medium bg-white p-2.5 rounded-lg border border-neutral-100 mt-1">{selectedBooking.custom_key_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Task Instructions */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 font-sans text-neutral-800">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-[#fbbf24]" />
                          Curator Task Instructions
                        </span>
                        <div className="bg-white p-3 rounded-lg border border-neutral-200 italic text-neutral-600 text-xs font-medium">
                          <p>&quot;{selectedBooking.job_instructions || 'Standard luxury sweep focus. Dust chandelier carefully.'}&quot;</p>
                        </div>

                        {selectedBooking.staff_job_status === 'Issue Reported' && selectedBooking.staff_reported_issue && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1 mt-2">
                            <div className="flex items-center gap-1 font-bold text-red-700 font-mono text-[10px] uppercase">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                              Logged Incident Issue
                            </div>
                            <p className="font-medium text-red-600 italic">&quot;{selectedBooking.staff_reported_issue}&quot;</p>
                          </div>
                        )}
                      </div>

                      {/* Curator Flow Control Panel */}
                      <div className="p-4 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-xl space-y-3 font-sans text-neutral-800">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Curator Flow Control
                        </span>
                        <p className="text-[11px] text-neutral-500 leading-relaxed">
                          Perform state calibration below as you proceed through the dispatch stages.
                        </p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {(!selectedBooking.staff_job_status || selectedBooking.staff_job_status === 'Pending') && (
                            <button
                              onClick={() => handleStaffJobUpdate(selectedBooking.id, 'Accepted')}
                              className="px-4 py-2 bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-black rounded-lg text-xs font-black shadow-sm cursor-pointer animate-pulse uppercase tracking-wider font-mono flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accept Dispatch
                            </button>
                          )}
                          {selectedBooking.staff_job_status === 'Accepted' && (
                            <button
                              onClick={() => handleStaffJobUpdate(selectedBooking.id, 'On the Way')}
                              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold cursor-pointer uppercase tracking-wider font-mono"
                            >
                              Mark: On the Way
                            </button>
                          )}
                          {selectedBooking.staff_job_status === 'On the Way' && (
                            <button
                              onClick={() => handleStaffJobUpdate(selectedBooking.id, 'Started')}
                              className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold cursor-pointer uppercase tracking-wider font-mono"
                            >
                              Mark: Started
                            </button>
                          )}
                          {selectedBooking.staff_job_status === 'Started' && (
                            <button
                              onClick={() => handleStaffJobUpdate(selectedBooking.id, 'Completed')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer uppercase tracking-wider font-mono flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Verify Completed
                            </button>
                          )}                           {selectedBooking.staff_job_status !== 'Completed' && selectedBooking.staff_job_status !== 'Issue Reported' && (
                            <button
                              onClick={() => {
                                const text = prompt('Kindly describe the dispatch issue detail:');
                                if (text) handleStaffJobUpdate(selectedBooking.id, 'Issue Reported', text);
                              }}
                              className="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold cursor-pointer uppercase tracking-wider font-mono flex items-center gap-1"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Report Incident
                            </button>
                          )}

                          {selectedBooking.staff_job_status === 'Issue Reported' && (
                            <div className="flex flex-col gap-2 w-full mt-1.5">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleStaffJobUpdate(selectedBooking.id, 'Started', selectedBooking.staff_reported_issue)}
                                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg text-xs font-bold cursor-pointer uppercase tracking-wider font-mono"
                                >
                                  Resume: Started
                                </button>
                                <button
                                  onClick={() => handleStaffJobUpdate(selectedBooking.id, 'Completed', selectedBooking.staff_reported_issue)}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer uppercase tracking-wider font-mono flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Resolve & Complete
                                </button>
                                <button
                                  onClick={() => {
                                    const text = prompt('Update the dispatch issue detail:', selectedBooking.staff_reported_issue || '');
                                    if (text !== null) {
                                      handleStaffJobUpdate(selectedBooking.id, 'Issue Reported', text);
                                    }
                                  }}
                                  className="px-4 py-2 text-red-750 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold cursor-pointer uppercase tracking-wider font-mono flex items-center gap-1"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                                  Update Issue Text
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedBooking.staff_job_status === 'Completed' && (
                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs py-1">
                              <CheckCircle2 className="w-4 h-4" />
                              Task Completed successfully
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    drawerTab === 'view' ? (
                      <>
                        {/* Customer Block info */}
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1.5 font-sans text-neutral-805">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Customer Core Spec</span>
                        <div className="grid grid-cols-2 gap-2 text-[11.5px] font-medium">
                          <div>Name: <span className="font-bold text-neutral-950">{selectedBooking.first_name} {selectedBooking.last_name}</span></div>
                          <div>Phone: <span className="font-bold text-neutral-950 font-mono">{selectedBooking.phone}</span></div>
                          <div className="col-span-2">Contact Email: <span className="font-bold text-neutral-950 font-mono text-xs">{selectedBooking.email}</span></div>
                          <div className="col-span-2">Postal Address: <span className="font-bold text-neutral-950 font-mono text-xs">{selectedBooking.postal_code || 'Central Toronto'}</span></div>
                        </div>
                      </div>

                      {/* Property & Structure Scope */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 font-sans text-neutral-805">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Property & Service Scope</span>
                        <div className="grid grid-cols-2 gap-2 text-[11.5px] font-medium">
                          <div>Home Type: <span className="font-bold text-neutral-950">{selectedBooking.home_type}</span></div>
                          <div>Bedrooms: <span className="font-bold text-neutral-950">{selectedBooking.bedrooms}</span></div>
                          <div>Bathrooms: <span className="font-bold text-neutral-950">{selectedBooking.bathrooms}</span></div>
                          <div>Square Footage: <span className="font-bold text-neutral-950 font-mono">{selectedBooking.square_footage ? `${selectedBooking.square_footage} sq. ft.` : 'Not Specified'}</span></div>
                          <div>Service Level: <span className="font-bold text-neutral-950">{selectedBooking.restoration_level}</span></div>
                          <div>Frequency: <span className="font-bold text-neutral-950">{selectedBooking.frequency}</span></div>
                          <div className="col-span-2">Access Method: <span className="font-bold text-neutral-950">{selectedBooking.entry_method || 'Not Specified'}</span></div>
                          {selectedBooking.custom_key_notes && (
                            <div className="col-span-2 mt-1">
                              <span className="text-[10px] text-neutral-400 font-semibold block">Key Instructions:</span>
                              <p className="italic text-neutral-600 font-medium bg-white p-2.5 rounded-lg border border-neutral-100">{selectedBooking.custom_key_notes}</p>
                            </div>
                          )}
                          {selectedBooking.customer_special_notes && (
                            <div className="col-span-2 mt-1">
                              <span className="text-[10px] text-neutral-400 font-semibold block">Special Requests / Notes:</span>
                              <p className="italic text-neutral-600 font-medium bg-white p-2.5 rounded-lg border border-neutral-100">{selectedBooking.customer_special_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Add-ons */}
                      {(() => {
                        let addonsList: any[] = [];
                        if (selectedBooking.addons) {
                          try {
                            addonsList = typeof selectedBooking.addons === 'string'
                              ? JSON.parse(selectedBooking.addons)
                              : selectedBooking.addons;
                          } catch (e) {}
                        }
                        if (addonsList.length === 0) return null;

                        return (
                          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 font-sans text-neutral-805">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Selected Add-ons</span>
                            <div className="space-y-1.5">
                              {addonsList.map((ad: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-xs border-b border-neutral-200/50 pb-1 last:border-b-0 last:pb-0">
                                  <span className="font-semibold text-neutral-900">✨ {ad.name}</span>
                                  <span className="font-mono text-neutral-500 font-bold">${Number(ad.price || 0).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Pricing Breakdown */}
                      {(() => {
                        let pricingDetails: any = null;
                        if (selectedBooking.pricing) {
                          try {
                            pricingDetails = typeof selectedBooking.pricing === 'string'
                              ? JSON.parse(selectedBooking.pricing)
                              : selectedBooking.pricing;
                          } catch (e) {}
                        }
                        if (!pricingDetails) return null;

                        return (
                          <div className="p-4 bg-amber-50/50 border border-amber-200/60 rounded-xl space-y-2 font-sans text-neutral-805">
                            <span className="text-[10px] font-bold uppercase text-amber-700 font-mono tracking-wider">Pricing Blueprint Breakdown</span>
                            <div className="space-y-1.5 text-[11.5px]">
                              <div className="flex justify-between">
                                <span>Base Cleaning Curation</span>
                                <span className="font-mono font-semibold">${Number(pricingDetails.baseService || 0).toFixed(2)}</span>
                              </div>
                              {pricingDetails.roomModifiers > 0 && (
                                <div className="flex justify-between">
                                  <span>Room Size Modifiers</span>
                                  <span className="font-mono font-semibold">${Number(pricingDetails.roomModifiers || 0).toFixed(2)}</span>
                                </div>
                              )}
                              {pricingDetails.addonsTotal > 0 && (
                                <div className="flex justify-between">
                                  <span>Add-ons Surcharge</span>
                                  <span className="font-mono font-semibold">${Number(pricingDetails.addonsTotal || 0).toFixed(2)}</span>
                                </div>
                              )}
                              {pricingDetails.frequencyDiscount > 0 && (
                                <div className="flex justify-between text-emerald-700">
                                  <span>Frequency Discount</span>
                                  <span className="font-mono font-bold">-${Number(pricingDetails.frequencyDiscount || 0).toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-neutral-500">
                                <span>Cleaners Trust Insurance Fee (5%)</span>
                                <span className="font-mono font-semibold">${Number(pricingDetails.serviceFee || pricingDetails.service_fee || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-neutral-500">
                                <span>Provincial Sales Tax (13%)</span>
                                <span className="font-mono font-semibold">${Number(pricingDetails.tax || 0).toFixed(2)}</span>
                              </div>
                              <div className="border-t border-amber-200/60 border-dashed pt-2 mt-2 flex justify-between items-center text-neutral-900 font-bold text-sm">
                                <span>Billed Total</span>
                                <span className="font-mono text-amber-700">${Number(pricingDetails.total || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Curation Dispatch Status Tracking (Admin view) */}
                      {selectedBooking.assigned_staff_id && (
                        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2 font-sans text-neutral-805">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                              Curator Dispatch Assignment
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                              selectedBooking.staff_job_status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              selectedBooking.staff_job_status === 'Issue Reported' ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse font-extrabold' :
                              'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {selectedBooking.staff_job_status || 'Pending'}
                            </span>
                          </div>
                          <div className="text-[11.5px] font-medium space-y-1">
                            <div>Assigned Cleaner: <span className="font-bold text-neutral-900">{staff.find(s => String(s.id) === String(selectedBooking.assigned_staff_id))?.name || 'Unknown'}</span></div>
                            <div>Instructions: <span className="italic text-neutral-600">&quot;{selectedBooking.job_instructions || 'None'}&quot;</span></div>
                            {selectedBooking.staff_job_status === 'Issue Reported' && selectedBooking.staff_reported_issue && (
                              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 font-medium italic mt-1.5 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                Alert incident: &quot;{selectedBooking.staff_reported_issue}&quot;
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Order manual overrides status controls */}
                      <div className="p-3.5 bg-neutral-50 border rounded-lg space-y-2 font-sans text-neutral-805">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Manual Status Orchestration</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 font-semibold block">Order State:</span>
                            <select
                              value={selectedBooking.order_status}
                              onChange={(e) => handleUpdateOrderStatus(selectedBooking.id, e.target.value, 'Statuses calibrated manually inside control detail desk.')}
                              className="w-full p-2 bg-white border rounded outline-none text-xs text-neutral-700 cursor-pointer font-semibold"
                            >
                              {['New', 'Under Review', 'Quote Sent', 'Payment Link Sent', 'Payment Pending', 'Paid', 'Job Assigned', 'Scheduled', 'In Progress', 'Completed', 'Invoice Sent', 'Settled', 'Closed', 'Cancelled', 'Refund Required'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 font-semibold block">Billing payment state:</span>
                            <select
                              value={selectedBooking.payment_status}
                              onChange={(e) => {
                                const updatedObj = { ...selectedBooking, payment_status: e.target.value };
                                const updated = bookings.map(item => item.id === selectedBooking.id ? updatedObj : item);
                                setBookings(updated);
                                setSelectedBooking(updatedObj);
                                saveBookingToBackend(updatedObj);
                              }}
                              className="w-full p-2 bg-white border rounded outline-none text-xs text-neutral-700 cursor-pointer font-semibold"
                            >
                              {['Unpaid', 'Quote Sent', 'Payment Link Sent', 'Payment Pending', 'Paid', 'Refund Required'].map(pt => (
                                <option key={pt} value={pt}>{pt}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-neutral-500 font-semibold block">Staff Job Status:</span>
                            <select
                              value={selectedBooking.staff_job_status || 'Pending'}
                              onChange={(e) => {
                                const val = e.target.value as any;
                                if (val === 'Issue Reported') {
                                  const text = prompt('Kindly describe the dispatch issue detail:') || '';
                                  handleStaffJobUpdate(selectedBooking.id, val, text);
                                } else {
                                  handleStaffJobUpdate(selectedBooking.id, val, selectedBooking.staff_reported_issue || '');
                                }
                              }}
                              className="w-full p-2 bg-white border rounded outline-none text-xs text-neutral-700 cursor-pointer font-semibold"
                            >
                              {['Pending', 'Accepted', 'On the Way', 'Started', 'Completed', 'Issue Reported'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {selectedBooking.staff_job_status === 'Issue Reported' && (
                          <div className="space-y-1.5 pt-2 border-t border-neutral-200 mt-2">
                            <span className="text-[10px] text-red-650 font-bold block flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                              Reported Issue / Incident Description:
                            </span>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                id="admin-reported-issue-input"
                                defaultValue={selectedBooking.staff_reported_issue || ''}
                                placeholder="Describe the issue reported..."
                                className="flex-1 p-2 bg-white border rounded outline-none text-xs font-medium text-neutral-800"
                              />
                              <button
                                onClick={() => {
                                  const txt = (document.getElementById('admin-reported-issue-input') as HTMLInputElement)?.value || '';
                                  const updatedObj = {
                                    ...selectedBooking,
                                    staff_reported_issue: txt
                                  };
                                  const updated = bookings.map(item => item.id === selectedBooking.id ? updatedObj : item);
                                  setBookings(updated);
                                  setSelectedBooking(updatedObj);
                                  saveBookingToBackend(updatedObj);
                                  alert('Reported issue description saved successfully.');
                                }}
                                className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold transition cursor-pointer"
                              >
                                Save Text
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Allocation widget */}
                      <div className="p-3.5 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-lg space-y-2 font-sans text-neutral-805">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Designated Service Allocation</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1 text-[11px]">
                            <span>Assigned Curator:</span>
                            <select
                              id="modal-assign-staff-drop"
                              defaultValue={selectedBooking.assigned_staff_id ? String(selectedBooking.assigned_staff_id) : ''}
                              className="w-full p-1.5 bg-white border rounded outline-none cursor-pointer"
                            >
                              <option value="">Not assigned</option>
                              {staff.filter(s => String(s.role_id) === '4').map(s => (
                                <option key={s.id} value={String(s.id)}>{s.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <span>Confirmed Booking Date:</span>
                            <input
                              type="date"
                              id="modal-assign-date"
                              defaultValue={selectedBooking.selected_date || ''}
                              className="w-full p-1 bg-white border rounded outline-none"
                            />
                          </div>

                          <div className="col-span-1 sm:col-span-2 space-y-1 text-[11px]">
                            <span>Simulated Staff instructions:</span>
                            <textarea
                              id="modal-assign-notes"
                              defaultValue={selectedBooking.job_instructions || 'Standard luxury sweep focus. Dust chandelier carefully.'}
                              placeholder="Instructions to workers..."
                              className="w-full h-12 p-1.5 bg-white border rounded outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const staffId = (document.getElementById('modal-assign-staff-drop') as HTMLSelectElement)?.value;
                                const dt = (document.getElementById('modal-assign-date') as HTMLInputElement)?.value;
                                const notesText = (document.getElementById('modal-assign-notes') as HTMLTextAreaElement)?.value;
                                if (!staffId || !dt) return alert('Configure a valid Curator staff and Confirmed date window.');
                                handleAssignStaff(selectedBooking.id, staffId, notesText, dt, selectedBooking.selected_time_slot);
                              }}
                              className="w-full py-1.5 bg-black text-white rounded font-bold uppercase mt-1.5 tracking-wider cursor-pointer text-[10px]"
                            >
                              Commit allocated assignment
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Historical status update list tracker */}
                      <div className="p-3.5 bg-neutral-50 border rounded-lg space-y-2 font-sans text-neutral-805">
                        <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Action Chronology History</span>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-1 scrollbar-thin">
                          {history.filter(h => h.order_id === selectedBooking.id).map(h => (
                            <div key={h.id} className="text-[11px] border-b pb-1.5 text-neutral-600 last:border-b-0">
                              <div className="flex justify-between font-mono text-[9px]">
                                <strong>Mode: {h.changed_by}</strong>
                                <span>{new Date(h.created_at).toLocaleString().slice(0, 16)}</span>
                              </div>
                              <p className="mt-0.5"><span className="font-semibold text-neutral-900">{h.old_status || 'INIT'}</span> → <span className="font-semibold text-amber-600">{h.new_status}</span></p>
                              <p className="text-[10px] text-neutral-400 mt-0.5 italic">&quot;{h.note}&quot;</p>
                            </div>
                          ))}
                          {history.filter(h => h.order_id === selectedBooking.id).length === 0 && (
                            <p className="text-neutral-400 italic text-center py-2">No historical statuses changes log.</p>
                          )}
                        </div>
                      </div>

                      {/* Print invoice statement */}
                      {selectedBooking.order_status === 'Completed' && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between font-sans">
                          <div>
                            <strong className="text-emerald-900 text-xs font-bold block">Compiling Order Billing Statement</strong>
                            <span className="text-[10.5px] text-emerald-600">This completed schedule has a billable invoice statement compiled.</span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBooking(null);
                              navigateTo('Invoices');
                              const inv = invoices.find(i => i.order_id === selectedBooking.id);
                              if (inv) setSelectedInvoice(inv);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer font-bold text-[10.5px]"
                          >
                            Print Statement
                          </button>
                        </div>
                      )}

                      {/* Manual administrative email trigger */}
                      <div className="p-3.5 bg-sky-50/60 border border-sky-200/80 rounded-lg space-y-2 font-sans text-neutral-808">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-bold uppercase text-sky-700 font-mono tracking-wider">Manual Dispatch Communications</span>
                          <span className="text-[8.5px] bg-sky-100 text-sky-850 px-1.5 py-0.2 rounded font-bold font-mono">SMTP REAL-TIME</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 leading-relaxed font-sans">
                          Select any configured branding template context below to dispatch bespoke notification with customized variables to <span className="font-bold text-sky-900 font-mono">{selectedBooking.email}</span>.
                        </p>
                        
                        <div className="flex gap-2">
                          <select
                            id="manual-email-tpl-select"
                            className="p-1 px-2.5 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-700 cursor-pointer font-bold flex-1 outline-none shadow-3xs"
                          >
                            <option value="order_confirmation">📁 Order Confirmation Template</option>
                            <option value="guest_account">📁 Guest Account Pre-seeded</option>
                            <option value="set_password">📁 Welcome Password Settings link</option>
                            <option value="quote_sent">📁 Professional Quote Breakdown</option>
                            <option value="payment_link">📁 Custom Secured Payment Link</option>
                            <option value="payment_reminder">📁 Auto Friendly Reminder Invoice</option>
                            <option value="payment_confirmed">📁 Secure Payment Receipt Confirmed</option>
                            <option value="schedule_confirmed">📁 Reservation Date Orchestrated</option>
                            <option value="job_assigned">📁 Curator Staff Allocation Notice</option>
                            <option value="order_completed">📁 Cleaning Completed survey review</option>
                            <option value="invoice_sent">📁 Generated Bill Invoice Statement</option>
                            <option value="settlement_completed">📁 Financial Statement Closed</option>
                            <option value="ticket_created">📁 Ticket Registered Alert</option>
                            <option value="ticket_replied">📁 Ticket Reply Feedback</option>
                            <option value="ticket_closed">📁 Ticket Closed Complete</option>
                            <option value="password_reset">📁 Secured OTP Password Reset Link</option>
                          </select>
                          <button
                            onClick={async (e) => {
                              const tpl = (document.getElementById('manual-email-tpl-select') as HTMLSelectElement)?.value;
                              const btn = e.target as HTMLButtonElement;
                              if (!tpl) return;
                              
                              try {
                                btn.disabled = true;
                                btn.innerText = 'Dispatching...';
                                const res = await fetch('/api/admin/send-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    email_type: tpl,
                                    recipient_email: selectedBooking.email,
                                    customer_name: `${selectedBooking.first_name} ${selectedBooking.last_name}`,
                                    order_id: selectedBooking.id,
                                    service_name: selectedBooking.restoration_level,
                                    amount: selectedBooking.pricing ? JSON.parse(selectedBooking.pricing).total : '180.00'
                                  })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  alert(`Bespoke communications email [${tpl}] dispatched successfully to ${selectedBooking.email}! Check Mailtrap sandboxed inbox.`);
                                } else {
                                  alert(`Dispatch SMTP failed: ${data.error}`);
                                }
                              } catch (err: any) {
                                alert(`Error dispatching email: ${err.message}`);
                              } finally {
                                btn.disabled = false;
                                btn.innerText = 'Send Letter';
                              }
                            }}
                            className="px-4.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10.5px] font-bold cursor-pointer font-sans shadow-2xs transition shrink-0"
                          >
                            Send Letter
                          </button>
                        </div>
                      </div>

                      {/* Notes textareas */}
                      <div className="grid grid-cols-2 gap-3 text-neutral-700 font-sans">
                        <div className="space-y-1">
                          <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase">Internal Curator Notes:</span>
                          <textarea
                            defaultValue={selectedBooking.internal_notes || ''}
                            onBlur={(e) => {
                              const updatedObj = { ...selectedBooking, internal_notes: e.target.value };
                              const updated = bookings.map(item => item.id === selectedBooking.id ? updatedObj : item);
                              setBookings(updated);
                              setSelectedBooking(updatedObj);
                              saveBookingToBackend(updatedObj);
                            }}
                            placeholder="Internal notes ONLY for administrators..."
                            className="w-full text-xs bg-neutral-5 p-1.5 rounded h-16 outline-none border border-neutral-200"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase">Customer-Visible Notes:</span>
                          <textarea
                            defaultValue={selectedBooking.customer_visible_notes || ''}
                            onBlur={(e) => {
                              const updatedObj = { ...selectedBooking, customer_visible_notes: e.target.value };
                              const updated = bookings.map(item => item.id === selectedBooking.id ? updatedObj : item);
                              setBookings(updated);
                              setSelectedBooking(updatedObj);
                              saveBookingToBackend(updatedObj);
                            }}
                            placeholder="Client note details visible in support letters..."
                            className="w-full text-xs bg-neutral-5 p-1.5 rounded h-16 outline-none border border-neutral-200"
                          />
                        </div>
                      </div>
                    </>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="w-full py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase rounded-xl tracking-wider cursor-pointer text-center font-sans"
                >
                  Close BlueprintSheet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
