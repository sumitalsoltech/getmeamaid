'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, LifeBuoy, User, Clock, ArrowRight, CheckCircle2, 
  ChevronRight, Calendar, AlertCircle, MessageSquare, Plus, Send, X, FileText, 
  LogOut, ShieldAlert, Zap, Info, Landmark, HelpCircle, AlertOctagon, CheckSquare
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  
  // App-level state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'tickets' | 'profile'>('orders');
  const [loading, setLoading] = useState(true);

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderHistoryTimeline, setOrderHistoryTimeline] = useState<any[]>([]);

  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReplies, setTicketReplies] = useState<any[]>([]);
  const [ticketRepliesLoading, setTicketRepliesLoading] = useState(false);
  const [newReplyMsg, setNewReplyMsg] = useState('');
  
  // Raising a ticket state
  const [raiseTicketOpen, setRaiseTicketOpen] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Service issue');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [newTicketOrderId, setNewTicketOrderId] = useState('');

  // General feedback
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // 1. Validate Session on Mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (!res.ok || !data.user) {
          router.push('/login');
          return;
        }
        setCurrentUser(data.user);
        
        // Fetch User Orders and Tickets directly in self-sufficient effect
        const ordersRes = await fetch('/api/orders');
        const ordersData = await ordersRes.json();
        if (ordersRes.ok) {
          setOrders(ordersData.orders || []);
        }

        const ticketsRes = await fetch('/api/tickets');
        const ticketsData = await ticketsRes.json();
        if (ticketsRes.ok) {
          setTickets(ticketsData.tickets || []);
        }
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [router]);

  const loadUserData = async () => {
    try {
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      if (ordersRes.ok) {
        setOrders(ordersData.orders || []);
      }

      const ticketsRes = await fetch('/api/tickets');
      const ticketsData = await ticketsRes.json();
      if (ticketsRes.ok) {
        setTickets(ticketsData.tickets || []);
      }
    } catch (err) {
      console.error("Failed loading data collections", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Fetch specific order timeline details
  const viewOrderDetails = async (order: any) => {
    setSelectedOrder(order);
    setOrderDetailsLoading(true);
    setOrderHistoryTimeline([]);
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      const data = await res.json();
      if (res.ok) {
        setOrderHistoryTimeline(data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  // 3. User Order Cancellations
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to request cancellation for this dynamic restorer schedule?')) return;
    setFeedbackError('');
    setFeedbackMsg('');

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', note: 'Requested cancellation directly from Customer Dashboard.' })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cancellation request rejected.');
      }

      setFeedbackMsg('Your schedule is cancelled successfully and administrative logs are updated.');
      
      // Reload orders and select cancelled order to refresh details
      await loadUserData();
      setSelectedOrder(data.order);
      // reload history
      const histRes = await fetch(`/api/orders/${data.order.id}`);
      const histData = await histRes.json();
      if (histRes.ok) {
        setOrderHistoryTimeline(histData.history || []);
      }
    } catch (err: any) {
      setFeedbackError(err.message || 'Can not update order coordinates.');
    }
  };

  // 4. Load specific Support Ticket conversation
  const viewTicketDetails = async (ticket: any) => {
    setSelectedTicket(ticket);
    setTicketRepliesLoading(true);
    setTicketReplies([]);
    try {
      const res = await fetch(`/api/tickets?ticketId=${ticket.id}`);
      const data = await res.json();
      if (res.ok) {
        setTicketReplies(data.replies || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTicketRepliesLoading(false);
    }
  };

  // 5. Submit Support Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyMsg.trim() || !selectedTicket) return;

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          message: newReplyMsg
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed submitting reply.');
      }

      // Add to local list and scroll reset
      setTicketReplies([...ticketReplies, data.reply]);
      setNewReplyMsg('');
      
      // Update selectedTicket status properties
      const updatedTicket = { ...selectedTicket, status: 'Open' };
      setSelectedTicket(updatedTicket);

      // Refresh list in background
      loadUserData();
    } catch (err: any) {
      alert(err.message || 'Error occurred replying.');
    }
  };

  // 6. Raise Support Ticket Form submit
  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject || !newTicketMessage) return;

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: newTicketOrderId || undefined,
          category: newTicketCategory,
          subject: newTicketSubject,
          message: newTicketMessage,
          priority: newTicketPriority
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed raising support ticket.');
      }

      // Add to ticket list
      setTickets([data.ticket, ...tickets]);
      setRaiseTicketOpen(false);
      
      // Clear forms
      setNewTicketSubject('');
      setNewTicketMessage('');
      setNewTicketOrderId('');

      // Auto load details of raised ticket
      viewTicketDetails(data.ticket);
      setActiveTab('tickets');
    } catch (err: any) {
      alert(err.message || 'Error raising ticket.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-xs text-primary bg-surface select-none">
        <div className="space-y-3 text-center">
          <div className="w-10 h-10 border-t-2 border-r-2 border-secondary rounded-full animate-spin mx-auto"></div>
          <span>Synchronizing security credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface selection:bg-accent selection:text-primary flex flex-col justify-between">
      <Header />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-32 pb-24 w-full flex-1">
        
        {/* Banner greeting client */}
        <section className="bg-surface-low rounded-3xl p-6 sm:p-8 border border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 z-0 bg-radial-[circle_at_top_right] from-secondary-fixed/5 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative z-10 space-y-1">
            <span className="font-mono text-[9px] tracking-[0.3em] font-bold text-secondary uppercase block">ACCRIED ATELIER MEMBER</span>
            <h2 className="font-display text-2xl font-bold text-primary">Bonjour, {currentUser?.name}</h2>
            <p className="text-[11px] font-sans text-on-surface-variant flex items-center gap-1.5 font-medium">
              Registered Profile: <strong className="text-primary font-mono">{currentUser?.email}</strong> 
              {currentUser?.is_admin && <span className="px-2 py-0.5 rounded-full bg-accent text-primary text-[9px] font-bold uppercase ml-2">ADMIN ROLE</span>}
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 shrink-0">
            {currentUser?.is_admin && (
              <button 
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-primary text-surface rounded-full font-display text-[10.5px] font-bold uppercase tracking-wider hover:bg-secondary transition-all"
              >
                Go to Admin Workspace
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border border-outline-variant/20 hover:bg-surface rounded-full font-display text-[10.5px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              Sign Out <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>

        {/* Dashboard layout structure grids */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Dashboard Left Sidebar Tabs navigation */}
          <div className="lg:col-span-3 space-y-4 font-display text-xs font-bold uppercase tracking-widest text-[#444444]">
            <div className="space-y-1">
              <span className="block text-[10px] tracking-[0.25em] font-mono text-on-surface-variant/60 font-bold mb-3">LEDGER SERVICES</span>
              
              <button
                onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
                className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'orders' 
                    ? 'bg-primary text-surface border-primary' 
                    : 'bg-surface-low text-primary border-outline-variant/10 hover:bg-surface-lowest'
                }`}
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>Curation Ledgers</span>
                {orders.length > 0 && (
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ml-auto ${
                    activeTab === 'orders' ? 'bg-accent text-primary' : 'bg-outline-variant/15 text-primary'
                  }`}>{orders.length}</span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('tickets'); setSelectedTicket(null); }}
                className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'tickets' 
                    ? 'bg-primary text-surface border-primary' 
                    : 'bg-surface-low text-primary border-outline-variant/10 hover:bg-surface-lowest'
                }`}
              >
                <LifeBuoy className="w-4 h-4 shrink-0" />
                <span>Support Inboxes</span>
                {tickets.length > 0 && (
                  <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ml-auto ${
                    activeTab === 'tickets' ? 'bg-accent text-primary' : 'bg-outline-variant/15 text-primary'
                  }`}>{tickets.length}</span>
                )}
              </button>

              <button
                onClick={() => { setActiveTab('profile'); }}
                className={`w-full text-left px-4 py-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'bg-primary text-surface border-primary' 
                    : 'bg-surface-low text-primary border-outline-variant/10 hover:bg-surface-lowest'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Client Profile</span>
              </button>
            </div>

            <div className="p-4 bg-accent/15 rounded-2xl border border-secondary/10 space-y-2.5">
              <div className="flex items-center gap-1.5 text-primary">
                <Zap className="w-4 h-4 text-secondary fill-current" />
                <span className="text-[10.5px] font-bold tracking-wider">Restoration Curation?</span>
              </div>
              <p className="text-[10.5px] font-sans normal-case text-on-surface-variant font-medium leading-relaxed">
                Need customized home detailing? Dispatched estimators are available for structural design overviews.
              </p>
              <button 
                onClick={() => router.push('/book')}
                className="w-full py-2 rounded-full bg-primary text-surface text-[9px] hover:opacity-90 tracking-widest font-bold transition-all text-center block uppercase"
              >
                Initialize Booking Wizard
              </button>
            </div>
          </div>

          {/* Right Workspace Side details panels */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Feedback updates */}
            {(feedbackMsg || feedbackError) && (
              <div className="text-xs font-sans">
                {feedbackMsg && <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 text-primary font-semibold">{feedbackMsg}</div>}
                {feedbackError && <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-700 font-semibold">{feedbackError}</div>}
              </div>
            )}

            {/* A. VIEW ORDERS LEDGER */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                {!selectedOrder ? (
                  <div className="space-y-4">
                    <div className="border-b border-outline-variant/10 pb-4">
                      <h3 className="font-display text-lg font-bold text-primary">Your Curation Ledgers</h3>
                      <p className="text-xs text-on-surface-variant">Review quotes, access payments validation, track schedules, and download invoices details.</p>
                    </div>

                    {orders.length === 0 ? (
                      <div className="p-12 text-center rounded-3xl bg-surface-low border border-dashed border-outline-variant/20 space-y-4">
                        <ClipboardList className="w-12 h-12 text-on-surface-variant/40 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-display text-sm font-bold text-primary uppercase">No Curation Blocks Located</h4>
                          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">There are no luxury maintenance entries linked to your profile parameters.</p>
                        </div>
                        <button 
                          onClick={() => router.push('/book')}
                          className="px-5 py-2.5 rounded-full bg-accent text-primary font-display text-xs font-bold tracking-wider hover:opacity-90 transition-all uppercase"
                        >
                          Place Initial Request
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {orders.map((ord) => (
                          <div 
                            key={ord.id}
                            onClick={() => viewOrderDetails(ord)}
                            className="bg-surface-low p-5 rounded-2xl border border-outline-variant/10 hover:border-secondary transition-all cursor-pointer space-y-4 relative group"
                          >
                            <span className="absolute top-5 right-5 text-[10px] font-mono font-bold text-secondary group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                              DETAILS <ChevronRight className="w-3 h-3 animate-pulse" />
                            </span>

                            <div className="space-y-1.5">
                              <span className="px-2 py-0.5 font-mono text-[9px] font-bold rounded bg-primary/10 text-primary">{ord.order_number}</span>
                              <h4 className="font-display text-sm font-bold text-primary leading-snug">
                                {ord.service_id === 'srv-standard' && 'Standard Maintenance Curation'}
                                {ord.service_id === 'srv-deep' && 'Deep Restoration Suite'}
                                {ord.service_id === 'srv-move' && 'Move In / Out Choreography'}
                                {!['srv-standard', 'srv-deep', 'srv-move'].includes(ord.service_id) && 'Bespoke Atelier Restoration'}
                              </h4>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10.5px] font-sans border-t border-outline-variant/10 pt-3">
                              <div>
                                <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase block">Dispatch Date</span>
                                <span className="font-semibold text-primary">{ord.preferred_date}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-on-surface-variant/70 uppercase block">Estimate Locked</span>
                                <span className="font-semibold text-primary font-mono">${ord.final_confirmed_price || ord.final_estimated_price}</span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {/* Status Badges */}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                ord.order_status === 'New' || ord.order_status === 'Under Review' ? 'bg-orange-500/10 text-orange-600' :
                                ord.order_status === 'Quote Sent' ? 'bg-indigo-500/10 text-indigo-600' :
                                ord.order_status === 'Scheduled' ? 'bg-emerald-500/15 text-emerald-600' :
                                ord.order_status === 'Completed' ? 'bg-teal-500/15 text-teal-600' :
                                ord.order_status === 'Cancelled' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'
                              }`}>
                                DISPATCH: {ord.order_status}
                              </span>

                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                                ord.payment_status === 'Paid' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-orange-500/10 text-orange-600'
                              }`}>
                                PAYMENT: {ord.payment_status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* --- DETAILED SINGLE ORDER SCREEN --- */
                  <div className="bg-surface-low p-6 sm:p-8 rounded-3xl border border-outline-variant/15 space-y-8 relative">
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="px-3.5 py-1.5 rounded-full bg-surface hover:bg-surface-lowest text-primary font-mono text-[9px] font-bold tracking-wider uppercase border border-outline-variant/20 inline-flex items-center gap-1 hover:shadow-xs transition-all"
                    >
                      ← Return to Ledgers
                    </button>

                    {/* Order Meta Header cards */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-on-surface-variant/1 w-full">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-accent text-primary text-[10px] font-mono font-bold tracking-widest rounded uppercase">
                          CURATED REFERNCE #{selectedOrder.order_number}
                        </span>
                        <h3 className="font-display text-xl font-bold text-primary">
                          {selectedOrder.service_id === 'srv-standard' && 'Standard Maintenance Curation'}
                          {selectedOrder.service_id === 'srv-deep' && 'Deep Restoration Suite'}
                          {selectedOrder.service_id === 'srv-move' && 'Move In / Out Choreography'}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed font-sans font-medium">
                          Estimated Subtotal: <strong className="font-mono text-primary">${selectedOrder.original_estimated_price}</strong> 
                          {selectedOrder.coupon_code && <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 rounded font-mono text-[10px]">COUPON: {selectedOrder.coupon_code} (${selectedOrder.discount_amount})</span>}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-right font-mono text-xs w-full md:w-auto">
                        <span className="block text-[8.5px] font-bold text-on-surface-variant/60 uppercase">LOCK BOX / HARBOUR PRICE</span>
                        <span className="text-2xl font-bold text-primary font-mono tracking-tight">
                          ${selectedOrder.final_confirmed_price || selectedOrder.final_estimated_price}
                        </span>
                        <span className="block text-[9px] uppercase font-bold text-on-surface-variant/80">
                          {selectedOrder.final_confirmed_price ? '✓ Quote Verified by Curator' : '⚠ Estimated Pending Verification'}
                        </span>
                      </div>
                    </div>

                    {/* Left Column Parameters vs Right Timeline Splitters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      
                      {/* Left Side: Parameters checklist */}
                      <div className="space-y-5">
                        <div className="space-y-3 p-4 rounded-2xl bg-surface-lowest border border-outline-variant/10 text-xs">
                          <h4 className="font-mono text-[9px] uppercase font-bold text-secondary tracking-widest">RESTORE ALLOCATIONS</h4>
                          
                          <div className="space-y-2 text-[11px] font-sans text-on-surface-variant">
                            <p className="border-b border-outline-variant/5 pb-1 flex justify-between">
                              <span className="font-bold text-primary">Property Type:</span> 
                              <span>{selectedOrder.property_size?.homeType || 'Apartment'}</span>
                            </p>
                            <p className="border-b border-outline-variant/5 pb-1 flex justify-between">
                              <span className="font-bold text-primary">Sizing Layers:</span> 
                              <span>{selectedOrder.property_size?.bedrooms} Beds / {selectedOrder.property_size?.bathrooms} Baths</span>
                            </p>
                            <p className="border-b border-outline-variant/5 pb-1 flex justify-between">
                              <span className="font-bold text-primary">Target Square Ft:</span> 
                              <span>{selectedOrder.property_size?.squareFootage} Sq. Ft.</span>
                            </p>
                            <p className="border-b border-outline-variant/5 pb-1 flex justify-between">
                              <span className="font-bold text-primary">Assigned Window:</span> 
                              <span className="font-mono text-primary font-semibold">{selectedOrder.preferred_date}</span>
                            </p>
                            <p className="border-b border-outline-variant/5 pb-1 flex justify-between">
                              <span className="font-bold text-primary">Dispatch Time:</span> 
                              <span>{selectedOrder.preferred_time_slot}</span>
                            </p>
                          </div>
                        </div>

                        {/* Special access details instructions */}
                        {selectedOrder.accessMethod && (
                          <div className="p-4 rounded-2xl bg-surface-lowest border border-outline-variant/10 text-xs space-y-2">
                            <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#555]">Access Directions</h4>
                            <p className="font-sans font-bold text-primary flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
                              Entry Strategy: {selectedOrder.accessMethod}
                            </p>
                            {selectedOrder.customKeyNotes && (
                              <p className="font-mono text-[10.5px] text-on-surface-variant leading-relaxed bg-surface/50 p-2.5 rounded border border-outline-variant/10">
                                {selectedOrder.customKeyNotes}
                              </p>
                            )}
                          </div>
                        )}

                        {selectedOrder.notes && (
                          <div className="p-4 rounded-2xl bg-surface-lowest border border-outline-variant/10 text-xs space-y-1">
                            <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#555]">Customer Custom Directives</h4>
                            <p className="font-sans text-on-surface-variant font-medium leading-relaxed italic">
                              &quot;{selectedOrder.notes}&quot;
                            </p>
                          </div>
                        )}

                        {/* Admin comment logs visible to client */}
                        {selectedOrder.customer_visible_notes && (
                          <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/25 text-xs space-y-1.5">
                            <h4 className="font-mono text-[9px] font-bold uppercase tracking-widest text-primary flex items-center gap-1">
                              <Info className="w-3.5 h-3.5 fill-current" /> Curator Instructions Dispatch
                            </h4>
                            <p className="font-sans text-primary font-bold leading-relaxed">
                              {selectedOrder.customer_visible_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Manual Quote / Settle Coordinates + Status History Timeline */}
                      <div className="space-y-6">
                        
                        {/* MANUAL SETTLEMENT COORDINATES FOR OFFLINE PAYMENTS */}
                        {selectedOrder.payment_status !== 'Paid' && (
                          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-4">
                            <div className="flex items-start gap-2.5">
                              <Landmark className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <h4 className="font-display font-bold text-primary uppercase text-xs tracking-wider">Manual Invoice Settlement</h4>
                                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                                  All dispatch bookings are finalized offline. Submit Interac e-Transfers or bank coordinates using parameters below to lock your sweep.
                                </p>
                              </div>
                            </div>

                            <div className="bg-surface-lowest/95 p-3.5 rounded-xl border border-outline-variant/20 font-mono text-[10.5px] space-y-2 text-primary">
                              <div className="flex justify-between">
                                <span className="font-sans text-on-surface-variant/80 font-bold">IBAN Routing:</span>
                                <span className="font-bold">CAD-PST-890-2104-928</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-sans text-on-surface-variant/80 font-bold">Trust Transfer Key:</span>
                                <span className="font-bold">admin@gmail.com</span>
                              </div>
                              <div className="flex justify-between border-t border-outline-variant/10 pt-2 font-bold text-secondary">
                                <span className="font-sans">Exact Invoice Total:</span>
                                <span>${selectedOrder.final_confirmed_price || selectedOrder.final_estimated_price}</span>
                              </div>
                              <div className="text-[9.5px] font-sans text-on-surface-variant/70 leading-normal pt-1.5 normal-case italic">
                                * Specify Secure Order Code <strong className="text-secondary font-mono">{selectedOrder.order_number}</strong> inside notes block. Administrative curation verifies transfers in 1 hour.
                              </div>
                            </div>

                            <div className="p-3 bg-accent/15 border border-outline-variant/25 rounded-lg text-[10.5px] text-primary space-y-1.5 font-medium leading-relaxed">
                              <p className="flex items-center gap-1 font-bold uppercase text-[9px] font-mono text-secondary"><Landmark className="w-3.5 h-3.5" /> Offline Settlement Verification Guidelines</p>
                              <p className="font-sans">We never email automatic checkout portals or verify card numbers. Send transfer coordinates directly, and expect dispatch finalization confirmation dynamically via dashboard inbox logs.</p>
                            </div>
                          </div>
                        )}

                        {/* Chronological Status Timeline updates */}
                        <div className="space-y-3">
                          <h4 className="font-mono text-[9px] uppercase font-bold text-on-surface-variant tracking-widest block">Ledgers Status Log history</h4>
                          
                          {orderDetailsLoading ? (
                            <span className="font-mono text-[10px] text-on-surface-variant animate-pulse">Retrieving coordinates logs...</span>
                          ) : (
                            <div className="relative border-l border-outline-variant/20 ml-2.5 pl-4 space-y-5">
                              {orderHistoryTimeline.map((hst, idx) => (
                                <div key={hst.id} className="relative text-xs">
                                  {/* Milestone marker bullet */}
                                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-secondary border border-surface shadow-xs"></div>
                                  
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-primary">{hst.new_status} Status</span>
                                      <span className="font-mono text-[9px] text-on-surface-variant/75">
                                        {new Date(hst.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="font-sans text-[11px] text-on-surface-variant/85 leading-relaxed italic">&quot;{hst.note}&quot;</p>
                                    <span className="font-mono text-[9.5px] text-on-surface-variant/60 uppercase block">Modified via: {hst.changed_by}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Customer Cancellations checks */}
                        {!['Cancelled', 'Refund Required', 'Completed', 'Settled'].includes(selectedOrder.order_status) && (
                          <div className="pt-6 border-t border-outline-variant/10 text-right">
                            <button 
                              onClick={() => handleCancelOrder(selectedOrder.id)}
                              className="px-4 py-2 hover:bg-red-500 hover:text-white rounded-full bg-red-500/10 border border-red-500/20 text-red-700 font-mono text-[10px] font-bold uppercase tracking-wider transition-all"
                            >
                              Request Cancellation block
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. SUPPORT TICKETS INBOX */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                
                {/* Raise a support ticket portal */}
                <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-primary">Support Inboxes</h3>
                    <p className="text-xs text-on-surface-variant">Review historical support communications or submit security and booking detail updates.</p>
                  </div>
                  <button 
                    onClick={() => setRaiseTicketOpen(true)}
                    className="px-4.5 py-2.5 bg-primary text-surface rounded-full font-display text-[10.5px] font-bold tracking-wider uppercase flex items-center gap-1.5 hover:bg-secondary cursor-pointer transition-all shrink-0 active:scale-95 text-center shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Raise support Ticket
                  </button>
                </div>

                {/* Raise ticket form popup details modal */}
                <AnimatePresence>
                  {raiseTicketOpen && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 bg-primary/45 backdrop-blur-xs flex items-center justify-center p-6"
                    >
                      <motion.div 
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-surface-lowest p-6 sm:p-8 rounded-3xl border border-outline-variant/15 shadow-2xl max-w-lg w-full space-y-6 overflow-y-auto max-h-[90vh]"
                      >
                        <div className="flex justify-between items-center border-b border-outline-variant/10 pb-3">
                          <h3 className="font-display text-base font-bold text-primary uppercase tracking-wide">Raise Support Request</h3>
                          <button onClick={() => setRaiseTicketOpen(false)} className="p-2 hover:bg-surface-low rounded-full transition-colors text-on-surface-variant">
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <form onSubmit={handleRaiseTicket} className="space-y-4 text-xs font-sans">
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="block font-bold text-primary">Ticket Category *</label>
                              <select 
                                value={newTicketCategory}
                                onChange={(e) => setNewTicketCategory(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:outline-none focus:border-secondary transition-all"
                              >
                                <option>Payment issue</option>
                                <option>Scheduling issue</option>
                                <option>Service issue</option>
                                <option>Coupon issue</option>
                                <option>Cancellation request</option>
                                <option>Refund request</option>
                                <option>Other</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block font-bold text-primary">Ticket Priority *</label>
                              <select 
                                value={newTicketPriority}
                                onChange={(e: any) => setNewTicketPriority(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:outline-none focus:border-secondary transition-all"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block font-bold text-primary">Optional Order Reference ID</label>
                            <select 
                              value={newTicketOrderId}
                              onChange={(e) => setNewTicketOrderId(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/20 text-xs focus:outline-none focus:border-secondary transition-all"
                            >
                              <option value="">No specific order reference</option>
                              {orders.map(o => (
                                <option key={o.id} value={o.id}>{o.order_number} ({o.preferred_date})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="block font-bold text-primary">Summarized Subject *</label>
                            <input 
                              type="text"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/25 focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                              placeholder="e.g. Inquiring on refund schedules"
                              value={newTicketSubject}
                              onChange={(e) => setNewTicketSubject(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block font-bold text-primary">Exhaustive Message details *</label>
                            <textarea 
                              rows={5}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant/25 focus:ring-1 focus:ring-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40 resize-none"
                              placeholder="Describe your circumstances in detail so our curators can assist..."
                              value={newTicketMessage}
                              onChange={(e) => setNewTicketMessage(e.target.value)}
                              required
                            ></textarea>
                          </div>

                          <button 
                            type="submit"
                            className="w-full py-3.5 mt-4 rounded-full bg-primary text-surface font-display text-xs tracking-widest uppercase font-bold hover:bg-secondary cursor-pointer transition-all text-center"
                          >
                            Submit Support Request Ticket
                          </button>
                        </form>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tickets dynamic splitting */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left list of tickets */}
                  <div className="md:col-span-5 space-y-3">
                    {tickets.length === 0 ? (
                      <span className="font-mono text-[10px] text-on-surface-variant/70 italic p-4 block">No communications raised yet.</span>
                    ) : (
                      tickets.map(t => (
                        <div 
                          key={t.id}
                          onClick={() => viewTicketDetails(t)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer text-xs space-y-2 relative ${
                            selectedTicket?.id === t.id 
                              ? 'bg-primary/5 border-secondary ring-1 ring-secondary/15' 
                              : 'bg-surface-low border-outline-variant/10 hover:border-outline-variant/30'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-1">
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-mono text-[9px] font-bold rounded-sm uppercase">{t.ticket_number}</span>
                            <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[8.5px] uppercase ${
                              t.status === 'Open' ? 'bg-orange-500/10 text-orange-600 animate-pulse' :
                              t.status === 'In Review' ? 'bg-yellow-500/10 text-yellow-600' :
                              t.status === 'Waiting for Customer' ? 'bg-secondary/10 text-primary' :
                              t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-on-surface-variant/15 text-on-surface-variant'
                            }`}>{t.status}</span>
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="font-display font-medium text-primary uppercase text-[10.5px] tracking-wide truncate">{t.subject}</h4>
                            <span className="text-[10px] text-on-surface-variant/65 font-mono uppercase block">{t.category} • {t.priority} priority</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Right chat logs conversation */}
                  <div className="md:col-span-7 bg-surface-low p-5 sm:p-6 rounded-3xl border border-outline-variant/15 min-h-[400px] flex flex-col justify-between relative">
                    {selectedTicket ? (
                      <div className="flex-1 flex flex-col justify-between h-full space-y-6">
                        
                        {/* Header ticket subject */}
                        <div className="border-b border-outline-variant/10 pb-3 flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-mono font-bold text-on-surface-variant/60 block uppercase">COMMUNICATION TARGET: {selectedTicket.ticket_number}</span>
                            <h4 className="font-display text-sm font-bold text-primary">{selectedTicket.subject}</h4>
                          </div>

                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                            selectedTicket.priority === 'High' ? 'bg-red-500/10 text-red-650' : 'bg-primary/5 text-primary'
                          }`}>
                            PRIORITY: {selectedTicket.priority}
                          </span>
                        </div>

                        {/* Scrolling chat messages list */}
                        <div className="flex-1 max-h-[300px] overflow-y-auto space-y-4 pr-1 scroller-none text-xs">
                          {/* Main initial statement */}
                          <div className="bg-surface p-4 rounded-2xl border border-outline-variant/10 text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[10.5px] text-primary">
                              <span>{currentUser?.name}</span>
                              <span className="font-mono text-[9px] text-on-surface-variant/75 font-normal">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                            </div>
                            <p className="font-sans leading-relaxed text-on-surface-variant/90">{selectedTicket.message}</p>
                          </div>

                          {/* Nested responses replies list */}
                          {ticketRepliesLoading ? (
                            <span className="font-mono text-[9.5px] text-on-surface-variant animate-pulse block">Accessing inbox items...</span>
                          ) : (
                            ticketReplies.map(rep => {
                              const isAdmin = rep.sender_type === 'admin';
                              return (
                                <div 
                                  key={rep.id} 
                                  className={`p-4 rounded-2xl border text-xs space-y-1 max-w-[85%] ${
                                    isAdmin 
                                      ? 'bg-secondary/5 border-secondary/25 ml-auto text-primary' 
                                      : 'bg-surface border-outline-variant/10 mr-auto text-on-surface-variant'
                                  }`}
                                >
                                  <div className="flex justify-between font-bold text-[10.5px] gap-4">
                                    <span>{isAdmin ? 'Get me a maid Curator Concierge' : currentUser?.name}</span>
                                    <span className="font-mono text-[9px] text-on-surface-variant/75 font-normal">{new Date(rep.created_at).toLocaleString()}</span>
                                  </div>
                                  <p className="font-sans leading-relaxed">{rep.message}</p>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Submit reply forms */}
                        {selectedTicket.status === 'Closed' ? (
                          <div className="p-4 rounded-xl bg-on-surface-variant/10 text-center text-[10.5px] font-mono font-bold text-on-surface-variant uppercase">
                            ✓ This communications log is marked as resolved & CLOSED.
                          </div>
                        ) : (
                          <form onSubmit={handleSendReply} className="flex gap-2 items-center">
                            <input 
                              type="text"
                              placeholder="Type response coordinate and message..."
                              className="flex-1 px-4 py-3 rounded-full bg-surface border border-outline-variant/20 text-xs focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary text-primary transition-all"
                              value={newReplyMsg}
                              onChange={(e) => setNewReplyMsg(e.target.value)}
                              required
                            />
                            <button 
                              type="submit"
                              className="w-10 h-10 rounded-full bg-primary text-surface hover:bg-secondary flex items-center justify-center cursor-pointer transition-all shrink-0 outline-none"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </form>
                        )}

                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <MessageSquare className="w-12 h-12 text-on-surface-variant/35 mx-auto" />
                        <div className="space-y-1">
                          <h4 className="font-display text-xs font-bold text-primary uppercase tracking-wider">No Communication Selected</h4>
                          <p className="text-sans text-[11px] text-on-surface-variant max-w-xs mx-auto leading-relaxed">
                            Click individual ticket coordinates left to load historical chat sessions and post updates logs.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* C. CLIENT PROFILE VIEW */}
            {activeTab === 'profile' && (
              <div className="bg-surface-low p-6 sm:p-10 rounded-3xl border border-outline-variant/15 space-y-6">
                <div className="border-b border-outline-variant/10 pb-4">
                  <h3 className="font-display text-lg font-bold text-primary">Client Profile Credentials</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Verify your registered account values and authentication parameters.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono text-xs">
                  <div className="p-4 rounded-2xl bg-surface-lowest border border-outline-variant/15 text-xs text-primary space-y-1.5">
                    <span className="text-[9px] font-bold text-on-surface-variant/70 block uppercase">Client ID</span>
                    <span className="font-bold text-primary font-mono block">{currentUser?.id}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-lowest border border-outline-variant/15 text-xs text-primary space-y-1.5">
                    <span className="text-[9px] font-bold text-on-surface-variant/70 block uppercase font-sans">Full Name coordinates</span>
                    <span className="font-bold text-primary block">{currentUser?.name}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-lowest border border-outline-variant/15 text-xs text-primary space-y-1.5">
                    <span className="text-[9px] font-bold text-on-surface-variant/70 block uppercase font-sans">Primary Email address</span>
                    <span className="font-semibold text-primary block truncate font-mono">{currentUser?.email}</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-lowest border border-outline-variant/15 text-xs text-primary space-y-1.5">
                    <span className="text-[9px] font-bold text-on-surface-variant/70 block uppercase font-sans">Primary Phone Coordinates</span>
                    <span className="font-semibold text-primary block font-mono">{currentUser?.phone || '+1 (416) N/A-XXXX'}</span>
                  </div>
                </div>

                <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/15 flex items-start gap-3 text-xs leading-normal font-sans">
                  <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5 fill-current" />
                  <div>
                    <h4 className="font-bold text-primary">Need account modification?</h4>
                    <p className="text-on-surface-variant mt-0.5 leading-relaxed">
                      To safeguard active payment coordinates and address verification strategies, edits under core accounts are vetted by estimators. Raise a support ticket directly, and our curators will execute changes instantly.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </section>

      </main>

      <Footer />
    </div>
  );
}
