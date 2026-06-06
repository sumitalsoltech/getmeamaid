'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, CheckCircle, ArrowRight, ShieldCheck, MapPin, 
  Layers, Package, RefreshCw, Star, ArrowUpRight, Award, 
  HelpCircle, Gift, Heart, Send, Check
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

// City details
const cities = [
  {
    name: "Toronto Core",
    desc: "Metropolitan Restorations & Executive Maintenance Loft Sweepings.",
    postalMatch: "M",
    image: "https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&q=80&w=800",
    href: "/locations/toronto",
    active: true
  },
  {
    name: "Vancouver Metro",
    desc: "Oceanfront Eco-Botanical Sanitation & Condo Deep Cleansing.",
    postalMatch: "V",
    image: "https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&q=80&w=800",
    href: "/#locations",
    active: false
  },
  {
    name: "Calgary Area",
    desc: "Foothills Dust Curation & High-Slab Hearth Sanitization.",
    postalMatch: "T",
    image: "https://images.unsplash.com/photo-1534017354672-ec8531e21b0d?auto=format&fit=crop&q=80&w=800",
    href: "/#locations",
    active: false
  }
];

// Service suite details fallback
const DEFAULT_SUITE_OPTIONS = [
  {
    badge: "Most Requested",
    title: "Standard Maintenance Curation",
    tagline: "The Routine Luxury Calibration",
    priceText: "From $140/session",
    desc: "A meticulous maintenance sweeps encompassing dusting, bespoke organizing, systematic vacuuming, sanitizing high-touch surfaces, and precision bathroom polishing. Ideal for modern, premium homes requiring periodic high-fidelity upkeep.",
    duration: "2.5 - 4 Hours",
    highlights: ["Scent choice: Fresh Herb or Bergamot Citrus", "Precision alignment of textiles", "Double-polished metal faucets"]
  },
  {
    badge: "Signature Premium",
    title: "Deep Restoration Suite",
    tagline: "Scientific Hand-Detailed Revivification",
    priceText: "From $210/session",
    desc: "An exhaustive physical overhaul targeting cumulative dust, deep lime and mold remediation, vents detailing, grout deep scrubbing, window-interior polishing, and inside-appliance curations based on diagnostic requirements.",
    duration: "4 - 7 Hours",
    highlights: ["Scientific-grade localized extraction", "100% steam grout cleaning", "Complete door frame & baseboard detailing"],
    highlighted: true
  },
  {
    badge: "Seamless Handover",
    title: "Move In / Out Choreography",
    tagline: "Total Ground-Up Sanitization",
    priceText: "From $340/session",
    desc: "Designed for buyers, renters, and listing agents. We curate complete vertical extraction, inside all shelves, drawers, cabinets, closets, detailing of vents, appliance resets, and standard wall spot cleansing to verify a spotless standard.",
    duration: "5 - 9 Hours",
    highlights: ["Meticulous empty drawer disinfection", "Oven & Fridge detailing included", "Full-spectrum air purification sweep"]
  },
  {
    badge: "getmeamaid Standard",
    title: "Post-Stay Airbnb Care",
    tagline: "Five-Star Rating Alignment",
    priceText: "Custom Bespoke",
    desc: "Bespoke professional turnovers tailored to elite short-term rental operators. Includes customized linen setups, hospitality detailing, amenity replenishment tracking, digital photos verification, and immediate damage flagging.",
    duration: "2.5 - 3.5 Hours",
    highlights: ["Full laundry integration options", "Hospitality toilet-paper seals", "Restoration visual logs for owners"]
  }
];

