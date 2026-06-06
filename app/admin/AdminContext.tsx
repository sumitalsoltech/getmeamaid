'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Admin tab slug mapping — keeps URLs clean and bookmarkable
export const TAB_SLUG: Record<string, string> = {
  'Dashboard':           'dashboard',
  'Orders / Bookings':   'orders',
  'Assigned Job':        'assigned-job',
  'Users / Customers':   'customers',
  'Staff Management':    'staff',
  'Roles & Permissions': 'roles',
  'Services':            'services',
  'Pricing Rules':       'pricing',
  'Coupons':             'coupons',
  'Slots / Availability':'slots',
  'Tickets':             'tickets',
  'Invoices':            'invoices',
  'Reports':             'reports',
  'Email Templates':     'emails',
  'Content Management':  'cms',
  'Settings':            'settings',
  'Database Health':     'database',
};

export const SLUG_TAB: Record<string, string> = Object.fromEntries(
  Object.entries(TAB_SLUG).map(([k, v]) => [v, k])
);

export function generateId(prefix: string): string {
  return `${prefix}-${Math.floor(Math.random() * 1000000)}`;
}

export const PERMISSION_SECTIONS: {
  title: string;
  permKey: string;
  permissions: { key: string; label: string }[];
}[] = [
  {
    title: "Dashboard",
    permKey: "view_dashboard",
    permissions: [
      { key: "view_dashboard", label: "View Dashboard & Analytics" }
    ]
  },
  {
    title: "Orders / Bookings",
    permKey: "view_orders",
    permissions: [
      { key: "view_orders", label: "View Bookings" },
      { key: "edit_orders", label: "Edit Bookings" },
      { key: "update_order_status", label: "Update Status" }
    ]
  },
  {
    title: "Assigned Job",
    permKey: "view_staff_jobs",
    permissions: [
      { key: "view_staff_jobs", label: "View Assigned Job Board" }
    ]
  },
  {
    title: "Users / Customers",
    permKey: "view_customers",
    permissions: [
      { key: "view_customers", label: "View Client Directory" }
    ]
  },
  {
    title: "Staff Management",
    permKey: "manage_staff",
    permissions: [
      { key: "manage_staff", label: "Manage Staff Accounts" }
    ]
  },
  {
    title: "Roles & Permissions",
    permKey: "manage_roles",
    permissions: [
      { key: "manage_roles", label: "Manage Roles & Security" }
    ]
  },
  {
    title: "Services",
    permKey: "manage_services",
    permissions: [
      { key: "manage_services", label: "Manage Curation Services" }
    ]
  },
  {
    title: "Pricing Rules",
    permKey: "manage_pricing",
    permissions: [
      { key: "manage_pricing", label: "Manage Pricing Rules" }
    ]
  },
  {
    title: "Coupons",
    permKey: "manage_coupons",
    permissions: [
      { key: "manage_coupons", label: "Manage Promo Coupons" }
    ]
  },
  {
    title: "Slots / Availability",
    permKey: "view_slots",
    permissions: [
      { key: "view_slots", label: "Manage Slots & Scheduling" }
    ]
  },
  {
    title: "Tickets",
    permKey: "manage_tickets",
    permissions: [
      { key: "manage_tickets", label: "Manage Support Tickets" }
    ]
  },
  {
    title: "Invoices",
    permKey: "download_invoices",
    permissions: [
      { key: "download_invoices", label: "View & Download Invoices" }
    ]
  },
  {
    title: "Reports",
    permKey: "view_reports",
    permissions: [
      { key: "view_reports", label: "View Performance Reports" }
    ]
  },
  {
    title: "Email Templates",
    permKey: "manage_email_templates",
    permissions: [
      { key: "manage_email_templates", label: "Manage Email Templates" }
    ]
  },
  {
    title: "Content Management",
    permKey: "manage_cms",
    permissions: [
      { key: "manage_cms", label: "Manage CMS Content" }
    ]
  },
  {
    title: "Settings",
    permKey: "manage_settings",
    permissions: [
      { key: "manage_settings", label: "Manage System Settings" }
    ]
  },
  {
    title: "Database Health",
    permKey: "manage_settings",
    permissions: [
      { key: "manage_settings", label: "Monitor Database Health" }
    ]
  }
];

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  is_active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role_id: string;
  is_active: boolean;
}

export interface Booking {
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
  addons?: string;
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

export interface StatusHistory {
  id: string;
  order_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  note: string;
  created_at: string;
}

export interface Ticket {
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

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: 'Unpaid' | 'Paid' | 'Refunded';
  created_at: string;
}

interface AdminContextProps {
  // Authentication & System State
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  currentUser: any;
  setCurrentUser: (val: any) => void;
  authEmail: string;
  setAuthEmail: (val: string) => void;
  authPassword: string;
  setAuthPassword: (val: string) => void;
  isAuthLoading: boolean;
  authError: string;
  setAuthError: (val: string) => void;
  currentRole: string;
  setCurrentRole: (val: string) => void;
  actingStaffId: string;
  setActingStaffId: (val: string) => void;
  activeTab: string;
  setActiveTab: (val: string) => void;
  drawerTab: 'view' | 'edit';
  setDrawerTab: (val: 'view' | 'edit') => void;
  navigateTo: (tabName: string) => void;
  switchSimulatedRole: (roleId: string) => void;
  hasPermission: (moduleName: string) => boolean;

  // Data State
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  staff: Staff[];
  setStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
  history: StatusHistory[];
  setHistory: React.Dispatch<React.SetStateAction<StatusHistory[]>>;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  slots: any[];
  setSlots: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  pricingRules: any[];
  setPricingRules: React.Dispatch<React.SetStateAction<any[]>>;
  coupons: any[];
  setCoupons: React.Dispatch<React.SetStateAction<any[]>>;
  cmsContent: any;
  setCmsContent: (val: any) => void;
  cmsSaveLoading: boolean;
  serverPricingRules: any[];
  setServerPricingRules: React.Dispatch<React.SetStateAction<any[]>>;
  allPricingMappings: any[];
  setAllPricingMappings: React.Dispatch<React.SetStateAction<any[]>>;

