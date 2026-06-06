'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Check, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, 
  MapPin, Home, Layers, Calendar, Clock, CreditCard, User, 
  FileText, Sparkle, ListTodo, Plus, Info, Trash2
} from 'lucide-react';

// Steps list matching design progress bar
const bookingSteps = [
  { idx: 1, name: 'Location' },
  { idx: 2, name: 'Home' },
  { idx: 3, name: 'Service' },
  { idx: 4, name: 'Frequency' },
  { idx: 5, name: 'Add-ons' },
  { idx: 6, name: 'Schedule' },
  { idx: 7, name: 'Access Tools' },
  { idx: 8, name: 'About You' },
  { idx: 9, name: 'Checkout' },
  { idx: 10, name: 'Review' }
];



function BookingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Active step counter (1-indexed)
  const [currentStep, setCurrentStep] = useState(1);

  // --- Step States ---
  // Step 1: Location/Postal
  const [postal, setPostal] = useState(searchParams.get('postal') || '');
  const [city, setCity] = useState('');

  // Step 2: Tell us about your home
  const [homeType, setHomeType] = useState(searchParams.get('homeType') || '');
  const [bedrooms, setBedrooms] = useState(parseInt(searchParams.get('beds') || '1'));
  const [bathrooms, setBathrooms] = useState(parseInt(searchParams.get('baths') || '1'));
  const [squareFootage, setSquareFootage] = useState<number | ''>('');

  // Step 3: Select restoration level
  const [restorationLevel, setRestorationLevel] = useState(
    searchParams.get('restorationLevel') || ''
  );

  // Step 4: Interval frequency
  const [frequency, setFrequency] = useState(searchParams.get('frequency') || '');

  // Step 5: Special Add-ons select list
  const [addons, setAddons] = useState<string[]>(
    searchParams.get('addons') ? searchParams.get('addons')!.split(',') : []
  );

  // Step 6: Schedule Date & Time Slots
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Step 7: Notes & custom instructions
  const [entryMethod, setEntryMethod] = useState('');
  const [customKeyNotes, setCustomKeyNotes] = useState('');
  const [customerSpecialNotes, setCustomerSpecialNotes] = useState('');

  // Step 8: Customer account details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 9: Checkout details (Credit Card details)
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');

  // State for random dispatch reference to ensure purity during render
  const [dispatchRef, setDispatchRef] = useState('PRE-682491');

  // Finished booking status animation
  const [orderComplete, setOrderComplete] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // --- Live Dynamic Pricing Rules loader and calculator ---
  const [dbRules, setDbRules] = useState<any[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [serviceSpecificRules, setServiceSpecificRules] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/pricing')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.pricingRules) {
          setDbRules(data.pricingRules.filter((r: any) => r.is_active));
        }
      })
      .catch(err => console.error('Error fetching db rules:', err));

    const loadServices = async () => {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success && data.services && data.services.length > 0) {
          setAvailableServices(data.services);
          // Pre-select service level matches from search params
          const paramLevel = searchParams.get('restorationLevel');
          if (paramLevel) {
            const matched = data.services.find((s: any) => 
              (s.title || s.name || '').toLowerCase() === paramLevel.toLowerCase() ||
              (s.slug || '').toLowerCase() === paramLevel.toLowerCase()
            );
            if (matched) {
              setRestorationLevel(matched.title || matched.name);
            } else {
              setRestorationLevel(paramLevel);
            }
          }
        } else {
          setAvailableServices([]);
        }
      } catch (err) {
        console.error('Error loading available services in booking form:', err);
        setAvailableServices([]);
      }
    };
    loadServices();
  }, [searchParams]);

  const currentServiceSelected = availableServices.find((s: any) => {
    let searchKey = restorationLevel?.toLowerCase() || "";
    if (searchKey === 'deep clean') searchKey = 'deep restoration suite';
    if (searchKey === 'move in/out' || searchKey === 'move in / out') searchKey = 'move in / out choreography';
    if (searchKey === 'standard clean' || searchKey === 'standard') searchKey = 'standard maintenance curation';

    const tLower = (s.title || s.name || '').toLowerCase();
    const slugLower = (s.slug || '').toLowerCase();
    
    return tLower === searchKey || 
           slugLower === searchKey.replace(/\s+/g, '-') ||
           (tLower.length > 5 && searchKey.includes(tLower)) || 
           (searchKey.length > 5 && tLower.includes(searchKey)) ||
           tLower === (restorationLevel || '').toLowerCase();
  });
  const isManualQuoteState = currentServiceSelected?.is_manual_quote === true;

  // Fetch associated pricing rules for the selected service dynamically
  useEffect(() => {
    if (currentServiceSelected && currentServiceSelected.id) {
      fetch(`/api/services/${currentServiceSelected.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.pricing_rules) {
            setServiceSpecificRules(data.pricing_rules);
          } else {
            setServiceSpecificRules([]);
          }
        })
        .catch(err => {
          console.error('Error fetching service-specific rules:', err);
          setServiceSpecificRules([]);
        });
    } else {
      setServiceSpecificRules([]);
    }
  }, [currentServiceSelected]);

  // Derive selectable add-ons for the selected service.
  // If no associated add-on rules exist, fallback to default add-ons ONLY for default services.
  const dynamicSelectableAddons = (() => {
    const associatedAddons = serviceSpecificRules
      .filter((sr: any) => {
        const rule = sr.pricing_rule || sr.pricing_rules;
        return rule && rule.rule_type === 'addon_pricing' && (sr.is_active !== false && rule.is_active !== false);
      })
      .map((sr: any) => {
        const rule = sr.pricing_rule || sr.pricing_rules;
        return {
          id: rule.id,
          label: rule.name || rule.rule_name,
          price: Number(rule.price_adjustment) || 0,
          desc: rule.message || `${rule.name || rule.rule_name} service add-on.`
        };
      });

    return associatedAddons;
  })();

  const pricing = (() => {
    // 1. Service levels base price
    let base = 0; 
    const currentService = currentServiceSelected;
    if (currentService) {
      base = Number(currentService.rate) || Number(currentService.base_price) || 0;
    }

    // Helper to find a rule, preferring service-specific pivot rules
    const getActiveRule = (ruleType: string, matchKey: string) => {
      const specific = serviceSpecificRules.find(sr => {
        const rule = sr.pricing_rule || sr.pricing_rules;
        return rule && rule.rule_type === ruleType && rule.match_key === matchKey;
      });
      if (specific) {
        return specific.pricing_rule || specific.pricing_rules;
      }
      return dbRules.find(r => r.rule_type === ruleType && r.match_key === matchKey);
    };

    if (!restorationLevel) {
      return {
        baseService: 0,
        roomModifiers: 0,
        addonsTotal: 0,
        frequencyDiscount: 0,
        subtotal: 0,
        serviceFee: 0,
        tax: 0,
        total: 0
      };
    }

    // 2. Room Count modifications
    let roomCharge = 0;
    const bedRule = getActiveRule('size_charge', 'bedrooms') || dbRules.find(r => r.rule_type === 'size_charge' && r.match_key === 'bedrooms');
    const bathRule = getActiveRule('size_charge', 'bathrooms') || dbRules.find(r => r.rule_type === 'size_charge' && r.match_key === 'bathrooms');

    if (bedrooms > 1) {
      roomCharge += (bedrooms - 1) * (bedRule ? bedRule.price_adjustment : 0);
    }
    if (bathrooms > 1) {
      roomCharge += (bathrooms - 1) * (bathRule ? bathRule.price_adjustment : 0);
    }

    // 3. Add-on pricing totals
    let addonsCost = 0;
    addons.forEach(addonId => {
      const matchedAddon = dynamicSelectableAddons.find(a => a.id === addonId);
      if (matchedAddon) {
        addonsCost += matchedAddon.price;
      } else {
        const addRule = dbRules.find(r => r.rule_type === 'addon_pricing' && (r.id === addonId || r.match_key === addonId));
        if (addRule) {
          addonsCost += addRule.price_adjustment;
        }
      }
    });

    const totalBeforeDiscount = base + roomCharge + addonsCost;

    // 4. Frequency modifier discounts
    let discountPercent = 0;
    if (frequency === 'Weekly') discountPercent = 0.20; 
    if (frequency === 'Bi-weekly') discountPercent = 0.15; 
    if (frequency === 'Monthly') discountPercent = 0.05; 

    const discountAmount = Math.round(totalBeforeDiscount * discountPercent);
    let calculatedSubtotal = totalBeforeDiscount - discountAmount;

    // 5. Minimum billing threshold limits
    const minRule = getActiveRule('min_order', 'min_order_value') || dbRules.find(r => r.rule_type === 'min_order');
    let minOrderThreshold = minRule ? minRule.price_adjustment : 0;
    if (calculatedSubtotal < minOrderThreshold) {
      calculatedSubtotal = minOrderThreshold;
    }

    const adminSvcFee = Math.round(calculatedSubtotal * 0.05 * 100) / 100; 
    const provincialTax = Math.round(calculatedSubtotal * 0.13 * 100) / 100; 
    const calculatedTotal = Math.round((calculatedSubtotal + adminSvcFee + provincialTax) * 100) / 100;

    return {
      baseService: base,
      roomModifiers: roomCharge,
      addonsTotal: addonsCost,
      frequencyDiscount: discountAmount,
      subtotal: calculatedSubtotal,
      serviceFee: adminSvcFee,
      tax: provincialTax,
      total: calculatedTotal
    };
  })();

  // Navigate forward checking simple validations
  const handleNextStep = async () => {
    if (currentStep === 1 && !postal.trim()) {
      alert('Please enter a valid postal code first.');
      return;
    }
    if (currentStep === 8 && (!firstName || !lastName || !email || !phone)) {
      alert('Please fill out all required contact panels.');
      return;
    }
    if (currentStep === 9 && (!cardName || !cardNumber || !cardExpiry || !cardCVC)) {
      alert('Please enter complete secure card payment details.');
      return;
    }
    if (currentStep === 10) {
      setSubmitting(true);
      setSubmitError('');
      const generatedRef = `PRE-${Math.floor(100000 + Math.random() * 900000)}`;
      setDispatchRef(generatedRef);

      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postal,
            homeType,
            bedrooms,
            bathrooms,
            squareFootage: squareFootage === '' ? 0 : Number(squareFootage),
            restorationLevel,
            frequency,
            addons: addons.map(addonId => {
              const matchedAddon = dynamicSelectableAddons.find(a => a.id === addonId);
              if (matchedAddon) {
                return { id: matchedAddon.id, name: matchedAddon.label, price: matchedAddon.price };
              }
              const addRule = dbRules.find(r => r.rule_type === 'addon_pricing' && (r.id === addonId || r.match_key === addonId));
              return {
                id: addonId,
                name: addRule ? (addRule.name || addRule.rule_name) : addonId,
                price: addRule ? addRule.price_adjustment : 0
              };
            }),
            selectedDate,
            selectedTimeSlot,
            entryMethod,
            customKeyNotes,
            customerSpecialNotes,
            firstName,
            lastName,
            email,
            phone,
            cardName,
            pricing,
            dispatchRef: generatedRef,
            status: isManualQuoteState ? 'Quote Proposed' : 'Confirmed'
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Server rejected the order submission. Check database or SMTP setup.');
        }

        setOrderComplete(true);
      } catch (err: any) {
        console.error('Submit error:', err);
        setSubmitError(err.message || 'System failed to submit booking.');
        alert(err.message || 'Error occurred while saving your dispatch order.');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setCurrentStep((prev) => Math.min(bookingSteps.length, prev + 1));
  };

  const handleBackStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Toggle add-on checkbox
  const toggleAddon = (id: string) => {
    if (addons.includes(id)) {
      setAddons(addons.filter(item => item !== id));
    } else {
      setAddons([...addons, id]);
    }
  };

  // Quick helper card mapping
  const activeStepDetails = bookingSteps.find(step => step.idx === currentStep);

  return (
    <div className="min-h-screen bg-surface selection:bg-accent selection:text-primary pb-16 lg:pb-24">
      
      {/* Editorial Minimalized Checkout Header Header */}
      <header className="border-b border-outline-variant/10 bg-surface-lowest py-5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <button 
            onClick={() => router.push('/')}
            className="group flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-primary hover:text-secondary uppercase"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Abandon Atelier Booking</span>
          </button>

          <div className="flex flex-col items-center">
            <span className="font-display text-sm tracking-[0.2em] font-bold text-primary">GET ME A MAID</span>
            <span className="font-mono text-[8px] tracking-[0.4em] text-on-surface-variant -mt-0.5">EDITORIAL</span>
          </div>

          <span className="px-3 py-1 bg-surface-low border border-outline-variant/15 font-mono text-[9px] font-bold tracking-widest text-secondary rounded">
            ESTIMATE SECURE
          </span>
        </div>
      </header>

      {/* Modern Horizontal Checkout Progress Bar */}
      <section className="bg-surface-low/50 py-4 border-b border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto scroller-none">
          <div className="flex items-center gap-4 min-w-[900px]">
            {bookingSteps.map((step) => {
              const isActive = step.idx === currentStep;
              const isCompleted = step.idx < currentStep;
              return (
                <div 
                  key={step.idx} 
                  onClick={() => {
                    // Quick navigation allowed for already configured fields
                    if (step.idx <= currentStep || isCompleted) {
                      setCurrentStep(step.idx);
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer transition-all shrink-0"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                    isActive 
                      ? 'bg-primary text-surface ring-2 ring-primary/25' 
                      : isCompleted 
                        ? 'bg-secondary text-accent' 
                        : 'bg-outline-variant/15 text-on-surface-variant'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5 text-accent stroke-[3]" /> : step.idx}
                  </div>
                  <span className={`font-display text-[10.5px] uppercase tracking-wider font-semibold ${
                    isActive ? 'text-primary font-bold' : 'text-on-surface-variant/80'
                  }`}>
                    {step.name}
                  </span>
                  {step.idx !== bookingSteps.length && (
                    <span className="text-on-surface-variant/30 font-mono text-xs font-light">/</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-6 mt-10 md:mt-14 relative">
        <AnimatePresence mode="wait">
          {orderComplete ? (
            /* --- GLORIOUS SUCCESS CHECKOUT SCREEN --- */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto text-center py-16 space-y-8 bg-surface-lowest p-8 rounded-3xl border border-secondary shadow-2xl relative overflow-hidden"
            >
              {/* Confetti decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/15 rounded-full filter blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/25 rounded-full filter blur-2xl"></div>

              <div className="w-20 h-20 rounded-full bg-secondary text-accent flex items-center justify-center mx-auto shadow-lg shadow-secondary/15">
                <CheckCircle2 className="w-10 h-10 stroke-[1.5]" />
              </div>

              <div className="space-y-3">
                <span className="inline-flex items-center gap-1 bg-secondary text-accent font-mono text-[9px] uppercase tracking-widest px-3 py-1 rounded-full font-bold">
                  <Sparkles className="w-3 h-3 fill-current" />
                  Atelier Dispatch Certified
                </span>
                 <h2 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-primary">
                  {isManualQuoteState ? 'Calculation Request Proposal Logged' : 'Restoration Sweep Confirmed'}
                </h2>
                <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-lg mx-auto leading-relaxed">
                  {isManualQuoteState ? (
                    <>Thank you, <span className="font-bold text-primary">{firstName || "Valued Client"}</span>. Your custom quote request has been received for <span className="font-bold text-primary">{selectedDate}</span>. Our expert estimators will review details, adjust customized pricing rules, and email you a verified quote proposal shortly.</>
                  ) : (
                    <>Thank you, <span className="font-bold text-primary">{firstName || "Valued Client"}</span>. Your luxury cleaning suite has been booked for <span className="font-bold text-primary">{selectedDate}</span>. Our verified crew chief will coordinate entry methods meticulously.</>
                  )}
                </p>
              </div>

              {/* Receipt Summary Info Card */}
              <div className="p-5 bg-surface rounded-2xl border border-outline-variant/15 text-left space-y-3.5 max-w-md mx-auto">
                <div className="flex justify-between text-xs font-mono pb-2 border-b border-outline-variant/10 text-on-surface-variant">
                  <span>DISPATCH REFERENCE</span>
                  <span className="font-bold font-mono tracking-wider text-primary">{dispatchRef}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-sans text-on-surface-variant/90 font-medium">
                  <div>
                    <span className="block text-[10px] font-mono text-on-surface-variant/50 uppercase">LOCATION</span>
                    <span>{postal} ({city})</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-on-surface-variant/50 uppercase font-medium">RESIDENCE TYPE</span>
                    <span>{homeType}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-on-surface-variant/50 uppercase">SUITE CALIBRATION</span>
                    <span className="font-semibold">{restorationLevel}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-mono text-on-surface-variant/50 uppercase">SCHEDULE DATE</span>
                    <span>{selectedDate}</span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-outline-variant/10 flex justify-between items-baseline">
                  <span className="text-xs font-mono font-bold text-primary">
                    {isManualQuoteState ? 'ESTIMATED PRE-QUOTE RATE' : 'TOTAL AUTHORIZATION COST'}
                  </span>
                  <span className="text-xl font-display font-semibold text-primary">
                    {isManualQuoteState ? `$${pricing.total}*` : `$${pricing.total}`}
                  </span>
                </div>
                {isManualQuoteState && (
                  <span className="block text-[8.5px] font-mono text-on-surface-variant/60 text-right leading-none select-none">
                    *Pending official quote verification from crew head
                  </span>
                )}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 rounded-full border border-primary/20 hover:bg-surface-low font-display text-xs tracking-wider uppercase font-bold text-primary transition-all text-center"
                >
                  Return to Headquarters
                </button>
                <div className="p-0.5 rounded-full bg-accent inline-block">
                  <a
                    href="mailto:hello@getmeamaid.com"
                    className="block px-6 py-2.5 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-bold hover:opacity-90 transition-all text-center"
                  >
                    Contact Coordinator
                  </a>
                </div>
              </div>

            </motion.div>
          ) : (
            /* --- REGULAR MULTI STEP WIZARD --- */
            <motion.div
              key="wizard-root"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 start-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              
              {/* Form Config Left (Col 1-7) */}
              <div className="lg:col-span-8 space-y-8 bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/15 shadow-sm">
                
                {/* Header Information for the active section */}
                <div className="border-b border-outline-variant/10 pb-4 space-y-1">
                  <span className="font-mono text-[9px] tracking-widest text-secondary font-bold uppercase block">
                    STAGE OVERVIEW {currentStep} OF {bookingSteps.length}
                  </span>
                  <h1 className="font-display text-xl sm:text-2xl font-semibold text-primary">
                    {activeStepDetails?.name === 'Location' && "Verify Restoration Coordinates"}
                    {activeStepDetails?.name === 'Home' && "Tell us about your home"}
                    {activeStepDetails?.name === 'Service' && "Select Your Restoration Level"}
                    {activeStepDetails?.name === 'Frequency' && "Verify Maintenance Frequency"}
                    {activeStepDetails?.name === 'Add-ons' && "Select Custom Cleaning Add-ons"}
                    {activeStepDetails?.name === 'Schedule' && "Reserve Your Appointment Slot"}
                    {activeStepDetails?.name === 'Access Tools' && "Provide Home Entry Guidelines"}
                    {activeStepDetails?.name === 'About You' && "Create Account Contact Profile"}
                    {activeStepDetails?.name === 'Checkout' && "Authorize Secure Billing Card"}
                    {activeStepDetails?.name === 'Review' && "Dispatch Restoration Summary Details"}
                  </h1>
                </div>

                {/* --- CHUCK SLIDER OPTIONS DEPENDENTS --- */}
                <div className="min-h-[280px]">
                  
                  {/* Step 1: Location */}
                  {currentStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                        Specify the postal region forwarding code below to check our active cleaning rosters.
                      </p>
                      <div className="space-y-2 max-w-sm">
                        <label className="block text-xs font-semibold text-primary">Postal Forwarding Code</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                          <input
                            type="text"
                            maxLength={7}
                            value={postal}
                            onChange={(e) => setPostal(e.target.value.toUpperCase())}
                            className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs uppercase font-mono tracking-widest"
                            placeholder="M5V 2N8"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 max-w-sm">
                        <label className="block text-xs font-semibold text-primary">Home Metropolitan Hub</label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                        >
                          <option>Toronto Core (M-Codes)</option>
                          <option>Vancouver Metro (V-Codes)</option>
                          <option>Calgary Core (T-Codes)</option>
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Home */}
                  {currentStep === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      
                      {/* Structure Selection */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-primary">Residence Structure Layout</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Condominium', 'House / Estate', 'Townhouse / Duplex'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setHomeType(type)}
                              className={`py-3.5 px-3 rounded-xl border text-center font-display text-xs tracking-wider uppercase font-semibold transition-all cursor-pointer ${
                                homeType === type
                                  ? 'bg-secondary text-accent border-secondary shadow-sm'
                                  : 'border-outline-variant/20 hover:bg-surface-low text-primary'
                              }`}
                            >
                              {type === 'Condominium' && <Home className="w-4 h-4 mx-auto mb-1.5" />}
                              {type === 'House / Estate' && <Layers className="w-4 h-4 mx-auto mb-1.5" />}
                              {type === 'Townhouse / Duplex' && <Home className="w-4 h-4 mx-auto mb-1.5" />}
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dropdown counter selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-primary">Bedrooms Quantity</label>
                          <select
                            value={bedrooms === 0 ? '' : bedrooms}
                            onChange={(e) => setBedrooms(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                          >
                            <option value="" disabled>Select Bedrooms</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                              <option key={count} value={count}>{count} Bedroom{count > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-primary">Bathrooms Quantity</label>
                          <select
                            value={bathrooms === 0 ? '' : bathrooms}
                            onChange={(e) => setBathrooms(parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                          >
                            <option value="" disabled>Select Bathrooms</option>
                            {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6].map((count) => (
                              <option key={count} value={count}>{count} Bathroom{count > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Sq footage */}
                      <div className="space-y-2 max-w-sm">
                        <label className="block text-xs font-semibold text-primary">Estimated Reserving Area Size (Sq. Ft.)</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={squareFootage}
                            onChange={(e) => setSquareFootage(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none text-xs font-mono"
                            placeholder="e.g., 1200"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-on-surface-variant font-mono">SQ FT</span>
                        </div>
                        <span className="block text-[10px] text-on-surface-variant/70 font-mono">excluding basements unless requested</span>
                      </div>

                    </motion.div>
                  )}

                  {/* Step 3: Service Levels */}
                  {currentStep === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="font-sans text-xs text-on-surface-variant">Select Your Restoration Level: Choose standard routine curation, intense multi-hour scaling extraction, or thorough empty-home vertical sweeping.</p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {availableServices.map((suite) => {
                          const sTitle = suite.title || suite.name;
                          const isManual = suite.is_manual_quote === true;
                          const sPriceText = isManual ? 'Manual Quote Required' : `$${suite.base_price || 140}`;
                          return (
                            <div
                              key={sTitle}
                              onClick={() => setRestorationLevel(sTitle)}
                              className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                                restorationLevel === sTitle
                                  ? 'border-secondary bg-secondary/5' 
                                  : 'border-outline-variant/15 hover:bg-surface-low/50 bg-surface'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-display text-sm font-semibold text-primary block">{sTitle}</span>
                                  {isManual && (
                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/50 text-[8.5px] font-bold rounded uppercase tracking-wider font-mono">
                                      MANUAL QUOTE
                                    </span>
                                  )}
                                </div>
                                <p className="font-sans text-xs text-on-surface-variant/80">{suite.description || suite.short_description || suite.desc}</p>
                              </div>
                              <span className="font-display font-bold text-base text-primary shrink-0">{sPriceText}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Frequency */}
                  {currentStep === 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="font-sans text-xs text-on-surface-variant">Regular routine schedules authorize high discounts. You can cancel or pause billing details free up to 24 hours prior.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                          { freq: 'One-Time Diagnostic', discount: 'Base rate' },
                          { freq: 'Weekly', discount: 'Save 20%' },
                          { freq: 'Bi-weekly', discount: 'Save 15%' },
                          { freq: 'Monthly', discount: 'Save 5%' }
                        ].map((item) => (
                          <div
                            key={item.freq}
                            onClick={() => setFrequency(item.freq)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer text-center space-y-2 ${
                              frequency === item.freq
                                ? 'border-secondary bg-secondary/5'
                                : 'border-outline-variant/15 hover:bg-surface-low bg-surface'
                            }`}
                          >
                            <span className="font-display text-sm font-semibold text-primary block">{item.freq}</span>
                            <span className="inline-block px-2.5 py-1 rounded bg-[#85f6e5]/10 text-primary border border-secondary/15 font-mono text-[9px] font-bold uppercase">{item.discount}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Special Add-ons */}
                  {currentStep === 5 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="font-sans text-xs text-on-surface-variant">Customize cleaning inclusions recursively. Toggle checkboxes to authorize specific restoration tasks dynamically.</p>
                      
                      <div className="space-y-3">
                        {dynamicSelectableAddons.map((addon) => {
                          const isChecked = addons.includes(addon.id);
                          return (
                            <div
                              key={addon.id}
                              onClick={() => toggleAddon(addon.id)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                                isChecked 
                                  ? 'border-secondary bg-secondary/5' 
                                  : 'border-outline-variant/15 hover:bg-surface-low bg-surface'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                    isChecked ? 'bg-secondary text-accent' : 'border border-outline-variant/50'
                                  }`}>
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className="font-sans text-xs font-bold text-primary">{addon.label}</span>
                                </div>
                                <p className="font-sans text-[11px] text-on-surface-variant pl-6">{addon.desc}</p>
                              </div>
                              <span className="font-mono text-xs font-bold text-primary shrink-0">+${addon.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Schedule picking */}
                  {currentStep === 6 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <p className="font-sans text-xs text-on-surface-variant">Reserve Your Appointment Slot: Select an available date and optimal timeframe for the systematic restoration sweep.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        
                        {/* Simulation Calendars selectors */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-primary">Select Available Date</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['June 10, 2026', 'June 11, 2026', 'June 12, 2026', 'June 15, 2026', 'June 16, 2026', 'June 17, 2026'].map((date) => (
                              <button
                                key={date}
                                type="button"
                                onClick={() => setSelectedDate(date)}
                                className={`py-3 px-2 rounded-lg border text-center font-mono text-[10.5px] font-bold tracking-tight cursor-pointer transition-all ${
                                  selectedDate === date
                                    ? 'bg-secondary text-accent border-secondary'
                                    : 'border-outline-variant/20 hover:bg-surface-low text-primary bg-surface-lowest'
                                }`}
                              >
                                {date}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Clock Hours selectors */}
                        <div className="space-y-3">
                          <label className="block text-xs font-semibold text-primary">Predefined Crew Arrival Windows</label>
                          {['09:00 AM - 01:00 PM (Morning Slot)', '01:00 PM - 05:00 PM (Afternoon Slot)', '05:00 PM - 09:00 PM (Twilight Care)'].map((slot) => (
                            <div
                              key={slot}
                              onClick={() => setSelectedTimeSlot(slot)}
                              className={`p-3 rounded-xl border text-xs cursor-pointer block text-left transition-all ${
                                selectedTimeSlot === slot
                                  ? 'border-secondary bg-secondary/5 font-semibold text-primary'
                                  : 'border-outline-variant/15 hover:bg-surface-low text-on-surface-variant bg-surface'
                              }`}
                            >
                              {slot}
                            </div>
                          ))}
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {/* Step 7: Entry Access notes */}
                  {currentStep === 7 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <p className="font-sans text-xs text-on-surface-variant">Provide Home Entry Guidelines: Detail secure protocols to access the locks. Our crew holds background clearances for key management safely.</p>
                      
                      <div className="space-y-2 max-w-md">
                        <label className="block text-xs font-semibold text-primary">Core Access Method</label>
                        <select
                          value={entryMethod}
                          onChange={(e) => setEntryMethod(e.target.value)}
                          className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                        >
                          <option>Provide lockbox key coordinates</option>
                          <option>Leave fob coordinate at front concierge office</option>
                          <option>Resident present at the property</option>
                        </select>
                      </div>

                      {entryMethod === 'Provide lockbox key coordinates' && (
                        <div className="space-y-1.5 max-w-md">
                          <label className="block text-xs font-semibold text-primary">Lockbox Code & Precise Instructions</label>
                          <textarea
                            value={customKeyNotes}
                            onChange={(e) => setCustomKeyNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                            placeholder="e.g., Code is 1234. Box is on the grey water mains left of front door..."
                          />
                        </div>
                      )}

                      <div className="space-y-1.5 max-w-md">
                        <label className="block text-xs font-semibold text-primary">Special Instruction Inclusions</label>
                        <textarea
                          value={customerSpecialNotes}
                          onChange={(e) => setCustomerSpecialNotes(e.target.value)}
                          rows={2}
                          className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs font-sans"
                          placeholder="e.g., Please treat marble vanity with extreme caution, use no citrus oil there..."
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 8: About You (Contact Profile) */}
                  {currentStep === 8 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <p className="font-sans text-xs text-on-surface-variant">Create Account Contact Profile: Provide details to register dispatched schedules and send dynamic checklist receipts directly.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-primary">First Name</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                            placeholder="Jean-Paul"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-primary">Last Name</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                            placeholder="Leclerc"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-primary">Email Address</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs"
                            placeholder="j.leclerc@gmail.com"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-primary">Phone Number</label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none focus:border-secondary text-xs font-mono"
                            placeholder="+1 (416) 555-0149"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 9: Checkout Payment */}
                  {currentStep === 9 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      
                      {/* Trust disclaimer */}
                      <div className="p-3 rounded-xl bg-secondary/5 border border-secondary/25 text-primary text-xs flex gap-2 items-start max-w-lg leading-relaxed font-sans">
                        <ShieldCheck className="w-5 h-5 text-secondary shrink-0" />
                        <span>Highly secure tokenized checkout authorization. No physical charges occur until 24 hours subsequent to the completed sweep.</span>
                      </div>

                      <div className="space-y-3 max-w-md">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-primary font-sans">Name on Card</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none text-xs"
                              placeholder="Jean-Paul Leclerc"
                            />
                            <User className="absolute right-3.5 top-3.5 w-4 h-4 text-on-surface-variant/40" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-primary">Secure Card Number</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={cardNumber}
                              onChange={(e) => setCardNumber(e.target.value)}
                              className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none text-xs font-mono"
                              placeholder="4530 0019 4432 0192"
                            />
                            <CreditCard className="absolute right-3.5 top-3.5 w-4 h-4 text-on-surface-variant/40" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-primary">Expiry Date</label>
                            <input
                              type="text"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none text-xs font-mono"
                              placeholder="MM/YY"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-primary">CVV / CVC Security</label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardCVC}
                              onChange={(e) => setCardCVC(e.target.value)}
                              className="w-full px-4 py-3 bg-surface border border-outline-variant/20 rounded-xl focus:outline-none text-xs font-mono"
                              placeholder="***"
                            />
                          </div>
                        </div>
                      </div>

                    </motion.div>
                  )}

                  {/* Step 10: Final Review invoice before submitting */}
                  {currentStep === 10 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <p className="font-sans text-xs text-on-surface-variant">Review all selected suite configurations. Clicking Dispatch will authenticate your slot instantly.</p>
                      
                      {/* Grid Review specs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface-low p-5 rounded-2xl border border-outline-variant/15 text-xs font-sans text-on-surface-variant font-medium">
                        
                        <div>
                          <span className="block text-[9px] font-mono text-on-surface-variant/50 uppercase">TARGET LOCATION HUB</span>
                          <span>{postal} ({city})</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-mono text-on-surface-variant/50 uppercase font-medium">RESIDENCE DETAILS</span>
                          <span>{homeType} ({bedrooms} Bed / {bathrooms} Bath)</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-mono text-on-surface-variant/50 uppercase">RESTORATION SPEED</span>
                          <span className="font-semibold text-primary">{restorationLevel} ({frequency})</span>
                        </div>
                        <div>
                          <span className="block text-[9px] font-mono text-on-surface-variant/50 uppercase">SCHEDULE DAY</span>
                          <span>{selectedDate} at {selectedTimeSlot.split(' ')[0]}</span>
                        </div>
                        <div className="col-span-1 sm:col-span-2">
                          <span className="block text-[9px] font-mono text-on-surface-variant/50 uppercase font-medium">SECURE ENTRY DETAILS</span>
                          <span>{entryMethod} - {customKeyNotes || "Meticulous entry instructions logged"}</span>
                        </div>

                      </div>
                    </motion.div>
                  )}

                </div>

                {/* Foot Navigation controls */}
                <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBackStep}
                    disabled={currentStep === 1}
                    className={`px-5 py-3 rounded-full text-xs font-display tracking-wider uppercase font-bold transition-all ${
                      currentStep === 1
                        ? 'text-on-surface-variant/20 bg-transparent'
                        : 'border border-primary/20 hover:bg-surface text-primary cursor-pointer'
                    }`}
                  >
                    Back Step
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleNextStep}
                    className="px-6 py-3 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-extrabold hover:opacity-95 shadow-sm active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>
                      {submitting 
                        ? (isManualQuoteState ? 'Requesting...' : 'Dispatching...') 
                        : currentStep === 10 
                          ? (isManualQuoteState ? 'Request High-Touch Estimation Quote' : 'Lock-In Estimation & Book') 
                          : 'Next Step'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

              {/* Sidebar Booking Summary right (Col 8-12) */}
              <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-surface-lowest p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-5 sticky top-28">
                  <div className="border-b border-outline-variant/10 pb-3 flex justify-between items-center bg-transparent">
                    <span className="font-display text-xs tracking-widest uppercase font-bold text-primary">Booking Summary</span>
                    <span className="font-mono text-[9px] text-on-surface-variant/60">GET ME A MAID ESTIMATION</span>
                  </div>

                  {/* Summary list */}
                  <div className="space-y-3 text-xs text-on-surface-variant">
                    
                    {restorationLevel && (
                      <div className="flex justify-between">
                        <span className="font-sans inline-flex items-center gap-1.5 font-medium text-on-surface-variant">Residential Suite Choice</span>
                        <span className="font-mono text-[11px] font-bold text-primary">{restorationLevel}</span>
                      </div>
                    )}

                    {(bedrooms > 0 || bathrooms > 0) && (
                      <div className="flex justify-between">
                        <span className="font-sans font-medium text-on-surface-variant">Dimensions Details</span>
                        <span className="font-mono text-[11px] text-primary">{bedrooms || 0} Bedrooms, {bathrooms || 0} Bathrooms</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="font-sans font-medium text-on-surface-variant">Frequency Schedule</span>
                      <span className="font-mono text-[11px] font-bold text-secondary uppercase">{frequency}</span>
                    </div>

                    {addons.length > 0 && (
                      <div className="pt-2 border-t border-outline-variant/10 space-y-1">
                        <span className="block text-[9px] font-mono tracking-widest font-bold text-on-surface-variant/60 uppercase">DURABLE INCLUSIONS ADDITIONS:</span>
                        {dynamicSelectableAddons.filter(item => addons.includes(item.id)).map(item => (
                          <div key={item.id} className="flex justify-between text-[11px] font-sans">
                            <span className="text-on-surface-variant/85 inline-flex items-center gap-1">
                              <Plus className="w-3 h-3 text-secondary" />
                              {item.label.split(' ').slice(0, 3).join(' ')}...
                            </span>
                            <span className="font-mono text-primary">+${item.price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {pricing.frequencyDiscount > 0 && (
                      <div className="flex justify-between text-[11px] text-secondary border-t border-outline-variant/10 pt-2 font-semibold">
                        <span>Frequentation Discount Credit</span>
                        <span className="font-mono">-${pricing.frequencyDiscount}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-outline-variant/10 space-y-2 text-[11px] font-sans">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant/70">Subtotal Price</span>
                        <span className="font-mono text-primary">${pricing.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant/70">Insurance Trust Fee (5%)</span>
                        <span className="font-mono text-primary">${pricing.serviceFee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant/70">Provincial Tax GST/HST (13%)</span>
                        <span className="font-mono text-primary">${pricing.tax}</span>
                      </div>
                    </div>

                    {/* Total Authorization Cost box */}
                    <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-baseline font-display">
                      <span className="text-xs font-bold text-primary uppercase">
                        {isManualQuoteState ? 'Est. Pre-Quote (*Manual)' : 'Estimated Total Cost'}
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-primary font-semibold">${pricing.total}</span>
                        {isManualQuoteState ? (
                          <span className="block text-[7.5px] text-amber-600 font-bold uppercase font-mono tracking-wider">PENDING CREW VERIFY</span>
                        ) : (
                          <span className="block text-[8px] text-on-surface-variant/50 font-mono">/ session</span>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Bonded trust logo */}
                  <div className="pt-3 border-t border-outline-variant/10 text-[10px] text-on-surface-variant/60 font-sans flex items-center justify-center gap-1.5 leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                    <span>Calculations verified under standard core frameworks.</span>
                  </div>

                </div>

              </div>
              
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-mono text-xs">LOADING ATELIER SCHEDULING MODULE...</div>}>
      <BookingWizardContent />
    </Suspense>
  );
}
