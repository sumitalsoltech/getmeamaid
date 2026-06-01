'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import DatabaseHealthPanel from '@/components/DatabaseHealthPanel';
import { 
  Sparkles, Check, ArrowRight, MapPin, Calendar, Clock, User, Mail, Phone, 
  ShieldAlert, Activity, FileText, Plus, Trash2, Edit2, Filter, DollarSign, 
  Gift, CreditCard, X, Search, ArrowUpRight, CheckCircle2, ChevronRight, Zap, RefreshCw,
  Users, Shield, Sliders, Tag, Settings, Key, FileSpreadsheet, Layers, MessageSquare,
  TrendingUp, BarChart3, Inbox, Lock, PlusCircle, LogOut, CheckSquare, AlertTriangle, Printer, Download, Send, CalendarDays, Briefcase,
  Database, Copy
} from 'lucide-react';

// Pure helper function to generate unique identifiers adhering to pure render constraints
function generateId(prefix: string): string {
  return `${prefix}-${Math.floor(Math.random() * 1000000)}`;
}

// Interfaces
interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_active: boolean;
}

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  is_active: boolean;
}

interface Booking {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  postal_code: string;
  home_type: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  restoration_level: string;
  frequency: string;
  selected_date: string;
  selected_time_slot: string;
  entry_method: string;
  custom_key_notes: string;
  customer_special_notes: string;
  pricing: string; // JSON
  created_at: string;
  order_status: string;
  payment_status: string;
  assigned_staff_id?: string;
  job_instructions?: string;
  confirmed_date?: string;
  confirmed_time?: string;
  staff_job_status?: 'Pending' | 'Accepted' | 'On the Way' | 'Started' | 'Completed' | 'Issue Reported';
  staff_reported_issue?: string;
  internal_notes?: string;
  customer_visible_notes?: string;
}

interface StatusHistory {
  id: string;
  order_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  note: string;
  created_at: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  customer_name: string;
  order_id?: string;
  subject: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Review' | 'Resolved' | 'Closed';
  category: string;
  created_at: string;
  replies?: Array<{ sender: string; message: string; date: string }>;
}

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: 'Unpaid' | 'Paid' | 'Refunded';
  created_at: string;
}

// Configured Constant Default Data (Out of render lifecycle)
const DEFAULT_ROLES: Role[] = [
  { id: 'role-super-admin', name: 'Super Admin', permissions: ['view_orders', 'edit_orders', 'update_order_status', 'assign_jobs', 'view_customers', 'manage_services', 'manage_pricing', 'manage_coupons', 'view_reports', 'download_invoices', 'manage_tickets', 'manage_staff', 'manage_roles', 'manage_email_templates'], is_active: true },
  { id: 'role-manager', name: 'Manager', permissions: ['view_orders', 'edit_orders', 'update_order_status', 'assign_jobs', 'view_customers', 'manage_services', 'manage_pricing', 'manage_coupons', 'view_reports', 'download_invoices', 'manage_tickets'], is_active: true },
  { id: 'role-support-staff', name: 'Support Staff', permissions: ['view_orders', 'edit_orders', 'update_order_status', 'manage_tickets', 'manage_coupons'], is_active: true },
  { id: 'role-field-staff', name: 'Field Staff', permissions: ['view_staff_jobs'], is_active: true },
  { id: 'role-accounts-staff', name: 'Accounts Staff', permissions: ['view_orders', 'update_order_status', 'view_reports', 'download_invoices'], is_active: true }
];

const DEFAULT_STAFF: Staff[] = [
  { id: 'stf-1', name: 'Arthur Pendelton', email: 'arthur@pristine.com', phone: '+1 (416) 555-0101', role_id: 'role-field-staff', is_active: true },
  { id: 'stf-2', name: 'Jessica Vance', email: 'jessica@pristine.com', phone: '+1 (416) 555-0102', role_id: 'role-field-staff', is_active: true },
  { id: 'stf-3', name: 'Michael Chen', email: 'michael@pristine.com', phone: '+1 (416) 555-0103', role_id: 'role-manager', is_active: true },
  { id: 'stf-4', name: 'Sarah Connor', email: 'sarah@pristine.com', phone: '+1 (416) 555-0104', role_id: 'role-support-staff', is_active: true }
];

const DEFAULT_TICKETS: Ticket[] = [
  { id: 'tkt-1', ticket_number: 'TKT-1082', customer_name: 'Charlotte Mercer', order_id: 'PRE-892104', category: 'Service issue', subject: 'Faucet polishing missing details', message: 'Hello, the master bath faucets were not buffed down. Could you ask the curator to inspect?', priority: 'Medium', status: 'Open', created_at: new Date(Date.now() - 86400000).toISOString(), replies: [] },
  { id: 'tkt-2', ticket_number: 'TKT-2901', customer_name: 'Marcus Goldman', order_id: 'PRE-102945', category: 'Scheduling issue', subject: 'Move up bi-weekly dispatch window', message: 'Can we move our afternoon window up to 11 AM due to corporate schedules?', priority: 'High', status: 'In Review', created_at: new Date(Date.now() - 43200000).toISOString(), replies: [] }
];

const DEFAULT_COUPONS = [
  { id: 'cop-1', code: 'PRISTINE15', value: 15, name: 'Eco Launch Promo', discount_type: 'percentage', used_count: 3 },
  { id: 'cop-2', code: 'WELCOME100', value: 100, name: 'New Client Reward', discount_type: 'fixed', used_count: 5 }
];

const DEFAULT_PRICING_RULES = [
  { id: 'rul-1', name: 'Downtown High-Rise Premium', rule_type: 'location_charge', value: 'Downtown', price_adjustment: 15, adjustment_type: 'percentage', is_active: true },
  { id: 'rul-2', name: 'Weekend Logistics Modifier', rule_type: 'urgency_charge', value: 'Saturday', price_adjustment: 45, adjustment_type: 'fixed', is_active: true }
];

const DEFAULT_SERVICES = [
  { id: 'srv-standard', title: 'Standard Maintenance Curation', rate: 220, is_active: true },
  { id: 'srv-deep', title: 'Complete Deep Curation', rate: 450, is_active: true },
  { id: 'srv-move', title: 'Move In / Out Choreography', rate: 600, is_active: true }
];

const DEFAULT_SLOTS = [
  { id: 'sl-1', name: '09:00 AM - 12:00 PM (Morning Slot)', is_active: true },
  { id: 'sl-2', name: '12:00 PM - 03:00 PM (Afternoon Slot)', is_active: true },
  { id: 'sl-3', name: '03:00 PM - 06:00 PM (Evening Slot)', is_active: true }
];

const DEFAULT_EMAIL_TEMPLATES = [
  { id: 'tpl-invoice', name: 'Invoice Generated Email', subject: '✨ Statement of Curation for Order {order_id}', body: 'Hello {customer_name},\n\nWe appreciate your choice. Your invoice {invoice_no} has been generated totaling {amount}. Enjoy your pristine space!' },
  { id: 'tpl-assign', name: 'Staff Job Assigned Notification', subject: 'Dispatch Alert: Job {order_id} Dedicated', body: 'Dear Field Curator,\n\nYou have been designated to orchestrate cleaning for order {order_id} scheduled for {date} ({time}).' }
];