  // Selections
  selectedBooking: Booking | null;
  setSelectedBooking: (b: Booking | null) => void;
  selectedTicket: Ticket | null;
  setSelectedTicket: (t: Ticket | null) => void;
  selectedInvoice: Invoice | null;
  setSelectedInvoice: (i: Invoice | null) => void;

  // Filters
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  ticketReplyText: string;
  setTicketReplyText: (val: string) => void;
  serviceDateFilter: string;
  setServiceDateFilter: (val: string) => void;
  serviceTypeFilter: string;
  setServiceTypeFilter: (val: string) => void;
  serviceLocationFilter: string;
  setServiceLocationFilter: (val: string) => void;

  // Email Templates & SMTP
  adminTemplates: any[];
  setAdminTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  adminEmailLogs: any[];
  setAdminEmailLogs: React.Dispatch<React.SetStateAction<any[]>>;
  selectedAdminTpl: any;
  setSelectedAdminTpl: (val: any) => void;
  tplEditSubject: string;
  setTplEditSubject: (val: string) => void;
  tplEditBody: string;
  setTplEditBody: (val: string) => void;
  tplEditActive: boolean;
  setTplEditActive: (val: boolean) => void;
  testEmailAddress: string;
  setTestEmailAddress: (val: string) => void;
  isTestSending: boolean;
  setIsTestSending: (val: boolean) => void;
  emailLogsSearch: string;
  setEmailLogsSearch: (val: string) => void;

  // Reports Page UI
  reportTab: string;
  setReportTab: (val: string) => void;
  repStartDate: string;
  setRepStartDate: (val: string) => void;
  repEndDate: string;
  setRepEndDate: (val: string) => void;
  repSearch: string;
  setRepSearch: (val: string) => void;
  repStatus: string;
  setRepStatus: (val: string) => void;
  repService: string;
  setRepService: (val: string) => void;
  repStaff: string;
  setRepStaff: (val: string) => void;
  repPage: number;
  setRepPage: (val: number) => void;
  repSortCol: string;
  setRepSortCol: (val: string) => void;
  repSortDir: 'asc' | 'desc';
  setRepSortDir: (val: 'asc' | 'desc') => void;

  // Services CMS Drawer States
  isServiceDrawerOpen: boolean;
  setIsServiceDrawerOpen: (val: boolean) => void;
  editingService: any | null;
  setEditingService: (val: any | null) => void;
  serviceLinkedRules: any[];
  setServiceLinkedRules: React.Dispatch<React.SetStateAction<any[]>>;
  isAddRuleModalOpen: boolean;
  setIsAddRuleModalOpen: (val: boolean) => void;

  // Service Form Inputs
  serviceFormTitle: string;
  setServiceFormTitle: (val: string) => void;
  serviceFormSlug: string;
  setServiceFormSlug: (val: string) => void;
  serviceFormDesc: string;
  setServiceFormDesc: (val: string) => void;
  serviceFormFullDesc: string;
  setServiceFormFullDesc: (val: string) => void;
  serviceFormImage: string;
  setServiceFormImage: (val: string) => void;
  serviceFormBasePrice: number | '';
  setServiceFormBasePrice: (val: number | '') => void;
  serviceFormDisplayOrder: number | '';
  setServiceFormDisplayOrder: (val: number | '') => void;
  serviceFormIsFeatured: boolean;
  setServiceFormIsFeatured: (val: boolean) => void;
  serviceFormIsActive: boolean;
  setServiceFormIsActive: (val: boolean) => void;
  serviceFormIsInstantPricing: boolean;
  setServiceFormIsInstantPricing: (val: boolean) => void;
  serviceFormIsManualQuote: boolean;
  setServiceFormIsManualQuote: (val: boolean) => void;
  serviceFormIncluded: string[];
  setServiceFormIncluded: (val: string[]) => void;
  serviceFormExcluded: string[];
  setServiceFormExcluded: (val: string[]) => void;
  serviceFormFAQs: Array<{q: string, a: string}>;
  setServiceFormFAQs: (val: Array<{q: string, a: string}>) => void;
  serviceFormNotes: string;
  setServiceFormNotes: (val: string) => void;

  // Pricing Rules
  pricingRulesLoading: boolean;
  editingRuleId: string | null;
  setEditingRuleId: (val: string | null) => void;
  selectedPricingService: string;
  setSelectedPricingService: (val: string) => void;
  pricingSubTab: string;
  setPricingSubTab: (val: string) => void;
  pricingSearch: string;
  setPricingSearch: (val: string) => void;
  pricingStatusFilter: string;
  setPricingStatusFilter: (val: string) => void;
  pricingSortCol: string;
  setPricingSortCol: (val: string) => void;
  pricingSortDir: 'asc' | 'desc';
  setPricingSortDir: (val: 'asc' | 'desc') => void;
  ruleForm: any;
  setRuleForm: React.Dispatch<React.SetStateAction<any>>;

  // Test Pricing Simulator / Calculator
  calcService: string;
  setCalcService: (val: string) => void;
  calcBedrooms: number;
  setCalcBedrooms: (val: number) => void;
  calcBathrooms: number | '';
  setCalcBathrooms: (val: number | '') => void;
  calcSqFt: string;
  setCalcSqFt: (val: string) => void;
  calcAddons: string[];
  setCalcAddons: React.Dispatch<React.SetStateAction<string[]>>;
  calcUrgency: string;
  setCalcUrgency: (val: string) => void;
  calcPostal: string;
  setCalcPostal: (val: string) => void;
  calcHomeType: string;
  setCalcHomeType: (val: string) => void;
  calcCoupon: string;
  setCalcCoupon: (val: string) => void;
  calcResult: any;
  setCalcResult: (val: any) => void;
  calcLoading: boolean;
  setCalcLoading: (val: boolean) => void;