export default function Home() {
  const router = useRouter();

  const [suiteOptions, setSuiteOptions] = useState<any[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.success && data.services && data.services.length > 0) {
          const mapped = data.services.map((s: any) => {
            let parsedIncluded = [];
            try {
              parsedIncluded = s.included_items ? (typeof s.included_items === 'string' ? JSON.parse(s.included_items) : s.included_items) : [];
            } catch (e) {
              parsedIncluded = [];
            }
            if (!Array.isArray(parsedIncluded)) parsedIncluded = [];

            return {
              id: s.id,
              badge: s.is_featured ? "Most Requested" : "getmeamaid Standard",
              title: s.title || s.name,
              tagline: s.is_manual_quote ? "High-Touch Estimation" : "Instant Estimation",
              priceText: s.is_manual_quote ? "Manual Estimation Required" : `From $${s.base_price || 140}/session`,
              desc: s.description || s.short_description || "",
              highlights: parsedIncluded.length > 0 ? parsedIncluded.slice(0, 3) : ["Premium sanitization sweep", "Aqueous ozone standard", "Triple microfiber polish"],
              highlighted: s.is_featured === true,
              is_manual_quote: s.is_manual_quote === true,
              image: s.image || ""
            };
          });
          setSuiteOptions(mapped);
        } else {
          setSuiteOptions(DEFAULT_SUITE_OPTIONS);
        }
      } catch (err) {
        console.error("Error fetching homepage services:", err);
        setSuiteOptions(DEFAULT_SUITE_OPTIONS);
      }
    };
    fetchServices();
  }, []);

  // Postal Code Check State
  const [postalCode, setPostalCode] = useState('');
  const [postalChecked, setPostalChecked] = useState(false);
  const [postalResult, setPostalResult] = useState<{
    valid: boolean;
    city?: string;
    msg: string;
  } | null>(null);

  // Estimator States
  const [homeType, setHomeType] = useState('Apartment / Condo');
  const [beds, setBeds] = useState(2);
  const [baths, setBaths] = useState(2);
  const [frequency, setFrequency] = useState('Bi-weekly');

  // Gift Card States
  const [giftAmount, setGiftAmount] = useState(250);
  const [customGiftAmount, setCustomGiftAmount] = useState('');
  const [giftFrom, setGiftFrom] = useState('');
  const [giftTo, setGiftTo] = useState('');
  const [giftEmail, setGiftEmail] = useState('');
  const [giftBought, setGiftBought] = useState(false);
  const [buyingGift, setBuyingGift] = useState(false);
  const [giftCardError, setGiftCardError] = useState('');

  // Real-Time Pricing State and CMS state
  const [estimatePrice, setEstimatePrice] = useState(180);
  const [cms, setCms] = useState<any>(null);

  // Load Content Management Configurations
  useEffect(() => {
    fetch('/api/cms')
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch CMS data');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.cms) {
          setCms(data.cms);
        }
      })
      .catch(err => console.error('Error loading CMS data:', err));
  }, []);

  // Poll real-time values from dynamic admin-defined pricing rules
  useEffect(() => {
    fetch('/api/pricing/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceLevel: 'Standard Maintenance Curation',
        bedrooms: beds,
        bathrooms: baths,
        homeType: homeType,
        addons: [],
        urgency: 'Normal'
      })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch pricing calculation');
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.priceBreakdown) {
          let amt = data.priceBreakdown.subtotal;
          // Apply frequency discount multipliers from pricing rule specs
          if (frequency.includes('Weekly')) amt = Math.round(amt * 0.8);
          else if (frequency.includes('Bi-weekly')) amt = Math.round(amt * 0.85);
          else if (frequency.includes('Monthly')) amt = Math.round(amt * 0.95);
          setEstimatePrice(amt);
        }
      })
      .catch(err => console.error('Estimate calculation fail:', err));
  }, [homeType, beds, baths, frequency]);


  // Handle Postal Validation
  const handlePostalCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode.trim()) return;

    const code = postalCode.trim().toUpperCase();
    const firstChar = code.charAt(0);

    setPostalChecked(true);

    if (firstChar === 'M') {
      setPostalResult({
        valid: true,
        city: 'Toronto Core',
        msg: 'Service active! We have active slots in Toronto.'
      });
    } else if (firstChar === 'V') {
      setPostalResult({
        valid: true,
        city: 'Vancouver Metro',
        msg: 'Service active! Secure booking online.'
      });
    } else if (firstChar === 'T') {
      setPostalResult({
        valid: true,
        city: 'Calgary Area',
        msg: 'Service active! Select standard or restoring suites.'
      });
    } else {
      setPostalResult({
        valid: false,
        msg: 'We are currently outside this zone. Leave an email below to vote.'
      });
    }
  };

  const handleBookRedirect = () => {
    // Save params in local state/session to pass to booking path
    const queryParams = new URLSearchParams({
      homeType,
      beds: beds.toString(),
      baths: baths.toString(),
      frequency,
      price: estimatePrice.toString()
    });
    router.push(`/book?${queryParams.toString()}`);
  };

  const buyGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftFrom || !giftTo || !giftEmail) return;
    setBuyingGift(true);
    setGiftCardError('');

    try {
      const response = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: giftAmount,
          fromName: giftFrom,
          toName: giftTo,
          recipientEmail: giftEmail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server rejected the gift card voucher purchase.');
      }

      setGiftBought(true);
      setTimeout(() => {
        setGiftBought(false);
        setGiftFrom('');
        setGiftTo('');
        setGiftEmail('');
      }, 7000);
    } catch (err: any) {
      console.error('Gift card purchase error:', err);
      setGiftCardError(err.message || 'System failed to purchase gift voucher.');
      alert(err.message || 'Error occurred while saving/emailing gift voucher.');
    } finally {
      setBuyingGift(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-accent selection:text-primary overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 lg:pt-32 lg:pb-24">
        {/* Subtle decorative mesh background */}
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_top_right] from-secondary-fixed/15 via-transparent to-transparent opacity-80 pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(var(--color-outline-variant) 0.5px, transparent 0.5px)", backgroundSize: "24px 24px" }}></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-low border border-outline-variant/15 font-mono text-[10px] sm:text-xs text-secondary-fixed text-primary tracking-wide uppercase">
                <Sparkles className="w-3 H-3 text-secondary" />
                <span>getmeamaid Premium Home Curation</span>
              </div>
              
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] text-primary">
                {cms?.hero?.status === 'published' ? cms.hero.heading : (
                  <>Professional Cleaning Services You Can <span className="text-secondary italic">Depend On</span></>
                )}
              </h1>
              
              <p className="font-sans text-sm sm:text-base lg:text-lg text-on-surface-variant leading-relaxed max-w-2xl">
                {cms?.hero?.status === 'published' ? cms.hero.subheading : "A systematic, clinical approach to restoration. Designed for modern living, budgeted dynamically, and calibrated in exquisite details for Toronto, Vancouver, and Calgary homes."}
              </p>
            </motion.div>

            {/* Postal Code Coverage Check Widget */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-surface-lowest p-5 rounded-2xl border border-outline-variant/15 shadow-sm max-w-xl"
            >
              <span className="block font-display text-[11px] tracking-widest uppercase font-bold text-on-surface-variant mb-3">
                Verify Editorial Coverage In Your Core
              </span>
              
              <form onSubmit={handlePostalCheck} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                  <input
                    type="text"
                    placeholder="Enter postal code (e.g., M5V 2N8)"
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      setPostalChecked(false);
                    }}
                    maxLength={7}
                    className="w-full pl-11 pr-4 py-3.5 rounded-full bg-surface border border-outline-variant/30 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none tracking-widest uppercase font-mono transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-full bg-primary text-surface font-display text-xs tracking-widest uppercase font-bold hover:bg-secondary cursor-pointer hover:shadow-md transition-all shrink-0 active:scale-95"
                >
                  Check Availability
                </button>
              </form>

              <AnimatePresence mode="wait">
                {postalChecked && postalResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden text-xs"
                  >
                    <div className={cn(
                      "p-3 rounded-xl border flex items-center gap-2",
                      postalResult.valid 
                        ? "bg-secondary/5 border-secondary/25 text-primary" 
                        : "bg-red-500/5 border-red-500/25 text-red-700"
                    )}>
                      {postalResult.valid ? (
                        <CheckCircle className="w-4 h-4 text-secondary shrink-0" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                      )}
                      <div className="flex-1">
                        <span className="font-semibold">{postalResult.msg}</span>
                        {postalResult.valid && postalResult.city === 'Toronto Core' && (
                          <Link href="/locations/toronto" className="underline ml-2 font-bold hover:text-secondary inline-flex items-center gap-0.5">
                            View Toronto Standard <ArrowUpRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Quick trust metric badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-6 pt-4 text-xs font-mono text-on-surface-variant/80"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary" />
                <span>Bonded & Insolvent insured</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-secondary" />
                <span>Elite 4.98 average rating</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-secondary" />
                <span>100% Eco-Botanical Safe</span>
              </div>
            </motion.div>
          </div>

          {/* Quick Modern Graphic - Clinical Cleaning Card Showcase */}
          <div className="lg:col-span-5 relative flex justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative w-full max-w-md aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border border-secondary-fixed/5"
            >
              <img
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800"
                alt="Architectural space curated beautifully by our cleaning standards"
                className="w-full h-full object-cover brightness-95"
              />
              {/* Overlaid glass card detailing the standard alignment */}
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
              
              {/* Dynamic stats banner */}
              <div className="absolute top-6 left-6 right-6 p-4 rounded-2xl bg-surface-lowest/80 backdrop-blur-md border border-surface-lowest/30 shadow-lg flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-mono tracking-widest text-on-surface-variant uppercase">RESTORE LEVEL</span>
                  <span className="font-display text-sm font-semibold text-primary">Micro-Extraction Standard</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-accent text-primary text-[10px] font-bold font-mono">
                  VERIFIED
                </span>
              </div>

              {/* Standard Alignment Checklist banner */}
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-primary/90 text-surface backdrop-blur-sm border border-surface/10 space-y-3">
                <div className="flex justify-between items-center border-b border-surface/10 pb-2">
                  <span className="font-display text-xs font-bold tracking-wider uppercase text-accent">Anatomy of the Curation</span>
                  <span className="font-mono text-[9px] text-surface-low">SUITE 02-B</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-surface-low/90">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span>UV Sanitized Keys</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span>Linen Fold Alignment</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span>Double HEPA filtration</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-accent" />
                    <span>HEPA extraction air</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Pricing Estimator Section */}
      <section id="pricing-calculator" className="bg-surface-low py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Context Left */}
            <div className="lg:col-span-5 space-y-6">
              <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
                ATELIER VALUATION TOOL
              </span>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-primary">
                Instant Pricing, Formulated in Real-Time
              </h2>
              <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                Determine your standard curation pricing dynamically. Using precise configurations for space and restoration frequencies, we produce verified estimations—with no hidden line-items or sudden premiums.
              </p>
              
              <div className="space-y-4 pt-4 border-t border-outline-variant/15 text-xs">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-primary block">Bespoke Adjustments Included</span>
                    <span className="text-on-surface-variant/85">Modify cleaning schedules or add meticulous restoration details at any time prior to 24 hours of execution.</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-primary block">Strategic Eco-Supplies Included</span>
                    <span className="text-on-surface-variant/85">Our cleaners bring custom-blended, plant-essential oil cleaning recipes that treat all premium architectural material gently.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Interactive Pricing Suite Form Right */}
            <div className="lg:col-span-7 bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/15 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-outline-variant/15 pb-4">
                <span className="font-display text-xs tracking-widest uppercase font-bold text-primary">
                  Curation Parameters
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant/70">
                  REAL-TIME QUOTE FOR CALGARY, TORONTO & VANCOUVER
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Home Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-primary">Residence Layout</label>
                  <select
                    value={homeType}
                    onChange={(e) => setHomeType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/20 focus:outline-none focus:border-secondary text-xs transition-colors"
                  >
                    <option>Apartment / Condo</option>
                    <option>House / Estate</option>
                    <option>Townhouse / Duplex</option>
                    <option>Office / Commercial</option>
                  </select>
                </div>

                {/* Restoration Frequency */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-primary">Interval Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/20 focus:outline-none focus:border-secondary text-xs transition-colors"
                  >
                    <option>One-Time Diagnostic</option>
                    <option>Weekly (Save 20%)</option>
                    <option>Bi-weekly (Save 15%)</option>
                    <option>Monthly (Save 5%)</option>
                  </select>
                </div>
              </div>

              {/* Beds & Baths Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                
                {/* Bedrooms slide/counter */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-primary">Bedrooms</span>
                    <span className="font-mono text-secondary-fixed text-primary font-bold">{beds} Bed{beds > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBeds(Math.max(1, beds - 1))}
                      className="w-9 h-9 rounded-full bg-surface-low border border-outline-variant/20 flex items-center justify-center font-bold hover:bg-outline-variant/10 text-xs transition-all"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={beds}
                      onChange={(e) => setBeds(parseInt(e.target.value))}
                      className="flex-1 accent-secondary h-1.5 rounded-full"
                    />
                    <button
                      onClick={() => setBeds(Math.min(8, beds + 1))}
                      className="w-9 h-9 rounded-full bg-surface-low border border-outline-variant/20 flex items-center justify-center font-bold hover:bg-outline-variant/10 text-xs transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Bathrooms slide/counter */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-primary">Bathrooms</span>
                    <span className="font-mono text-secondary-fixed text-primary font-bold">{baths} Bath{baths > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBaths(Math.max(1, baths - 1))}
                      className="w-9 h-9 rounded-full bg-surface-low border border-outline-variant/20 flex items-center justify-center font-bold hover:bg-outline-variant/10 text-xs transition-all"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={baths}
                      onChange={(e) => setBaths(parseInt(e.target.value))}
                      className="flex-1 accent-secondary h-1.5 rounded-full"
                    />
                    <button
                      onClick={() => setBaths(Math.min(6, baths + 1))}
                      className="w-9 h-9 rounded-full bg-surface-low border border-outline-variant/20 flex items-center justify-center font-bold hover:bg-outline-variant/10 text-xs transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>

              </div>

              {/* Price Calculation Output Display Banner */}
              <div className="mt-8 p-6 rounded-2xl bg-primary text-surface grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="block text-[10px] font-mono tracking-widest text-[#85f6e5] uppercase font-bold">ESTIMATED VALUATION</span>
                  <div className="flex items-baseline justify-center sm:justify-start gap-1">
                    <span className="text-3xl font-display font-semibold text-surface-lowest">${estimatePrice}</span>
                    <span className="text-xs text-surface-low/70">/ session</span>
                  </div>
                  <span className="block text-[10px] text-surface-low/60 font-mono">excluding tax & dynamic custom additions</span>
                </div>
                <div>
                  <button
                    onClick={handleBookRedirect}
                    className="w-full py-4 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-accent/15"
                  >
                    Lock-In Estimation & Book
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Local Coverage Section */}
      <section id="locations" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              METROPOLITAN PRESENCE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
              Metropolitan Editorial Coverage Areas
            </h2>
            <p className="font-sans text-sm text-on-surface-variant">
              We operate strictly structured, high-efficiency teams in major executive urban corridors across Canada. Explore localized services and reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {cities.map((city, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => {
                  if (city.active) {
                    router.push(city.href);
                  }
                }}
                className={cn(
                  "group relative cursor-pointer rounded-2xl overflow-hidden shadow-sm border border-outline-variant/15 bg-surface-lowest hover:shadow-xl transition-all duration-300",
                  !city.active && "opacity-85"
                )}
              >
                <div className="relative aspect-[3/2] overflow-hidden">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent"></div>
                  
                  {city.active ? (
                    <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-accent text-primary text-[10px] font-bold font-mono tracking-widest uppercase">
                      ACTIVE SITES
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-surface-low/80 backdrop-blur-sm text-on-surface-variant text-[10px] font-bold font-mono tracking-widest uppercase border border-outline-variant/20">
                      VOTING ACTIVE
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display text-base font-semibold text-primary">{city.name}</h3>
                    {city.active && (
                      <ArrowUpRight className="w-4 h-4 text-on-surface-variant/80 group-hover:text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    )}
                  </div>
                  <p className="font-sans text-xs text-on-surface-variant/85 leading-relaxed">
                    {city.desc}
                  </p>
                  
                  {city.active ? (
                    <div className="pt-2">
                      <span className="text-[10px] font-mono font-bold text-secondary uppercase hover:underline">
                        Explore Local Toronto Office &rarr;
                      </span>
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-on-surface-variant/50 uppercase">
                        Requires 100 More Votes
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Thank you for voting for ${city.name}!`);
                        }}
                        className="px-2.5 py-1 rounded border border-outline-variant/30 text-[10px] hover:bg-surface-low tracking-widest uppercase font-bold"
                      >
                        Vote City
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* The Service Suites grid */}
      <section id="services" className="bg-surface-lowest border-y border-outline-variant/10 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-4">
              <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
                ATELIER OFFERS
              </span>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-primary">
                Curated Architectural Service Suites
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Whether seeking executive ongoing upkeep or rigorous diagnostic restoration before a move, our cleaners complete detailed checklists with an unwavering standard of quality.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {suiteOptions.map((suite, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-6 sm:p-8 rounded-2xl border flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-lg relative overflow-hidden",
                  suite.highlighted 
                    ? "border-secondary bg-surface-low" 
                    : "border-outline-variant/15 bg-surface-lowest"
                )}
              >
                {suite.highlighted && (
                  <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none overflow-hidden">
                    <div className="absolute top-6 -right-10 w-36 py-1 bg-secondary text-accent text-center font-mono text-[8.5px] font-bold tracking-widest uppercase transform rotate-45">
                      FEATURED
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      suite.highlighted ? "bg-secondary text-accent" : "bg-primary/5 text-primary"
                    )}>
                      {React.createElement(suite.icon || [Sparkles, Layers, Package, RefreshCw][idx % 4] || Sparkles, { className: "w-5 h-5" })}
                    </div>
                    <span className="font-mono text-[9px] tracking-widest font-extrabold text-on-surface-variant/75 uppercase block">
                      {suite.badge}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-display text-lg font-semibold text-primary">{suite.title}</h3>
                    <p className="font-mono text-[10px] tracking-widest font-bold text-secondary uppercase">{suite.tagline}</p>
                  </div>

                  <p className="font-sans text-xs text-on-surface-variant/90 leading-relaxed">
                    {suite.desc}
                  </p>

                  <ul className="space-y-2 pt-2 border-t border-outline-variant/10">
                    {suite.highlights.map((hlt: string, hIdx: number) => (
                      <li key={hIdx} className="flex items-center gap-2 font-sans text-xs text-on-surface-variant">
                        <Check className="w-4 h-4 text-secondary shrink-0" />
                        <span>{hlt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-outline-variant/10 flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-mono tracking-wider text-on-surface-variant uppercase">RESTORE ESTIMATE</span>
                    <span className="font-display text-sm font-semibold text-primary">{suite.priceText}</span>
                  </div>

                  {suite.href ? (
                    <Link
                      href={suite.href}
                      className={cn(
                        "px-4.5 py-2.5 rounded-full font-display text-xs tracking-wider uppercase font-bold text-center inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:shadow-md",
                        suite.highlighted 
                          ? "bg-primary text-surface hover:bg-secondary" 
                          : "bg-surface-low text-primary hover:bg-outline-variant/15"
                      )}
                    >
                      <span>Explore Suite Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={handleBookRedirect}
                      className={cn(
                        "px-4.5 py-2.5 rounded-full font-display text-xs tracking-wider uppercase font-bold text-center inline-flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:shadow-md",
                        suite.highlighted 
                          ? "bg-primary text-surface hover:bg-secondary" 
                          : "bg-surface-low text-primary hover:bg-outline-variant/15"
                      )}
                    >
                      <span>Reserve Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* The Three-Step Transformation Section */}
      <section className="py-20 lg:py-28 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-16">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              OPERATIONAL FIDELITY
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
              The Three-Step Transformation
            </h2>
            <p className="font-sans text-sm text-on-surface-variant">
              How we take an executive space and restore get me a maid clarity systematically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            
            {cms?.howItWorks?.filter((s: any) => s.is_active).length > 0 ? (
              cms.howItWorks
                .filter((s: any) => s.is_active)
                .sort((a: any, b: any) => a.display_order - b.display_order)
                .map((step: any, idx: number) => (
                  <div key={step.id || idx} className="p-6 bg-surface-lowest rounded-2xl border border-outline-variant/15 shadow-sm space-y-4 flex flex-col relative z-10 justify-between">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-4xl text-secondary/15 font-extrabold">0{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded bg-primary/5 text-primary font-mono text-[9px] font-bold">STAGE 0{idx + 1}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-primary">{step.title}</h3>
                      <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-outline-variant/10">
                      <span className="text-[10px] font-mono text-on-surface-variant/60 block">STANDARD PROTOCOL</span>
                    </div>
                  </div>
                ))
            ) : (
              <>
                {/* Step 1 */}
                <div className="p-6 bg-surface-lowest rounded-2xl border border-outline-variant/15 shadow-sm space-y-4 flex flex-col relative z-10 justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-4xl text-secondary/15 font-extrabold">01</span>
                      <span className="px-2 py-0.5 rounded bg-primary/5 text-primary font-mono text-[9px] font-bold">PRE-DIAGNOSTIC</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-primary">Systemmatic Assessment</h3>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      We verify your space dimensions, room count, and focus-specific diagnostic inclusions (e.g., lime buildup, lint extractions, or high skylights detailing) to structure the crew deployment perfectly.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-outline-variant/10">
                    <span className="text-[10px] font-mono text-on-surface-variant/60 block">VERIFIED CRITERIA MAPS</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-6 bg-surface-lowest rounded-2xl border border-outline-variant/15 shadow-sm space-y-4 flex flex-col relative z-10 justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-4xl text-secondary/15 font-extrabold">02</span>
                      <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-mono text-[9px] font-bold">THE SWEEP</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-primary">The Clinical Restoration</h3>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      Our strategic, background-checked staff sweeps systematically through designated zones—applying precise material care for marble, stone, walnut, brass, and glass using eco-ethical botanical solutions.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-outline-variant/10">
                    <span className="text-[10px] font-mono text-on-surface-variant/60 block">ZERO HARSH CHEMICAL FUMES</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-6 bg-surface-lowest rounded-2xl border border-outline-variant/15 shadow-sm space-y-4 flex flex-col relative z-10 justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-4xl text-secondary/15 font-extrabold">03</span>
                      <span className="px-2 py-0.5 rounded bg-accent/30 text-primary font-mono text-[9px] font-bold font-semibold">HANDOVER</span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-primary">Signature Finish Audit</h3>
                    <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                      The crew Lead inspects visual alignments: drapery settings, bedding creases, scent selection, bathroom tile drying diagnostics, and locks securely—issuing full photo-checkup records to your email inbox.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-outline-variant/10">
                    <span className="text-[10px] font-mono text-on-surface-variant/60 block">100% QUALITY GUARANTEED</span>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      </section>

      {/* The Verdict Feedback Section */}
      <section className="py-20 lg:py-28 bg-surface-lowest">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
                ATELIER VERDICTS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
                Uncompromising Client Satisfaction
              </h2>
            </div>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant max-w-sm leading-relaxed">
              Read real diagnostic client reviews collected from architectural restorations and premium office maintenance throughout Toronto and Calgary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Review 1 */}
            <div className="p-6 bg-surface-low rounded-2xl border border-outline-variant/15 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-0.5 text-secondary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <h4 className="font-display text-base font-semibold text-primary leading-tight">
                  &ldquo;They treated my mid-century walnut storage panels and terrazzo tiling with absolute botanical reverence.&rdquo;
                </h4>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  The standard maintenance curation behaves like a high-end luxury resort visit. Complete laundry symmetry, baseboards polished in corners, and zero generic detergent stink!
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                <div>
                  <span className="font-display text-xs font-bold text-primary block">Elizabeth C.</span>
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase">Rosedale, Toronto</span>
                </div>
                <span className="text-[9px] font-mono text-secondary px-2 py-0.5 rounded bg-secondary/5 border border-secondary/15">VERIFIED RESIDENT</span>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 bg-surface-low rounded-2xl border border-outline-variant/15 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-0.5 text-secondary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <h4 className="font-display text-base font-semibold text-primary leading-tight">
                  &ldquo;A scientific restoration level with a comprehensive layout summary of inclusions.&rdquo;
                </h4>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  I booked their deep restoration checkup after painting work.baseboards, vents detailing, and kitchen hood steam treatments look get me a maid as a medical laboratory. Worth every dollar.
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                <div>
                  <span className="font-display text-xs font-bold text-primary block">Dr. Marcus Vance</span>
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase">Altadore, Calgary</span>
                </div>
                <span className="text-[9px] font-mono text-secondary px-2 py-0.5 rounded bg-secondary/5 border border-secondary/15">VERIFIED RESIDENT</span>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 bg-surface-low rounded-2xl border border-outline-variant/15 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-0.5 text-secondary">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <h4 className="font-display text-base font-semibold text-primary leading-tight">
                  &ldquo;The move-in curation in our apartment was breathtaking. Meticulous drawer dusting.&rdquo;
                </h4>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  We received dynamic updates, digital lock confirmations, and gorgeous photos. The crew lead even left lavender-blossom packets inside our guest closet! Magnificent treatment.
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                <div>
                  <span className="font-display text-xs font-bold text-primary block">Yuki & David L.</span>
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase">Coal Harbour, Vancouver</span>
                </div>
                <span className="text-[9px] font-mono text-secondary px-2 py-0.5 rounded bg-secondary/5 border border-secondary/15">VERIFIED RESIDENT</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Gift Cards Interactive Section */}
      <section id="gift-cards" className="py-20 lg:py-28 bg-surface-low border-t border-outline-variant/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Context Left */}
            <div className="lg:col-span-6 space-y-6">
              <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
                BESPOKE VOUCHERS
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
                Bespoke Cleaning Gift Cards for Architectural Lovers
              </h2>
              <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Gift the ultimate luxury: a get me a maid, hand-detailed residence. Perfect for housewarmings, premium wedding alignments, executive colleagues, or new parents in need of an exquisite systematic reset.
              </p>
              
              {/* Premium Voucher Render Display */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#002542] via-[#003b68] to-[#001424] text-surface shadow-2xl relative overflow-hidden aspect-[1.8/1] flex flex-col justify-between max-w-sm border border-accent/10 sm:scale-100 origin-left">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-25 rounded-full filter blur-xl"></div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <span className="font-display text-xs tracking-[0.2em] font-bold text-accent uppercase block">GET ME A MAID</span>
                    <span className="font-mono text-[7px] tracking-[0.4em] text-surface-low uppercase">EDITORIAL ATELIER</span>
                  </div>
                  <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                </div>

                <div className="space-y-1 relative z-10 text-center sm:text-left">
                  <span className="font-mono text-[7.5px] tracking-widest text-[#85f6e5]/80 uppercase block">CREDIT RESTORATION CARD</span>
                  <div className="font-display text-4xl font-bold tracking-tight text-surface-lowest">
                    ${giftAmount}
                  </div>
                </div>

                <div className="flex justify-between items-end border-t border-surface/10 pt-3 relative z-10 text-[9px] font-mono text-surface-low/85">
                  <div>
                    <span className="block text-[6.5px] text-surface-low/50">DELIVERED TO</span>
                    <span>{giftTo || "Recipient Name"}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[6.5px] text-surface-low/50">CRAFTED FROM</span>
                    <span>{giftFrom || "Your Name"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Buy Form Box Right */}
            <div className="lg:col-span-6 bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/15 shadow-sm">
              <h3 className="font-display text-[11px] tracking-widest uppercase font-bold text-primary mb-5 border-b border-outline-variant/10 pb-3">
                Configure Virtual Gift Voucher
              </h3>

              <form onSubmit={buyGiftCard} className="space-y-4">
                
                {/* Value Buttons Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-primary">Voucher Amount</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[100, 160, 250, 500].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setGiftAmount(val);
                          setCustomGiftAmount('');
                        }}
                        className={cn(
                          "py-2.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer",
                          giftAmount === val && !customGiftAmount
                            ? "bg-secondary text-accent border-secondary shadow-sm"
                            : "border-outline-variant/30 hover:bg-surface-low text-primary"
                        )}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>

                  <div className="relative pt-1.5">
                    <input
                      type="number"
                      placeholder="Or write custom amount..."
                      value={customGiftAmount}
                      onChange={(e) => {
                        setCustomGiftAmount(e.target.value);
                        if (e.target.value) setGiftAmount(parseInt(e.target.value) || 0);
                      }}
                      className="w-full px-4 py-2 text-xs font-mono rounded-lg bg-surface border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary"
                    />
                  </div>
                </div>

                {/* From / To Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary">From (Sender)</label>
                    <input
                      type="text"
                      placeholder="Jean-Paul"
                      value={giftFrom}
                      onChange={(e) => setGiftFrom(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-xs bg-surface border border-outline-variant/20 focus:outline-none focus:border-secondary"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-primary">To (Recipient)</label>
                    <input
                      type="text"
                      placeholder="Marie Leclerc"
                      value={giftTo}
                      onChange={(e) => setGiftTo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg text-xs bg-surface border border-outline-variant/20 focus:outline-none focus:border-secondary"
                      required
                    />
                  </div>
                </div>

                {/* To Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-primary">Recipient Email Address</label>
                  <input
                    type="email"
                    placeholder="marie.leclerc@gmail.com"
                    value={giftEmail}
                    onChange={(e) => setGiftEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg text-xs bg-surface border border-outline-variant/20 focus:outline-none focus:border-secondary font-sans"
                    required
                  />
                </div>

                <AnimatePresence mode="wait">
                  {giftBought ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-xl bg-secondary/10 border border-secondary text-primary text-xs flex items-center gap-3 font-semibold"
                    >
                      <CheckCircle className="w-5 h-5 text-secondary shrink-0" />
                      <div>
                        <span>getmeamaid Restoring Credit Authorized!</span>
                        <span className="block font-normal text-on-surface-variant text-[11px] mt-0.5">
                          A beautiful luxurious PDF digital card has been sent to {giftEmail}.
                        </span>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      type="submit"
                      disabled={buyingGift}
                      className="w-full py-3.5 rounded-full bg-primary text-surface font-display text-xs tracking-wider uppercase font-bold hover:bg-secondary cursor-pointer shadow-md shadow-primary/10 flex items-center justify-center gap-2 active:scale-95 transition-all text-center disabled:opacity-50"
                    >
                      <Gift className="w-4 h-4" />
                      {buyingGift ? 'Processing Purchase...' : 'Purchase & Email Voucher'}
                    </button>
                  )}
                </AnimatePresence>

              </form>
            </div>

          </div>
        </div>
      </section>

      {/* final CTA Section */}
      <section className="bg-primary text-surface py-20 lg:py-24 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_bottom] from-secondary-fixed/10 via-transparent to-transparent opacity-80 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10 space-y-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-accent font-mono text-[10px] uppercase tracking-widest font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Join the Cleaners Choice
          </span>
          
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-surface-lowest leading-tight">
            Ready for a Systematic Restoration?
          </h2>
          
          <p className="font-sans text-xs sm:text-sm text-surface-low/80 max-w-xl mx-auto leading-relaxed">
            Configure your residence details, check instant dynamic dates, and submit booking requests in less than two minutes. Let us elevate your living standards.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Link
              href="/book"
              className="px-8 py-4 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-bold hover:opacity-90 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-accent/10 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Configure Booking Now
            </Link>
            <Link
              href="#pricing-calculator"
              className="px-8 py-4 rounded-full border border-surface-low/20 hover:bg-surface-lowest/5 font-display text-xs tracking-wider uppercase font-bold text-surface-lowest transition-all text-center"
            >
              Calculate Quote
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