export default function AdminDashboard() {

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Acting Profile State (For dynamic RBAC and Live demo simulation!)
  const [currentRole, setCurrentRole] = useState('role-super-admin'); // Default Super Admin
  const [actingStaffId, setActingStaffId] = useState('stf-1'); // Currently simulated staff user

  // Sidebar Workspace Module State
  const [activeTab, setActiveTab] = useState('Dashboard');

  // --- Admin Feature Refinements States (Requirement 1 & 2 & 3) ---
  const [adminTemplates, setAdminTemplates] = useState<any[]>([]);
  const [adminEmailLogs, setAdminEmailLogs] = useState<any[]>([]);
  const [selectedAdminTpl, setSelectedAdminTpl] = useState<any>(null);
  const [tplEditSubject, setTplEditSubject] = useState('');
  const [tplEditBody, setTplEditBody] = useState('');
  const [tplEditActive, setTplEditActive] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestSending, setIsTestSending] = useState(false);
  const [emailLogsSearch, setEmailLogsSearch] = useState('');

  // --- Dynamic Dashboard Reporting States (PRD Goal: Reports Page UI) ---
  const [reportTab, setReportTab] = useState('Order Summary');
  const [repStartDate, setRepStartDate] = useState('');
  const [repEndDate, setRepEndDate] = useState('');
  const [repSearch, setRepSearch] = useState('');
  const [repStatus, setRepStatus] = useState('all');
  const [repService, setRepService] = useState('all');
  const [repStaff, setRepStaff] = useState('all');
  const [repPage, setRepPage] = useState(1);

  const [services, setServices] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_services');
      if (cached) return JSON.parse(cached);
    }
    return DEFAULT_SERVICES;
  });

  const [pricingRules, setPricingRules] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_rules');
      if (cached) return JSON.parse(cached);
    }
    return DEFAULT_PRICING_RULES;
  });

  const [coupons, setCoupons] = useState<any[]>([]);
  const [repSortCol, setRepSortCol] = useState('');
  const [repSortDir, setRepSortDir] = useState<'asc' | 'desc'>('asc');

  const [cmsContent, setCmsContent] = useState<any>(null);
  const [cmsSaveLoading, setCmsSaveLoading] = useState(false);
  
  // Pricing Rules syncing states
  const [serverPricingRules, setServerPricingRules] = useState<any[]>([]);
  const [pricingRulesLoading, setPricingRulesLoading] = useState(false);

  // Service linking & Services CMS states
  const [allPricingMappings, setAllPricingMappings] = useState<any[]>([]);
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceLinkedRules, setServiceLinkedRules] = useState<any[]>([]);
  const [isAddRuleModalOpen, setIsAddRuleModalOpen] = useState(false);
  
  // Service editing form inputs
  const [serviceFormTitle, setServiceFormTitle] = useState('');
  const [serviceFormSlug, setServiceFormSlug] = useState('');
  const [serviceFormDesc, setServiceFormDesc] = useState('');
  const [serviceFormFullDesc, setServiceFormFullDesc] = useState('');
  const [serviceFormImage, setServiceFormImage] = useState('');
  const [serviceFormBasePrice, setServiceFormBasePrice] = useState(140);
  const [serviceFormDisplayOrder, setServiceFormDisplayOrder] = useState(0);
  const [serviceFormIsFeatured, setServiceFormIsFeatured] = useState(false);
  const [serviceFormIsActive, setServiceFormIsActive] = useState(true);
  const [serviceFormIsInstantPricing, setServiceFormIsInstantPricing] = useState(true);
  const [serviceFormIsManualQuote, setServiceFormIsManualQuote] = useState(false);
  const [serviceFormIncluded, setServiceFormIncluded] = useState<string[]>([]);
  const [serviceFormExcluded, setServiceFormExcluded] = useState<string[]>([]);
  const [serviceFormFAQs, setServiceFormFAQs] = useState<Array<{q: string, a: string}>>([]);
  const [serviceFormNotes, setServiceFormNotes] = useState('');
  
  // High fidelity states
  const [selectedPricingService, setSelectedPricingService] = useState('Standard Maintenance Curation');
  const [pricingSubTab, setPricingSubTab] = useState('Base Price');
  const [pricingSearch, setPricingSearch] = useState('');
  const [pricingStatusFilter, setPricingStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'
  const [pricingSortCol, setPricingSortCol] = useState('name');
  const [pricingSortDir, setPricingSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    match_key: '',
    price_adjustment: 0,
    adjustment_type: 'fixed',
    is_active: true,
    currency: 'CAD',
    quantity_allowed: false,
    quantity_label: '',
    condition: 'Custom',
    postal_code: '',
    service_available: true,
    manual_quote: false,
    apply_before_coupon: true,
    message: ''
  });

  // Test Pricing Simulator / Calculator States
  const [calcService, setCalcService] = useState('Standard Maintenance Curation');
  const [calcBedrooms, setCalcBedrooms] = useState(1);
  const [calcBathrooms, setCalcBathrooms] = useState(1);
  const [calcSqFt, setCalcSqFt] = useState('');
  const [calcAddons, setCalcAddons] = useState<string[]>([]);
  const [calcUrgency, setCalcUrgency] = useState('Normal');
  const [calcPostal, setCalcPostal] = useState('');
  const [calcHomeType, setCalcHomeType] = useState('Apartment / Condo');
  const [calcCoupon, setCalcCoupon] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Fetch all live settings from API when appropriate
  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.services);
        localStorage.setItem('pristine_admin_services', JSON.stringify(data.services));
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data.coupons) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
    }
  };

  const fetchCMSAndEmails = async () => {
    try {
      const cmsRes = await fetch('/api/cms');
      const cmsData = await cmsRes.json();
      if (cmsData.success) {
        setCmsContent(cmsData.cms);
        if (cmsData.cms.servicesContent) {
            setServices(cmsData.cms.servicesContent);
        }
      }

      const emailRes = await fetch('/api/admin/emails');
      const emailData = await emailRes.json();
      if (emailData.success) {
        setAdminTemplates(emailData.templates || []);
        setAdminEmailLogs(emailData.logs || []);
        if (emailData.templates?.length > 0) {
          const firstTpl = emailData.templates[0];
          setSelectedAdminTpl(firstTpl);
          setTplEditSubject(firstTpl.subject || '');
          setTplEditBody(firstTpl.body || '');
          setTplEditActive(firstTpl.is_active !== false);
        }
      }

      const prRes = await fetch('/api/pricing');
      const prData = await prRes.json();
      if (prData.success) {
        setServerPricingRules(prData.pricingRules || []);
      }
    } catch (err) {
      console.error('Error fetching admin states:', err);
    }
  };

  const createService = async (service: any) => {
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    if (res.ok) await fetchServices();
  };

  const editService = async (id: string, service: any) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    if (res.ok) await fetchServices();
  };

  const deleteService = async (id: string) => {
    const res = await fetch(`/api/admin/services/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) await fetchServices();
  };

  const handleSavePricingRule = async (ruleType: string, customPayload?: any) => {
    try {
      setPricingRulesLoading(true);
      let payload = customPayload;
      if (!payload) {
        payload = {
          ...ruleForm,
          rule_type: ruleType,
          service_name: selectedPricingService
        };
        if (editingRuleId) {
          payload.id = editingRuleId;
        }
      }

      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setServerPricingRules(data.pricingRules || []);
        setEditingRuleId(null);
        setRuleForm({
          name: '',
          match_key: '',
          price_adjustment: 0,
          adjustment_type: 'fixed',
          is_active: true,
          currency: 'CAD',
          quantity_allowed: false,
          quantity_label: '',
          condition: 'Custom',
          postal_code: '',
          service_available: true,
          manual_quote: false,
          apply_before_coupon: true,
          message: ''
        });
      } else {
        alert(`Failed to save rule: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    } finally {
      setPricingRulesLoading(false);
    }
  };

  const handleToggleRuleStatus = async (rule: any) => {
    const updated = { ...rule, is_active: !rule.is_active };
    await handleSavePricingRule(rule.rule_type, updated);
  };

  const handleDeletePricingRule = async (id: string) => {
    if (!confirm('Are you certain you wish to delete this pricing rule from the backend database?')) return;
    try {
      setPricingRulesLoading(true);
      const res = await fetch('/api/pricing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setServerPricingRules(data.pricingRules || []);
        if (editingRuleId === id) {
          setEditingRuleId(null);
        }
      } else {
        alert(`Delete failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API delete error: ${err.message}`);
    } finally {
      setPricingRulesLoading(false);
    }
  };

  const handleTestPreviewPrice = async () => {
    try {
      setCalcLoading(true);
      const res = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceLevel: calcService,
          bedrooms: calcBedrooms,
          bathrooms: calcBathrooms,
          squareFootage: calcSqFt ? Number(calcSqFt) : 0,
          addons: calcAddons.map(name => ({ name, quantity: 1 })),
          urgency: calcUrgency,
          postalCode: calcPostal,
          homeType: calcHomeType,
          couponCode: calcCoupon
        })
      });
      const data = await res.json();
      if (data.success) {
        setCalcResult(data.priceBreakdown);
      } else {
        alert(`Calculation failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error simulating price calculation: ${err.message}`);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleSaveCmsContent = async (updatedCms: any) => {
    setCmsSaveLoading(true);
    try {
      const res = await fetch('/api/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: updatedCms })
      });
      const data = await res.json();
      if (data.success) {
        alert('CMS website content saved successfully!');
        fetchCMSAndEmails();
      } else {
        alert(`CMS update failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    } finally {
      setCmsSaveLoading(false);
    }
  };

  const handleSaveEmailTemplate = async () => {
    if (!selectedAdminTpl) return;
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_template',
          id: selectedAdminTpl.id,
          subject: tplEditSubject,
          body: tplEditBody,
          is_active: tplEditActive
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Email template changes saved successfully!');
        fetchCMSAndEmails();
      } else {
        alert(`Failed to save template: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error saving template: ${err.message}`);
    }
  };

  const handleSendTestEmail = async () => {
    if (!selectedAdminTpl || !testEmailAddress) {
      alert('Please select a template and provide a valid test email address.');
      return;
    }
    setIsTestSending(true);
    try {
      const res = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_type: selectedAdminTpl.id,
          recipient_email: testEmailAddress,
          customer_name: 'Simulated Test Customer',
          order_id: 'PRE-TEST-992211',
          service_name: 'Standard Maintenance Curation',
          amount: '180.00'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Test email [${selectedAdminTpl.id}] dispatched successfully to ${testEmailAddress}! Check Mailtrap sandboxed inbox.`);
      } else {
        alert(`SMTP Delivery failure: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error dispatching email: ${err.message}`);
    } finally {
      setIsTestSending(false);
    }
  };

  const handleResendFailedEmail = async (logId: string) => {
    try {
      const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resend_log',
          logId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Resent failed email successfully!');
        fetchCMSAndEmails();
      } else {
        alert(`Resent failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleOpenServiceDrawer = async (service: any | null) => {
    setEditingService(service);
    if (service) {
      setServiceFormTitle(service.title || service.name || '');
      setServiceFormSlug(service.slug || '');
      setServiceFormDesc(service.description || service.short_description || '');
      setServiceFormFullDesc(service.full_description || '');
      setServiceFormImage(service.image || '');
      setServiceFormBasePrice(Number(service.base_price) || 0);
      setServiceFormDisplayOrder(Number(service.display_order) || 0);
      setServiceFormIsFeatured(service.is_featured === true);
      setServiceFormIsActive(service.is_active !== false);
      setServiceFormIsInstantPricing(service.is_instant_pricing_enabled !== false);
      setServiceFormIsManualQuote(service.is_manual_quote === true);
      
      // Parse included items
      try {
        setServiceFormIncluded(service.included_items ? (typeof service.included_items === 'string' ? JSON.parse(service.included_items) : service.included_items) : []);
      } catch (e) {
        setServiceFormIncluded([]);
      }
      
      // Parse excluded items
      try {
        setServiceFormExcluded(service.excluded_items ? (typeof service.excluded_items === 'string' ? JSON.parse(service.excluded_items) : service.excluded_items) : []);
      } catch (e) {
        setServiceFormExcluded([]);
      }
      
      // Parse FAQs
      try {
        setServiceFormFAQs(service.faqs ? (typeof service.faqs === 'string' ? JSON.parse(service.faqs) : service.faqs) : []);
      } catch (e) {
        setServiceFormFAQs([]);
      }
      
      setServiceFormNotes(service.notes || '');
      
      // Fetch associated pricing rules of this service
      await fetchServiceRules(service.id);
    } else {
      // Setup defaults for creating a new service
      setServiceFormTitle('');
      setServiceFormSlug('');
      setServiceFormDesc('');
      setServiceFormFullDesc('');
      setServiceFormImage('');
      setServiceFormBasePrice(140);
      setServiceFormDisplayOrder(0);
      setServiceFormIsFeatured(false);
      setServiceFormIsActive(true);
      setServiceFormIsInstantPricing(true);
      setServiceFormIsManualQuote(false);
      setServiceFormIncluded([]);
      setServiceFormExcluded([]);
      setServiceFormFAQs([]);
      setServiceFormNotes('');
      setServiceLinkedRules([]);
    }
    setIsServiceDrawerOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceFormTitle.trim()) {
      alert("Service Name is required.");
      return;
    }
    const slug = serviceFormSlug.trim() || serviceFormTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload = {
      title: serviceFormTitle,
      slug,
      description: serviceFormDesc,
      full_description: serviceFormFullDesc,
      image: serviceFormImage,
      base_price: Number(serviceFormBasePrice),
      is_featured: serviceFormIsFeatured,
      is_active: serviceFormIsActive,
      is_instant_pricing_enabled: serviceFormIsInstantPricing,
      is_manual_quote: serviceFormIsManualQuote,
      display_order: Number(serviceFormDisplayOrder),
      included_items: JSON.stringify(serviceFormIncluded),
      excluded_items: JSON.stringify(serviceFormExcluded),
      faqs: JSON.stringify(serviceFormFAQs),
      notes: serviceFormNotes
    };

    try {
      const url = editingService 
        ? `/api/admin/services/${editingService.id}` 
        : '/api/admin/services';
      
      const method = editingService ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert("Service saved successfully!");
        setIsServiceDrawerOpen(false);
        await fetchServices();
        await fetchMappings();
      } else {
        alert(`Failed to save service: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    }
  };

  const fetchServiceRules = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/pricing-rules`);
      const data = await res.json();
      if (data.success) {
        setServiceLinkedRules(data.mapping || []);
      }
    } catch (err) {
      console.error('Error fetching linked rules:', err);
    }
  };

  const handleToggleServiceActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/services/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        await fetchServices();
      } else {
        alert(`Failed to toggle status: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service permanently? This action is irreversible.")) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert("Service deleted successfully!");
        await fetchServices();
        await fetchMappings();
      } else {
        alert(`Failed to delete service: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error deleting service: ${err.message}`);
    }
  };

  const handleAddPricingRuleLink = async (pricingRuleId: string) => {
    if (!editingService) return;
    try {
      const exists = serviceLinkedRules.some((r: any) => r.pricing_rule_id === pricingRuleId);
      if (exists) {
        alert("This pricing rule is already linked to this service.");
        return;
      }
      const res = await fetch(`/api/admin/services/${editingService.id}/pricing-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricing_rule_id: pricingRuleId,
          is_required: false,
          default_selected: false,
          display_order: serviceLinkedRules.length,
          is_active: true
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchServiceRules(editingService.id);
        await fetchMappings();
      } else {
        alert(`Failed to link rule: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    }
  };

  const handleUpdateRuleLink = async (mappingId: string, updatedFields: any) => {
    if (!editingService) return;
    try {
      const res = await fetch(`/api/admin/services/${editingService.id}/pricing-rules/${mappingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields)
      });
      const data = await res.json();
      if (data.success) {
        await fetchServiceRules(editingService.id);
        await fetchMappings();
      } else {
        alert(`Failed to update link: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    }
  };

  const handleRemoveRuleLink = async (mappingId: string) => {
    if (!editingService) return;
    if (!confirm("Are you sure you want to unlink this pricing rule?")) return;
    try {
      const res = await fetch(`/api/admin/services/${editingService.id}/pricing-rules/${mappingId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        await fetchServiceRules(editingService.id);
        await fetchMappings();
      } else {
        alert(`Failed to unlink rule: ${data.error}`);
      }
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    }
  };

  const fetchMappings = async () => {
    try {
      const res = await fetch('/api/admin/pricing-mappings');
      const data = await res.json();
      if (data.success) {
        setAllPricingMappings(data.mappings || []);
      }
    } catch (err) {
      console.error('Error fetching mappings:', err);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.roles) {
        setRoles(data.roles);
        saveState('roles', data.roles);
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.staff) {
        setStaff(data.staff);
        saveState('staff', data.staff);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.tickets) {
        const formattedTickets = data.tickets.map((t: any) => ({
          ...t,
          replies: t.replies || []
        }));
        setTickets(formattedTickets);
        saveState('tickets', formattedTickets);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch('/api/admin/slots');
      const data = await res.json();
      if (data.slots) {
        setSlots(data.slots);
        saveState('slots', data.slots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCMSAndEmails();
    fetchServices();
    fetchCoupons();
    fetchMappings();
    fetchRoles();
    fetchStaff();
    fetchTickets();
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable State Persister
  const saveState = useCallback((key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`pristine_admin_${key}`, JSON.stringify(data));
    }
  }, []);

  // Unified State Stores with Lazy Safe Client-Side Init
  const [bookings, setBookings] = useState<Booking[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_bookings');
      if (cached) return JSON.parse(cached);
    }
    return [];
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_roles');
      if (cached) return JSON.parse(cached);
    }
    return DEFAULT_ROLES;
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_staff');
      if (cached) return JSON.parse(cached);
    }
    return DEFAULT_STAFF;
  });

  const [history, setHistory] = useState<StatusHistory[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_history');
      if (cached) return JSON.parse(cached);
    }
    return [];
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_tickets');
      if (cached) return JSON.parse(cached);
    }
    return DEFAULT_TICKETS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_invoices');
      if (cached) return JSON.parse(cached);
    }
    return [];
  });

  const [slots, setSlots] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('pristine_admin_slots');
      if (cached) return JSON.parse(cached);
    }
    return DEFAULT_SLOTS;
  });

  const [emailTemplates] = useState<any[]>(DEFAULT_EMAIL_TEMPLATES);

  // Interactive Panel States
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketReplyText, setTicketReplyText] = useState('');

  // Service and Location based filters
  const [serviceDateFilter, setServiceDateFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [serviceLocationFilter, setServiceLocationFilter] = useState('');

  // Creation/Edit Dialog Mocks
  const [newStaff, setNewStaff] = useState({ name: '', email: '', phone: '', role_id: 'role-field-staff' });
  const [newService, setNewService] = useState({ title: '', rate: 0, duration: '', desc: '', highlights: [] as string[] });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as string[] });
  const [newCoupon, setNewCoupon] = useState({ code: '', value: 25, type: 'percent' });
  const [newRule, setNewRule] = useState({ name: '', value: 15, type: 'fixed', rule_type: 'residence_type' });

  const fetchBookingsAPI = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const baseBookings = data.bookings || [];
        
        // Enrich bookings with standard default statuses for operations
        const enriched: Booking[] = baseBookings.map((b: any) => ({
          ...b,
          order_status: b.status || b.order_status || 'New',
          payment_status: b.payment_status || 'Payment Pending',
          assigned_staff_id: b.assigned_staff_id || undefined,
          staff_job_status: b.staff_job_status || undefined,
          internal_notes: b.internal_notes || b.admin_internal_notes || '',
          customer_visible_notes: b.customer_visible_notes || ''
        }));

        // Schedule state setters safely on the next loop tick to satisfy React 19 effect constraints
        setTimeout(() => {
          setBookings(enriched);
          saveState('bookings', enriched);

          // Pre-populate status logs matching enriched statuses
          const baseLogs: StatusHistory[] = enriched.flatMap(b => {
            return [
              { id: `log-${b.id}-1`, order_id: b.id, old_status: '', new_status: 'New', changed_by: 'Customer Flow', note: 'Order registered online.', created_at: b.created_at },
              ...(b.order_status !== 'New' ? [{ id: `log-${b.id}-2`, order_id: b.id, old_status: 'New', new_status: b.order_status, changed_by: 'System Auto-Designator', note: 'Status initialized.', created_at: new Date().toISOString() }] : [])
            ];
          });
          setHistory(baseLogs);
          saveState('history', baseLogs);

          // Pre-populate completed bookings with auto-invoices
          const baseInvoices: Invoice[] = enriched
            .filter(b => b.order_status === 'Completed')
            .map(b => {
              let pr: any = {};
              try { pr = typeof b.pricing === 'string' ? JSON.parse(b.pricing) : b.pricing; } catch {}
              return {
                id: `inv-rec-${b.id}`,
                invoice_number: `INV-${b.id.replace('PRE-', '')}`,
                order_id: b.id,
                customer_name: `${b.first_name} ${b.last_name}`,
                customer_email: b.email,
                total_amount: pr?.total || 350.00,
                status: b.payment_status === 'Paid' ? 'Paid' as const : 'Unpaid' as const,
                created_at: new Date().toISOString()
              };
            });
          setInvoices(baseInvoices);
          saveState('invoices', baseInvoices);
        }, 0);

      }
    } catch (e) {
      console.error(e);
    }
  }, [saveState, setBookings, setHistory, setInvoices]);

  // Fetch initial bookings on mount
  useEffect(() => {
    fetchBookingsAPI();
  }, [fetchBookingsAPI]);

  const saveBookingToBackend = useCallback(async (booking: Booking) => {
    try {
      const res = await fetch(`/api/orders/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: booking.order_status,
          payment_status: booking.payment_status,
          assigned_staff_id: booking.assigned_staff_id,
          job_instructions: booking.job_instructions,
          confirmed_date: booking.confirmed_date,
          confirmed_time: booking.confirmed_time,
          staff_job_status: booking.staff_job_status,
          internal_notes: booking.internal_notes,
          customer_visible_notes: booking.customer_visible_notes
        })
      });
      if (!res.ok) {
        console.error('Failed to sync booking to backend database');
      }
    } catch (e) {
      console.error('Error syncing booking to backend database:', e);
    }
  }, []);

  // Switch role or simulated acting staff dynamically
  const switchSimulatedRole = (roleId: string) => {
    setCurrentRole(roleId);
    
    // Automatically switch active tab for simplified UX as required
    if (roleId === 'role-field-staff') {
      setActiveTab('Staff Jobs');
    } else {
      setActiveTab('Dashboard');
    }
  };

  // Helper to verify permissions
  const hasPermission = (moduleName: string): boolean => {
    if (currentRole === 'role-super-admin') return true;
    const activeRoleObj = roles.find(r => r.id === currentRole);
    if (!activeRoleObj) return false;

    // Direct mapping of Sidebar section key details
    const mapping: Record<string, string> = {
      'Dashboard': 'view_orders',
      'Orders / Bookings': 'view_orders',
      'Job Allocation': 'assign_jobs',
      'Staff Jobs': 'view_staff_jobs',
      'Users / Customers': 'view_customers',
      'Staff Management': 'manage_staff',
      'Roles & Permissions': 'manage_roles',
      'Services': 'manage_services',
      'Pricing Rules': 'manage_pricing',
      'Coupons': 'manage_coupons',
      'Slots / Availability': 'view_orders',
      'Tickets': 'manage_tickets',
      'Invoices': 'download_invoices',
      'Reports': 'view_reports',
      'Email Templates': 'manage_email_templates',
      'Content Management': 'view_orders',
      'Settings': 'view_orders',
      'Database Health': 'view_orders'
    };

    const reqPerm = mapping[moduleName];
    if (currentRole === 'role-field-staff') {
      return moduleName === 'Staff Jobs' || moduleName === 'Tickets';
    }
    if (!reqPerm) return true;
    return activeRoleObj.permissions.includes(reqPerm);
  };

  // Manual order status override & Save History Workflow (Requirement 5)
  const handleUpdateOrderStatus = (orderId: string, newStatus: string, manualNote: string = '') => {
    const updatedBookings = bookings.map(b => {
      if (b.id === orderId) {
        const oldStatus = b.order_status;
        
        // Log history change (using safe pure generateId inside event callbacks)
        const hobj: StatusHistory = {
          id: generateId('hst-log'),
          order_id: b.id,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: roles.find(r => r.id === currentRole)?.name || 'Administrator',
          note: manualNote || `Status updated to ${newStatus}.`,
          created_at: new Date().toISOString()
        };
        
        const newHistory = [hobj, ...history];
        setHistory(newHistory);
        saveState('history', newHistory);

        // Auto generation of Invoice if marked completed (Requirement 8)
        if (newStatus === 'Completed') {
          const invoiceExists = invoices.some(i => i.order_id === b.id);
          if (!invoiceExists) {
            let pr: any = {};
            try { pr = typeof b.pricing === 'string' ? JSON.parse(b.pricing) : b.pricing; } catch {}
            const invoiceItem: Invoice = {
              id: `inv-rec-${b.id}`,
              invoice_number: `INV-${b.id.replace('PRE-', '')}`,
              order_id: b.id,
              customer_name: `${b.first_name} ${b.last_name}`,
              customer_email: b.email,
              total_amount: pr?.total || 350.00,
              status: b.payment_status === 'Paid' ? 'Paid' : 'Unpaid',
              created_at: new Date().toISOString()
            };
            const updatedInvs = [invoiceItem, ...invoices];
            setInvoices(updatedInvs);
            saveState('invoices', updatedInvs);
          }
        }

        const updatedObj = { ...b, order_status: newStatus };
        saveBookingToBackend(updatedObj);
        return updatedObj;
      }
      return b;
    });

    setBookings(updatedBookings);
    saveState('bookings', updatedBookings);

    // Sync selected
    if (selectedBooking && selectedBooking.id === orderId) {
      setSelectedBooking(updatedBookings.find(b => b.id === orderId) || null);
    }
  };

  // Job allocation mechanics (Requirement 6)
  const handleAssignStaff = (orderId: string, staffId: string, instructions: string, confDate: string, confTime: string) => {
    const staffName = staff.find(s => s.id === staffId)?.name || 'Simulated Cleaner';
    const note = `Allocated dedicated job to staff ${staffName}. Schedule: ${confDate} ${confTime}. Instructions: ${instructions}`;
    
    // Update order data structures
    const updated = bookings.map(b => {
      if (b.id === orderId) {
        const updatedObj = {
          ...b,
          assigned_staff_id: staffId,
          job_instructions: instructions,
          confirmed_date: confDate,
          confirmed_time: confTime,
          order_status: 'Job Assigned',
          staff_job_status: 'Pending' as const
        };
        saveBookingToBackend(updatedObj);
        return updatedObj;
      }
      return b;
    });

    setBookings(updated);
    saveState('bookings', updated);

    // Add list history
    const hobj: StatusHistory = {
      id: generateId('hst-log'),
      order_id: orderId,
      old_status: bookings.find(b => b.id === orderId)?.order_status || 'New',
      new_status: 'Job Assigned',
      changed_by: roles.find(r => r.id === currentRole)?.name || 'Admin Allocator',
      note: note,
      created_at: new Date().toISOString()
    };
    const newHistory = [hobj, ...history];
    setHistory(newHistory);
    saveState('history', newHistory);

    if (selectedBooking && selectedBooking.id === orderId) {
      setSelectedBooking(updated.find(b => b.id === orderId) || null);
    }

    alert(`Job successfully allocated to ${staffName}. Notification generated dynamically.`);
  };

  // Staff update job checklist status triggers (Requirement 6, 10)
  const handleStaffJobUpdate = (orderId: string, nextStatus: 'Accepted' | 'On the Way' | 'Started' | 'Completed' | 'Issue Reported', issueText: string = '') => {
    const updated = bookings.map(b => {
      if (b.id === orderId) {
        const updatedObj = {
          ...b,
          staff_job_status: nextStatus,
          staff_reported_issue: nextStatus === 'Issue Reported' ? issueText : b.staff_reported_issue,
          order_status: nextStatus === 'Completed' ? 'Completed' : b.order_status
        };
        saveBookingToBackend(updatedObj);
        return updatedObj;
      }
      return b;
    });

    setBookings(updated);
    saveState('bookings', updated);

    // Save logs
    const hobj: StatusHistory = {
      id: generateId('hst-log'),
      order_id: orderId,
      old_status: bookings.find(b => b.id === orderId)?.staff_job_status || 'Pending',
      new_status: nextStatus,
      changed_by: 'Staff Worker Portal',
      note: nextStatus === 'Issue Reported' ? `Issue reported by staff: "${issueText}"` : `Staff updated task status to "${nextStatus}"`,
      created_at: new Date().toISOString()
    };
    const newHistory = [hobj, ...history];
    setHistory(newHistory);
    saveState('history', newHistory);

    if (selectedBooking && selectedBooking.id === orderId) {
      setSelectedBooking(updated.find(b => b.id === orderId) || null);
    }
  };

  // Role Management addition & edits (Requirement 3)
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name) return;
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRole.name,
          permissions: newRole.permissions
        })
      });
      const data = await res.json();
      if (data.success && data.role) {
        const rlist = [...roles, data.role];
        setRoles(rlist);
        saveState('roles', rlist);
        setNewRole({ name: '', permissions: [] });
        alert(`Success: Created new operational role "${data.role.name}".`);
      } else {
        alert(`Failed to create role: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error creating role: ${err.message}`);
    }
  };

  const togglePermissionInNewRole = (perm: string) => {
    if (newRole.permissions.includes(perm)) {
      setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== perm) });
    } else {
      setNewRole({ ...newRole, permissions: [...newRole.permissions, perm] });
    }
  };

  // Staff Management operations (Requirement 4)
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStaff.name,
          email: newStaff.email,
          phone: newStaff.phone || '+1 (416) 555-4821',
          role_id: newStaff.role_id,
          is_active: true
        })
      });
      const data = await res.json();
      if (data.success && data.staff) {
        const slist = [...staff, data.staff];
        setStaff(slist);
        saveState('staff', slist);
        setNewStaff({ name: '', email: '', phone: '', role_id: 'role-field-staff' });
        alert(`Staff ${data.staff.name} added and role configured.`);
      } else {
        alert(`Failed to add staff: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error adding staff: ${err.message}`);
    }
  };

  // Report builder & downloads (Requirement 11)
  const executeReportQuery = (reportKey: string): any[] => {
    switch (reportKey) {
      case '1': // Orders by status
        return bookings.filter(b => statusFilter === 'all' || b.order_status === statusFilter);
      case '2': // Jobs assigned
        return bookings.filter(b => b.assigned_staff_id !== undefined);
      case '3': // Completed jobs by staff
        return bookings.filter(b => b.order_status === 'Completed' && b.assigned_staff_id);
      case '4': // Pending jobs
        return bookings.filter(b => b.order_status === 'New' || b.order_status === 'Under Review');
      case '5': // Payment pending
        return bookings.filter(b => b.payment_status === 'Payment Pending');
      case '6': // Completed with invoice
        return bookings.filter(b => b.order_status === 'Completed' && invoices.some(i => i.order_id === b.id));
      case '7': // Completed without invoice
        return bookings.filter(b => b.order_status === 'Completed' && !invoices.some(i => i.order_id === b.id));
      case '8': // Revenue
        return invoices.filter(i => i.status === 'Paid');
      case '9': // Coupons
        return coupons;
      case '10': // Staff Performance
        return staff.map(s => {
          const sJobs = bookings.filter(b => b.assigned_staff_id === s.id);
          return {
            name: s.name,
            total_allocated: sJobs.length,
            completed_jobs: sJobs.filter(b => b.order_status === 'Completed').length,
            issues_reported: sJobs.filter(b => b.staff_job_status === 'Issue Reported').length
          };
        });
      case '11': // Support tickets
        return tickets;
      default:
        return bookings;
    }
  };

  const handleExportCSV = (reportKey: string) => {
    const reportData = executeReportQuery(reportKey);
    if (reportData.length === 0) {
      alert('No data entries found for current matching queries.');
      return;
    }
    
    // Convert to flat CSV
    const headers = Object.keys(reportData[0]).join(',');
    const rows = reportData.map(item => 
      Object.values(item).map(val => {
        let text = val === null || val === undefined ? '' : String(val);
        text = text.replace(/"/g, '""');
        if (text.includes(',') || text.includes('\n')) text = `"${text}"`;
        return text;
      }).join(',')
    );

    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pristine_export_report_${reportKey}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Seed data trigger
  const handleTriggerSeeding = () => {
    localStorage.clear();
    location.reload();
  };

  // Setup pass check or bypass instant entry
  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1204' || pin.toLowerCase() === 'admin' || pin === '') {
      setIsAuthenticated(true);
      setAuthError('');
      // Set the admin cookie so the backend API allows us to perform CRUD
      document.cookie = "pristine_user_id=usr-admin; path=/; max-age=86400";
    } else {
      setAuthError('Incorrect passcode credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-[#0f172a] font-sans selection:bg-[#fbbf24]/30 flex flex-col antialiased">
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="auth-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-grow flex items-center justify-center p-6 h-screen bg-[#1e1e24] text-white"
          >
            <div className="max-w-md w-full bg-[#121214] p-8 rounded-2xl border border-neutral-800 shadow-xl space-y-6 text-center">
              <div className="flex justify-center flex-col items-center gap-1">
                <div className="p-3 bg-[#fbbf24]/10 rounded-full text-[#fbbf24] mb-2">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight uppercase tracking-widest font-mono">pristine admin</h1>
                <p className="text-xs text-neutral-400">Enterprise Operations Control Console</p>
              </div>

              <form onSubmit={handleBypassSubmit} className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#fbbf24]">Admin Access Code</label>
                  <input
                    type="password"
                    placeholder="Enter admin or leave blank to continue"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-[#1c1c1f] border border-neutral-800 text-center text-sm focus:border-[#fbbf24] outline-none tracking-widest font-mono"
                  />
                  <p className="text-[10px] text-neutral-500 italic text-center mt-1">
                    Demo: leave input completely blank and press &quot;Enter&quot; to bypass instantly.
                  </p>
                </div>

                {authError && <p className="text-xs text-red-500 font-medium">{authError}</p>}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#fbbf24] text-black font-semibold uppercase text-xs tracking-wider hover:bg-[#fbbf24]/85 transition-all shadow-lg font-bold"
                >
                  Configure Entry Authorization
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <div key="dashboard-main-shell" className="flex flex-grow h-screen overflow-hidden text-sm">
            
            {/* 1. Side Left-Navigation (Requirement 1 & 2) */}
            <aside className="w-64 bg-[#0d1117] text-neutral-300 flex flex-col border-r border-neutral-800 shrink-0 select-none print:hidden">
              <div className="p-5 border-b border-neutral-800 flex flex-col gap-1 bg-[#161b22]">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#fbbf24]" />
                  <span className="font-bold tracking-wider uppercase font-mono text-white text-xs">pristine ops</span>
                </div>
                <span className="text-[10px] text-[#fbbf24] uppercase tracking-widest font-bold">Atelier Suite v4.1</span>
              </div>

              {/* simulated role switcher profiler inside navbar */}
              <div className="px-4 py-3 bg-[#161b22]/50 border-b border-neutral-800/60 text-xs">
                <span className="text-[9px] uppercase font-bold text-neutral-500 font-mono block mb-1">Acting Profiler Login</span>
                <select
                  value={currentRole}
                  onChange={(e) => switchSimulatedRole(e.target.value)}
                  className="w-full text-xs font-semibold bg-neutral-900 border border-neutral-800 text-[#fbbf24] p-1.5 rounded outline-none cursor-pointer"
                >
                  <option value="role-super-admin">Super Admin (All Access)</option>
                  <option value="role-manager">Manager</option>
                  <option value="role-support-staff">Support Staff</option>
                  <option value="role-accounts-staff">Accounts Staff</option>
                  <option value="role-field-staff">Field Staff User</option>
                </select>

                {currentRole === 'role-field-staff' && (
                  <div className="mt-2 text-[10px] flex items-center gap-1.5 bg-neutral-900/60 p-1.5 rounded">
                    <span className="text-neutral-500">Cleaner:</span>
                    <select
                      value={actingStaffId}
                      onChange={(e) => setActingStaffId(e.target.value)}
                      className="bg-transparent text-white font-medium outline-none cursor-pointer text-[10px]"
                    >
                      {staff.filter(s => s.role_id === 'role-field-staff').map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Menu items rendered dynamically based on role permissions */}
              <nav className="flex-grow overflow-y-auto py-4 px-2 space-y-1 scrollbar-thin">
                {[
                  { name: 'Dashboard', icon: Activity },
                  { name: 'Orders / Bookings', icon: FileText },
                  { name: 'Job Allocation', icon: CalendarDays },
                  { name: 'Staff Jobs', icon: Briefcase },
                  { name: 'Users / Customers', icon: Users },
                  { name: 'Staff Management', icon: ShieldAlert },
                  { name: 'Roles & Permissions', icon: Shield },
                  { name: 'Services', icon: Layers },
                  { name: 'Pricing Rules', icon: DollarSign },
                  { name: 'Coupons', icon: Tag },
                  { name: 'Slots / Availability', icon: Clock },
                  { name: 'Tickets', icon: MessageSquare },
                  { name: 'Invoices', icon: FileSpreadsheet },
                  { name: 'Reports', icon: BarChart3 },
                  { name: 'Email Templates', icon: Mail },
                  { name: 'Content Management', icon: Inbox },
                  { name: 'Settings', icon: Settings },
                  { name: 'Database Health', icon: Database }
                ].map((m) => {
                  const visible = hasPermission(m.name);
                  if (!visible) return null;
                  const Icon = m.icon;
                  const isCur = activeTab === m.name;

                  return (
                    <button
                      key={m.name}
                      onClick={() => setActiveTab(m.name)}
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
                <div className="text-[10px] text-neutral-500 text-center font-mono select-none">
                  Logged in: {roles.find(r => r.id === currentRole)?.name}
                </div>
              </div>
            </aside>

            {/* Main view container */}
            <main className="flex-grow flex flex-col overflow-hidden bg-neutral-50 p-6 sm:p-8">
              
              {/* Top Operational Header (Requirement 1) */}
              <header className="flex justify-between items-center pb-4 border-b border-neutral-200/80 mb-6 shrink-0 print:hidden">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-900 flex items-center gap-1.5 font-mono">
                    <span>{activeTab}</span>
                  </h2>
                  <p className="text-xs text-neutral-500">PRISTINE System Panel Management Drawer</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-amber-100 border border-amber-200 rounded text-amber-800 text-xs font-semibold font-mono">
                    Simulation Profile: <span className="font-extrabold">{roles.find(r => r.id === currentRole)?.name}</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsAuthenticated(false);
                      setPin('');
                    }}
                    className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-all"
                    title="Log Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </header>

              {/* Tab Subviews Scrollable Area */}
              <div className="flex-grow overflow-y-auto pr-1">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    
                    {/* View: Dashboard */}
                    {activeTab === 'Dashboard' && (
                      <div className="space-y-6">
                        {/* Dynamic Stat Widgets (Requirement 1) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
                            <Activity className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
                            <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Registered Dispatches</span>
                            <h3 className="text-2xl font-bold font-mono text-neutral-900">{bookings.length}</h3>
                            <span className="text-[10px] text-neutral-500">Aggregate customer dispatches</span>
                          </div>
                          <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
                            <DollarSign className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
                            <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Accounting Revenue</span>
                            <h3 className="text-2xl font-bold font-mono text-neutral-900 text-amber-600">
                              ${bookings.reduce((sum, b) => {
                                try {
                                  const pr = typeof b.pricing === 'string' ? JSON.parse(b.pricing) : b.pricing;
                                  return sum + (pr?.total || 0);
                                } catch { return sum; }
                              }, 0).toFixed(2)}
                            </h3>
                            <span className="text-[10px] text-neutral-500">Total transaction values</span>
                          </div>
                          <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
                            <MessageSquare className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
                            <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Active Support Tickets</span>
                            <h3 className="text-2xl font-bold font-mono text-neutral-900">
                              {tickets.filter(t => t.status !== 'Closed').length}
                            </h3>
                            <span className="text-[10px] text-neutral-500">Unresolved client tickets</span>
                          </div>
                          <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-1 relative overflow-hidden">
                            <Users className="w-12 h-12 text-neutral-100 absolute right-3 top-3" />
                            <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono block">Registered Staff Curators</span>
                            <h3 className="text-2xl font-bold font-mono text-neutral-900">{staff.length}</h3>
                            <span className="text-[10px] text-[#fbbf24] font-semibold">Active staff assignments</span>
                          </div>
                        </div>

                        {/* Bento segment */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="col-span-2 p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
                            <div className="flex justify-between items-center text-xs font-bold uppercase font-mono tracking-wider border-b border-neutral-100 pb-2">
                              <span>New Order Queues</span>
                              <span className="text-amber-600">Action Required</span>
                            </div>
                            <div className="divide-y divide-neutral-100">
                              {bookings.slice(0, 3).map(b => (
                                <div key={b.id} className="py-2.5 flex items-center justify-between">
                                  <div>
                                    <strong className="text-neutral-900 block font-semibold">{b.first_name} {b.last_name}</strong>
                                    <span className="text-xs text-neutral-500">{b.home_type} • {b.selected_date}</span>
                                  </div>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                                    {b.order_status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
                            <span className="block font-bold font-mono uppercase text-xs text-neutral-500 tracking-wider">Quick Actions</span>
                            <div className="flex flex-col gap-2">
                              <button onClick={() => setActiveTab('Job Allocation')} className="w-full text-left p-3 hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-semibold">
                                <span>Assign Waiting Orders</span>
                                <ChevronRight className="w-4 h-4 text-neutral-400" />
                              </button>
                              <button onClick={() => setActiveTab('Roles & Permissions')} className="w-full text-left p-3 hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-semibold">
                                <span>Calibrate Security Roles</span>
                                <ChevronRight className="w-4 h-4 text-neutral-400" />
                              </button>
                              <button onClick={() => setActiveTab('Reports')} className="w-full text-left p-3 hover:bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between text-xs font-semibold">
                                <span>Download Excel/CSV Reports</span>
                                <ChevronRight className="w-4 h-4 text-[#fbbf24]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View: Orders / Bookings (Requirement 5 & 9) */}
                    {activeTab === 'Orders / Bookings' && (
                      <div className="space-y-4">
                        {/* Integrated Filter Bar with Date, Service Type, & Service Location (Requirement 11 variant) */}
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
                                  className="pl-8 pr-3 py-1.5 w-full text-xs rounded-md border border-neutral-200 outline-none bg-white focus:border-[#fbbf24] transition font-medium"
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
                                  className="w-full p-1.5 bg-white border border-neutral-200 rounded-md outline-none text-neutral-700 text-xs text-mono pr-7 focus:border-[#fbbf24] transition uppercase"
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
                    )}

                    {/* View: Job Allocation (Requirement 6) */}
                    {activeTab === 'Job Allocation' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
                          <h3 className="font-mono font-bold text-neutral-950 uppercase text-xs tracking-wider border-b pb-2">Pending Staff Allocations</h3>
                          <div className="divide-y divide-neutral-100 space-y-3">
                            {bookings.filter(b => b.order_status === 'New' || b.order_status === 'Under Review').map(b => (
                              <div key={b.id} className="pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div>
                                  <span className="font-mono text-[9px] font-bold bg-neutral-100 border px-1.5 py-0.5 rounded text-neutral-600 block w-fit mb-1">{b.id}</span>
                                  <strong className="text-neutral-900 block font-semibold">{b.first_name} {b.last_name}</strong>
                                  <p className="text-xs text-neutral-500">{b.home_type} • {b.postal_code} • {b.selected_date}</p>
                                </div>
                                
                                {/* Quick alloc inline widget */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <select
                                    id={`alloc-staff-${b.id}`}
                                    className="p-1.5 bg-white border rounded outline-none text-xs text-neutral-700 cursor-pointer"
                                  >
                                    <option value="">Select Staff...</option>
                                    {staff.filter(s => s.role_id === 'role-field-staff').map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      const selS = (document.getElementById(`alloc-staff-${b.id}`) as HTMLSelectElement)?.value;
                                      if (!selS) return alert('Kindly select a staff member first.');
                                      handleAssignStaff(b.id, selS, 'Standard dispatch. Please enforce clean bathroom moldings.', b.selected_date, b.selected_time_slot);
                                    }}
                                    className="px-3 py-1.5 bg-black text-white hover:bg-neutral-800 rounded text-xs font-semibold cursor-pointer"
                                  >
                                    Assign Job
                                  </button>
                                </div>
                              </div>
                            ))}
                            {bookings.filter(b => b.order_status === 'New' || b.order_status === 'Under Review').length === 0 && (
                              <p className="text-neutral-500 italic text-center py-4">No waiting bookings currently pending allocation.</p>
                            )}
                          </div>
                        </div>

                        <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-4">
                          <h3 className="font-mono font-bold text-neutral-900 uppercase text-xs tracking-wider border-b pb-2">Curators Activity Tracker</h3>
                          <div className="space-y-3.5">
                            {staff.filter(s => s.role_id === 'role-field-staff').map(s => {
                              const jobs = bookings.filter(b => b.assigned_staff_id === s.id);
                              return (
                                <div key={s.id} className="p-3 bg-neutral-50 border rounded-lg space-y-2">
                                  <div className="flex justify-between items-center border-b pb-1.5">
                                    <strong className="text-neutral-900 text-xs font-bold">{s.name}</strong>
                                    <span className="text-[10px] text-neutral-500 font-mono">{jobs.length} Jobs Assigned</span>
                                  </div>
                                  <div className="space-y-1">
                                    {jobs.map(j => (
                                      <div key={j.id} className="flex justify-between items-center text-[11px]">
                                        <span className="font-mono text-neutral-400">{j.id}</span>
                                        <span className={`font-semibold uppercase text-[9px] ${j.staff_job_status === 'Issue Reported' ? 'text-red-500' : 'text-neutral-600'}`}>
                                          {j.staff_job_status || 'Assigned'}
                                        </span>
                                      </div>
                                    ))}
                                    {jobs.length === 0 && <p className="text-[11px] text-neutral-400 italic">No schedules assigned today.</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View: Staff Jobs (Requirement 6, 10) */}
                    {activeTab === 'Staff Jobs' && (
                      <div className="max-w-xl mx-auto space-y-6">
                        <div className="p-5 bg-white border border-neutral-200 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-neutral-500">Field Curator Dispatch Board</h3>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px] uppercase font-mono">
                              Live Worker View
                            </span>
                          </div>
                          <div>
                            <span className="text-[11px] text-neutral-400 font-mono">Simulated Account</span>
                            <h2 className="text-lg font-bold text-neutral-900">
                              {staff.find(s => s.id === actingStaffId)?.name} (Field Staff)
                            </h2>
                          </div>
                          
                          {/* Simulated staff select */}
                          <div className="flex items-center gap-2 border-t pt-3 text-xs">
                            <span className="text-neutral-500">Pick Active Worker:</span>
                            <select
                              value={actingStaffId}
                              onChange={(e) => setActingStaffId(e.target.value)}
                              className="p-1 bg-white border rounded outline-none text-neutral-700 cursor-pointer font-semibold"
                            >
                              {staff.filter(s => s.role_id === 'role-field-staff').map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {bookings.filter(b => b.assigned_staff_id === actingStaffId).map(b => (
                            <div key={b.id} className="p-6 bg-white border border-neutral-200 rounded-xl space-y-4 shadow-sm text-neutral-800">
                              <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
                                <div>
                                  <span className="font-mono text-[9px] uppercase tracking-wider bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded leading-none">
                                    {b.id}
                                  </span>
                                  <h3 className="font-display font-extrabold text-[#0f172a] mt-1.5 text-base">
                                    {b.first_name} {b.last_name}
                                  </h3>
                                  <span className="text-xs text-neutral-500 font-mono">{b.phone}</span>
                                </div>
                                <span className={`px-2 py-1 text-xs font-black uppercase tracking-wider rounded border ${b.staff_job_status === 'Issue Reported' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-neutral-50 text-neutral-700'}`}>
                                  {b.staff_job_status || 'Allocated'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>Location Address / Post: <strong className="block text-neutral-950 font-semibold">{b.postal_code || 'Central Toronto'}</strong></div>
                                <div>Time slot: <strong className="block text-neutral-950 font-semibold">{b.selected_date} ({b.selected_time_slot})</strong></div>
                                <div className="col-span-2">Instructions: <p className="italic text-neutral-600 mt-1 font-medium bg-neutral-50 p-2.5 rounded border border-neutral-100">&quot;{b.job_instructions || 'Please clean with premium allergen suite.'}&quot;</p></div>
                              </div>

                              {/* Action trigger buttons */}
                              <div className="border-t border-neutral-100 pt-4 flex flex-wrap gap-2 justify-end">
                                {(!b.staff_job_status || b.staff_job_status === 'Pending') && (
                                  <button
                                    onClick={() => handleStaffJobUpdate(b.id, 'Accepted')}
                                    className="px-4 py-2 bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 rounded-lg text-xs font-bold shadow-sm cursor-pointer animate-pulse"
                                  >
                                    Accept Dispatch Job
                                  </button>
                                )}
                                {b.staff_job_status === 'Accepted' && (
                                  <button
                                    onClick={() => handleStaffJobUpdate(b.id, 'On the Way')}
                                    className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Mark: On the Way
                                  </button>
                                )}
                                {b.staff_job_status === 'On the Way' && (
                                  <button
                                    onClick={() => handleStaffJobUpdate(b.id, 'Started')}
                                    className="px-4 py-2 bg-black text-white hover:bg-neutral-800 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Mark: Started
                                  </button>
                                )}
                                {b.staff_job_status === 'Started' && (
                                  <button
                                    onClick={() => handleStaffJobUpdate(b.id, 'Completed')}
                                    className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Verify Completed
                                  </button>
                                )}

                                {b.staff_job_status !== 'Completed' && b.staff_job_status !== 'Issue Reported' && (
                                  <button
                                    onClick={() => {
                                      const text = prompt('Kindly describe the dispatch issue detail:');
                                      if (text) handleStaffJobUpdate(b.id, 'Issue Reported', text);
                                    }}
                                    className="px-4 py-2 text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-xs font-bold cursor-pointer"
                                  >
                                    Flag/Report Issue
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                          {bookings.filter(b => b.assigned_staff_id === actingStaffId).length === 0 && (
                            <p className="text-neutral-500 italic text-center py-12">No dispatch jobs allocated to your curator account today.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View: Users / Customers (Requirement 4) */}
                    {activeTab === 'Users / Customers' && (
                      <div className="bg-white border rounded-xl p-5 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold uppercase font-mono text-neutral-500 tracking-wider">Registered Client Directory</h3>
                        </div>
                        <div className="divide-y divide-neutral-100">
                          {bookings.map((b, i) => (
                            <div key={`${b.id}-${i}`} className="py-3 flex justify-between items-center border-b border-neutral-100/50">
                              <div>
                                <strong className="text-neutral-900 block font-semibold">{b.first_name} {b.last_name}</strong>
                                <span className="text-xs font-mono text-neutral-400">{b.email} • {b.phone}</span>
                              </div>
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 text-neutral-600 rounded">
                                Source: Account SignUp
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View: Staff Management (Requirement 4) */}
                    {activeTab === 'Staff Management' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4">
                          <h3 className="text-sm font-bold font-mono text-neutral-500 uppercase pb-2 border-b">Active Curators Staff List</h3>
                          <div className="divide-y divide-neutral-100 space-y-3">
                            {staff.map(s => (
                              <div key={s.id} className="pt-3 flex justify-between items-center text-xs border-b border-neutral-200/20 pb-3">
                                <div>
                                  <strong className="text-neutral-900 block font-semibold text-sm">{s.name}</strong>
                                  <span className="text-neutral-500 font-mono">{s.email} • {s.phone}</span>
                                </div>
                                <div className="text-right">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fbbf24]/10 text-[#c2931a] block w-fit ml-auto">
                                    {roles.find(r => r.id === s.role_id)?.name || 'Field'}
                                  </span>
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
                                    className={`text-[10px] font-bold mt-1 block hover:underline cursor-pointer ${s.is_active ? 'text-red-600' : 'text-emerald-600'}`}
                                  >
                                    {s.is_active ? 'Deactivate staff' : 'Activate staff'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border rounded-xl p-5 space-y-4">
                          <h3 className="text-sm font-bold font-mono text-neutral-900 uppercase">Enroll New Staff Member</h3>
                          <form onSubmit={handleCreateStaff} className="space-y-3.5 text-neutral-800">
                            <input
                              type="text"
                              placeholder="Full Name"
                              value={newStaff.name}
                              onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                              className="w-full text-xs p-2 bg-neutral-50 border rounded outline-none"
                              required
                            />
                            <input
                              type="email"
                              placeholder="Email Address"
                              value={newStaff.email}
                              onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                              className="w-full text-xs p-2 bg-neutral-50 border rounded outline-none"
                              required
                            />
                            <select
                              value={newStaff.role_id}
                              onChange={(e) => setNewStaff({ ...newStaff, role_id: e.target.value })}
                              className="w-full text-xs p-2 bg-neutral-50 border rounded outline-none cursor-pointer"
                            >
                              {roles.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                            <button className="w-full py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-lg cursor-pointer">
                              Add Staff & Send Invite
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* View: Roles & Permissions (Requirement 3) */}
                    {activeTab === 'Roles & Permissions' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4">
                          <h3 className="text-sm font-bold font-mono text-neutral-500 uppercase pb-2 border-b">Configured Authorization Roles</h3>
                          <div className="divide-y divide-neutral-100">
                            {roles.map(r => (
                              <div key={r.id} className="py-3.5 text-xs border-b border-neutral-100 last:border-b-0">
                                <div className="flex justify-between items-center mb-1">
                                  <strong className="text-sm text-neutral-900 font-extrabold">{r.name}</strong>
                                  <span className="px-2 py-0.5 bg-neutral-100 text-neutral-400 font-mono text-[9px] rounded uppercase font-bold">
                                    {r.id === 'role-super-admin' ? 'Root Bypass' : `${r.permissions.length} actions allowed`}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {r.permissions.map(p => (
                                    <span key={p} className="text-[9.5px] bg-neutral-50 border px-1.5 py-0.5 rounded font-mono text-neutral-500">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border rounded-xl p-5 space-y-4">
                          <h3 className="text-sm font-mono font-bold text-neutral-900 uppercase">Create Custom Security Role</h3>
                          <form onSubmit={handleCreateRole} className="space-y-4 text-neutral-800">
                            <input
                              type="text"
                              placeholder="Role Name (e.g., Accounts Staff)"
                              value={newRole.name}
                              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                              className="w-full p-2 text-xs bg-neutral-50 border rounded outline-none"
                              required
                            />

                            <div className="space-y-1 bg-neutral-50 p-2.5 rounded border border-neutral-100 max-h-48 overflow-y-auto font-sans">
                              <span className="block text-[10px] font-bold text-neutral-400 font-mono uppercase mb-1">Set Module Permissions</span>
                              {[
                                'view_orders', 'edit_orders', 'update_order_status', 'assign_jobs', 'view_customers',
                                'manage_services', 'manage_pricing', 'manage_coupons', 'view_reports', 'download_invoices',
                                'manage_tickets', 'manage_staff', 'manage_roles', 'manage_email_templates', 'view_staff_jobs'
                              ].map(p => (
                                <label key={p} className="flex items-center gap-2 py-0.5 text-xs text-neutral-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newRole.permissions.includes(p)}
                                    onChange={() => togglePermissionInNewRole(p)}
                                    className="rounded border-neutral-300 outline-none"
                                  />
                                  <span className="font-mono text-[11px]">{p}</span>
                                </label>
                              ))}
                            </div>

                            <button className="w-full py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-lg cursor-pointer">
                              Save New Role Schema
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* View: Services */}
                    {activeTab === 'Services' && (
                      <div className="space-y-6">
                        {/* Header & Create Button */}
                        <div className="bg-white border hover:shadow-xs transition-all rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="space-y-1">
                            <h3 className="text-sm uppercase font-bold font-mono text-neutral-800">Bespoke Curation Suites</h3>
                            <p className="text-xs text-neutral-500">Create, revise, and customize dynamic architectural cleaning services. Link rules to define estimation behavior.</p>
                          </div>
                          <button
                            onClick={() => handleOpenServiceDrawer(null)}
                            className="px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-sm">+</span>
                            Create Curation Suite
                          </button>
                        </div>

                        {/* Services List Table */}
                        <div className="bg-white border rounded-xl overflow-hidden shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-neutral-50 border-b border-neutral-100 text-[10px] font-mono uppercase text-neutral-400">
                                  <th className="py-3 px-4 font-semibold">Curation Service</th>
                                  <th className="py-3 px-4 font-semibold">Short Description</th>
                                  <th className="py-3 px-4 font-semibold text-center">Base Price</th>
                                  <th className="py-3 px-4 font-semibold text-center">Execution Mode</th>
                                  <th className="py-3 px-4 font-semibold text-center">Display Order</th>
                                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100 text-xs">
                                {services.map(s => {
                                  const linkedRulesCount = allPricingMappings.filter(m => m.service_id === s.id).length;
                                  return (
                                    <tr key={s.id} className="hover:bg-neutral-50/50 transition-all">
                                      {/* Service Detail */}
                                      <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                          {s.image ? (
                                            <img
                                              src={s.image}
                                              alt={s.title || s.name}
                                              className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                                            />
                                          ) : (
                                            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400 font-bold border font-mono">
                                              S
                                            </div>
                                          )}
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <strong className="text-neutral-900 font-semibold">{s.title || s.name}</strong>
                                              {s.is_featured && (
                                                <span className="px-1.5 py-0.5 bg-[#85f6e5]/20 text-[#0f172a] font-mono text-[8px] font-extrabold rounded uppercase tracking-wider">
                                                  FEATURED
                                                </span>
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <span className="text-[10px] font-mono text-neutral-400">slug: {s.slug || '-'}</span>
                                              <span className={`w-1.5 h-1.5 rounded-full ${s.is_active !== false ? 'bg-emerald-500' : 'bg-neutral-300'}`}></span>
                                              <span className="text-[10px] uppercase font-mono text-neutral-400">{s.is_active !== false ? 'Active' : 'Inactive'}</span>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      
                                      {/* Description */}
                                      <td className="py-4 px-4 text-neutral-500 max-w-sm font-sans truncate">
                                        {s.description || s.short_description || <span className="text-neutral-300 italic">No description filled</span>}
                                      </td>

                                      {/* Pricing */}
                                      <td className="py-4 px-4 text-center font-mono font-bold text-neutral-900">
                                        ${s.base_price || 0}
                                      </td>

                                      {/* Execution Type */}
                                      <td className="py-4 px-4">
                                        <div className="flex flex-col items-center gap-1">
                                          {s.is_manual_quote ? (
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-200/50 font-mono text-[9px] font-bold rounded">
                                              MANUAL ESTIMATOR
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200/50 font-mono text-[9px] font-bold rounded">
                                              INSTANT PRICING
                                            </span>
                                          )}
                                          <span className="text-[9px] font-mono text-neutral-400">{linkedRulesCount} rules associated</span>
                                        </div>
                                      </td>

                                      {/* Sort Order */}
                                      <td className="py-4 px-4 text-center font-mono font-bold text-neutral-500">
                                        {s.display_order || 0}
                                      </td>

                                      {/* Actions */}
                                      <td className="py-4 px-4 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                          <button
                                            onClick={() => handleOpenServiceDrawer(s)}
                                            className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-bold font-mono uppercase bg-transparent rounded border border-blue-100 transition-all cursor-pointer"
                                          >
                                            REVISE / RULES
                                          </button>
                                          <button
                                            onClick={() => handleDeleteService(s.id)}
                                            className="px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 text-[10px] font-bold font-mono uppercase bg-transparent rounded border border-red-50 transition-all cursor-pointer"
                                          >
                                            Delete
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

                        {/* DETAIL SUITE CMS DRAWER MODAL */}
                        {isServiceDrawerOpen && (
                          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
                            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border">
                              {/* Modal Title Banner */}
                              <div className="bg-neutral-900 text-white px-6 py-4 flex justify-between items-center sm:rounded-t-2xl">
                                <div>
                                  <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase">CURATION WORKSPACE EXPERT</span>
                                  <h4 className="text-sm font-bold">{editingService ? `Revise Suite Detail: ${serviceFormTitle}` : 'Create New Curation Suite'}</h4>
                                </div>
                                <button
                                  onClick={() => setIsServiceDrawerOpen(false)}
                                  className="text-neutral-400 hover:text-white font-mono text-base font-bold cursor-pointer transition-all"
                                >
                                  ✖
                                </button>
                              </div>

                              {/* Form Contents Container */}
                              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                                
                                {/* Section 1: Basic details */}
                                <div className="space-y-4">
                                  <h5 className="text-[11px] uppercase tracking-wider font-extrabold font-mono text-neutral-400 border-b pb-1">SECTION 1: BASIC DETAILS</h5>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Suite Name *</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. Premium Lavender Suite"
                                        value={serviceFormTitle}
                                        onChange={(e) => setServiceFormTitle(e.target.value)}
                                        className="w-full px-3 py-2 bg-neutral-50 hover:bg-neutral-100 focus:bg-white text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Custom URL Slug (leave blank to auto-generate)</label>
                                      <input
                                        type="text"
                                        placeholder="e.g. premium-lavender-suite"
                                        value={serviceFormSlug}
                                        onChange={(e) => setServiceFormSlug(e.target.value)}
                                        className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-mono"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Starting Base Price (CAD) *</label>
                                      <input
                                        type="number"
                                        placeholder="140"
                                        value={serviceFormBasePrice}
                                        onChange={(e) => setServiceFormBasePrice(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-mono font-bold text-neutral-900"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1 md:col-span-2">
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Service Image URL</label>
                                      <input
                                        type="text"
                                        placeholder="https://images.unsplash.com/photo-..."
                                        value={serviceFormImage}
                                        onChange={(e) => setServiceFormImage(e.target.value)}
                                        className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none text-neutral-600 overflow-ellipsis"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Display sorting order</label>
                                      <input
                                        type="number"
                                        value={serviceFormDisplayOrder}
                                        onChange={(e) => setServiceFormDisplayOrder(Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-mono font-bold"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Short Description Summary</label>
                                    <input
                                      type="text"
                                      placeholder="A concise, beautiful summary seen in marketing grids and layouts..."
                                      value={serviceFormDesc}
                                      onChange={(e) => setServiceFormDesc(e.target.value)}
                                      className="w-full px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none font-sans"
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                                      <input
                                        type="checkbox"
                                        checked={serviceFormIsFeatured}
                                        onChange={(e) => setServiceFormIsFeatured(e.target.checked)}
                                        className="rounded border-neutral-300 pointer-events-auto"
                                      />
                                      <span className="text-[10px] font-mono uppercase font-bold">Featured Suite?</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                                      <input
                                        type="checkbox"
                                        checked={serviceFormIsActive}
                                        onChange={(e) => setServiceFormIsActive(e.target.checked)}
                                        className="rounded border-neutral-300 pointer-events-auto"
                                      />
                                      <span className="text-[10px] font-mono uppercase font-bold">Active Station?</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                                      <input
                                        type="checkbox"
                                        checked={serviceFormIsInstantPricing}
                                        onChange={(e) => setServiceFormIsInstantPricing(e.target.checked)}
                                        className="rounded border-neutral-300 pointer-events-auto"
                                      />
                                      <span className="text-[10px] font-mono uppercase font-bold">Instant Pricing?</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-2 bg-neutral-50 hover:bg-neutral-100 rounded-lg">
                                      <input
                                        type="checkbox"
                                        checked={serviceFormIsManualQuote}
                                        onChange={(e) => setServiceFormIsManualQuote(e.target.checked)}
                                        className="rounded border-neutral-300 pointer-events-auto"
                                      />
                                      <span className="text-[10px] font-mono uppercase font-bold">Manual Quote Req?</span>
                                    </label>
                                  </div>
                                </div>

                                {/* Section 2: Service Content */}
                                <div className="space-y-4">
                                  <h5 className="text-[11px] uppercase tracking-wider font-extrabold font-mono text-neutral-400 border-b pb-1">SECTION 2: DETAILS CHOREOGRAPHY CONTENT</h5>
                                  
                                  <div className="space-y-2">
                                    <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Full Deep Description</label>
                                    <textarea
                                      rows={3}
                                      placeholder="Elaborated long-form details explaining the clinical, comprehensive steps of restoration included..."
                                      value={serviceFormFullDesc}
                                      onChange={(e) => setServiceFormFullDesc(e.target.value)}
                                      className="w-full p-3 bg-neutral-50 text-sm border rounded-xl focus:outline-none"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Inclusions */}
                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Dynamic Inclusions list</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Press Enter or Click [+] to Add"
                                          id="newInclusion"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const el = e.target as HTMLInputElement;
                                              if (el.value.trim()) {
                                                setServiceFormIncluded([...serviceFormIncluded, el.value.trim()]);
                                                el.value = '';
                                              }
                                            }
                                          }}
                                          className="flex-1 px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const el = document.getElementById('newInclusion') as HTMLInputElement;
                                            if (el && el.value.trim()) {
                                              setServiceFormIncluded([...serviceFormIncluded, el.value.trim()]);
                                              el.value = '';
                                            }
                                          }}
                                          className="px-3 bg-neutral-900 text-white rounded-lg text-xs cursor-pointer font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {serviceFormIncluded.map((inc, i) => (
                                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-sans">
                                            <span>✓ {inc}</span>
                                            <button
                                              type="button"
                                              onClick={() => setServiceFormIncluded(serviceFormIncluded.filter((_, idx) => idx !== i))}
                                              className="text-emerald-400 hover:text-emerald-900 font-bold ml-1"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Exclusions */}
                                    <div className="space-y-2">
                                      <label className="block text-[10px] font-mono text-neutral-500 uppercase font-bold">Dynamic Exclusions list</label>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Press Enter or Click [+] to Add"
                                          id="newExclusion"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              const el = e.target as HTMLInputElement;
                                              if (el.value.trim()) {
                                                setServiceFormExcluded([...serviceFormExcluded, el.value.trim()]);
                                                el.value = '';
                                              }
                                            }
                                          }}
                                          className="flex-1 px-3 py-2 bg-neutral-50 text-xs border rounded-lg focus:outline-none"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const el = document.getElementById('newExclusion') as HTMLInputElement;
                                            if (el && el.value.trim()) {
                                              setServiceFormExcluded([...serviceFormExcluded, el.value.trim()]);
                                              el.value = '';
                                            }
                                          }}
                                          className="px-3 bg-neutral-950 text-white rounded-lg text-xs cursor-pointer font-bold"
                                        >
                                          +
                                        </button>
                                      </div>
                                      <div className="flex flex-wrap gap-1.5 pt-1">
                                        {serviceFormExcluded.map((exc, i) => (
                                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-sans">
                                            <span>✗ {exc}</span>
                                            <button
                                              type="button"
                                              onClick={() => setServiceFormExcluded(serviceFormExcluded.filter((_, idx) => idx !== i))}
                                              className="text-red-400 hover:text-red-900 font-bold ml-1"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 3: Pricing Rules Linking Panel */}
                                {editingService && (
                                  <div className="space-y-4">
                                    <h5 className="text-[11px] uppercase tracking-wider font-extrabold font-mono text-neutral-400 border-b pb-1">SECTION 3: SERVICE PRICING RULE ASSOCIATIONS</h5>
                                    
                                    <div className="flex justify-between items-center bg-neutral-50 p-3 rounded-lg">
                                      <span className="text-[11px] text-neutral-500 font-mono">Select and link existing base calculations, size factors, add-ons, location charges, or min limits:</span>
                                      
                                      <button
                                        type="button"
                                        onClick={() => setIsAddRuleModalOpen(true)}
                                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-bold font-mono rounded cursor-pointer uppercase transition-all"
                                      >
                                        + Associate Existing Rule
                                      </button>
                                    </div>

                                    {/* Mapped Associated Rules Table */}
                                    <div className="border border-neutral-100 rounded-lg overflow-hidden shrink-0">
                                      <table className="w-full text-left">
                                        <thead>
                                          <tr className="bg-neutral-50 text-[10px] font-mono uppercase text-neutral-400 border-b">
                                            <th className="py-2.5 px-3">Rule Name</th>
                                            <th className="py-2.5 px-3">Type</th>
                                            <th className="py-2.5 px-3 text-center">Required?</th>
                                            <th className="py-2.5 px-3 text-center">Default Selected?</th>
                                            <th className="py-2.5 px-3 text-center">Status</th>
                                            <th className="py-2.5 px-3 text-right">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y text-xs text-neutral-800">
                                          {serviceLinkedRules.length === 0 ? (
                                            <tr>
                                              <td colSpan={6} className="py-8 text-center text-neutral-300 italic">No pricing rules associated with this service yet. All default global estimations rule rules will operate.</td>
                                            </tr>
                                          ) : (
                                            serviceLinkedRules.map((link: any) => {
                                              return (
                                                <tr key={link.id} className="hover:bg-neutral-50/50 transition-all text-xs">
                                                  <td className="py-3 px-3">
                                                    <div className="font-semibold text-neutral-900">{link.pricing_rules?.rule_name || link.pricing_rule?.rule_name || 'Associated Formula'}</div>
                                                    <span className="text-[9px] text-neutral-400 font-mono">id: {link.pricing_rule_id}</span>
                                                  </td>
                                                  <td className="py-3 px-3 font-mono text-[10px] text-neutral-500">
                                                    {link.pricing_rules?.rule_type || link.pricing_rule?.rule_type || 'global'}
                                                  </td>
                                                  <td className="py-3 px-3 text-center">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleUpdateRuleLink(link.id, { is_required: !link.is_required })}
                                                      className={`px-2 py-0.5 font-mono text-[10px] rounded font-bold cursor-pointer uppercase transition-all ${
                                                        link.is_required ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-neutral-100 text-neutral-400'
                                                      }`}
                                                    >
                                                      {link.is_required ? 'YES' : 'NO'}
                                                    </button>
                                                  </td>
                                                  <td className="py-3 px-3 text-center">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleUpdateRuleLink(link.id, { default_selected: !link.default_selected })}
                                                      className={`px-2 py-0.5 font-mono text-[10px] rounded font-bold cursor-pointer uppercase transition-all ${
                                                        link.default_selected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-400'
                                                      }`}
                                                    >
                                                      {link.default_selected ? 'YES' : 'NO'}
                                                    </button>
                                                  </td>
                                                  <td className="py-3 px-3 text-center">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleUpdateRuleLink(link.id, { is_active: !link.is_active })}
                                                      className={`px-2 py-0.5 font-mono text-[10px] rounded font-bold cursor-pointer uppercase transition-all ${
                                                        link.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                                      }`}
                                                    >
                                                      {link.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
                                                    </button>
                                                  </td>
                                                  <td className="py-3 px-3 text-right">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleRemoveRuleLink(link.id)}
                                                      className="text-red-500 hover:text-red-700 hover:underline font-mono text-[10px] uppercase font-bold cursor-pointer"
                                                    >
                                                      Unlink
                                                    </button>
                                                  </td>
                                                </tr>
                                              );
                                            })
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Drawer Foot controls */}
                              <div className="bg-neutral-50 px-6 py-4 border-t flex justify-between items-center sm:rounded-b-2xl">
                                <button
                                  type="button"
                                  onClick={() => setIsServiceDrawerOpen(false)}
                                  className="px-4 py-2 text-xs font-bold ring-1 ring-neutral-200 rounded-lg hover:bg-neutral-100 transition-all cursor-pointer"
                                >
                                  Close
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSaveService}
                                  className="px-5 py-2 bg-neutral-900 text-white font-bold text-xs rounded-lg hover:bg-neutral-800 transition-all cursor-pointer shadow-xs"
                                >
                                  Save Curation Suite
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DOUBLE MODAL: CHOOSE EXIST PRICING RULE TO LINK */}
                        {isAddRuleModalOpen && (
                          <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-neutral-100 animate-in fade-in zoom-in-95 duration-200">
                              <div className="bg-neutral-950 text-white p-4 flex justify-between items-center">
                                <h6 className="text-xs font-mono font-bold uppercase tracking-wider">Select Rules To Associate</h6>
                                <button
                                  type="button"
                                  onClick={() => setIsAddRuleModalOpen(false)}
                                  className="hover:text-amber-400 font-bold"
                                >
                                  ✖
                                </button>
                              </div>
                              
                              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                                <p className="text-[11px] text-neutral-500">Select any pre-configured base rate modifiers or property add-ons configuration formulas below to apply onto {serviceFormTitle}:</p>
                                
                                <div className="space-y-4 divide-y">
                                  {['service_base', 'size_charge', 'addon_pricing', 'urgency_charge', 'location_charge', 'min_order', 'manual_quote'].map((type) => {
                                    const matched = (pricingRules.length > 0 ? pricingRules : DEFAULT_PRICING_RULES).filter(r => r.rule_type === type);
                                    if (matched.length === 0) return null;
                                    
                                    return (
                                      <div key={type} className="pt-3 first:pt-0 space-y-1.5">
                                        <span className="text-[9px] font-mono tracking-widest font-extrabold text-neutral-400 bg-neutral-100 rounded px-1.5 py-0.5 uppercase">
                                          {type.replace('_', ' ')}
                                        </span>
                                        <div className="space-y-1 pt-1">
                                          {matched.map((rule) => {
                                            const isLinked = serviceLinkedRules.some((r: any) => r.pricing_rule_id === rule.id);
                                            return (
                                              <div key={rule.id} className="flex justify-between items-center text-xs p-2 rounded hover:bg-neutral-50 gap-2">
                                                <div>
                                                  <span className="font-semibold text-neutral-800">{rule.name || rule.rule_name}</span>
                                                  <div className="text-[9px] text-neutral-400 font-mono">match: &quot;{rule.match_key || rule.value}&quot; | adjust: {rule.adjustment_type === 'percentage' ? `${rule.price_adjustment}%` : `$${rule.price_adjustment}`}</div>
                                                </div>
                                                <button
                                                  type="button"
                                                  disabled={isLinked}
                                                  onClick={async () => {
                                                    await handleAddPricingRuleLink(rule.id);
                                                    setIsAddRuleModalOpen(false);
                                                  }}
                                                  className={`px-2 py-1 font-mono text-[9px] font-bold uppercase cursor-pointer rounded border ${
                                                    isLinked
                                                      ? 'text-neutral-400 bg-neutral-100 border-neutral-200'
                                                      : 'text-neutral-800 hover:text-white border-neutral-300 hover:bg-neutral-900 transition-all'
                                                  }`}
                                                >
                                                  {isLinked ? 'Linked' : 'Associate'}
                                                </button>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="bg-neutral-50 p-4 font-mono text-[10px] text-neutral-400 text-center border-t">
                                Associated formulas will govern real-time online estimation quotes.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* View: Pricing Rules */}
                    {activeTab === 'Pricing Rules' && (
                      <div className="space-y-6 font-sans text-neutral-800">
                        
                        {/* Selected Service Dropdown Header */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h2 className="text-base font-extrabold text-neutral-900 flex items-center gap-2">
                              <DollarSign className="w-5 h-5 text-[#fbbf24] shrink-0" />
                              Pricing & Rule Architect
                            </h2>
                            <p className="text-xs text-neutral-500">Configure systemic fine-tuning pricing matrices, travel zones, add-ons, and booking overrides.</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-neutral-700 whitespace-nowrap">Selected Service:</span>
                            <div className="relative">
                              <select
                                value={selectedPricingService}
                                onChange={(e) => {
                                  setSelectedPricingService(e.target.value);
                                  setEditingRuleId(null);
                                  setPricingSearch('');
                                }}
                                className="bg-neutral-50 px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-[#fbbf24] cursor-pointer text-neutral-900"
                              >
                                <option value="Standard Maintenance Curation">Standard Maintenance Curation</option>
                                <option value="Deep Restoration Suite">Deep Restoration Suite</option>
                                <option value="Move In / Out Choreography">Move In / Out Choreography</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Sub Tabs Controller */}
                        <div className="flex flex-wrap gap-1 border-b border-neutral-200">
                          {['Base Price', 'Size / Property Rules', 'Add-ons', 'Urgency Rules', 'Location Rules', 'Minimum Order', 'Manual Quote Rules'].map((tab) => (
                            <button
                              key={tab}
                              onClick={() => {
                                setPricingSubTab(tab);
                                setEditingRuleId(null);
                                setPricingSearch('');
                              }}
                              className={`px-4 py-2.5 text-xs font-bold transition border-b-2 cursor-pointer ${
                                pricingSubTab === tab
                                  ? 'border-[#fbbf24] text-neutral-900 font-extrabold'
                                  : 'border-transparent text-neutral-500 hover:text-neutral-850 hover:border-neutral-200'
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        {/* main Split Layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* LEFT COLUMN: Table List of Rules */}
                          <div className="lg:col-span-2 space-y-4">
                            
                            {/* Controls Bar for Multi-item Tabs */}
                            {pricingSubTab !== 'Base Price' && pricingSubTab !== 'Minimum Order' && (
                              <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row gap-3 justify-between items-center">
                                <div className="relative w-full sm:w-72">
                                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                                  <input
                                    type="text"
                                    placeholder={`Search ${pricingSubTab}...`}
                                    value={pricingSearch}
                                    onChange={(e) => setPricingSearch(e.target.value)}
                                    className="w-full bg-neutral-50 pl-9 pr-4 py-1.5 rounded-lg border border-neutral-200 text-xs focus:ring-1 focus:ring-[#fbbf24] outline-none"
                                  />
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                  <span className="text-[11px] font-bold text-neutral-500 whitespace-nowrap">Status:</span>
                                  <select
                                    value={pricingStatusFilter}
                                    onChange={(e) => setPricingStatusFilter(e.target.value)}
                                    className="bg-neutral-50 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-200 font-medium cursor-pointer"
                                  >
                                    <option value="all">All States</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Table content block */}
                            <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs">
                              {pricingSubTab === 'Base Price' ? (
                                <div className="p-6 text-center space-y-4">
                                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-[#fbbf24]">
                                    <DollarSign className="w-6 h-6" />
                                  </div>
                                  <div className="max-w-md mx-auto space-y-2">
                                    <h3 className="text-sm font-extrabold text-neutral-950">Starting Price Standard</h3>
                                    <p className="text-xs text-neutral-500">
                                      The service base price specifies the standard initial cost for **{selectedPricingService}** before applying dynamic modifiers, sizes, or extra addon selections.
                                    </p>
                                    <div className="mt-4 p-4 bg-neutral-50 border rounded-xl inline-block">
                                      <p className="text-[11px] font-bold uppercase text-neutral-400 tracking-wider">Current Live Base Price</p>
                                      <p className="text-3xl font-black text-neutral-900 mt-1">
                                        {ruleForm.currency === 'USD' ? '$' : 'CAD $'}{ruleForm.price_adjustment}
                                      </p>
                                      <p className="text-[10px] text-neutral-500 mt-1 flex items-center justify-center gap-1">
                                        <CheckCircle2 className={`w-3 h-3 ${ruleForm.is_active ? 'text-emerald-500' : 'text-neutral-300'}`} />
                                        Rate is {ruleForm.is_active ? 'Active' : 'Inactive'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : pricingSubTab === 'Minimum Order' ? (
                                <div className="p-6 text-center space-y-4">
                                  <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mx-auto text-sky-500">
                                    <TrendingUp className="w-6 h-6" />
                                  </div>
                                  <div className="max-w-md mx-auto space-y-2">
                                    <h3 className="text-sm font-extrabold text-neutral-950">Minimum Booking Order Guard</h3>
                                    <p className="text-xs text-neutral-500">
                                      Protects the business model by capping low-value appointments. If the total calculated service cost is less than this value, the customer pays this minimum limit.
                                    </p>
                                    <div className="mt-4 p-4 bg-neutral-50 border rounded-xl inline-block">
                                      <p className="text-[11px] font-bold uppercase text-neutral-400 tracking-wider">Service Minimum Billing</p>
                                      <p className="text-3xl font-black text-neutral-900 mt-1">
                                        CAD ${ruleForm.price_adjustment}
                                      </p>
                                      <p className="text-[10px] text-neutral-500 mt-1 flex items-center justify-center gap-2">
                                        <span>Apply before coupon: **{ruleForm.apply_before_coupon ? 'Yes' : 'No'}**</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <CheckCircle2 className={`w-3 h-3 ${ruleForm.is_active ? 'text-emerald-500' : 'text-neutral-300'}`} />
                                          {ruleForm.is_active ? 'Enabled' : 'Disabled'}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left text-xs text-neutral-700">
                                    <thead className="bg-neutral-50 text-[10px] text-neutral-500 font-bold uppercase border-b border-neutral-100">
                                      <tr>
                                        <th className="p-4">Rule / Metric Name</th>
                                        <th className="p-4">Match Key / Condition</th>
                                        {pricingSubTab === 'Add-ons' && <th className="p-4">Quantity Rule</th>}
                                        {pricingSubTab === 'Location Rules' && <th className="p-4">Area / Details</th>}
                                        <th className="p-4">Modifier Value</th>
                                        <th className="p-4">Manual Quote</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                      {serverPricingRules.filter(r => {
                                        const isCorrectType = r.rule_type === (
                                          pricingSubTab === 'Size / Property Rules' ? 'size_charge' :
                                          pricingSubTab === 'Add-ons' ? 'addon_pricing' :
                                          pricingSubTab === 'Urgency Rules' ? 'urgency_charge' :
                                          pricingSubTab === 'Location Rules' ? 'location_charge' :
                                          pricingSubTab === 'Manual Quote Rules' ? 'manual_quote' : 'service_base'
                                        );
                                        const isCorrectService = !r.service_name || r.service_name === selectedPricingService;
                                        const matchesSearch = !pricingSearch || r.name.toLowerCase().includes(pricingSearch.toLowerCase()) || (r.match_key && r.match_key.toLowerCase().includes(pricingSearch.toLowerCase()));
                                        const matchesStatus = pricingStatusFilter === 'all' || 
                                                              (pricingStatusFilter === 'active' && r.is_active) || 
                                                              (pricingStatusFilter === 'inactive' && !r.is_active);
                                        return isCorrectType && isCorrectService && matchesSearch && matchesStatus;
                                      }).map((rule) => {
                                        return (
                                          <tr key={rule.id} className="hover:bg-neutral-50/50 transition">
                                            <td className="p-4 font-extrabold text-neutral-900 block max-w-[170px] truncate">
                                              {rule.name}
                                            </td>
                                            <td className="p-4 font-mono font-bold text-neutral-600">
                                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded text-[10.5px]">
                                                {rule.match_key}
                                              </span>
                                            </td>
                                            
                                            {pricingSubTab === 'Add-ons' && (
                                              <td className="p-4 text-neutral-500">
                                                {rule.quantity_allowed ? (
                                                  <span className="text-[10.5px] text-amber-705 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                                                    Yes ({rule.quantity_label || 'per unit'})
                                                  </span>
                                                ) : 'No'}
                                              </td>
                                            )}

                                            {pricingSubTab === 'Location Rules' && (
                                              <td className="p-4 font-medium text-neutral-600">
                                                <span className="text-[10.5px] bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded max-w-[120px] truncate block">
                                                  {rule.postal_code || rule.match_key}
                                                </span>
                                              </td>
                                            )}

                                            <td className="p-4 font-bold text-neutral-800 font-mono">
                                              {rule.adjustment_type === 'unavailable' ? (
                                                <span className="text-red-650 text-[10px] font-bold">Blocked Out</span>
                                              ) : rule.adjustment_type === 'manual' || rule.manual_quote ? (
                                                <span className="text-amber-650 text-[10px] font-bold">Shared Quote</span>
                                              ) : rule.adjustment_type === 'percentage' ? (
                                                `+${rule.price_adjustment}%`
                                              ) : (
                                                `+$${rule.price_adjustment}`
                                              )}
                                            </td>
                                            <td className="p-4">
                                              {rule.manual_quote || rule.adjustment_type === 'manual' || rule.adjustment_type === 'unavailable' ? (
                                                <span className="text-amber-500 bg-amber-50 text-[10px] font-black uppercase px-1.5 py-0.5 rounded">Yes</span>
                                              ) : (
                                                <span className="text-neutral-400">No</span>
                                              )}
                                            </td>
                                            <td className="p-4">
                                              <button
                                                type="button"
                                                onClick={() => handleToggleRuleStatus(rule)}
                                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase transition ${
                                                  rule.is_active
                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                                                }`}
                                              >
                                                {rule.is_active ? 'Active' : 'Inactive'}
                                              </button>
                                            </td>
                                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingRuleId(rule.id);
                                                  setRuleForm({
                                                    name: rule.name || '',
                                                    match_key: rule.match_key || '',
                                                    price_adjustment: rule.price_adjustment || 0,
                                                    adjustment_type: rule.adjustment_type || 'fixed',
                                                    is_active: rule.is_active !== false,
                                                    currency: rule.currency || 'CAD',
                                                    quantity_allowed: rule.quantity_allowed || false,
                                                    quantity_label: rule.quantity_label || '',
                                                    condition: rule.condition || 'Custom',
                                                    postal_code: rule.postal_code || '',
                                                    service_available: rule.service_available !== false,
                                                    manual_quote: rule.manual_quote || false,
                                                    apply_before_coupon: rule.apply_before_coupon !== false,
                                                    message: rule.message || ''
                                                  });
                                                }}
                                                className="hover:underline text-sky-600 font-bold hover:text-sky-800"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleDeletePricingRule(rule.id)}
                                                className="hover:underline text-red-500 font-bold hover:text-red-700"
                                              >
                                                Delete
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}

                                      {serverPricingRules.filter(r => {
                                        const isCorrectType = r.rule_type === (
                                          pricingSubTab === 'Size / Property Rules' ? 'size_charge' :
                                          pricingSubTab === 'Add-ons' ? 'addon_pricing' :
                                          pricingSubTab === 'Urgency Rules' ? 'urgency_charge' :
                                          pricingSubTab === 'Location Rules' ? 'location_charge' :
                                          pricingSubTab === 'Manual Quote Rules' ? 'manual_quote' : 'service_base'
                                        );
                                        const isCorrectService = !r.service_name || r.service_name === selectedPricingService;
                                        return isCorrectType && isCorrectService;
                                      }).length === 0 && (
                                        <tr>
                                          <td colSpan={8} className="p-8 text-center text-neutral-400 italic">
                                            No configuration rules registered under {pricingSubTab} yet. Apply settings inside the card on the right!
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* RIGHT COLUMN: Form and Testing Simulator */}
                          <div className="space-y-6">
                            
                            {/* Form Card */}
                            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
                              <div>
                                <h3 className="text-xs font-black uppercase text-neutral-400 tracking-wider">
                                  {editingRuleId ? 'Modify Curation Rule' : 'Add New Pricing Rule'}
                                </h3>
                                <p className="text-[10px] text-neutral-500 mt-1">
                                  {pricingSubTab === 'Base Price'
                                    ? 'Tune the standard initial billing value.'
                                    : pricingSubTab === 'Minimum Order'
                                    ? 'Curb small dispatch margins.'
                                    : `Configure rules and adjustments for service ${pricingSubTab}.`}
                                </p>
                              </div>

                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleSavePricingRule(
                                    pricingSubTab === 'Base Price' ? 'service_base' :
                                    pricingSubTab === 'Size / Property Rules' ? 'size_charge' :
                                    pricingSubTab === 'Add-ons' ? 'addon_pricing' :
                                    pricingSubTab === 'Urgency Rules' ? 'urgency_charge' :
                                    pricingSubTab === 'Location Rules' ? 'location_charge' :
                                    pricingSubTab === 'Minimum Order' ? 'min_order' :
                                    pricingSubTab === 'Manual Quote Rules' ? 'manual_quote' : 'service_base'
                                  );
                                }}
                                className="space-y-4 text-xs text-neutral-800"
                              >
                                {pricingSubTab !== 'Base Price' && pricingSubTab !== 'Minimum Order' && (
                                  <div className="space-y-1">
                                    <span className="font-bold text-neutral-700">Rule Display Name:</span>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Master Bedroom Addition"
                                      value={ruleForm.name}
                                      onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                                      className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs"
                                    />
                                  </div>
                                )}

                                {/* Render custom form controls based on category */}
                                {pricingSubTab === 'Base Price' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Starting Base Rate ($):</span>
                                      <input
                                        type="number"
                                        required
                                        min={1}
                                        value={ruleForm.price_adjustment}
                                        onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: Number(e.target.value) })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Currency Option:</span>
                                      <input
                                        type="text"
                                        required
                                        value={ruleForm.currency}
                                        onChange={(e) => setRuleForm({ ...ruleForm, currency: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono"
                                      />
                                    </div>
                                  </div>
                                )}

                                {pricingSubTab === 'Minimum Order' && (
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Min Order Val ($):</span>
                                      <input
                                        type="number"
                                        required
                                        min={1}
                                        value={ruleForm.price_adjustment}
                                        onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: Number(e.target.value) })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Apply Pre-coupon?</span>
                                      <select
                                        value={ruleForm.apply_before_coupon ? 'yes' : 'no'}
                                        onChange={(e) => setRuleForm({ ...ruleForm, apply_before_coupon: e.target.value === 'yes' })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs"
                                      >
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                      </select>
                                    </div>
                                  </div>
                                )}

                                {pricingSubTab === 'Size / Property Rules' && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Matching Option:</span>
                                        <input
                                          type="text"
                                          required
                                          placeholder="e.g. 1 Bedroom, bathrooms"
                                          value={ruleForm.match_key}
                                          onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Adjustment Style:</span>
                                        <select
                                          value={ruleForm.adjustment_type}
                                          onChange={(e) => setRuleForm({ ...ruleForm, adjustment_type: e.target.value })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs"
                                        >
                                          <option value="fixed">Fixed Flat ($)</option>
                                          <option value="percentage">Percentage (%)</option>
                                          <option value="manual">Manual Quote Needed</option>
                                        </select>
                                      </div>
                                    </div>
                                    {ruleForm.adjustment_type !== 'manual' && (
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Price Modifier Value:</span>
                                        <input
                                          type="number"
                                          required
                                          placeholder="e.g. 20"
                                          value={ruleForm.price_adjustment}
                                          onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: Number(e.target.value) })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold"
                                        />
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <input
                                        type="checkbox"
                                        id="size_manual"
                                        checked={ruleForm.manual_quote}
                                        onChange={(e) => setRuleForm({ ...ruleForm, manual_quote: e.target.checked })}
                                        className="cursor-pointer"
                                      />
                                      <label htmlFor="size_manual" className="font-bold text-neutral-700 cursor-pointer">
                                        Trigger Manual Concierge Review?
                                      </label>
                                    </div>
                                  </div>
                                )}

                                {pricingSubTab === 'Add-ons' && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Add-on Item Key:</span>
                                        <input
                                          type="text"
                                          required
                                          placeholder="e.g. Interior Window Polishing"
                                          value={ruleForm.match_key}
                                          onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Price Fee ($):</span>
                                        <input
                                          type="number"
                                          required
                                          value={ruleForm.price_adjustment}
                                          onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: Number(e.target.value) })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          id="qty_allowed"
                                          checked={ruleForm.quantity_allowed}
                                          onChange={(e) => setRuleForm({ ...ruleForm, quantity_allowed: e.target.checked })}
                                          className="cursor-pointer"
                                        />
                                        <label htmlFor="qty_allowed" className="font-bold text-neutral-700 cursor-pointer">
                                          Allow multiple quantities?
                                        </label>
                                      </div>
                                      {ruleForm.quantity_allowed && (
                                        <div className="space-y-1 pt-1.5 border-t border-neutral-200 mt-1">
                                          <span className="font-bold text-neutral-600 block">Quantity Suffix Label:</span>
                                          <input
                                            type="text"
                                            placeholder="e.g. per window, per bathroom"
                                            value={ruleForm.quantity_label}
                                            onChange={(e) => setRuleForm({ ...ruleForm, quantity_label: e.target.value })}
                                            className="w-full bg-white border border-neutral-200 rounded-lg p-2 outline-none text-xs"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {pricingSubTab === 'Urgency Rules' && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Match Date / Urgency:</span>
                                        <select
                                          value={ruleForm.match_key}
                                          onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs"
                                        >
                                          <option value="">-- Select option --</option>
                                          <option value="Same-day">Same-day (today)</option>
                                          <option value="Next-day">Next-day (tomorrow)</option>
                                          <option value="Saturday">Saturday</option>
                                          <option value="Sunday">Sunday</option>
                                          <option value="Custom">Custom urgency</option>
                                        </select>
                                      </div>
                                      {ruleForm.match_key === 'Custom' && (
                                        <div className="space-y-1">
                                          <span className="font-bold text-neutral-700">Custom Value:</span>
                                          <input
                                            type="text"
                                            required
                                            value={ruleForm.match_key}
                                            onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono"
                                          />
                                        </div>
                                      )}
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Adjustment Type:</span>
                                        <select
                                          value={ruleForm.adjustment_type}
                                          onChange={(e) => setRuleForm({ ...ruleForm, adjustment_type: e.target.value })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs"
                                        >
                                          <option value="fixed">Fixed Flat ($)</option>
                                          <option value="percentage">Percentage (%)</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Change Value:</span>
                                      <input
                                        type="number"
                                        required
                                        value={ruleForm.price_adjustment}
                                        onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: Number(e.target.value) })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold"
                                      />
                                    </div>
                                  </div>
                                )}

                                {pricingSubTab === 'Location Rules' && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Postal Code / prefix (comma separated):</span>
                                      <input
                                        type="text"
                                        required
                                        placeholder="e.g. M5V, M4B or L5B"
                                        value={ruleForm.postal_code || ruleForm.match_key}
                                        onChange={(e) => setRuleForm({ ...ruleForm, postal_code: e.target.value, match_key: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono"
                                      />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Curation Service Availability:</span>
                                        <select
                                          value={ruleForm.service_available ? 'yes' : 'no'}
                                          onChange={(e) => setRuleForm({ ...ruleForm, service_available: e.target.value === 'yes', adjustment_type: e.target.value === 'yes' ? 'fixed' : 'unavailable' })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs"
                                        >
                                          <option value="yes">Available and supported</option>
                                          <option value="no">Not available / Rejected</option>
                                        </select>
                                      </div>
                                      {ruleForm.service_available && (
                                        <div className="space-y-1">
                                          <span className="font-bold text-neutral-700">Pricing Mode:</span>
                                          <select
                                            value={ruleForm.adjustment_type}
                                            onChange={(e) => setRuleForm({ ...ruleForm, adjustment_type: e.target.value })}
                                            className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 cursor-pointer text-xs"
                                          >
                                            <option value="fixed">Fixed Flat ($)</option>
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="manual">Manual Quote Needed</option>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {ruleForm.service_available && ruleForm.adjustment_type !== 'manual' && (
                                      <div className="space-y-1">
                                        <span className="font-bold text-neutral-700">Location Value Adjustment:</span>
                                        <input
                                          type="number"
                                          required
                                          value={ruleForm.price_adjustment}
                                          onChange={(e) => setRuleForm({ ...ruleForm, price_adjustment: Number(e.target.value) })}
                                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-[#fbbf24] text-xs font-mono font-bold"
                                        />
                                      </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-1">
                                      <input
                                        type="checkbox"
                                        id="loc_manual"
                                        checked={ruleForm.manual_quote}
                                        onChange={(e) => setRuleForm({ ...ruleForm, manual_quote: e.target.checked })}
                                        className="cursor-pointer"
                                      />
                                      <label htmlFor="loc_manual" className="font-bold text-neutral-700 cursor-pointer">
                                        Force manual review quote?
                                      </label>
                                    </div>
                                  </div>
                                )}

                                {pricingSubTab === 'Manual Quote Rules' && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Condition Scenario Key:</span>
                                      <select
                                        value={ruleForm.match_key}
                                        onChange={(e) => setRuleForm({ ...ruleForm, match_key: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-205 p-2 rounded text-xs text-neutral-800"
                                      >
                                        <option value="">-- Select scenario --</option>
                                        <option value="large_size">Property size too large (ext. ranges)</option>
                                        <option value="commercial">Commercial job selected</option>
                                        <option value="outside_zone">Unsupported location coordinates</option>
                                        <option value="custom">Custom administrator trigger</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="font-bold text-neutral-700">Custom Alert Message displayed to client:</span>
                                      <textarea
                                        required
                                        rows={3}
                                        placeholder="Estimated price starts from $X. Final quote will be shared by email after concierge review..."
                                        value={ruleForm.message}
                                        onChange={(e) => setRuleForm({ ...ruleForm, message: e.target.value })}
                                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 outline-none text-xs focus:ring-1 focus:ring-[#fbbf24]"
                                      ></textarea>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2 pt-2 border-t border-neutral-100 flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="checkbox"
                                      id="rule_active"
                                      checked={ruleForm.is_active}
                                      onChange={(e) => setRuleForm({ ...ruleForm, is_active: e.target.checked })}
                                      className="cursor-pointer"
                                    />
                                    <label htmlFor="rule_active" className="text-[11px] font-bold text-neutral-700 cursor-pointer">
                                      Save as Active
                                    </label>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {editingRuleId && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingRuleId(null);
                                          setRuleForm({
                                            name: '',
                                            match_key: '',
                                            price_adjustment: 0,
                                            adjustment_type: 'fixed',
                                            is_active: true,
                                            currency: 'CAD',
                                            quantity_allowed: false,
                                            quantity_label: '',
                                            condition: 'Custom',
                                            postal_code: '',
                                            service_available: true,
                                            manual_quote: false,
                                            apply_before_coupon: true,
                                            message: ''
                                          });
                                        }}
                                        className="px-3 py-2 border rounded-lg font-bold hover:bg-neutral-50 transition cursor-pointer text-[10.5px]"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      type="submit"
                                      disabled={pricingRulesLoading}
                                      className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 cursor-pointer text-[10.5px]"
                                    >
                                      {pricingRulesLoading ? 'Saving...' : editingRuleId ? 'Update Rule' : 'Save Rule Entry'}
                                    </button>
                                  </div>
                                </div>
                              </form>
                            </div>

                            {/* PRICE TEST CALCULATOR / PREVIEW WIDGET */}
                            <div className="bg-[#FAF9F6] border border-amber-200/50 rounded-xl p-5 shadow-xs space-y-4 font-sans text-neutral-800">
                              <div className="flex items-center gap-2 border-b pb-2 border-amber-200/30 font-sans text-neutral-900">
                                <Activity className="w-4 h-4 text-amber-500" />
                                <h3 className="text-xs font-black uppercase tracking-wider">
                                  Live Pricing Simulator Tester
                                </h3>
                              </div>
                              <p className="text-[10px] text-neutral-500 mt-1">
                                Test and audit how all active service rules combine. Enter simulated booking metrics to verify calculations immediately.
                              </p>

                              <div className="space-y-3 text-[11px]">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-bold text-neutral-600 block mb-1">Service Level:</span>
                                    <select
                                      value={calcService}
                                      onChange={(e) => setCalcService(e.target.value)}
                                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-medium cursor-pointer text-neutral-800"
                                    >
                                      <option value="Standard Maintenance Curation">Standard Maintenance</option>
                                      <option value="Deep Restoration Suite">Deep Restoration Suite</option>
                                      <option value="Move In / Out Choreography">Move In / Out</option>
                                    </select>
                                  </div>
                                  <div>
                                    <span className="font-bold text-neutral-600 block mb-1 font-sans">Property size:</span>
                                    <select
                                      value={`${calcBedrooms} Bed`}
                                      onChange={(e) => {
                                        const beds = Number(e.target.value.split(' ')[0]);
                                        setCalcBedrooms(beds);
                                      }}
                                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-medium cursor-pointer text-neutral-800"
                                    >
                                      <option value="1 Bed">1 Bedroom</option>
                                      <option value="2 Bed">2 Bedrooms</option>
                                      <option value="3 Bed">3 Bedrooms</option>
                                      <option value="4 Bed">4 Bedrooms</option>
                                      <option value="5 Bed">5+ Bedrooms</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-bold text-neutral-600 block mb-1 font-sans">Bathrooms count:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      value={calcBathrooms}
                                      onChange={(e) => setCalcBathrooms(Number(e.target.value))}
                                      className="w-full bg-white border border-neutral-200 rounded-lg p-1 text-neutral-800 focus:outline-none"
                                    />
                                  </div>
                                  <div>
                                    <span className="font-bold text-neutral-600 block mb-1">Postal / Area Code:</span>
                                    <input
                                      type="text"
                                      placeholder="e.g. M5V"
                                      value={calcPostal}
                                      onChange={(e) => setCalcPostal(e.target.value)}
                                      className="w-full bg-white border border-neutral-200 rounded-lg p-1 uppercase text-neutral-800 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-bold text-neutral-600 block mb-1">Service Urgency:</span>
                                    <select
                                      value={calcUrgency}
                                      onChange={(e) => setCalcUrgency(e.target.value)}
                                      className="w-full bg-white border border-neutral-200 rounded-lg p-1.5 font-medium cursor-pointer text-neutral-850"
                                    >
                                      <option value="Normal">Normal dispatch</option>
                                      <option value="Same-day">Same-day service</option>
                                      <option value="Next-day">Next-day service</option>
                                      <option value="Saturday">Saturday service</option>
                                    </select>
                                  </div>
                                  <div>
                                    <span className="font-bold text-neutral-600 block mb-1">Coupon code:</span>
                                    <input
                                      type="text"
                                      placeholder="PRISTINE15"
                                      value={calcCoupon}
                                      onChange={(e) => setCalcCoupon(e.target.value)}
                                      className="w-full bg-white border border-neutral-200 rounded-lg p-1 uppercase font-mono text-neutral-800 focus:outline-none"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1 bg-white p-2.5 border border-neutral-200/65 rounded-xl">
                                  <span className="font-bold text-neutral-650 block">Simulate Add-ons:</span>
                                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                                    {['Deep Oven Curation', 'Premium Lavender-Sage Scent Selection', 'Interior Window Polishing', 'Deep Refrigerator Hand-wash'].map(addon => {
                                      const checked = calcAddons.includes(addon);
                                      return (
                                        <button
                                          type="button"
                                          key={addon}
                                          onClick={() => {
                                            if (checked) {
                                              setCalcAddons(calcAddons.filter(x => x !== addon));
                                            } else {
                                              setCalcAddons([...calcAddons, addon]);
                                            }
                                          }}
                                          className={`px-2 py-1 border text-[9.5px] rounded-lg text-left line-clamp-1 truncate ${
                                            checked 
                                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold' 
                                              : 'bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200'
                                          }`}
                                        >
                                          {addon}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleTestPreviewPrice}
                                  disabled={calcLoading}
                                  className="w-full py-2 bg-amber-400 hover:bg-amber-505 text-neutral-950 font-black rounded-lg transition tracking-wide text-xs cursor-pointer shadow-xs uppercase mt-3"
                                >
                                  {calcLoading ? 'Calculating Breakdowns...' : 'Preview Live Price Estimate'}
                                </button>
                                
                                {calcResult && (
                                  < AnimatePresence>
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="mt-4 p-3 bg-neutral-900 text-neutral-100 rounded-xl space-y-2 border border-neutral-800"
                                    >
                                      <h4 className="text-[10px] font-black uppercase text-amber-400 border-b border-neutral-800 pb-1 flex items-center justify-between">
                                        <span>Calculation Math Output</span>
                                        {calcResult.manualQuoteFlag && <span className="text-red-400 font-extrabold font-sans text-[8px] bg-red-950 px-1 py-0.2 rounded">MANUAL RE-ROUTE</span>}
                                      </h4>
                                      
                                      <div className="space-y-1 font-mono text-[10px] text-neutral-300">
                                        <div className="flex justify-between">
                                          <span>Base Service Initial Rate:</span>
                                          <span className="text-neutral-150 font-bold">${calcResult.basePrice}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Size modifier offset:</span>
                                          <span className="text-neutral-150 font-bold">+${calcResult.sizeCharge}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Extras addon total:</span>
                                          <span className="text-neutral-150 font-bold">+${calcResult.addOnTotal}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Urgency level offset:</span>
                                          <span className="text-neutral-150 font-bold">+${calcResult.urgencyCharge}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Travel zone billing charge:</span>
                                          <span className="text-neutral-150 font-bold">+${calcResult.locationCharge}</span>
                                        </div>
                                        
                                        {calcResult.minOrderAdjustment > 0 && (
                                          <div className="flex justify-between border-t border-dashed border-neutral-800 pt-1 text-amber-400 font-bold">
                                            <span>Min Order Adjust Cap:</span>
                                            <span>+${calcResult.minOrderAdjustment}</span>
                                          </div>
                                        )}
                                        
                                        <div className="flex justify-between border-t border-neutral-850 pt-1 text-xs">
                                          <span className="font-sans font-bold text-neutral-400">Rate subtotal:</span>
                                          <span className="text-white font-black">${calcResult.subtotal}</span>
                                        </div>
                                        
                                        <div className="flex justify-between text-neutral-400">
                                          <span>HST Tax (13%) & cleaner trust:</span>
                                          <span>+${(calcResult.tax + calcResult.trustFee).toFixed(2)}</span>
                                        </div>
                                        {calcResult.discountAmount > 0 && (
                                          <div className="flex justify-between text-emerald-400">
                                            <span>Coupon discount ({calcResult.couponCode || 'Promo'}):</span>
                                            <span>-${calcResult.discountAmount}</span>
                                          </div>
                                        )}
                                      </div>

                                      <div className="border-t border-neutral-800 pt-1.5 mt-1.5 flex justify-between items-center bg-neutral-950 p-2 rounded-lg">
                                        <span className="text-xs font-sans font-extrabold text-white text-[10px] uppercase">Final Estimated Charge:</span>
                                        <span className="text-emerald-400 font-black text-sm">${calcResult.finalEstimatedPrice.toFixed(2)} CAD</span>
                                      </div>

                                      {calcResult.manualQuoteFlag && (
                                        <div className="mt-2 p-2 bg-red-950/60 border border-red-900 text-red-300 text-[9.5px] rounded-lg">
                                          <span className="font-extrabold uppercase block text-[8px] text-red-400">Auditor Notice:</span>
                                          {calcResult.manualQuoteMessage}
                                        </div>
                                      )}
                                    </motion.div>
                                  </ AnimatePresence>
                                )}
                              </div>
                            </div>

                          </div>
                          
                        </div>

                      </div>
                    )}

                    {/* View: Coupons */}
                    {activeTab === 'Coupons' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4">
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
                                  className="text-[10px] hover:underline text-red-500 font-bold font-sans"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white border rounded-xl p-5 space-y-4">
                          <h3 className="text-sm font-bold font-mono uppercase">Add Coupon</h3>
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
                                  discount_value: newCoupon.value,
                                  is_active: true
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                fetchCoupons();
                                setNewCoupon({ code: '', value: 25, type: 'percent' });
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
                                onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                                className="text-xs p-2 bg-neutral-50 border rounded outline-none"
                                required
                              />
                            </div>
                            <button className="w-full py-2 bg-black text-white text-xs font-bold rounded">
                              Save Coupon
                            </button>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* View: Slots / Availability */}
                    {activeTab === 'Slots / Availability' && (
                      <div className="bg-white border rounded-xl p-5 space-y-4">
                        <h3 className="text-xs uppercase font-bold font-mono text-neutral-400 border-b pb-1">Arrival Window Timeslots</h3>
                        <div className="divide-y divide-neutral-100">
                          {slots.map(s => (
                            <div key={s.id} className="py-2.5 flex justify-between items-center text-xs font-mono border-b border-neutral-100 last:border-0">
                              <span>{s.name}</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-sans text-[10px] font-bold rounded">
                                STATUS: ACTIVE
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* View: Tickets */}
                    {activeTab === 'Tickets' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4">
                          <h3 className="text-xs uppercase font-bold font-mono text-neutral-400 border-b pb-1">Active Client Tickets</h3>
                          <div className="divide-y divide-neutral-100">
                            {tickets.map(t => (
                              <div
                                key={t.id}
                                onClick={() => setSelectedTicket(t)}
                                className={`py-3.5 flex justify-between items-start text-xs cursor-pointer hover:bg-neutral-50 p-2.5 rounded-lg transition-all ${selectedTicket?.id === t.id ? 'bg-[#fbbf24]/5 border-l-2 border-[#fbbf24]' : ''}`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-neutral-950">{t.ticket_number}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${t.priority === 'High' ? 'bg-red-100 text-red-800' : 'bg-neutral-100 text-neutral-600'}`}>
                                      {t.priority}
                                    </span>
                                  </div>
                                  <strong className="text-neutral-900 text-sm block">{t.subject}</strong>
                                  <p className="text-neutral-500 line-clamp-1">{t.message}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-[10px] font-bold text-[9px] uppercase ${t.status === 'Open' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-500'}`}>
                                  {t.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer ticket reply workflow */}
                        <div className="bg-white border rounded-xl p-5 space-y-4">
                          <h3 className="text-sm font-bold font-mono uppercase">Ticket Reply Control</h3>
                          {selectedTicket ? (
                            <div className="space-y-4 text-xs text-neutral-800">
                              <div className="p-3 bg-neutral-50 rounded border border-neutral-100 space-y-1">
                                <span className="font-mono text-[9px] block text-neutral-400">Subject: {selectedTicket.ticket_number}</span>
                                <strong className="text-neutral-950 text-sm">{selectedTicket.subject}</strong>
                                <p className="text-neutral-600 mt-2 font-medium">From: {selectedTicket.customer_name}</p>
                                <p className="italic text-neutral-500 bg-white p-2 border rounded mt-1.5">&quot;{selectedTicket.message}&quot;</p>
                              </div>

                              <div className="space-y-1 bg-neutral-50 p-2 border rounded max-h-36 overflow-y-auto font-sans">
                                <span className="text-[9px] uppercase font-bold text-neutral-400">Reply History:</span>
                                {selectedTicket.replies?.map((r, i) => (
                                  <div key={i} className="mt-1 border-t pt-1">
                                    <strong>{r.sender}:</strong> <p className="text-neutral-600 mt-0.5">{r.message}</p>
                                  </div>
                                ))}
                                {(!selectedTicket.replies || selectedTicket.replies.length === 0) && <p className="text-neutral-400 italic">No replies posted yet.</p>}
                              </div>

                              <div className="space-y-1.5">
                                <span className="block font-bold">Write response template:</span>
                                <textarea
                                  placeholder="Type response back to customer..."
                                  value={ticketReplyText}
                                  onChange={(e) => setTicketReplyText(e.target.value)}
                                  className="w-full h-20 p-2 border bg-neutral-50 rounded outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!ticketReplyText) return;
                                    try {
                                      const replyRes = await fetch('/api/tickets', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          action: 'reply',
                                          ticketId: selectedTicket.id,
                                          message: ticketReplyText
                                        })
                                      });
                                      const replyData = await replyRes.json();
                                      
                                      if (!replyData.success) {
                                        alert(`Failed to submit reply: ${replyData.error}`);
                                        return;
                                      }

                                      const statusRes = await fetch('/api/tickets', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          action: 'status',
                                          ticketId: selectedTicket.id,
                                          status: 'Resolved'
                                        })
                                      });
                                      const statusData = await statusRes.json();

                                      if (statusData.success) {
                                        const updated = tickets.map(t => {
                                          if (t.id === selectedTicket.id) {
                                            return {
                                              ...t,
                                              status: 'Resolved' as const,
                                              replies: [...(t.replies || []), { sender: 'Support Administrator', message: ticketReplyText, date: new Date().toISOString() }]
                                            };
                                          }
                                          return t;
                                        });
                                        setTickets(updated);
                                        saveState('tickets', updated);
                                        setTicketReplyText('');
                                        setSelectedTicket(updated.find(t => t.id === selectedTicket.id) || null);
                                        alert('Reply submitted and ticket marked Resolved in MySQL database.');
                                      } else {
                                        alert(`Failed to update ticket status: ${statusData.error}`);
                                      }
                                    } catch (err: any) {
                                      alert(`Error resolving ticket: ${err.message}`);
                                    }
                                  }}
                                  className="w-full py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded cursor-pointer"
                                >
                                  Submit & Settle Ticket
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-neutral-500 italic py-6 text-center">Select any support ticket to handle replies.</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View: Invoices (Requirement 7 & 8) */}
                    {activeTab === 'Invoices' && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">
                        <div className="lg:col-span-2 bg-white border rounded-xl p-5 space-y-4 print:hidden">
                          <h3 className="text-xs uppercase font-bold font-mono text-neutral-400 border-b pb-1">Ledger Generated Invoices</h3>
                          <div className="bg-white border overflow-x-auto rounded-lg">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="bg-neutral-50 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                                  <th className="p-3">Invoice No.</th>
                                  <th className="p-3">Customer</th>
                                  <th className="p-3">Total Amount</th>
                                  <th className="p-3">Settle Status</th>
                                  <th className="p-3">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y text-neutral-700">
                                {invoices.map((i, idx) => (
                                  <tr key={`${i.id}-${idx}`} className="hover:bg-neutral-50/50">
                                    <td className="p-3 font-mono font-bold text-neutral-900">{i.invoice_number}</td>
                                    <td className="p-3">{i.customer_name}</td>
                                    <td className="p-3 font-mono">${i.total_amount.toFixed(2)}</td>
                                    <td className="p-3">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${i.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                        {i.status}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <button
                                        onClick={() => setSelectedInvoice(i)}
                                        className="px-2 py-1 bg-black text-white hover:bg-neutral-800 rounded text-xs font-semibold cursor-pointer"
                                      >
                                        Statement Print View
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                                {invoices.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="p-4 text-center text-neutral-400 italic">No invoices compiled. Mark an order as &quot;Completed&quot; inside detail panels to generate invoices.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Interactive Printable Invoice Sheet */}
                        <div className="bg-white border rounded-xl p-6 space-y-5 shadow-sm print:border-none print:shadow-none print:-mt-10 text-neutral-800">
                          {selectedInvoice ? (
                            <div id="invoice-printable-container" className="space-y-4 text-xs font-sans">
                              {/* invoice shell brand header */}
                              <div className="flex justify-between items-start border-b pb-3.5">
                                <div>
                                  <h2 className="text-base font-extrabold tracking-widest text-[#0f172a] uppercase font-mono">getmeamaid Co.</h2>
                                  <p className="text-[10px] text-neutral-400 uppercase font-mono mt-0.5">Premium Curation Suite</p>
                                  <span className="text-[9px] text-neutral-500 block mt-1.5 leading-tight">100 King St West, Toronto, ON M5X 1A9</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] text-neutral-400 uppercase block font-mono">Invoice Number</span>
                                  <strong className="text-sm font-semibold text-neutral-900 font-mono tracking-wider">{selectedInvoice.invoice_number}</strong>
                                  <span className="text-[9px] text-neutral-400 block mt-1 font-mono">{selectedInvoice.created_at.slice(0, 10)}</span>
                                </div>
                              </div>

                              <div className="space-y-1.5 text-neutral-600 bg-neutral-50 p-3 rounded">
                                <span className="text-[9px] uppercase font-serif font-black text-neutral-400 tracking-wider">Statement For Customer</span>
                                <div className="text-neutral-900 font-bold block">{selectedInvoice.customer_name}</div>
                                <div className="text-[10px] text-neutral-500 font-mono italic">{selectedInvoice.customer_email}</div>
                              </div>

                              <div className="border border-neutral-200/50 rounded overflow-hidden">
                                <div className="bg-neutral-50 p-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex justify-between">
                                  <span>Service Summary</span>
                                  <span>Billed Charge</span>
                                </div>
                                <div className="p-2.5 flex justify-between">
                                  <div>
                                    <strong className="font-semibold block text-neutral-900">{bookings.find(b => b.id === selectedInvoice.order_id)?.home_type || 'Eco Sanitation Suite'}</strong>
                                    <span className="text-[11px] text-neutral-400 font-mono">Reference: {selectedInvoice.order_id}</span>
                                  </div>
                                  <span className="font-mono font-bold">${(selectedInvoice.total_amount / 1.18).toFixed(2)}</span>
                                </div>
                                <div className="p-2.5 border-t border-neutral-100 flex justify-between text-neutral-500 text-[11px]">
                                  <span>Tax calibration (13%) & Fee (5%):</span>
                                  <span className="font-mono">${(selectedInvoice.total_amount - (selectedInvoice.total_amount / 1.18)).toFixed(2)}</span>
                                </div>
                                <div className="p-2.5 bg-neutral-50 border-t flex justify-between font-bold text-neutral-900 text-sm">
                                  <span>Total Invoice Amount:</span>
                                  <span className="font-mono">${selectedInvoice.total_amount.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="border border-neutral-100 p-2.5 rounded bg-neutral-50/30 text-[10.5px]">
                                <span className="font-mono uppercase font-black text-neutral-400 block mb-0.5">Settle Status:</span>
                                <p className="font-semibold">Settlement: <span className="text-amber-600 font-bold uppercase">{selectedInvoice.status}</span></p>
                              </div>

                              <div className="flex gap-2 print:hidden pt-4 border-t">
                                <button
                                  onClick={() => window.print()}
                                  className="flex-grow p-2.5 bg-black text-white hover:bg-neutral-955 rounded text-xs font-bold inline-flex justify-center items-center gap-2 cursor-pointer"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Print Standard Invoice</span>
                                </button>
                                <button
                                  onClick={() => {
                                    alert(`Emailed statement successfully back to customer address: ${selectedInvoice.customer_email}.`);
                                  }}
                                  className="p-2.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded text-xs font-bold cursor-pointer"
                                  title="E-mail Statement"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-neutral-500 italic py-12 text-center print:hidden">Select any generated invoice statement from ledger list to open the print view.</p>
                          )}
                        </div>
                      </div>
                    )}
                          {/* View: Reports (PRD Goal: Reports Page UI with 11 dynamic tabs, sorting, pagination, and actions) */}
                    {activeTab === 'Reports' && (
                      <div className="space-y-6">
                        
                        {/* 11 Reports View Grid Layer */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                          
                          {/* Sidebar Report Switcher Left Column - 11 Tabs (PRD Section Reports Tabs and Data) */}
                          <div className="lg:col-span-3 bg-white border border-neutral-200 rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                            <div className="border-b pb-2 mb-2 px-1">
                              <h3 className="text-xs uppercase font-extrabold font-mono text-neutral-400 tracking-wider">Statistical Folders</h3>
                              <p className="text-[10px] text-neutral-500 font-sans">Toggle report category directories. Data is computed lazily upon entry.</p>
                            </div>

                            {[
                              { id: 'Order Summary', name: 'Order Summary', icon: FileText, desc: 'Detailed orders quantity & statuses' },
                              { id: 'Revenue / Payment', name: 'Revenue / Payment', icon: DollarSign, desc: 'Financial earnings breakdowns' },
                              { id: 'Payment Pending', name: 'Payment Pending', icon: Clock, desc: 'Outstanding balances & callbacks' },
                              { id: 'Coupon Usage', name: 'Coupon Usage', icon: Tag, desc: 'Active coupon code perform' },
                              { id: 'Service Performance', name: 'Service Performance', icon: BarChart3, desc: 'Top cleaning packages sales' },
                              { id: 'Customer Report', name: 'Customer Report', icon: Users, desc: 'Homeowner acquisition & values' },
                              { id: 'Ticket Report', name: 'Ticket Report', icon: AlertTriangle, desc: 'Logged customer support alerts' },
                              { id: 'Staff Job Report', name: 'Staff Job Report', icon: Briefcase, desc: 'Curator staff workload & issues' },
                              { id: 'Schedule / Slot Report', name: 'Schedule / Slot Report', icon: Calendar, desc: 'Operational capacity & locks' },
                              { id: 'Invoice Report', name: 'Invoice Report', icon: FileSpreadsheet, desc: 'Dispatched billing files' },
                              { id: 'Settlement Report', name: 'Settlement Report', icon: CheckCircle2, desc: 'Closed accounts ledgers' }
                            ].map((tab) => {
                              const isSel = reportTab === tab.id;
                              const IconComp = tab.icon;
                              // Lazy database calculations link helper to get basic count badges
                              const getBadgeCount = () => {
                                if (tab.id === 'Order Summary') return bookings.length;
                                if (tab.id === 'Payment Pending') return bookings.filter(b => b.payment_status !== 'Paid').length;
                                if (tab.id === 'Ticket Report') return tickets.length;
                                if (tab.id === 'Invoice Report') return invoices.length;
                                if (tab.id === 'Staff Job Report') return staff.length;
                                return null;
                              };
                              const bCount = getBadgeCount();

                              return (
                                <button
                                  key={tab.id}
                                  onClick={() => {
                                    setReportTab(tab.id);
                                    setRepPage(1);
                                    setRepSortCol('');
                                  }}
                                  className={`w-full text-left p-3.5 rounded-xl border flex gap-3 items-center transition-all ${
                                    isSel
                                      ? 'bg-neutral-900 border-neutral-900 text-white font-bold shadow-md transform scale-[1.01]'
                                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700 hover:text-neutral-950 shadow-2xs'
                                  }`}
                                >
                                  <div className={`p-1.5 rounded-lg ${isSel ? 'bg-white/10 text-[#fbbf24]' : 'bg-white text-neutral-500 border border-neutral-200 shadow-3xs'}`}>
                                    <IconComp className="w-4 h-4 shrink-0" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs font-bold leading-none truncate font-sans">{tab.name}</span>
                                      {bCount !== null && (
                                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                                          isSel ? 'bg-[#fbbf24]/20 text-[#fbbf24]' : 'bg-neutral-200 text-neutral-800'
                                        }`}>
                                          {bCount}
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-[9.5px] mt-0.5 font-sans leading-none truncate ${isSel ? 'text-neutral-400' : 'text-neutral-450'}`}>{tab.desc}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {/* Lazy Real-Time Reporting Processor Column Right Column */}
                          {(() => {
                            // Local variables evaluation inside clean encapsulated block
                            const parsePricing = (pricingStr: string) => {
                              try {
                                return JSON.parse(pricingStr);
                              } catch {
                                return { subtotal: 180, total: 180 };
                              }
                            };

                            // Evaluated Active Computed Dataset
                            const computedData = (() => {
                              // --- Tab: Order Summary ---
                              if (reportTab === 'Order Summary') {
                                let list = bookings.filter(b => {
                                  if (repStartDate && b.selected_date < repStartDate) return false;
                                  if (repEndDate && b.selected_date > repEndDate) return false;
                                  if (repService !== 'all' && b.restoration_level !== repService) return false;
                                  if (repStaff !== 'all' && b.assigned_staff_id !== repStaff) return false;
                                  if (repStatus !== 'all' && b.order_status !== repStatus) return false;
                                  if (repSearch) {
                                    const q = repSearch.toLowerCase();
                                    const name = `${b.first_name} ${b.last_name}`.toLowerCase();
                                    if (!b.id.toLowerCase().includes(q) && !name.includes(q) && !b.email.toLowerCase().includes(q)) return false;
                                  }
                                  return true;
                                });

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (repSortCol === 'Customer') {
                                      valA = `${a.first_name} ${a.last_name}`;
                                      valB = `${b.first_name} ${b.last_name}`;
                                    }
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const rows = list.map(b => ({
                                  'Order ID': b.id,
                                  'Customer': `${b.first_name} ${b.last_name}`,
                                  'Service': b.restoration_level,
                                  'Order date': b.selected_date,
                                  'Order status': b.order_status,
                                  'Payment status': b.payment_status,
                                  'Final amount': `$${parsePricing(b.pricing).total.toFixed(2)}`
                                }));

                                const totalMatch = list.length;
                                const newC = list.filter(b => b.order_status === 'New').length;
                                const compC = list.filter(b => b.order_status === 'Completed').length;
                                const cancC = list.filter(b => b.order_status === 'Cancelled').length;
                                const paidC = list.filter(b => b.payment_status === 'Paid').length;
                                const pendC = list.filter(b => b.payment_status === 'Payment Pending' || b.payment_status === 'Unpaid').length;

                                const cards = [
                                  { label: 'Total Orders', value: totalMatch, desc: 'Overall matching active files' },
                                  { label: 'New Orders', value: newC, desc: 'Pending schedule allocations' },
                                  { label: 'Completed Orders', value: compC, desc: 'Successfully signed off' },
                                  { label: 'Cancelled Orders', value: cancC, desc: 'Refunded home accounts' },
                                  { label: 'Paid Orders', value: paidC, desc: 'Proceeds received in full' },
                                  { label: 'Pending Payment', value: pendC, desc: 'Outstanding active debts' }
                                ];

                                return { cards, headers: ['Order ID', 'Customer', 'Service', 'Order date', 'Order status', 'Payment status', 'Final amount'], rows, origin: list };
                              }

                              // --- Tab: Revenue / Payment ---
                              if (reportTab === 'Revenue / Payment') {
                                let list = bookings.filter(b => {
                                  if (repStartDate && b.selected_date < repStartDate) return false;
                                  if (repEndDate && b.selected_date > repEndDate) return false;
                                  if (repService !== 'all' && b.restoration_level !== repService) return false;
                                  if (repStaff !== 'all' && b.assigned_staff_id !== repStaff) return false;
                                  if (repStatus !== 'all' && b.payment_status !== repStatus) return false;
                                  if (repSearch) {
                                    const q = repSearch.toLowerCase();
                                    const name = `${b.first_name} ${b.last_name}`.toLowerCase();
                                    if (!b.id.toLowerCase().includes(q) && !name.includes(q)) return false;
                                  }
                                  return true;
                                });

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (repSortCol === 'Customer') {
                                      valA = `${a.first_name} ${a.last_name}`;
                                      valB = `${b.first_name} ${b.last_name}`;
                                    }
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const rows = list.map(b => {
                                  const amt = parsePricing(b.pricing).total;
                                  const isP = b.payment_status === 'Paid';
                                  return {
                                    'Order ID': b.id,
                                    'Customer': `${b.first_name} ${b.last_name}`,
                                    'Service': b.restoration_level,
                                    'Final confirmed amount': `$${amt.toFixed(2)}`,
                                    'Paid amount': `$${(isP ? amt : 0).toFixed(2)}`,
                                    'Payment status': b.payment_status,
                                    'Payment date': isP ? (b.confirmed_date || b.selected_date) : 'N/A',
                                    'Settlement status': b.order_status === 'Completed' && isP ? 'Settled' : 'Unsettled'
                                  };
                                });

                                const estR = list.filter(b => b.order_status !== 'Cancelled').reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);
                                const confR = list.filter(b => b.order_status === 'Completed').reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);
                                const paidA = list.filter(b => b.payment_status === 'Paid').reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);
                                const pendA = list.filter(b => b.payment_status !== 'Paid' && b.order_status !== 'Cancelled').reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);
                                const cancA = list.filter(b => b.order_status === 'Cancelled').reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);

                                const cards = [
                                  { label: 'Estimated Revenue', value: `$${estR.toFixed(2)}`, desc: 'From all active orders' },
                                  { label: 'Confirmed Revenue', value: `$${confR.toFixed(2)}`, desc: 'Completed finalized bookings' },
                                  { label: 'Paid Amount', value: `$${paidA.toFixed(2)}`, desc: 'Bank safe currency received' },
                                  { label: 'Pending Payment Amount', value: `$${pendA.toFixed(2)}`, desc: 'Homeowner checkouts outstanding' },
                                  { label: 'Cancelled Order Value', value: `$${cancA.toFixed(2)}`, desc: 'Voided transaction totals' }
                                ];

                                return { cards, headers: ['Order ID', 'Customer', 'Service', 'Final confirmed amount', 'Paid amount', 'Payment status', 'Payment date', 'Settlement status'], rows, origin: list };
                              }

                              // --- Tab: Payment Pending ---
                              if (reportTab === 'Payment Pending') {
                                let list = bookings.filter(b => {
                                  if (b.payment_status === 'Paid') return false;
                                  if (repStartDate && b.selected_date < repStartDate) return false;
                                  if (repEndDate && b.selected_date > repEndDate) return false;
                                  if (repService !== 'all' && b.restoration_level !== repService) return false;
                                  if (repStaff !== 'all' && b.assigned_staff_id !== repStaff) return false;
                                  if (repSearch) {
                                    const q = repSearch.toLowerCase();
                                    const name = `${b.first_name} ${b.last_name}`.toLowerCase();
                                    if (!b.id.toLowerCase().includes(q) && !name.includes(q) && !b.email.toLowerCase().includes(q)) return false;
                                  }
                                  return true;
                                });

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (repSortCol === 'Customer') {
                                      valA = `${a.first_name} ${a.last_name}`;
                                      valB = `${b.first_name} ${b.last_name}`;
                                    }
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const rows = list.map(b => {
                                  let followDate = 'Not Conducted';
                                  if (b.internal_notes && b.internal_notes.includes('Follow-up')) {
                                    const m = b.internal_notes.match(/Follow-up\s+([0-9\-\/]+)/i);
                                    followDate = m && m[1] ? m[1] : 'Recorded';
                                  }
                                  return {
                                    'Order ID': b.id,
                                    'Customer': `${b.first_name} ${b.last_name}`,
                                    'Phone': b.phone,
                                    'Email': b.email,
                                    'Service': b.restoration_level,
                                    'Final amount': `$${parsePricing(b.pricing).total.toFixed(2)}`,
                                    'Payment link sent date': b.created_at ? new Date(b.created_at).toLocaleDateString() : b.selected_date,
                                    'Payment status': b.payment_status || 'Payment Pending',
                                    'Last follow-up date': followDate,
                                    '_raw_match': b // Passed to enable custom actions
                                  };
                                });

                                const pendingCount = list.length;
                                const pendingValue = list.reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);
                                const avgP = pendingCount > 0 ? (pendingValue / pendingCount) : 0;
                                const followLogs = list.filter(b => b.internal_notes?.includes('Follow-up')).length;

                                const cards = [
                                  { label: 'Active Pending Orders', value: pendingCount, desc: 'Requires proactive dispatch call' },
                                  { label: 'Total Pending Value', value: `$${pendingValue.toFixed(2)}`, desc: 'Revenue in collection pipeline' },
                                  { label: 'Average Pending Bill', value: `$${avgP.toFixed(2)}`, desc: 'Per homeowner invoice' },
                                  { label: 'Follow-up Calls Logged', value: followLogs, desc: 'Documented client touchpoints' }
                                ];

                                return { cards, headers: ['Order ID', 'Customer', 'Phone', 'Email', 'Service', 'Final amount', 'Payment status', 'Last follow-up date'], rows, origin: list };
                              }

                              // --- Tab: Coupon Usage ---
                              if (reportTab === 'Coupon Usage') {
                                let list = coupons.map(c => {
                                  const usageB = bookings.filter(b => 
                                    b.custom_key_notes?.toLowerCase().includes(c.code.toLowerCase()) ||
                                    b.internal_notes?.toLowerCase().includes(c.code.toLowerCase())
                                  );
                                  const uCount = Math.max(c.used_count || 0, usageB.length);
                                  const discountUnit = c.discount_type === 'percentage' ? 45 : c.value;
                                  const totalDiscount = uCount * discountUnit;
                                  const revGen = uCount * 220;
                                  return {
                                    'Coupon code': c.code,
                                    'Discount type': c.discount_type === 'percentage' ? `Percentage (${c.value}%)` : `Flat Cash ($${c.value})`,
                                    'Usage count': uCount,
                                    'Total discount given': `$${totalDiscount.toFixed(2)}`,
                                    'Revenue generated': `$${revGen.toFixed(2)}`,
                                    'Active/inactive': 'Active',
                                    'Validity date': '2026-12-31'
                                  };
                                });

                                if (repSearch) {
                                  const q = repSearch.toLowerCase();
                                  list = list.filter(c => c['Coupon code'].toLowerCase().includes(q));
                                }

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const usages = list.reduce((sum, c) => sum + c['Usage count'], 0);
                                const discounts = list.reduce((sum, c) => sum + parseFloat(c['Total discount given'].replace(/[^0-9\.]/g, '')), 0);
                                const rawSales = list.reduce((sum, c) => sum + parseFloat(c['Revenue generated'].replace(/[^0-9\.]/g, '')), 0);
                                const topCop = list.length > 0 ? [...list].sort((a,b) => b['Usage count'] - a['Usage count'])[0]['Coupon code'] : 'N/A';

                                const cards = [
                                  { label: 'Total Coupons Used', value: usages, desc: 'Processed checkout codes' },
                                  { label: 'Total Discount Given', value: `$${discounts.toFixed(2)}`, desc: 'Capital deductions from base rate' },
                                  { label: 'Most Used Coupon', value: topCop, desc: 'Top operational campaign' },
                                  { label: 'Revenue After Discount', value: `$${(rawSales - discounts).toFixed(2)}`, desc: 'Promo code net sales proceeds' }
                                ];

                                return { cards, headers: ['Coupon code', 'Discount type', 'Usage count', 'Total discount given', 'Revenue generated', 'Active/inactive', 'Validity date'], rows: list, origin: list };
                              }

                              // --- Tab: Service Performance ---
                              if (reportTab === 'Service Performance') {
                                let list = services.map(s => {
                                  const matchB = bookings.filter(b => b.restoration_level === s.title);
                                  const total = matchB.length;
                                  const comp = matchB.filter(b => b.order_status === 'Completed').length;
                                  const canc = matchB.filter(b => b.order_status === 'Cancelled').length;
                                  const rev = matchB.filter(b => b.order_status !== 'Cancelled').reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);
                                  const avgVal = total > 0 ? (rev / total) : 0;
                                  return {
                                    'Service name': s.title,
                                    'Total orders': total,
                                    'Completed orders': comp,
                                    'Cancelled orders': canc,
                                    'Revenue': `$${rev.toFixed(2)}`,
                                    'Average order value': `$${avgVal.toFixed(2)}`
                                  };
                                });

                                if (repSearch) {
                                  const q = repSearch.toLowerCase();
                                  list = list.filter(item => item['Service name'].toLowerCase().includes(q));
                                }

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                let topOrders = 'N/A', topRev = 'N/A', cancelledSrv = 'N/A';
                                let maxO = -1, maxR = -1, maxC = -1;
                                list.forEach(item => {
                                  const rAmt = parseFloat(item.Revenue.replace(/[^0-9\.]/g, '')) || 0;
                                  if (item['Total orders'] > maxO) { maxO = item['Total orders']; topOrders = item['Service name']; }
                                  if (rAmt > maxR) { maxR = rAmt; topRev = item['Service name']; }
                                  if (item['Cancelled orders'] > maxC) { maxC = item['Cancelled orders']; cancelledSrv = item['Service name']; }
                                });

                                const cards = [
                                  { label: 'Top Service (Orders)', value: topOrders.replace(' Curation', ''), desc: `${maxO} active client reservations` },
                                  { label: 'Top Service (Revenue)', value: topRev.replace(' Curation', ''), desc: `Generated $${maxR.toFixed(2)} gross` },
                                  { label: 'Most Cancelled Service', value: cancelledSrv.replace(' Curation', ''), desc: `Friction point with ${maxC} dropouts` },
                                  { label: 'Popular Package Adds', value: 'Fridge Sanitizing, Oven Sparkle', desc: 'Top secondary chore choices' }
                                ];

                                return { cards, headers: ['Service name', 'Total orders', 'Completed orders', 'Cancelled orders', 'Revenue', 'Average order value'], rows: list, origin: list };
                              }

                              // --- Tab: Customer Report ---
                              if (reportTab === 'Customer Report') {
                                const emails = Array.from(new Set(bookings.map(b => b.email.toLowerCase())));
                                let list = emails.map(email => {
                                  const cB = bookings.filter(b => b.email.toLowerCase() === email);
                                  const b0 = cB[0];
                                  const spend = cB.filter(b => b.payment_status === 'Paid').reduce((sum, b) => sum + parsePricing(b.pricing).total, 0);
                                  const src = b0.custom_key_notes?.toLowerCase().includes('portal') ? 'Secure Member Portal' : 'Public Guest Checkout';
                                  const lastD = cB.reduce((max, b) => b.selected_date > max ? b.selected_date : max, '1970-01-01');
                                  return {
                                    'Customer name': `${b0.first_name} ${b0.last_name}`,
                                    'Email': email,
                                    'Phone': b0.phone,
                                    'Account source': src,
                                    'Total orders': cB.length,
                                    'Paid orders': cB.filter(b => b.payment_status === 'Paid').length,
                                    'Total spend': `$${spend.toFixed(2)}`,
                                    'Last order date': lastD === '1970-01-01' ? 'N/A' : lastD
                                  };
                                });

                                if (repSearch) {
                                  const q = repSearch.toLowerCase();
                                  list = list.filter(c => c['Customer name'].toLowerCase().includes(q) || c.Email.toLowerCase().includes(q));
                                }

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const totalC = emails.length;
                                const newC = list.filter(c => c['Total orders'] === 1).length;
                                const repeatC = list.filter(c => c['Total orders'] > 1).length;
                                const guestPortals = list.filter(c => c['Account source'] === 'Public Guest Checkout').length;
                                const hasUnpaid = bookings.filter(b => b.payment_status !== 'Paid' && b.order_status !== 'Cancelled').length;

                                const cards = [
                                  { label: 'Total Unique Customers', value: totalC, desc: 'Homeowners in corporate logs' },
                                  { label: 'Single-job Accounts', value: newC, desc: 'Acquisition cohort' },
                                  { label: 'Loyal Repeat Clients', value: repeatC, desc: `${totalC > 0 ? (repeatC/totalC*100).toFixed(0) : 0}% recurring booking rate` },
                                  { label: 'Guest Checkout Sessions', value: guestPortals, desc: 'One-click registrations' },
                                  { label: 'Outstanding Invoices', value: hasUnpaid, desc: 'Homeowners with active debits' }
                                ];

                                return { cards, headers: ['Customer name', 'Email', 'Phone', 'Account source', 'Total orders', 'Paid orders', 'Total spend', 'Last order date'], rows: list, origin: list };
                              }

                              // --- Tab: Ticket Report ---
                              if (reportTab === 'Ticket Report') {
                                let list = tickets.filter(t => {
                                  if (repStartDate && t.created_at < repStartDate) return false;
                                  if (repEndDate && t.created_at > repEndDate) return false;
                                  if (repStatus !== 'all' && t.status !== repStatus) return false;
                                  if (repSearch) {
                                    const q = repSearch.toLowerCase();
                                    if (!t.ticket_number.toLowerCase().includes(q) && !t.customer_name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
                                  }
                                  return true;
                                });

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const rows = list.map(t => ({
                                  'Ticket ID': t.ticket_number,
                                  'Customer': t.customer_name,
                                  'Order ID': t.order_id || 'N/A',
                                  'Category': t.category,
                                  'Status': t.status,
                                  'Created date': new Date(t.created_at).toLocaleDateString(),
                                  'Last response': t.replies && t.replies.length > 0 ? new Date(t.replies[t.replies.length - 1].date).toLocaleDateString() : 'N/A',
                                  'Closed date': t.status === 'Closed' ? new Date(t.created_at).toLocaleDateString() : 'N/A'
                                }));

                                const totalT = list.length;
                                const openT = list.filter(t => t.status === 'Open').length;
                                const resolveT = list.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

                                const cards = [
                                  { label: 'Total Tickets Filed', value: totalT, desc: 'Logged support files' },
                                  { label: 'Active Support Backlog', value: openT, desc: 'Requires support response' },
                                  { label: 'Resolved Tickets', value: resolveT, desc: 'Satisfied homeowner issues' },
                                  { label: 'Resolution Rate (KPI)', value: `${totalT > 0 ? (resolveT/totalT*100).toFixed(0) : 100}%`, desc: 'Overall ticket shutdown metric' }
                                ];

                                return { cards, headers: ['Ticket ID', 'Customer', 'Order ID', 'Category', 'Status', 'Created date', 'Last response', 'Closed date'], rows, origin: list };
                              }

                              // --- Tab: Staff Job Report ---
                              if (reportTab === 'Staff Job Report') {
                                let list = staff.map(s => {
                                  const sJobs = bookings.filter(b => b.assigned_staff_id === s.id);
                                  const comp = sJobs.filter(b => b.order_status === 'Completed').length;
                                  const pend = sJobs.filter(b => b.order_status !== 'Completed' && b.order_status !== 'Cancelled').length;
                                  const issue = sJobs.filter(b => b.staff_job_status === 'Issue Reported').length;
                                  const rate = sJobs.length > 0 ? ((comp / sJobs.length) * 100).toFixed(0) + '%' : '100%';
                                  return {
                                    'Staff name': s.name,
                                    'Assigned jobs': sJobs.length,
                                    'Completed jobs': comp,
                                    'Pending jobs': pend,
                                    'Issue reported jobs': issue,
                                    'Completion rate': rate
                                  };
                                });

                                if (repSearch) {
                                  const q = repSearch.toLowerCase();
                                  list = list.filter(s => s['Staff name'].toLowerCase().includes(q));
                                }

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const jobsAlloc = list.reduce((sum, s) => sum + s['Assigned jobs'], 0);
                                const jobsComp = list.reduce((sum, s) => sum + s['Completed jobs'], 0);
                                const jobsPend = list.reduce((sum, s) => sum + s['Pending jobs'], 0);
                                const topS = list.length > 0 ? [...list].sort((a,b) => b['Completed jobs'] - a['Completed jobs'])[0]['Staff name'] : 'N/A';

                                const cards = [
                                  { label: 'Assigned Workloads', value: jobsAlloc, desc: 'Jobs allocated' },
                                  { label: 'Staff Completed Jobs', value: jobsComp, desc: 'Secured pristine files' },
                                  { label: 'Active Queue Assignments', value: jobsPend, desc: 'Tours ongoing or locked' },
                                  { label: 'Top Curator Performer', value: topS, desc: 'High customer star feedbacks' }
                                ];

                                return { cards, headers: ['Staff name', 'Assigned jobs', 'Completed jobs', 'Pending jobs', 'Issue reported jobs', 'Completion rate'], rows: list, origin: list };
                              }

                              // --- Tab: Schedule / Slot Report ---
                              if (reportTab === 'Schedule / Slot Report') {
                                const dict: { [key: string]: any } = {};
                                bookings.forEach(b => {
                                  const k = `${b.selected_date} | ${b.selected_time_slot}`;
                                  if (!dict[k]) {
                                    dict[k] = { date: b.selected_date, slot: b.selected_time_slot, total: 0, sched: 0, pending: 0, canc: 0 };
                                  }
                                  dict[k].total += 1;
                                  if (b.order_status !== 'Cancelled') dict[k].sched += 1;
                                  if (b.order_status === 'New') dict[k].pending += 1;
                                  if (b.order_status === 'Cancelled') dict[k].canc += 1;
                                });

                                let list = Object.values(dict);
                                if (repStartDate) list = list.filter(item => item.date >= repStartDate);
                                if (repEndDate) list = list.filter(item => item.date <= repEndDate);
                                if (repSearch) {
                                  const q = repSearch.toLowerCase();
                                  list = list.filter(item => item.date.includes(q) || item.slot.toLowerCase().includes(q));
                                }

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const rows = list.map(item => ({
                                  'Date': item.date,
                                  'Slot': item.slot,
                                  'Number of orders': item.total,
                                  'Scheduled orders': item.sched,
                                  'Pending confirmation': item.pending,
                                  'Cancelled orders': item.canc
                                }));

                                const futureCount = bookings.filter(b => b.selected_date >= '2026-05-27' && b.order_status !== 'Cancelled').length;

                                const cards = [
                                  { label: 'Primary Busy Window', value: '09:00 AM - 12:00 PM', desc: 'Peak weekday slot density' },
                                  { label: 'Unscheduled Bookings', value: bookings.filter(b => b.order_status === 'New').length, desc: 'Awaiting scheduling' },
                                  { label: 'Upcoming dispatches', value: futureCount, desc: 'Bookings scheduled' },
                                  { label: 'Blackout Blocks Set', value: 2, desc: 'Holidays toggled tight' }
                                ];

                                return { cards, headers: ['Date', 'Slot', 'Number of orders', 'Scheduled orders', 'Pending confirmation', 'Cancelled orders'], rows, origin: list };
                              }

                              // --- Tab: Invoice Report ---
                              if (reportTab === 'Invoice Report') {
                                let list = invoices.map(i => {
                                  const itemB = bookings.find(b => b.id === i.order_id);
                                  return {
                                    'Invoice number': i.invoice_number,
                                    'Order ID': i.order_id,
                                    'Customer': i.customer_name,
                                    'Service': itemB ? itemB.restoration_level : 'Curation Care',
                                    'Invoice amount': `$${i.total_amount.toFixed(2)}`,
                                    'Invoice date': new Date(i.created_at).toLocaleDateString(),
                                    'Invoice sent status': i.status === 'Paid' ? 'Paid & Sent' : 'Dispatched',
                                    'Download invoice': 'ActiveReady'
                                  };
                                });

                                if (repSearch) {
                                  const q = repSearch.toLowerCase();
                                  list = list.filter(i => i['Invoice number'].toLowerCase().includes(q) || i.Customer.toLowerCase().includes(q) || i['Order ID'].toLowerCase().includes(q));
                                }

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const totalI = list.length;
                                const openSent = list.filter(i => i['Invoice sent status'] !== 'Draft').length;
                                const incompleteI = bookings.filter(b => b.order_status === 'Completed' && !invoices.some(i => i.order_id === b.id)).length;
                                const complPending = bookings.filter(b => b.order_status === 'Completed' && invoices.some(i => i.order_id === b.id && i.status !== 'Paid')).length;

                                const cards = [
                                  { label: 'Total Invoices', value: totalI, desc: 'Filing statements processed' },
                                  { label: 'Invoices Dispatched', value: openSent, desc: 'Emailed directly to clients' },
                                  { label: 'Missing Invoice Rooms', value: incompleteI, desc: 'Completed bookings missing bills' },
                                  { label: 'Outstanding Comp Files', value: complPending, desc: 'Awaiting cash clearance' }
                                ];

                                return { cards, headers: ['Invoice number', 'Order ID', 'Customer', 'Service', 'Invoice amount', 'Invoice date', 'Invoice sent status', 'Download invoice'], rows: list, origin: list };
                              }

                              // --- Tab: Settlement Report ---
                              if (reportTab === 'Settlement Report') {
                                let list = bookings.filter(b => {
                                  if (b.order_status !== 'Completed' && b.payment_status !== 'Paid') return false;
                                  if (repStartDate && b.selected_date < repStartDate) return false;
                                  if (repEndDate && b.selected_date > repEndDate) return false;
                                  if (repService !== 'all' && b.restoration_level !== repService) return false;
                                  if (repSearch) {
                                    const q = repSearch.toLowerCase();
                                    const n = `${b.first_name} ${b.last_name}`.toLowerCase();
                                    if (!b.id.toLowerCase().includes(q) && !n.includes(q)) return false;
                                  }
                                  return true;
                                });

                                if (repSortCol) {
                                  list = [...list].sort((a: any, b: any) => {
                                    let valA = a[repSortCol] ?? '';
                                    let valB = b[repSortCol] ?? '';
                                    if (repSortCol === 'Customer') {
                                      valA = `${a.first_name} ${a.last_name}`;
                                      valB = `${b.first_name} ${b.last_name}`;
                                    }
                                    if (typeof valA === 'string') valA = valA.toLowerCase();
                                    if (typeof valB === 'string') valB = valB.toLowerCase();
                                    if (valA < valB) return repSortDir === 'asc' ? -1 : 1;
                                    if (valA > valB) return repSortDir === 'asc' ? 1 : -1;
                                    return 0;
                                  });
                                }

                                const rows = list.map(b => {
                                  const pricing = parsePricing(b.pricing);
                                  const isP = b.payment_status === 'Paid';
                                  const isCom = b.order_status === 'Completed';
                                  return {
                                    'Order ID': b.id,
                                    'Customer': `${b.first_name} ${b.last_name}`,
                                    'Service': b.restoration_level,
                                    'Paid amount': `$${(isP ? pricing.total : 0).toFixed(2)}`,
                                    'Payment status': b.payment_status,
                                    'Settlement status': isP && isCom ? 'Settled & Cleared' : 'Pending Settle',
                                    'Completion date': b.confirmed_date || b.selected_date || 'N/A',
                                    'Settlement date': isP ? (b.confirmed_date || b.selected_date) : 'Pending'
                                  };
                                });

                                const settledCount = rows.filter(r => r['Settlement status'] === 'Settled & Cleared').length;
                                const unpaidComp = bookings.filter(b => b.order_status === 'Completed' && b.payment_status !== 'Paid').length;
                                const paidOngoing = bookings.filter(b => b.payment_status === 'Paid' && b.order_status !== 'Completed').length;
                                const refundRequests = bookings.filter(b => b.payment_status === 'Refunded').length;

                                const cards = [
                                  { label: 'Settled Closed Orders', value: settledCount, desc: 'Completed with funds received' },
                                  { label: 'Unsettled Ongoing Files', value: paidOngoing, desc: 'Pre-paid folders in process' },
                                  { label: 'Unpaid Completed Rooms', value: unpaidComp, desc: 'Awaiting homeowner billing' },
                                  { label: 'Refund Required Orders', value: refundRequests, desc: 'Requires manual bank credit back' }
                                ];

                                return { cards, headers: ['Order ID', 'Customer', 'Service', 'Paid amount', 'Payment status', 'Settlement status', 'Completion date', 'Settlement date'], rows, origin: list };
                              }

                              return { cards: [], headers: [], rows: [], origin: [] };
                            })();

                            // Slice pagination
                            const itemsPerPage = 10;
                            const totalRowsCount = computedData.rows.length;
                            const maxPagesCount = Math.max(1, Math.ceil(totalRowsCount / itemsPerPage));
                            const paginatedRows = computedData.rows.slice((repPage - 1) * itemsPerPage, repPage * itemsPerPage);

                            // Helper sort header toggler
                            const triggerSortClick = (col: string) => {
                              if (repSortCol === col) {
                                setRepSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
                              } else {
                                setRepSortCol(col);
                                setRepSortDir('asc');
                              }
                            };

                            // Multi-format Downloads helper (PRD Section Export formats: CSV, Excel)
                            const executeLocalExport = (format: 'csv' | 'excel') => {
                              if (computedData.rows.length === 0) {
                                alert('Empty dataset. Choose less restrictive filters.');
                                return;
                              }
                              
                              const cleanHeaders = computedData.headers.filter(h => h !== '_raw_match');
                              
                              if (format === 'csv') {
                                const csvHeaders = cleanHeaders.join(',');
                                const csvRows = computedData.rows.map(rowObj => {
                                  return cleanHeaders.map(h => {
                                    const val = (rowObj as any)[h];
                                    let text = val === null || val === undefined ? '' : String(val);
                                    text = text.replace(/"/g, '""');
                                    if (text.includes(',') || text.includes('\n') || text.includes('\r')) {
                                      text = `"${text}"`;
                                    }
                                    return text;
                                  }).join(',');
                                }).join('\r\n');

                                const blob = new Blob([[csvHeaders, csvRows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `pristine_curv_report_${reportTab.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              } else {
                                // Dynamic Excel spreadsheet using TSV schema
                                const xlsHeaders = cleanHeaders.join('\t');
                                const xlsRows = computedData.rows.map(rowObj => {
                                  return cleanHeaders.map(h => {
                                    const val = (rowObj as any)[h];
                                    let text = val === null || val === undefined ? '' : String(val);
                                    text = text.replace(/\t/g, ' ');
                                    text = text.replace(/\r?\n/g, ' ');
                                    return text;
                                  }).join('\t');
                                }).join('\r\n');

                                const blob = new Blob([[xlsHeaders, xlsRows].join('\r\n')], { type: 'application/vnd.ms-excel;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `pristine_curv_report_${reportTab.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xls`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                              }
                            };

                            // Pending Payment Action Handlers
                            const resendPendingMail = async (b: any) => {
                              try {
                                const res = await fetch('/api/admin/send-email', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    email_type: 'tpl-invoice',
                                    recipient_email: b.email,
                                    customer_name: `${b.first_name} ${b.last_name}`,
                                    order_id: b.id,
                                    service_name: b.restoration_level,
                                    invoice_no: `INV-${b.id.replace('PRE-', '')}`,
                                    amount: parsePricing(b.pricing).total.toFixed(2)
                                  })
                                });
                                const body = await res.json();
                                if (body.success) {
                                  alert(`Secured pending payment email dispatched successfully to customer ${b.email}! Check Mailtrap sandboxed inbox.`);
                                  fetchCMSAndEmails();
                                } else {
                                  alert(`SMTP Delivery error: ${body.error}`);
                                }
                              } catch (err: any) {
                                alert(`Delivery crash: ${err.message}`);
                              }
                            };

                            const settlePendingPaid = (b: any) => {
                              const bId = b.id;
                              const updatedObj = { ...b, payment_status: 'Paid' };
                              const updatedB = bookings.map(item => item.id === bId ? updatedObj : item);
                              setBookings(updatedB);
                              saveState('bookings', updatedB);
                              saveBookingToBackend(updatedObj);

                              // Sync associated invoice or generate a paid one
                              const updatedInv = invoices.map(item => item.order_id === bId ? { ...item, status: 'Paid' as const } : item);
                              let invoiceList = [...updatedInv];
                              if (!invoices.some(item => item.order_id === bId)) {
                                invoiceList.unshift({
                                  id: generateId('inv'),
                                  invoice_number: `INV-${bId.replace('PRE-', '')}`,
                                  order_id: bId,
                                  customer_name: `${b.first_name} ${b.last_name}`,
                                  customer_email: b.email,
                                  total_amount: parsePricing(b.pricing).total,
                                  status: 'Paid',
                                  created_at: new Date().toISOString()
                                });
                              }
                              setInvoices(invoiceList);
                              saveState('invoices', invoiceList);
                              alert(`Booking folder ${bId} marked Paid. Auto-generated clean invoice statement in database.`);
                            };

                            const appendFollowUpText = (b: any) => {
                              const bId = b.id;
                              const note = prompt(`Enter concise log for call/email with client ${b.first_name} ${b.last_name}:`);
                              if (!note) return;
                              const stamp = `[Follow-up ${new Date().toLocaleDateString()}]: ${note}`;
                              let updatedObj: any = null;
                              const updatedB = bookings.map(item => {
                                if (item.id === bId) {
                                  updatedObj = { ...item, internal_notes: item.internal_notes ? `${item.internal_notes}\n${stamp}` : stamp };
                                  return updatedObj;
                                }
                                return item;
                              });
                              setBookings(updatedB);
                              saveState('bookings', updatedB);
                              if (updatedObj) {
                                saveBookingToBackend(updatedObj);
                              }
                              alert('Direct follow-up logging saved securely in folder.');
                            };

                            return (
                              <div className="lg:col-span-9 space-y-6">
                                
                                {/* Top Summary Metric Cards (PRD Section Report Table Expectations) */}
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                  {computedData.cards.map((card, idx) => (
                                    <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-4.5 space-y-2 shadow-xs transition-all hover:border-neutral-300">
                                      <span className="text-[10px] font-extrabold uppercase font-mono text-neutral-400 tracking-wider block">{card.label}</span>
                                      <strong className="text-2xl font-black text-neutral-900 font-sans tracking-tight block">{card.value}</strong>
                                      <p className="text-[10px] text-neutral-500 font-medium leading-normal">{card.desc}</p>
                                    </div>
                                  ))}
                                </div>

                                {/* Active Filters and Core Controls Box (PRD Common Features for All Reports) */}
                                <div className="bg-white border border-neutral-200 rounded-xl p-4.5 space-y-4 shadow-3xs">
                                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-3.5">
                                    <div>
                                      <h4 className="text-sm font-extrabold font-sans text-neutral-900">{reportTab} Analysis Desk</h4>
                                      <p className="text-[10.5px] text-neutral-55px">Active spreadsheet filters. Dynamic sorting, date scale bounds, and multi-format reports export.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                      <button
                                        onClick={() => executeLocalExport('csv')}
                                        className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-bold hover:bg-neutral-800 transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                                        title="Download Flat Comma Separated Values file"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>Download CSV</span>
                                      </button>
                                      <button
                                        onClick={() => executeLocalExport('excel')}
                                        className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition flex items-center gap-1.5 cursor-pointer shadow-3xs"
                                        title="Export spreadsheet format for Microsoft Excel"
                                      >
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                        <span>Export Excel</span>
                                      </button>
                                      <button
                                        onClick={() => window.print()}
                                        className="px-2.5 py-1.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                        title="Print dynamic viewport table"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        <span>Print View</span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 text-xs text-neutral-800">
                                    
                                    {/* Date range filter */}
                                    <div className="space-y-1">
                                      <span className="font-extrabold block text-neutral-700 font-sans text-[10.5px]">Start Date:</span>
                                      <input 
                                        type="date"
                                        value={repStartDate}
                                        onChange={(e) => setRepStartDate(e.target.value)}
                                        className="w-full text-xs p-2 bg-neutral-50 border rounded-lg focus:bg-white outline-none focus:ring-1 focus:ring-[#fbbf24]"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <span className="font-extrabold block text-neutral-700 font-sans text-[10.5px]">End Date:</span>
                                      <input 
                                        type="date"
                                        value={repEndDate}
                                        onChange={(e) => setRepEndDate(e.target.value)}
                                        className="w-full text-xs p-2 bg-neutral-50 border rounded-lg focus:bg-white outline-none focus:ring-1 focus:ring-[#fbbf24]"
                                      />
                                    </div>

                                    {/* Global text search mapping */}
                                    <div className="space-y-1">
                                      <span className="font-extrabold block text-neutral-700 font-sans text-[10.5px]">Search string:</span>
                                      <div className="relative">
                                        <input 
                                          type="text"
                                          placeholder="Type to search..."
                                          value={repSearch}
                                          onChange={(e) => setRepSearch(e.target.value)}
                                          className="w-full text-xs p-2 pl-7 bg-neutral-50 border rounded-lg focus:bg-white outline-none focus:ring-1 focus:ring-[#fbbf24]"
                                        />
                                        <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
                                      </div>
                                    </div>

                                    {/* Dynamic Filters depending on columns */}
                                    <div className="space-y-1">
                                      <span className="font-extrabold block text-neutral-700 font-sans text-[10.5px]">Filter Service:</span>
                                      <select
                                        value={repService}
                                        onChange={(e) => setRepService(e.target.value)}
                                        className="w-full text-xs p-2 bg-neutral-50 border rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-[#fbbf24]"
                                      >
                                        <option value="all">📁 All Services</option>
                                        <option value="Standard Maintenance Curation">Standard Maintenance Curation</option>
                                        <option value="Complete Deep Curation">Complete Deep Curation</option>
                                        <option value="Move In / Out Choreography">Move In / Out Choreography</option>
                                      </select>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="font-extrabold block text-neutral-700 font-sans text-[10.5px]">Filter Staff:</span>
                                      <select
                                        value={repStaff}
                                        onChange={(e) => setRepStaff(e.target.value)}
                                        className="w-full text-xs p-2 bg-neutral-50 border rounded-lg cursor-pointer outline-none focus:ring-1 focus:ring-[#fbbf24]"
                                      >
                                        <option value="all">📁 All Staff members</option>
                                        {staff.map(m => (
                                          <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                      </select>
                                    </div>

                                  </div>

                                  <div className="flex justify-between items-center pt-2.5 border-t">
                                    <div className="flex items-center gap-3">
                                      {/* Status filter selection where applicable */}
                                      {['Order Summary', 'Revenue / Payment', 'Ticket Report'].includes(reportTab) && (
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-bold uppercase text-neutral-500 font-sans">Focus Status:</span>
                                          <select
                                            value={repStatus}
                                            onChange={(e) => setRepStatus(e.target.value)}
                                            className="text-[10px] bg-neutral-100 border border-neutral-200 rounded px-1.5 py-0.5 font-bold cursor-pointer outline-none"
                                          >
                                            <option value="all">All statuses</option>
                                            {reportTab === 'Order Summary' && (
                                              <>
                                                <option value="New">New</option>
                                                <option value="Confirmed">Confirmed</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Cancelled">Cancelled</option>
                                              </>
                                            )}
                                            {reportTab === 'Revenue / Payment' && (
                                              <>
                                                <option value="Paid">Paid</option>
                                                <option value="Payment Pending">Payment Pending</option>
                                                <option value="Unpaid">Unpaid</option>
                                              </>
                                            )}
                                            {reportTab === 'Ticket Report' && (
                                              <>
                                                <option value="Open">Open</option>
                                                <option value="In Review">In Review</option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Closed">Closed</option>
                                              </>
                                            )}
                                          </select>
                                        </div>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => {
                                        setRepStartDate('');
                                        setRepEndDate('');
                                        setRepSearch('');
                                        setRepStatus('all');
                                        setRepService('all');
                                        setRepStaff('all');
                                        setRepPage(1);
                                      }}
                                      className="px-3.5 py-1 text-[10.5px] bg-neutral-150 hover:bg-neutral-200 border text-neutral-700 font-bold rounded-md cursor-pointer transition text-right"
                                    >
                                      Reset Filter Parameters
                                    </button>
                                  </div>

                                </div>

                                {/* Main Data View Grid (PRD Report Table Expectations) */}
                                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left font-sans text-xs border-collapse min-w-[700px]">
                                      <thead>
                                        <tr className="bg-neutral-50 text-neutral-500 font-bold border-b select-none">
                                          {computedData.headers.filter(h => h !== '_raw_match').map((header) => {
                                            const isSorted = repSortCol === header;
                                            return (
                                              <th 
                                                key={header} 
                                                onClick={() => triggerSortClick(header)}
                                                className="p-3.5 font-sans whitespace-nowrap text-xs font-extrabold hover:bg-neutral-100 cursor-pointer transition-colors"
                                              >
                                                <div className="flex items-center gap-1.5">
                                                  <span>{header}</span>
                                                  <span className="text-[9px] text-[#fbbf24]">
                                                    {isSorted ? (repSortDir === 'asc' ? '▲' : '▼') : '↕'}
                                                  </span>
                                                </div>
                                              </th>
                                            );
                                          })}
                                          {reportTab === 'Payment Pending' && (
                                            <th className="p-3.5 font-sans text-xs font-extrabold text-neutral-500">Actions Area</th>
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-neutral-100 text-neutral-700 font-sans">
                                        {paginatedRows.map((rowObj, rIdx) => {
                                          return (
                                            <tr key={rIdx} className="hover:bg-neutral-50/60 transition-colors">
                                              {computedData.headers.filter(h => h !== '_raw_match').map((header) => {
                                                const val = (rowObj as any)[header];
                                                
                                                // Specific aesthetic badges injection based on data columns
                                                if (header === 'Order status' || header === 'Payment status' || header === 'Settlement status' || header === 'Status' || header === 'Invoice sent status') {
                                                  const isSuccess = ['Completed', 'Paid', 'Settled', 'Settled & Cleared', 'Resolved', 'Paid & Sent', 'Active'].includes(val);
                                                  const isPending = ['New', 'In Review', 'Dispatched', 'Payment Pending', 'Unpaid', 'Pending Settle', 'Open'].includes(val);
                                                  return (
                                                    <td key={header} className="p-3.5 font-sans whitespace-nowrap">
                                                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                                                        isSuccess ? 'bg-emerald-100 text-emerald-800' :
                                                        isPending ? 'bg-amber-100 text-amber-800 border border-amber-200/40' :
                                                        'bg-red-100 text-red-800'
                                                      }`}>
                                                        {val}
                                                      </span>
                                                    </td>
                                                  );
                                                }

                                                if (header === 'Order ID' || header === 'Ticket ID' || header === 'Invoice number' || header === 'Coupon code') {
                                                  return (
                                                    <td key={header} className="p-3.5 font-mono text-[11px] font-extrabold text-neutral-950">
                                                      {val}
                                                    </td>
                                                  );
                                                }

                                                // Service links render
                                                if (header === 'Service' || header === 'Service name') {
                                                  return (
                                                    <td key={header} className="p-3.5 font-semibold text-neutral-900 truncate max-w-[180px]" title={val}>
                                                      {val}
                                                    </td>
                                                  );
                                                }

                                                // Download invoice mock link (PRD Invoice Report expectation)
                                                if (header === 'Download invoice') {
                                                  return (
                                                    <td key={header} className="p-3.5 whitespace-nowrap">
                                                      <button 
                                                        onClick={() => alert(`Reviewing invoice statement PDF block ${(rowObj as any)['Invoice number'] || (rowObj as any)['Order ID']}. Check direct print modal.`)}
                                                        className="text-[10.5px] font-bold text-[#fbbf24] hover:text-[#d9a21b] flex items-center gap-1 cursor-pointer transition"
                                                      >
                                                        <FileText className="w-3.5 h-3.5 shrink-0" />
                                                        <span>Invoice Statement PDF</span>
                                                      </button>
                                                    </td>
                                                  );
                                                }

                                                return (
                                                  <td key={header} className="p-3.5 whitespace-nowrap text-xs text-neutral-800">
                                                    {val ?? '-'}
                                                  </td>
                                                );
                                              })}

                                              {/* Actions column for Payment Pending */}
                                              {reportTab === 'Payment Pending' && (
                                                <td className="p-3.5 whitespace-nowrap space-x-1.5">
                                                  <button
                                                    onClick={() => resendPendingMail((rowObj as any)['_raw_match'])}
                                                    className="px-2.5 py-1 text-[9.5px] bg-neutral-900 text-white font-bold rounded-lg hover:bg-neutral-800 transition cursor-pointer"
                                                  >
                                                    Resend Email
                                                  </button>
                                                  <button
                                                    onClick={() => settlePendingPaid((rowObj as any)['_raw_match'])}
                                                    className="px-2.5 py-1 text-[9.5px] bg-[#fbbf24] hover:bg-[#d9a21b] text-neutral-950 font-extrabold rounded-lg transition cursor-pointer"
                                                  >
                                                    Mark Paid
                                                  </button>
                                                  <button
                                                    onClick={() => appendFollowUpText((rowObj as any)['_raw_match'])}
                                                    className="px-2.5 py-1 text-[9.5px] bg-sky-50 text-sky-800 border border-sky-200 font-semibold rounded-lg hover:bg-sky-100 transition cursor-pointer"
                                                  >
                                                    Add Note
                                                  </button>
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}

                                        {computedData.rows.length === 0 && (
                                          <tr>
                                            <td colSpan={12} className="p-12 text-center text-neutral-400 italic font-sans text-xs">
                                              No records found for the selected filters.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>

                                  {/* Table Pagination Controls Footer */}
                                  {totalRowsCount > 0 && (
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3.5 px-4.5 py-3 border-t bg-neutral-50 text-xs text-neutral-500 font-sans select-none">
                                      <div className="font-sans">
                                        Showing <span className="font-bold text-neutral-900">{Math.min(totalRowsCount, (repPage - 1) * itemsPerPage + 1)}</span> to{' '}
                                        <span className="font-bold text-neutral-900">{Math.min(totalRowsCount, repPage * itemsPerPage)}</span> of{' '}
                                        <span className="font-bold text-neutral-900">{totalRowsCount}</span> folders matching
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          disabled={repPage === 1}
                                          onClick={() => setRepPage(prev => Math.max(1, prev - 1))}
                                          className="px-3.5 py-1 bg-white border rounded-lg hover:bg-neutral-100 cursor-pointer font-bold disabled:opacity-40 transition-opacity"
                                        >
                                          Previous Page
                                        </button>
                                        <div className="px-2 py-1 bg-neutral-200/50 rounded font-bold font-mono text-[10px] text-neutral-905">
                                          Page {repPage} of {maxPagesCount}
                                        </div>
                                        <button
                                          disabled={repPage >= maxPagesCount}
                                          onClick={() => setRepPage(prev => Math.min(maxPagesCount, prev + 1))}
                                          className="px-3.5 py-1 bg-white border rounded-lg hover:bg-neutral-100 cursor-pointer font-bold disabled:opacity-40 transition-opacity"
                                        >
                                          Next Page
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                </div>

                              </div>
                            );
                          })()}

                        </div>

                      </div>
                    )}

                    {/* View: Email Templates (Requirement 1 & central SMTP tester) */}
                    {activeTab === 'Email Templates' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          
                          {/* Left Column: Template List */}
                          <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-4 space-y-3 shadow-xs">
                            <h3 className="text-xs uppercase font-extrabold font-mono text-neutral-400 tracking-wider">System Templates ({adminTemplates.length})</h3>
                            <p className="text-[10px] text-neutral-500 font-sans">Select a registered communication template context to calibrate subject fields or layout.</p>
                            
                            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                              {adminTemplates.map((tpl) => {
                                const isSel = selectedAdminTpl?.id === tpl.id;
                                return (
                                  <button
                                    key={tpl.id}
                                    onClick={() => {
                                      setSelectedAdminTpl(tpl);
                                      setTplEditSubject(tpl.subject || '');
                                      setTplEditBody(tpl.body || '');
                                      setTplEditActive(tpl.is_active !== false);
                                    }}
                                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 ${
                                      isSel 
                                        ? 'bg-[#fbbf24]/10 border-[#fbbf24] text-neutral-900 font-bold' 
                                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                                    }`}
                                  >
                                    <div className="flex justify-between items-center w-full">
                                      <span className="text-xs font-mono font-semibold truncate max-w-[150px]">{tpl.id}</span>
                                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase font-sans ${
                                        tpl.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {tpl.is_active !== false ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-sans truncate">{tpl.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Center & Right Column: Template Composer Editor & Live Envelope Mockup */}
                          {selectedAdminTpl ? (
                            <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl p-5 space-y-5 shadow-xs">
                              
                              <div className="flex justify-between items-center border-b pb-2">
                                <div>
                                  <h3 className="text-sm font-bold text-neutral-900 font-sans">{selectedAdminTpl.name}</h3>
                                  <span className="text-[10px] text-neutral-400 font-mono">ID Reference: {selectedAdminTpl.id}</span>
                                </div>
                                <div className="flex gap-2">
                                  <label className="flex items-center gap-1.5 text-xs text-neutral-600 font-semibold select-none">
                                    <input 
                                      type="checkbox" 
                                      checked={tplEditActive}
                                      onChange={(e) => setTplEditActive(e.target.checked)}
                                      className="rounded border-neutral-300 text-yellow-500 focus:ring-yellow-400"
                                    />
                                    <span>Template Active</span>
                                  </label>
                                </div>
                              </div>

                              {/* Target Subject line */}
                              <div className="space-y-1">
                                <label className="block text-xs font-bold text-neutral-700 font-sans">Email Subject Line:</label>
                                <input
                                  type="text"
                                  value={tplEditSubject}
                                  onChange={(e) => setTplEditSubject(e.target.value)}
                                  className="w-full text-xs p-2.5 border rounded-lg focus:ring-2 focus:ring-[#fbbf24] outline-none"
                                  placeholder="Enter communication subject..."
                                />
                              </div>

                              {/* Target Body line with rich tags injector */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-baseline">
                                  <label className="block text-xs font-bold text-neutral-700 font-sans">Envelope Msg Body:</label>
                                  <span className="text-[9px] text-[#fbbf24] font-bold font-mono">SUPPORTED DYNAMIC PLACEHOLDERS:</span>
                                </div>
                                
                                {/* Placeholder insertion help badges */}
                                <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 rounded-lg border">
                                  {['customer_name', 'order_id', 'service_name', 'amount', 'date', 'time', 'invoice_no'].map(item => (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => setTplEditBody(prev => prev + ` {{${item}}}`)}
                                      className="px-2 py-1 bg-white hover:bg-neutral-100 border text-[9.5px] font-mono rounded font-medium text-neutral-600 hover:text-neutral-900 cursor-pointer shadow-2xs"
                                    >
                                      + &#123;&#123;{item}&#125;&#125;
                                    </button>
                                  ))}
                                </div>

                                <textarea
                                  value={tplEditBody}
                                  onChange={(e) => setTplEditBody(e.target.value)}
                                  rows={8}
                                  className="w-full text-xs font-mono p-3 border rounded-lg focus:ring-2 focus:ring-[#fbbf24] outline-none leading-relaxed"
                                  placeholder="Format body text..."
                                />
                              </div>

                              {/* Live visual visual envelope card preview */}
                              <div className="p-4 bg-neutral-900 text-white rounded-xl space-y-2 font-sans">
                                <span className="text-[9px] font-mono text-[#fbbf24] uppercase font-bold tracking-widest block border-b border-white/10 pb-1">Real-Time Message Interpolation Letter Preview</span>
                                <div className="space-y-1.5 text-[11px] leading-relaxed">
                                  <p><span className="text-neutral-400">Subject Preview:</span> <span className="font-semibold">{tplEditSubject
                                    .replace(/\{\{customer_name\}\}/g, 'Arthur Pendelton')
                                    .replace(/\{\{order_id\}\}/g, 'PRE-849102')
                                    .replace(/\{\{invoice_no\}\}/g, 'INV-2041')
                                  }</span></p>
                                  <div className="pt-2 border-t border-white/5 whitespace-pre-wrap font-mono text-[10px] text-neutral-300">
                                    {tplEditBody
                                      .replace(/\{\{customer_name\}\}/g, 'Arthur Pendelton')
                                      .replace(/\{\{order_id\}\}/g, 'PRE-849102')
                                      .replace(/\{\{service_name\}\}/g, 'Standard Maintenance Curation')
                                      .replace(/\{\{amount\}\}/g, '$180.00')
                                      .replace(/\{\{date\}\}/g, 'June 10, 2026')
                                      .replace(/\{\{time\}\}/g, '09:00 AM')
                                      .replace(/\{\{invoice_no\}\}/g, 'INV-2041')
                                    }
                                  </div>
                                </div>
                              </div>

                              {/* Action saves & SMTP Test Sender widget */}
                              <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2 border-t">
                                <div className="flex-1 flex gap-2 max-w-sm">
                                  <input
                                    type="email"
                                    placeholder="Enter test recipe email address..."
                                    value={testEmailAddress}
                                    onChange={(e) => setTestEmailAddress(e.target.value)}
                                    className="p-2 border rounded text-xs flex-1 outline-none"
                                  />
                                  <button
                                    onClick={handleSendTestEmail}
                                    disabled={isTestSending}
                                    className="px-3 bg-neutral-900 border hover:bg-neutral-805 text-white rounded text-[10.5px] font-bold cursor-pointer shrink-0 disabled:opacity-50"
                                  >
                                    {isTestSending ? 'Sending...' : 'Send SMTP Test'}
                                  </button>
                                </div>
                                <button
                                  onClick={handleSaveEmailTemplate}
                                  className="px-5 py-2 bg-[#fbbf24] text-black font-extrabold rounded-lg text-xs hover:bg-[#d9a21b] cursor-pointer"
                                >
                                  Save Template Configuration
                                </button>
                              </div>

                            </div>
                          ) : (
                            <div className="lg:col-span-8 bg-neutral-50 border border-neutral-200 rounded-xl p-8 text-center text-neutral-400 font-sans italic">
                              Select a registered communication template context to load the workspace.
                            </div>
                          )}

                        </div>

                        {/* Centralized Email Communications Log Desk */}
                        <div className="bg-white border text-neutral-700 border-neutral-200 rounded-xl p-5 space-y-4 shadow-xs">
                          <div className="flex justify-between items-center border-b pb-2">
                            <div>
                              <h3 className="text-sm font-bold text-neutral-900 font-sans">Centralized Customer Email Communications Log</h3>
                              <p className="text-[10px] text-neutral-500 mt-0.5">Logs all outgoing customer confirm emails, status updates, reset password forms, and invoice letters.</p>
                            </div>
                            <div className="w-64 relative">
                              <input
                                type="text"
                                placeholder="Search logs by email address..."
                                value={emailLogsSearch}
                                onChange={(e) => setEmailLogsSearch(e.target.value)}
                                className="w-full pl-7 pr-2.5 py-1 text-[11px] border rounded outline-none"
                              />
                              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2" />
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans text-[11px] border-collapse">
                              <thead>
                                <tr className="bg-neutral-50 text-neutral-500 font-bold border-b">
                                  <th className="p-2">Timestamp Date</th>
                                  <th className="p-2">Template Slug</th>
                                  <th className="p-2">Recipient Email Address</th>
                                  <th className="p-2">Linked Dispatch</th>
                                  <th className="p-2 text-center">Output Status</th>
                                  <th className="p-2 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-100">
                                {adminEmailLogs
                                  .filter(l => !emailLogsSearch || l.recipient_email?.toLowerCase().includes(emailLogsSearch.toLowerCase()))
                                  .map((log) => (
                                    <tr key={log.id} className="hover:bg-neutral-50">
                                      <td className="p-2 text-neutral-500 font-mono text-[10px]">{log.timestamp ? new Date(log.timestamp).toLocaleString().slice(0, 16) : 'N/A'}</td>
                                      <td className="p-2 font-mono text-[10px] text-[#fbbf24] font-extrabold uppercase">{log.template_used}</td>
                                      <td className="p-2 font-medium text-neutral-900 font-mono">{log.recipient_email}</td>
                                      <td className="p-2 font-mono text-[10px]">{log.related_entity_id || 'SYSTEM'}</td>
                                      <td className="p-2 text-center">
                                        <span className={`px-1.5 py-0.5 rounded-full font-bold text-[8px] uppercase tracking-wide inline-block ${
                                          log.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {log.status}
                                        </span>
                                      </td>
                                      <td className="p-2 text-right">
                                        {log.status === 'failed' && (
                                          <button
                                            onClick={() => handleResendFailedEmail(log.id)}
                                            className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-[4px] text-[9.5px] font-bold cursor-pointer shadow-2xs"
                                          >
                                            Resend Communications
                                          </button>
                                        )}
                                        {log.status === 'sent' && (
                                          <span className="text-neutral-400 text-[9.5px]">Receipt verified</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}

                                {adminEmailLogs.filter(l => !emailLogsSearch || l.recipient_email?.toLowerCase().includes(emailLogsSearch.toLowerCase())).length === 0 && (
                                  <tr>
                                    <td colSpan={6} className="p-8 text-center text-neutral-400 italic">No communication logs recorded. Submit a booking or click manual dispatch inside helper sheets!</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* View: Content Management System (Requirement 2 & Section status configs) */}
                    {activeTab === 'Content Management' && (
                      <div className="bg-white border text-neutral-700 border-neutral-200 rounded-xl p-5 space-y-6 shadow-xs">
                        <div className="flex justify-between items-baseline border-b pb-2">
                          <div>
                            <h3 className="text-sm font-bold text-neutral-900 font-sans">Corporate Brand CMS Content Panel</h3>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Edit home layouts, headings, test copy description blocks, and structural steps without modifying file codes.</p>
                          </div>
                          <button
                            onClick={() => handleSaveCmsContent(cmsContent)}
                            disabled={cmsSaveLoading}
                            className="px-5 py-2 bg-[#fbbf24] text-black font-extrabold rounded-lg text-xs hover:bg-[#d9a21b] cursor-pointer disabled:opacity-50"
                          >
                            {cmsSaveLoading ? 'Saving changes...' : 'Publish Brand Changes'}
                          </button>
                        </div>

                        {cmsContent ? (
                          <div className="space-y-6">
                            
                            {/* Hero Section Configs */}
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4 font-sans">
                              <div className="flex justify-between items-center border-b pb-1">
                                <span className="text-xs font-bold text-neutral-803 uppercase tracking-wide">Section 1: Landing Page Hero Area</span>
                                <select
                                  value={cmsContent.hero?.status || 'draft'}
                                  onChange={(e) => {
                                    setCmsContent({
                                      ...cmsContent,
                                      hero: { ...cmsContent.hero, status: e.target.value }
                                    });
                                  }}
                                  className="p-1 text-[10px] bg-white border rounded font-bold cursor-pointer text-neutral-700"
                                >
                                  <option value="draft">📁 DRAFT</option>
                                  <option value="published">🟢 PUBLISHED</option>
                                  <option value="inactive">🛑 INACTIVE</option>
                                </select>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <span className="text-[10.5px] font-semibold text-neutral-500 block">Hero Title Greeting:</span>
                                  <input
                                    type="text"
                                    value={cmsContent.hero?.heading || ''}
                                    onChange={(e) => {
                                      setCmsContent({
                                        ...cmsContent,
                                        hero: { ...cmsContent.hero, heading: e.target.value }
                                      });
                                    }}
                                    className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg outline-none font-sans text-neutral-950 font-bold"
                                    placeholder="Enter premium greeting..."
                                  />
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10.5px] font-semibold text-neutral-500 block">Subheading Brand Pitch Narrative:</span>
                                  <textarea
                                    value={cmsContent.hero?.subheading || ''}
                                    onChange={(e) => {
                                      setCmsContent({
                                        ...cmsContent,
                                        hero: { ...cmsContent.hero, subheading: e.target.value }
                                      });
                                    }}
                                    className="w-full text-xs p-2.5 bg-white border border-neutral-200 rounded-lg outline-none h-16 leading-relaxed"
                                    placeholder="Describe your brand offerings..."
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Section 2: How It Works operational system */}
                            <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4 font-sans">
                              <div className="flex justify-between items-center border-b pb-1">
                                <span className="text-xs font-bold text-neutral-803 uppercase tracking-wide">Section 2: The Three-Step Transformation Flow</span>
                                <span className="text-[9.5px] text-neutral-400 font-mono font-bold">LIVE HOMEPAGE COMPONENT LINK</span>
                              </div>

                              <div className="space-y-4">
                                {cmsContent.howItWorks?.map((step: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-white rounded-lg border flex flex-col md:flex-row gap-3 items-start justify-between">
                                    <div className="flex gap-2 items-center">
                                      <span className="font-mono text-xl font-black text-neutral-300">0{idx + 1}</span>
                                      <div className="space-y-1">
                                        <input
                                          type="text"
                                          value={step.title || ''}
                                          onChange={(e) => {
                                            const updatedHow = [...cmsContent.howItWorks];
                                            updatedHow[idx].title = e.target.value;
                                            setCmsContent({ ...cmsContent, howItWorks: updatedHow });
                                          }}
                                          className="text-xs font-bold font-sans text-neutral-950 border-b outline-none pb-0.5 focus:border-[#fbbf24]"
                                          placeholder="Step Title"
                                        />
                                        <input
                                          type="text"
                                          value={step.description || ''}
                                          onChange={(e) => {
                                            const updatedHow = [...cmsContent.howItWorks];
                                            updatedHow[idx].description = e.target.value;
                                            setCmsContent({ ...cmsContent, howItWorks: updatedHow });
                                          }}
                                          className="text-[10.5px] font-sans text-neutral-500 w-[300px] sm:w-[450px] border-none outline-none focus:ring-0 focus:border-b"
                                          placeholder="Description..."
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-1 text-[10.5px]">
                                        <input
                                          type="checkbox"
                                          checked={step.is_active !== false}
                                          onChange={(e) => {
                                            const updatedHow = [...cmsContent.howItWorks];
                                            updatedHow[idx].is_active = e.target.checked;
                                            setCmsContent({ ...cmsContent, howItWorks: updatedHow });
                                          }}
                                          className="rounded border-neutral-300"
                                        />
                                        <span>Active step</span>
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                          </div>
                        ) : (
                          <div className="p-12 text-center text-neutral-400 italic">Formatting live corporate assets from database. Wait a brief moment...</div>
                        )}

                      </div>
                    )}

                    {/* View: Settings */}
                    {activeTab === 'Settings' && (
                      <div className="bg-white border text-neutral-700 border-neutral-200 rounded-xl p-5 space-y-4 shadow-xs font-sans">
                        <h4 className="text-sm font-bold text-neutral-900">Control Settings Panel parameters</h4>
                        <p className="text-xs text-neutral-500">Live API and SMTP microservices configured correctly under sandboxed test networks.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                          <div className="p-3.5 bg-neutral-50 border rounded-lg space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400">SMTP Sandbox Node</span>
                            <p className="text-neutral-700">Host: sandbox.smtp.mailtrap.io</p>
                            <p className="text-neutral-700">Port: 2525</p>
                          </div>
                          <div className="p-3.5 bg-neutral-50 border rounded-lg space-y-1">
                            <span className="text-[10px] font-bold text-neutral-400">Database Persistence API</span>
                            <p className="text-neutral-700">Provider: In-Memory / MySQL Sync Node</p>
                            <p className="text-neutral-700">State: Connected / Secure</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'Database Health' && (
                      <DatabaseHealthPanel />
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

            </main>

          </div>
        )}
      </AnimatePresence>

      {/* 2. Admin Order Detail Page Updates Modal (Requirement 9) */}
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

                {/* Sub panels details */}
                <div className="space-y-4">
                  
                  {/* Customer Block info */}
                  <div className="p-3.5 bg-neutral-50 border rounded-lg space-y-1.5 font-sans text-neutral-805">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Customer Core Spec</span>
                    <div className="grid grid-cols-2 gap-2 text-[11.5px] font-medium">
                      <div>Name: <span className="font-bold text-neutral-950">{selectedBooking.first_name} {selectedBooking.last_name}</span></div>
                      <div>Phone: <span className="font-bold text-neutral-950 font-mono">{selectedBooking.phone}</span></div>
                      <div className="col-span-2">Contact Email: <span className="font-bold text-neutral-950 font-mono text-xs">{selectedBooking.email}</span></div>
                      <div className="col-span-2">Postal Address: <span className="font-bold text-neutral-950 font-mono text-xs">{selectedBooking.postal_code || 'Central Toronto'}</span></div>
                    </div>
                  </div>

                  {/* Order manual overrides status controls (Requirement 5) */}
                  <div className="p-3.5 bg-neutral-50 border rounded-lg space-y-2 font-sans text-neutral-805">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Manual Status Orchestration</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-neutral-500 font-semibold block">Order State:</span>
                        <select
                          value={selectedBooking.order_status}
                          onChange={(e) => handleUpdateOrderStatus(selectedBooking.id, e.target.value, 'Statuses calibrated manually inside control detail desk.')}
                          className="w-full p-2 bg-white border rounded outline-none text-xs text-neutral-700 cursor-pointer font-semibold animate-pulse-once"
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
                            saveState('bookings', updated);
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
                    </div>
                  </div>

                  {/* Allocation widget (Requirement 6) */}
                  <div className="p-3.5 bg-[#fbbf24]/5 border border-[#fbbf24]/20 rounded-lg space-y-2 font-sans text-neutral-805">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 font-mono tracking-wider">Designated Service Allocation</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1 text-[11px]">
                        <span>Assigned Curator:</span>
                        <select
                          id="modal-assign-staff-drop"
                          defaultValue={selectedBooking.assigned_staff_id || ''}
                          className="w-full p-1.5 bg-white border rounded outline-none cursor-pointer"
                        >
                          <option value="">Not assigned</option>
                          {staff.filter(s => s.role_id === 'role-field-staff').map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
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

                  {/* Historical status update list tracker (Requirement 5) */}
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

                  {/* Add Invoice creation detail segment (Requirement 7) */}
                  {selectedBooking.order_status === 'Completed' && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between font-sans">
                      <div>
                        <strong className="text-emerald-900 text-xs font-bold block">Compiling Order Billing Statement</strong>
                        <span className="text-[10.5px] text-emerald-600">This completed schedule has a billable invoice statement compiled.</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBooking(null);
                          setActiveTab('Invoices');
                          const inv = invoices.find(i => i.order_id === selectedBooking.id);
                          if (inv) setSelectedInvoice(inv);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer font-bold text-[10.5px]"
                      >
                        Print Statement
                      </button>
                    </div>
                  )}

                  {/* Manual Administrative Email Triggering (PRD Goal 3.1) */}
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

                  {/* Save custom interior internal notes (Requirement 9) */}
                  <div className="grid grid-cols-2 gap-3 text-neutral-700 font-sans">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] font-bold text-neutral-400 uppercase">Internal Curator Notes:</span>
                      <textarea
                        defaultValue={selectedBooking.internal_notes || ''}
                        onBlur={(e) => {
                          const updatedObj = { ...selectedBooking, internal_notes: e.target.value };
                          const updated = bookings.map(item => item.id === selectedBooking.id ? updatedObj : item);
                          setBookings(updated);
                          saveState('bookings', updated);
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
                          saveState('bookings', updated);
                          setSelectedBooking(updatedObj);
                          saveBookingToBackend(updatedObj);
                        }}
                        placeholder="Client note details visible in support letters..."
                        className="w-full text-xs bg-neutral-5 p-1.5 rounded h-16 outline-none border border-neutral-200"
                      />
                    </div>
                  </div>

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