  // Creation / Edit Dialog Mocks
  newStaff: { name: string; email: string; phone: string; role_id: string; password?: string };
  setNewStaff: React.Dispatch<React.SetStateAction<{ name: string; email: string; phone: string; role_id: string; password?: string }>>;
  editingStaffId: string | null;
  setEditingStaffId: (val: string | null) => void;
  isStaffModalOpen: boolean;
  setIsStaffModalOpen: (val: boolean) => void;
  staffSearchQuery: string;
  setStaffSearchQuery: (val: string) => void;
  newRole: { name: string; permissions: string[] };
  setNewRole: React.Dispatch<React.SetStateAction<{ name: string; permissions: string[] }>>;
  isRoleModalOpen: boolean;
  setIsRoleModalOpen: (val: boolean) => void;
  editingRoleId: string | null;
  setEditingRoleId: (val: string | null) => void;
  newCoupon: any;
  setNewCoupon: React.Dispatch<React.SetStateAction<any>>;
  newRule: { name: string; value: number; type: string; rule_type: string };
  setNewRule: React.Dispatch<React.SetStateAction<{ name: string; value: number; type: string; rule_type: string }>>;

  // Fetch / Mutate handlers
  fetchServices: () => Promise<void>;
  fetchCoupons: () => Promise<void>;
  fetchCMSAndEmails: () => Promise<void>;
  fetchMappings: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchTickets: () => Promise<void>;
  fetchSlots: () => Promise<void>;
  fetchBookingHistory: (bookingId: string) => Promise<void>;
  fetchBookingsAPI: () => Promise<void>;
  fetchServiceRules: (serviceId: string) => Promise<void>;
  checkSession: () => Promise<void>;
  saveBookingToBackend: (booking: Booking) => Promise<void>;
  handleLoginSubmit: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleSavePricingRule: (ruleType: string, customPayload?: any) => Promise<void>;
  handleToggleRuleStatus: (rule: any) => Promise<void>;
  handleDeletePricingRule: (id: string) => Promise<void>;
  handleTestPreviewPrice: () => Promise<void>;
  handleSaveCmsContent: (updatedCms: any) => Promise<void>;
  handleSaveEmailTemplate: () => Promise<void>;
  handleSendTestEmail: () => Promise<void>;
  handleResendFailedEmail: (logId: string) => Promise<void>;
  handleOpenServiceDrawer: (service: any | null) => Promise<void>;
  handleSaveService: () => Promise<void>;
  handleToggleServiceActive: (id: string, currentStatus: boolean) => Promise<void>;
  handleDeleteService: (id: string) => Promise<void>;
  handleAddPricingRuleLink: (pricingRuleId: string) => Promise<void>;
  handleUpdateRuleLink: (mappingId: string, updatedFields: any) => Promise<void>;
  handleRemoveRuleLink: (mappingId: string) => Promise<void>;
  handleUpdateOrderStatus: (orderId: string, newStatus: string, manualNote?: string) => void;
  handleAssignStaff: (orderId: string, staffId: string, instructions: string, confDate: string, confTime: string) => void;
  handleStaffJobUpdate: (orderId: string, nextStatus: 'Pending' | 'Accepted' | 'On the Way' | 'Started' | 'Completed' | 'Issue Reported', issueText?: string) => void;
  handleCreateRole: (e: React.FormEvent) => Promise<void>;
  togglePermissionInNewRole: (perm: string) => void;
  isSectionSelected: (section: typeof PERMISSION_SECTIONS[0]) => boolean;
  toggleSection: (section: typeof PERMISSION_SECTIONS[0]) => void;
  areAllPermissionsSelected: () => boolean;
  toggleAllPermissions: () => void;
  handleCreateStaff: (e: React.FormEvent) => Promise<void>;
  executeReportQuery: (reportKey: string) => any[];
  handleExportCSV: (reportKey: string) => void;
  handleTriggerSeeding: () => void;
}

const AdminContext = createContext<AdminContextProps | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // Acting Profile State
  const [currentRole, setCurrentRole] = useState('1'); // Default Super Admin
  const [actingStaffId, setActingStaffId] = useState('all'); // Default to all active staff

  // Sidebar Workspace Module State
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [drawerTab, setDrawerTab] = useState<'view' | 'edit'>('view');

