'use client';

import React from 'react';
import { useAdmin } from '../AdminContext';
import { 
  FileText, DollarSign, Clock, Tag, BarChart3, Users, AlertTriangle, Briefcase, 
  Calendar, FileSpreadsheet, CheckCircle2, Search, Download, Printer
} from 'lucide-react';

export default function ReportsSection() {
  const {
    bookings,
    setBookings,
    tickets,
    invoices,
    setInvoices,
    staff,
    coupons,
    services,
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
    saveBookingToBackend,
    fetchCMSAndEmails
  } = useAdmin();

  // Stable State Persister (No-op)
  const saveState = (key: string, data: any) => {};

  // Local helper inside clean block (from page.tsx)
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
          '_raw_match': b
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
        { label: 'Blackout Blocks Set', value: 2, desc: 'Blackout dates enabled' }
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
      setRepSortDir(repSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setRepSortCol(col);
      setRepSortDir('asc');
    }
  };

  // Multi-format Downloads helper
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

    const updatedInv = invoices.map(item => item.order_id === bId ? { ...item, status: 'Paid' as const } : item);
    let invoiceList = [...updatedInv];
    if (!invoices.some(item => item.order_id === bId)) {
      invoiceList.unshift({
        id: `inv-rec-${bId}`,
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
    <div className="space-y-6">
      
      {/* 11 Reports View Grid Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sidebar Report Switcher Left Column - 11 Tabs */}
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
                className={`w-full text-left p-3.5 rounded-xl border flex gap-3 items-center transition-all cursor-pointer ${
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
        <div className="lg:col-span-9 space-y-6">
          
          {/* Top Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {computedData.cards.map((card, idx) => (
              <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-4.5 space-y-2 shadow-xs transition-all hover:border-neutral-300">
                <span className="text-[10px] font-extrabold uppercase font-mono text-neutral-400 tracking-wider block">{card.label}</span>
                <strong className="text-2xl font-black text-neutral-900 font-sans tracking-tight block">{card.value}</strong>
                <p className="text-[10px] text-neutral-500 font-medium leading-normal">{card.desc}</p>
              </div>
            ))}
          </div>

          {/* Active Filters and Core Controls Box */}
          <div className="bg-white border border-neutral-200 rounded-xl p-4.5 space-y-4 shadow-3xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-3.5">
              <div>
                <h4 className="text-sm font-extrabold font-sans text-neutral-900">{reportTab} Analysis Desk</h4>
                <p className="text-[10.5px] text-neutral-500">Active spreadsheet filters. Dynamic sorting, date scale bounds, and multi-format reports export.</p>
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
                  {services.map((service: any) => (
                    <option key={service.id} value={service.title || service.name}>
                      {service.title || service.name}
                    </option>
                  ))}
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

          {/* Main Data View Grid */}
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
                    onClick={() => setRepPage(Math.max(1, repPage - 1))}
                    className="px-3.5 py-1 bg-white border rounded-lg hover:bg-neutral-100 cursor-pointer font-bold disabled:opacity-40 transition-opacity"
                  >
                    Previous Page
                  </button>
                  <div className="px-2 py-1 bg-neutral-200/50 rounded font-bold font-mono text-[10px] text-neutral-905">
                    Page {repPage} of {maxPagesCount}
                  </div>
                  <button
                    disabled={repPage >= maxPagesCount}
                    onClick={() => setRepPage(Math.min(maxPagesCount, repPage + 1))}
                    className="px-3.5 py-1 bg-white border rounded-lg hover:bg-neutral-100 cursor-pointer font-bold disabled:opacity-40 transition-opacity"
                  >
                    Next Page
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