  // Navigate to a named tab — updates state and URL bar instantly without Next.js navigation.
  // Using history.pushState avoids full page navigation overhead (no component remounting).
  const navigateTo = useCallback((tabName: string) => {
    setActiveTab(tabName);
    const slug = TAB_SLUG[tabName] || 'dashboard';
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/admin/${slug}`);
    }
  }, []);


  // --- Admin Feature Refinements States ---
  const [adminTemplates, setAdminTemplates] = useState<any[]>([]);
  const [adminEmailLogs, setAdminEmailLogs] = useState<any[]>([]);
  const [selectedAdminTpl, setSelectedAdminTpl] = useState<any>(null);
  const [tplEditSubject, setTplEditSubject] = useState('');
  const [tplEditBody, setTplEditBody] = useState('');
  const [tplEditActive, setTplEditActive] = useState(true);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestSending, setIsTestSending] = useState(false);
  const [emailLogsSearch, setEmailLogsSearch] = useState('');

  // --- Dynamic Dashboard Reporting States ---
  const [reportTab, setReportTab] = useState('Order Summary');
  const [repStartDate, setRepStartDate] = useState('');
  const [repEndDate, setRepEndDate] = useState('');
  const [repSearch, setRepSearch] = useState('');
  const [repStatus, setRepStatus] = useState('all');
  const [repService, setRepService] = useState('all');
  const [repStaff, setRepStaff] = useState('all');
  const [repPage, setRepPage] = useState(1);

  const [services, setServices] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
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
  const [serviceFormBasePrice, setServiceFormBasePrice] = useState<number | ''>(140);
  const [serviceFormDisplayOrder, setServiceFormDisplayOrder] = useState<number | ''>(0);
  const [serviceFormIsFeatured, setServiceFormIsFeatured] = useState(false);
  const [serviceFormIsActive, setServiceFormIsActive] = useState(true);
  const [serviceFormIsInstantPricing, setServiceFormIsInstantPricing] = useState(true);
  const [serviceFormIsManualQuote, setServiceFormIsManualQuote] = useState(false);
  const [serviceFormIncluded, setServiceFormIncluded] = useState<string[]>([]);
  const [serviceFormExcluded, setServiceFormExcluded] = useState<string[]>([]);
  const [serviceFormFAQs, setServiceFormFAQs] = useState<Array<{q: string, a: string}>>([]);
  const [serviceFormNotes, setServiceFormNotes] = useState('');
  
  // High fidelity states
  const [selectedPricingService, setSelectedPricingService] = useState('');
  const [pricingSubTab, setPricingSubTab] = useState('Base Price');
  const [pricingSearch, setPricingSearch] = useState('');
  const [pricingStatusFilter, setPricingStatusFilter] = useState('all');
  const [pricingSortCol, setPricingSortCol] = useState('name');
  const [pricingSortDir, setPricingSortDir] = useState<'asc' | 'desc'>('asc');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const [ruleForm, setRuleForm] = useState<any>({
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

  // Automatically synchronize selected services state with the fetched database records
  useEffect(() => {
    if (services.length > 0) {
      const exists = services.some(
        (s: any) => s.title?.toLowerCase() === selectedPricingService.toLowerCase()
      );
      if (!exists) {
        setSelectedPricingService(services[0].title || services[0].name || '');
      }
    }
  }, [services, selectedPricingService]);

  useEffect(() => {
    if (pricingSubTab === 'Base Price' && selectedPricingService) {
      const targetService = services.find(
        (s: any) => s.title?.toLowerCase() === selectedPricingService.toLowerCase() || 
                    s.slug?.toLowerCase() === selectedPricingService.toLowerCase().replace(/\s+/g, '-')
      );
      
      if (targetService) {
        setRuleForm((prev: any) => ({
          ...prev,
          price_adjustment: targetService.base_price || 0,
          name: `${targetService.title} Base`,
          adjustment_type: 'fixed',
        }));
      } else {
        setRuleForm((prev: any) => ({
          ...prev,
          price_adjustment: 0,
          name: `${selectedPricingService} Base`,
        }));
      }
    }
  }, [pricingSubTab, selectedPricingService, services]);

  // Test Pricing Simulator / Calculator States
  const [calcService, setCalcService] = useState('');

  // Automatically synchronize calc service state with the fetched database records
  useEffect(() => {
    if (services.length > 0) {
      const exists = services.some(
        (s: any) => s.title?.toLowerCase() === calcService.toLowerCase()
      );
      if (!exists) {
        setCalcService(services[0].title || services[0].name || '');
      }
    }
  }, [services, calcService]);
  const [calcBedrooms, setCalcBedrooms] = useState(1);
  const [calcBathrooms, setCalcBathrooms] = useState<number | ''>(1);
  const [calcSqFt, setCalcSqFt] = useState('');
  const [calcAddons, setCalcAddons] = useState<string[]>([]);
  const [calcUrgency, setCalcUrgency] = useState('Normal');
  const [calcPostal, setCalcPostal] = useState('');
  const [calcHomeType, setCalcHomeType] = useState('Apartment / Condo');
  const [calcCoupon, setCalcCoupon] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Database unified states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  // Selection states
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [serviceDateFilter, setServiceDateFilter] = useState('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [serviceLocationFilter, setServiceLocationFilter] = useState('');

  // Dialog mocks
  const [newStaff, setNewStaff] = useState<{ name: string; email: string; phone: string; role_id: string; password?: string }>({ name: '', email: '', phone: '', role_id: '4', password: '' });
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [newService, setNewService] = useState({ title: '', rate: 0, duration: '', desc: '', highlights: [] as string[] });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as string[] });
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [newCoupon, setNewCoupon] = useState<any>({ code: '', value: 25, type: 'percent' });
  const [newRule, setNewRule] = useState({ name: '', value: 15, type: 'fixed', rule_type: 'residence_type' });

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
        // Removed setServices(cmsData.cms.servicesContent) to prevent overwriting 
        // the actual DB services and causing race conditions on base_price.
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

  const handleSavePricingRule = async (ruleType: string, customPayload?: any) => {
    try {
      setPricingRulesLoading(true);

      if (ruleType === 'service_base') {
        const payload = customPayload || {
          ...ruleForm,
          service_name: selectedPricingService
        };
        
        const targetService = services.find(
          (s: any) => s.title?.toLowerCase() === payload.service_name.toLowerCase() || 
                      s.slug?.toLowerCase() === payload.service_name.toLowerCase().replace(/\s+/g, '-')
        );
        
        if (targetService && targetService.id) {
          const res = await fetch(`/api/admin/services/${targetService.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base_price: Number(payload.price_adjustment) })
          });
          const data = await res.json();
          if (data.success) {
            alert('Base price updated successfully in services table.');
            setServices(prev => prev.map(s => s.id === targetService.id ? { ...s, base_price: Number(payload.price_adjustment) } : s));
            setRuleForm((prev: any) => ({ ...prev, price_adjustment: Number(payload.price_adjustment) }));
            setPricingRulesLoading(false);
            return;
          } else {
            alert(`Failed to update base price: ${data.error}`);
            setPricingRulesLoading(false);
            return;
          }
        } else {
          alert('Error: Could not find matching service in database to update base price.');
          setPricingRulesLoading(false);
          return;
        }
      }

      let payload = customPayload;
      if (!payload) {
        const targetService = services.find(
          (s: any) => s.title?.toLowerCase() === selectedPricingService.toLowerCase() || 
                      s.slug?.toLowerCase() === selectedPricingService.toLowerCase().replace(/\s+/g, '-')
        );
        payload = {
          ...ruleForm,
          price_adjustment: ruleForm.price_adjustment === '' ? 0 : Number(ruleForm.price_adjustment),
          rule_type: ruleType,
          service_name: selectedPricingService,
          service_id: targetService ? targetService.id : null
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
          bathrooms: calcBathrooms === '' ? 0 : Number(calcBathrooms),
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
      
      try {
        setServiceFormIncluded(service.included_items ? (typeof service.included_items === 'string' ? JSON.parse(service.included_items) : service.included_items) : []);
      } catch (e) {
        setServiceFormIncluded([]);
      }
      
      try {
        setServiceFormExcluded(service.excluded_items ? (typeof service.excluded_items === 'string' ? JSON.parse(service.excluded_items) : service.excluded_items) : []);
      } catch (e) {
        setServiceFormExcluded([]);
      }
      
      try {
        setServiceFormFAQs(service.faqs ? (typeof service.faqs === 'string' ? JSON.parse(service.faqs) : service.faqs) : []);
      } catch (e) {
        setServiceFormFAQs([]);
      }
      
      setServiceFormNotes(service.notes || '');
      await fetchServiceRules(service.id);
    } else {
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
        alert(editingService ? 'Service updated successfully!' : 'Service created successfully!');
        setIsServiceDrawerOpen(false);
        fetchServices();
      } else {
        alert(`Failed to save service: ${data.error}`);
      }
    } catch (e: any) {
      alert(`API Error: ${e.message}`);
    }
  };

  const handleToggleServiceActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      } else {
        alert(`Failed to toggle status: ${data.error}`);
      }
    } catch (e: any) {
      alert(`API Error: ${e.message}`);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this service? All linking pricing rules mappings will be orphaned.')) return;
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert('Service deleted successfully.');
        setIsServiceDrawerOpen(false);
        fetchServices();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (e: any) {
      alert(`API Error: ${e.message}`);
    }
  };

  const fetchServiceRules = async (serviceId: string) => {
    try {
      const res = await fetch(`/api/admin/services/${serviceId}/pricing-rules`);
      const data = await res.json();
      if (data.success) {
        setServiceLinkedRules(data.rules || []);
      }
    } catch (err) {
      console.error('Error fetching service pricing rules:', err);
    }
  };

  const handleAddPricingRuleLink = async (pricingRuleId: string) => {
    if (!editingService) return;
    try {
      const res = await fetch(`/api/admin/services/${editingService.id}/pricing-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing_rule_id: pricingRuleId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchServiceRules(editingService.id);
        await fetchMappings();
        setIsAddRuleModalOpen(false);
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
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const fetchBookingHistory = useCallback(async (bookingId: string) => {
    try {
      const res = await fetch(`/api/orders/${bookingId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.history) {
          setHistory(prev => {
            const otherLogs = prev.filter(h => h.order_id !== bookingId);
            return [...data.history, ...otherLogs];
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch order status history:", e);
    }
  }, []);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/me');
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setCurrentRole(data.user.role_id);
        if (String(data.user.role_id) === '4') {
          setActingStaffId(String(data.user.id));
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch (err) {
      console.error('Session check failed:', err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCMSAndEmails();
      fetchServices();
      fetchCoupons();
      fetchMappings();
      fetchRoles();
      fetchStaff();
      fetchTickets();
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchBookingsAPI = useCallback(async () => {
    try {
      const response = await fetch('/api/orders');
      if (response.ok) {
        const data = await response.json();
        const baseBookings = data.bookings || [];
        
        const enriched: Booking[] = baseBookings.map((b: any) => ({
          ...b,
          order_status: b.status || b.order_status || 'New',
          payment_status: b.payment_status || 'Payment Pending',
          assigned_staff_id: b.assigned_staff_id || undefined,
          staff_job_status: b.staff_job_status || undefined,
          staff_reported_issue: b.staff_reported_issue || undefined,
          internal_notes: b.internal_notes || b.admin_internal_notes || '',
          customer_visible_notes: b.customer_visible_notes || ''
        }));

        setTimeout(() => {
          setBookings(enriched);

          const baseLogs: StatusHistory[] = enriched.flatMap(b => {
            return [
              { id: `log-${b.id}-1`, order_id: b.id, old_status: '', new_status: 'New', changed_by: 'Customer Flow', note: 'Order registered online.', created_at: b.created_at },
              ...(b.order_status !== 'New' ? [{ id: `log-${b.id}-2`, order_id: b.id, old_status: 'New', new_status: b.order_status, changed_by: 'System Auto-Designator', note: 'Status initialized.', created_at: new Date().toISOString() }] : [])
            ];
          });
          setHistory(baseLogs);

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
        }, 0);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookingsAPI();
    }
  }, [fetchBookingsAPI, isAuthenticated]);

  useEffect(() => {
    if (selectedBooking?.id) {
      fetchBookingHistory(selectedBooking.id);
    }
  }, [selectedBooking?.id, fetchBookingHistory]);

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
          staff_reported_issue: booking.staff_reported_issue,
          internal_notes: booking.internal_notes,
          customer_visible_notes: booking.customer_visible_notes
        })
      });
      if (res.ok) {
        fetchBookingHistory(booking.id);
      } else {
        const errText = await res.text();
        console.error('Failed to sync booking to backend database:', errText);
      }
    } catch (e) {
      console.error('Error syncing booking to backend database:', e);
    }
  }, [fetchBookingHistory]);

  const switchSimulatedRole = (roleId: string) => {
    setCurrentRole(roleId);
    if (String(roleId) === '4') {
      navigateTo('Assigned Job');
    } else {
      navigateTo('Dashboard');
    }
  };

  const hasPermission = useCallback((moduleName: string): boolean => {
    // Super admin (role 1) always has full access
    if (String(currentRole) === '1') return true;

    // If the logged-in user is type 'admin', full access
    if (currentUser?.type === 'admin') return true;

    const mapping: Record<string, string> = {
      'Dashboard': 'view_dashboard',
      'Orders / Bookings': 'view_orders',
      'Assigned Job': 'view_staff_jobs',
      'Users / Customers': 'view_customers',
      'Staff Management': 'manage_staff',
      'Roles & Permissions': 'manage_roles',
      'Services': 'manage_services',
      'Pricing Rules': 'manage_pricing',
      'Coupons': 'manage_coupons',
      'Slots / Availability': 'view_slots',
      'Tickets': 'manage_tickets',
      'Invoices': 'download_invoices',
      'Reports': 'view_reports',
      'Email Templates': 'manage_email_templates',
      'Content Management': 'manage_cms',
      'Settings': 'manage_settings',
      'Database Health': 'manage_settings'
    };

    const reqPerm = mapping[moduleName];
    if (!reqPerm) return true; // Unknown module — allow by default

    // Primary: use permissions from roles table (loaded async)
    const activeRoleObj = roles.find(r => String(r.id) === String(currentRole));
    if (activeRoleObj) {
      return activeRoleObj.permissions.includes(reqPerm);
    }

    // Fallback: use permissions embedded in the JWT (available immediately after login/session check)
    if (currentUser?.permissions) {
      return currentUser.permissions.includes(reqPerm);
    }

    // No data available yet — deny by default (will re-render once roles load)
    return false;
  }, [currentRole, currentUser, roles]);

  const handleUpdateOrderStatus = (orderId: string, newStatus: string, manualNote: string = '') => {
    const updatedBookings = bookings.map(b => {
      if (b.id === orderId) {
        const oldStatus = b.order_status;
        
        const hobj: StatusHistory = {
          id: generateId('hst-log'),
          order_id: b.id,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: roles.find(r => String(r.id) === String(currentRole))?.name || 'Administrator',
          note: manualNote || `Status updated to ${newStatus}.`,
          created_at: new Date().toISOString()
        };
        
        const newHistory = [hobj, ...history];
        setHistory(newHistory);

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
          }
        }

        // Synchronize staff_job_status based on order_status
        let updatedStaffJobStatus = b.staff_job_status;
        if (newStatus === 'Completed') {
          updatedStaffJobStatus = 'Completed';
        } else if (newStatus === 'In Progress') {
          if (b.staff_job_status !== 'Started' && b.staff_job_status !== 'Completed') {
            updatedStaffJobStatus = 'Started';
          }
        } else if (newStatus === 'Scheduled') {
          if (b.staff_job_status !== 'Accepted' && b.staff_job_status !== 'On the Way' && b.staff_job_status !== 'Started' && b.staff_job_status !== 'Completed') {
            updatedStaffJobStatus = 'Accepted';
          }
        } else if (newStatus === 'Job Assigned') {
          updatedStaffJobStatus = 'Pending';
        }

        const updatedObj = { 
          ...b, 
          order_status: newStatus,
          staff_job_status: updatedStaffJobStatus
        };
        saveBookingToBackend(updatedObj);
        return updatedObj;
      }
      return b;
    });

    setBookings(updatedBookings);

    if (selectedBooking && selectedBooking.id === orderId) {
      setSelectedBooking(updatedBookings.find(b => b.id === orderId) || null);
    }
  };

  const handleAssignStaff = (orderId: string, staffId: string, instructions: string, confDate: string, confTime: string) => {
    const staffName = staff.find(s => String(s.id) === String(staffId))?.name || 'Simulated Cleaner';
    const note = `Allocated dedicated job to staff ${staffName}. Schedule: ${confDate} ${confTime}. Instructions: ${instructions}`;
    
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

    const hobj: StatusHistory = {
      id: generateId('hst-log'),
      order_id: orderId,
      old_status: bookings.find(b => b.id === orderId)?.order_status || 'New',
      new_status: 'Job Assigned',
      changed_by: roles.find(r => String(r.id) === String(currentRole))?.name || 'Admin Allocator',
      note: note,
      created_at: new Date().toISOString()
    };
    const newHistory = [hobj, ...history];
    setHistory(newHistory);

    if (selectedBooking && selectedBooking.id === orderId) {
      setSelectedBooking(updated.find(b => b.id === orderId) || null);
    }

    alert(`Job successfully allocated to ${staffName}. Notification generated dynamically.`);
  };

  const handleStaffJobUpdate = (orderId: string, nextStatus: 'Pending' | 'Accepted' | 'On the Way' | 'Started' | 'Completed' | 'Issue Reported', issueText: string = '') => {
    const updated = bookings.map(b => {
      if (b.id === orderId) {
        let orderStatus = b.order_status;
        if (nextStatus === 'Pending') {
          orderStatus = 'Job Assigned';
        } else if (nextStatus === 'Accepted') {
          orderStatus = 'Scheduled';
        } else if (nextStatus === 'On the Way' || nextStatus === 'Started') {
          orderStatus = 'In Progress';
        } else if (nextStatus === 'Completed') {
          orderStatus = 'Completed';
        } else if (nextStatus === 'Issue Reported') {
          orderStatus = 'Under Review';
        }

        const updatedObj = {
          ...b,
          staff_job_status: nextStatus,
          staff_reported_issue: nextStatus === 'Issue Reported' ? issueText : b.staff_reported_issue,
          order_status: orderStatus
        };
        saveBookingToBackend(updatedObj);
        return updatedObj;
      }
      return b;
    });

    setBookings(updated);

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

    if (selectedBooking && selectedBooking.id === orderId) {
      setSelectedBooking(updated.find(b => b.id === orderId) || null);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name) return;
    try {
      const url = '/api/admin/roles';
      const method = editingRoleId ? 'PUT' : 'POST';
      const bodyPayload = editingRoleId
        ? {
            id: editingRoleId,
            name: newRole.name,
            permissions: newRole.permissions
          }
        : {
            name: newRole.name,
            permissions: newRole.permissions
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (data.success && data.role) {
        if (editingRoleId) {
          const rlist = roles.map(r => String(r.id) === String(editingRoleId) ? data.role : r);
          setRoles(rlist);
          setEditingRoleId(null);
          setIsRoleModalOpen(false);
          setNewRole({ name: '', permissions: [] });
          alert(`Success: Updated role "${data.role.name}".`);
        } else {
          const rlist = [...roles, data.role];
          setRoles(rlist);
          setIsRoleModalOpen(false);
          setNewRole({ name: '', permissions: [] });
          alert(`Success: Created new operational role "${data.role.name}".`);
        }
      } else {
        alert(`Failed to save role: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error saving role: ${err.message}`);
    }
  };

  const togglePermissionInNewRole = (perm: string) => {
    if (newRole.permissions.includes(perm)) {
      setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== perm) });
    } else {
      setNewRole({ ...newRole, permissions: [...newRole.permissions, perm] });
    }
  };

  const isSectionSelected = (section: typeof PERMISSION_SECTIONS[0]) => {
    const uniqueKeys = [...new Set(section.permissions.map(p => p.key))];
    return uniqueKeys.every(k => newRole.permissions.includes(k));
  };

  const toggleSection = (section: typeof PERMISSION_SECTIONS[0]) => {
    const uniqueKeys = [...new Set(section.permissions.map(p => p.key))];
    const alreadyHasAll = isSectionSelected(section);
    let updatedPerms: string[];
    if (alreadyHasAll) {
      updatedPerms = newRole.permissions.filter(p => !uniqueKeys.includes(p));
    } else {
      const keysToAdd = uniqueKeys.filter(k => !newRole.permissions.includes(k));
      updatedPerms = [...newRole.permissions, ...keysToAdd];
    }
    setNewRole({ ...newRole, permissions: updatedPerms });
  };

  const areAllPermissionsSelected = () => {
    const allKeys = [...new Set(PERMISSION_SECTIONS.flatMap(s => s.permissions.map(p => p.key)))];
    return allKeys.every(k => newRole.permissions.includes(k));
  };

  const toggleAllPermissions = () => {
    const allKeys = [...new Set(PERMISSION_SECTIONS.flatMap(s => s.permissions.map(p => p.key)))];
    const alreadyHasAll = areAllPermissionsSelected();
    setNewRole({
      ...newRole,
      permissions: alreadyHasAll ? [] : allKeys
    });
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.email) return;
    try {
      const url = '/api/admin/staff';
      const method = editingStaffId ? 'PUT' : 'POST';
      const bodyPayload = editingStaffId 
        ? {
            id: editingStaffId,
            name: newStaff.name,
            email: newStaff.email,
            phone: newStaff.phone || '+1 (416) 555-4821',
            role_id: Number(newStaff.role_id),
            password: newStaff.password || undefined
          }
        : {
            name: newStaff.name,
            email: newStaff.email,
            phone: newStaff.phone || '+1 (416) 555-4821',
            role_id: Number(newStaff.role_id),
            is_active: true,
            password: newStaff.password || undefined
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      if (data.success && data.staff) {
        if (editingStaffId) {
          const updated = staff.map(st => String(st.id) === String(editingStaffId) ? data.staff : st);
          setStaff(updated);
          setEditingStaffId(null);
          alert(`Staff ${data.staff.name} updated successfully.`);
        } else {
          const slist = [...staff, data.staff];
          setStaff(slist);
          alert(`Staff ${data.staff.name} added and role configured.`);
        }
        setNewStaff({ name: '', email: '', phone: '', role_id: '4', password: '' });
        setIsStaffModalOpen(false);
      } else {
        alert(`Failed to save staff: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error saving staff: ${err.message}`);
    }
  };

  const executeReportQuery = (reportKey: string): any[] => {
    switch (reportKey) {
      case '1':
        return bookings.filter(b => statusFilter === 'all' || b.order_status === statusFilter);
      case '2':
        return bookings.filter(b => b.assigned_staff_id !== undefined);
      case '3':
        return bookings.filter(b => b.order_status === 'Completed' && b.assigned_staff_id);
      case '4':
        return bookings.filter(b => b.order_status === 'New' || b.order_status === 'Under Review');
      case '5':
        return bookings.filter(b => b.payment_status === 'Payment Pending');
      case '6':
        return bookings.filter(b => b.order_status === 'Completed' && invoices.some(i => i.order_id === b.id));
      case '7':
        return bookings.filter(b => b.order_status === 'Completed' && !invoices.some(i => i.order_id === b.id));
      case '8':
        return invoices.filter(i => i.status === 'Paid');
      case '9':
        return coupons;
      case '10':
        return staff.map(s => {
          const sJobs = bookings.filter(b => b.assigned_staff_id === s.id);
          return {
            name: s.name,
            total_allocated: sJobs.length,
            completed_jobs: sJobs.filter(b => b.order_status === 'Completed').length,
            issues_reported: sJobs.filter(b => b.staff_job_status === 'Issue Reported').length
          };
        });
      case '11':
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

  const handleTriggerSeeding = () => {
    localStorage.clear();
    location.reload();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required.');
      return;
    }
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        setCurrentRole(data.user.role_id);
        setAuthError('');
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during login.');
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/admin/auth/logout', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setAuthEmail('');
        setAuthPassword('');
        document.cookie = "pristine_user_id=; path=/; max-age=0";
        // Navigate to /admin so the URL reflects the logged-out state
        router.push('/admin');
      } else {
        alert(`Logout failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Logout error: ${err.message}`);
    }
  };

  return (
    <AdminContext.Provider value={{
      isAuthenticated, setIsAuthenticated,
      currentUser, setCurrentUser,
      authEmail, setAuthEmail,
      authPassword, setAuthPassword,
      isAuthLoading,
      authError, setAuthError,
      currentRole, setCurrentRole,
      actingStaffId, setActingStaffId,
      activeTab, setActiveTab,
      drawerTab, setDrawerTab,
      navigateTo,
      switchSimulatedRole,
      hasPermission,

      bookings, setBookings,
      roles, setRoles,
      staff, setStaff,
      history, setHistory,
      tickets, setTickets,
      invoices, setInvoices,
      slots, setSlots,
      services, setServices,
      pricingRules, setPricingRules,
      coupons, setCoupons,
      cmsContent, setCmsContent,
      cmsSaveLoading,
      serverPricingRules, setServerPricingRules,
      allPricingMappings, setAllPricingMappings,

      selectedBooking, setSelectedBooking,
      selectedTicket, setSelectedTicket,
      selectedInvoice, setSelectedInvoice,

      searchQuery, setSearchQuery,
      statusFilter, setStatusFilter,
      ticketReplyText, setTicketReplyText,
      serviceDateFilter, setServiceDateFilter,
      serviceTypeFilter, setServiceTypeFilter,
      serviceLocationFilter, setServiceLocationFilter,

      adminTemplates, setAdminTemplates,
      adminEmailLogs, setAdminEmailLogs,
      selectedAdminTpl, setSelectedAdminTpl,
      tplEditSubject, setTplEditSubject,
      tplEditBody, setTplEditBody,
      tplEditActive, setTplEditActive,
      testEmailAddress, setTestEmailAddress,
      isTestSending, setIsTestSending,
      emailLogsSearch, setEmailLogsSearch,

      reportTab, setReportTab,
      repStartDate, setRepStartDate,
      repEndDate, setRepEndDate,
      repSearch, setRepSearch,
      repStatus, setRepStatus,
      repService, setRepService,
      repStaff, setRepStaff,
      repPage, setRepPage,
      repSortCol, setRepSortCol,
      repSortDir, setRepSortDir,

      isServiceDrawerOpen, setIsServiceDrawerOpen,
      editingService, setEditingService,
      serviceLinkedRules, setServiceLinkedRules,
      isAddRuleModalOpen, setIsAddRuleModalOpen,

      serviceFormTitle, setServiceFormTitle,
      serviceFormSlug, setServiceFormSlug,
      serviceFormDesc, setServiceFormDesc,
      serviceFormFullDesc, setServiceFormFullDesc,
      serviceFormImage, setServiceFormImage,
      serviceFormBasePrice, setServiceFormBasePrice,
      serviceFormDisplayOrder, setServiceFormDisplayOrder,
      serviceFormIsFeatured, setServiceFormIsFeatured,
      serviceFormIsActive, setServiceFormIsActive,
      serviceFormIsInstantPricing, setServiceFormIsInstantPricing,
      serviceFormIsManualQuote, setServiceFormIsManualQuote,
      serviceFormIncluded, setServiceFormIncluded,
      serviceFormExcluded, setServiceFormExcluded,
      serviceFormFAQs, setServiceFormFAQs,
      serviceFormNotes, setServiceFormNotes,

      pricingRulesLoading,
      editingRuleId, setEditingRuleId,
      selectedPricingService, setSelectedPricingService,
      pricingSubTab, setPricingSubTab,
      pricingSearch, setPricingSearch,
      pricingStatusFilter, setPricingStatusFilter,
      pricingSortCol, setPricingSortCol,
      pricingSortDir, setPricingSortDir,
      ruleForm, setRuleForm,

      calcService, setCalcService,
      calcBedrooms, setCalcBedrooms,
      calcBathrooms, setCalcBathrooms,
      calcSqFt, setCalcSqFt,
      calcAddons, setCalcAddons,
      calcUrgency, setCalcUrgency,
      calcPostal, setCalcPostal,
      calcHomeType, setCalcHomeType,
      calcCoupon, setCalcCoupon,
      calcResult, setCalcResult,
      calcLoading, setCalcLoading,

      newStaff, setNewStaff,
      editingStaffId, setEditingStaffId,
      isStaffModalOpen, setIsStaffModalOpen,
      staffSearchQuery, setStaffSearchQuery,
      newRole, setNewRole,
      isRoleModalOpen, setIsRoleModalOpen,
      editingRoleId, setEditingRoleId,
      newCoupon, setNewCoupon,
      newRule, setNewRule,

      fetchServices,
      fetchCoupons,
      fetchCMSAndEmails,
      fetchMappings,
      fetchRoles,
      fetchStaff,
      fetchTickets,
      fetchSlots,
      fetchBookingHistory,
      fetchBookingsAPI,
      fetchServiceRules,
      checkSession,
      saveBookingToBackend,
      handleLoginSubmit,
      handleLogout,
      handleSavePricingRule,
      handleToggleRuleStatus,
      handleDeletePricingRule,
      handleTestPreviewPrice,
      handleSaveCmsContent,
      handleSaveEmailTemplate,
      handleSendTestEmail,
      handleResendFailedEmail,
      handleOpenServiceDrawer,
      handleSaveService,
      handleToggleServiceActive,
      handleDeleteService,
      handleAddPricingRuleLink,
      handleUpdateRuleLink,
      handleRemoveRuleLink,
      handleUpdateOrderStatus,
      handleAssignStaff,
      handleStaffJobUpdate,
      handleCreateRole,
      togglePermissionInNewRole,
      isSectionSelected,
      toggleSection,
      areAllPermissionsSelected,
      toggleAllPermissions,
      handleCreateStaff,
      executeReportQuery,
      handleExportCSV,
      handleTriggerSeeding
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
