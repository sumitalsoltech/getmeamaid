'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Check, ArrowRight, MapPin, 
  Layers, Package, RefreshCw, Star, 
  ChevronDown, HelpCircle, Shield, Award 
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

// Localized Toronto FAQs
const torontoFaqItems = [
  {
    q: "Do you service downtown Toronto condos with restricted key fobs?",
    a: "Absolutely. Our executive cleaning team is highly accustomed to downtown high-rise protocols (such as key-box pickups, concierge key release forms, and security registration. We coordinate directly with your concierge to verify a seamless check-in and lock-out handover."
  },
  {
    q: "What cleaning materials do you use for heritage hardwood or marble surfaces?",
    a: "We use strictly custom-blended eco-botanical cleaning solutions. Our formulations contain natural essential oils (such as eucalyptus, lavender, and sweet orange) which are verified safe for heritage oak floors, delicate limestone, and premium calacatta marble countertops, providing outstanding disinfection without stripping native sealants."
  },
  {
    q: "Are the cleaning crews bonded, insured, and background-checked?",
    a: "Yes, without compromise. Every individual on our cleaning crew is bonded, fully insured for up to $5M in comprehensive liability, and has undergone detailed federal background clearances. We maintain a zero-tolerance policy to protect your private sanctuary."
  },
  {
    q: "Can I cancel or reschedule my appointment?",
    a: "Certainly. You can alter, pause, or reschedule your session without charge up to 24 hours prior to our scheduled arrival. Appointments rescheduled with less than 24 hours notice carry a standard administrative fee."
  }
];

export default function TorontoLocation() {
  const router = useRouter();

  // FAQ accordion state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  // Postal validation
  const [postal, setPostal] = useState('');
  const [checked, setChecked] = useState(false);
  const [valid, setValid] = useState(false);

  // Reviews
  const reviews = [
    {
      name: "Sabrina Moreau",
      neighborhood: "Yorkville Condo, Toronto",
      stars: 5,
      title: "Phenomenal standard of detail",
      body: "Our high-rise condo requires meticulous treatment for wide-plank oak floors and brass fittings. The getmeamaid team executes their Maintenance suite with total structural discipline. The lavender-sage scent selection is incredibly elegant."
    },
    {
      name: "Marcus G.",
      neighborhood: "Forest Hill Residence, Toronto",
      stars: 5,
      title: "Splendid restoration effort",
      body: "We booked the Deep Restoration suite after hosting an architecture reception. Baseboards, exhaust fans, and interior cabinet alignments were returned to Get me a maid showroom quality. Highly recommended for executive estates."
    },
    {
      name: "Christian & Chloe K.",
      neighborhood: "Leslieville Loft, Toronto",
      stars: 5,
      title: "Reliable, clinical, and quiet",
      body: "We work from home and they were incredibly respectful, quiet, and swift. They cleared every spec of dust on our tall track lights. Pure luxury clean!"
    }
  ];

  const handlePostalCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postal.trim()) return;

    setChecked(true);
    const code = postal.trim().toUpperCase();
    
    // Checks standard Toronto forwarding area 'M'
    if (code.startsWith('M')) {
      setValid(true);
    } else {
      setValid(false);
    }
  };

  const handleBookNow = () => {
    router.push('/book?city=toronto');
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-accent selection:text-primary overflow-x-hidden">
      <Header />

      {/* Hero Banner with Toronto Skyline Overlay */}
      <section className="relative min-h-[60vh] flex items-center justify-center pt-32 pb-20 overflow-hidden">
        {/* Toronto skyline blur backdrop */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1503152394-c571994fd383?auto=format&fit=crop&q=80&w=1600"
            alt="Toronto Skyline"
            className="w-full h-full object-cover brightness-35 filter contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-transparent"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-accent font-mono text-[10px] uppercase tracking-widest font-bold">
              <MapPin className="w-3 h-3 fill-current" />
              Toronto Metropolitan Core
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-surface-lowest">
              Luxury Professional Cleaning Services in Toronto
            </h1>
            <p className="font-sans text-xs sm:text-sm lg:text-base text-surface-low/90 max-w-2xl mx-auto leading-relaxed">
              Meticulous systematic restorations crafted for executive downtown properties, historical Annex brick residences, and high-ceiling Leslieville lofts.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-4 text-[11px] font-mono text-surface-low/80"
          >
            <span className="flex items-center gap-1.5 border-r border-surface-low/20 pr-6">
              <Shield className="w-4 h-4 text-accent" />
              Bonded & Background Verified
            </span>
            <span className="flex items-center gap-1.5 border-r border-surface-low/20 pr-6">
              <Award className="w-4 h-4 text-accent" />
              4.98 average rating in GTA
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              100% Eco-Botanical Solutions
            </span>
          </motion.div>
        </div>
      </section>

      {/* Local Toronto Coverage Entry Form */}
      <section className="py-12 border-b border-outline-variant/10 bg-surface-lowest">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-display text-sm font-bold tracking-wider uppercase text-primary">Verify Your Toronto GTA Neighborhood</h3>
            <p className="font-sans text-xs text-on-surface-variant">We service Rosedale, Forest Hill, Yorkville, Annex, Leslieville, CityPlace, King West & beyond.</p>
          </div>

          <form onSubmit={handlePostalCheck} className="flex gap-2 w-full md:w-auto shrink-0 max-w-md">
            <input
              type="text"
              placeholder="Enter postal code (M...)"
              value={postal}
              onChange={(e) => {
                setPostal(e.target.value);
                setChecked(false);
              }}
              maxLength={7}
              className="px-4 py-2 text-xs font-mono uppercase bg-surface border border-outline-variant/35 focus:outline-none focus:border-secondary rounded-lg tracking-widest w-full md:w-48"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-surface rounded-lg text-xs font-display tracking-wider uppercase font-bold hover:bg-secondary cursor-pointer shrink-0"
            >
              Verify Code
            </button>
          </form>
        </div>
        
        <AnimatePresence>
          {checked && (
            <div className="max-w-4xl mx-auto px-6 mt-3">
              {valid ? (
                <div className="p-3.5 rounded-xl bg-secondary/10 border border-secondary/20 text-primary text-xs font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-secondary shrink-0" />
                  <span>Excellent coverage established! Standard intervals are active in your neighborhood.</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  <span>We currently primarily service postal zones starting with &quot;M&quot; in the Greater Toronto Area. Leave your email for updates!</span>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </section>

      {/* Curated Toronto Service Suite Grid */}
      <section className="py-20 lg:py-28 bg-surface-low">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              TORONTO PORTFOLIO
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
              The Toronto Service Standards
            </h2>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant">
              Every appointment includes a comprehensive checklist verification led by an experienced crew chief.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Standard */}
            <div className="bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/15 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="font-mono text-[10px] tracking-widest text-secondary uppercase font-bold block">01 / MAINTENANCE</span>
                <h3 className="font-display text-base font-semibold text-primary">Standard Maintenance Curation</h3>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  High-end ongoing upkeep. Includes surface dusting, premium kitchen and bathroom polishing, textile alignment (pillows, throws, curtains), floor vacuuming/mop extraction, and trash reset.
                </p>
                <p className="font-mono text-[11px] font-bold text-primary pt-2">From $140 / session</p>
              </div>
              <div className="pt-6 mt-6 border-t border-outline-variant/10 text-center">
                <button onClick={handleBookNow} className="w-full py-2.5 rounded-lg border border-primary/20 hover:bg-surface-low text-xs font-display tracking-wider uppercase font-bold text-primary transition-all">
                  Reserve Maintenance Suite
                </button>
              </div>
            </div>

            {/* Deep Restoration */}
            <div className="bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-secondary shadow-lg flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none overflow-hidden">
                <div className="absolute top-4 -right-10 w-32 py-0.5 bg-secondary text-accent text-center font-mono text-[8px] tracking-widest uppercase transform rotate-45">
                  RECOMMENDED
                </div>
              </div>

              <div className="space-y-4">
                <span className="font-mono text-[10px] tracking-widest text-[#006a60] uppercase font-bold block">02 / DEEP CLEAN</span>
                <h3 className="font-display text-base font-semibold text-primary">Deep Restoration Suite</h3>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Detailed top-to-bottom clinical revitalization. Targets lime buildup, inside microwave / cooker exhaust fans, double baseboard scrubbing, interior window glass polishing, and complete steam grout extraction.
                </p>
                <p className="font-mono text-[11px] font-bold text-secondary pt-2">From $210 / session</p>
              </div>
              <div className="pt-6 mt-6 border-t border-outline-variant/10 text-center">
                <Link href="/services/deep-cleaning" className="block w-full py-2.5 rounded-lg bg-secondary text-accent hover:opacity-90 text-xs font-display tracking-wider uppercase font-bold transition-all">
                  Explore Deep Suite Details
                </Link>
              </div>
            </div>

            {/* Commercial */}
            <div className="bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/15 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="font-mono text-[10px] tracking-widest text-secondary uppercase font-bold block">03 / EXECUTIVE</span>
                <h3 className="font-display text-base font-semibold text-primary">Commercial Curation Suite</h3>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Engineered for design firms, boutique galleries, and premier shared offices. Verifies a spotless, dust-extracted presentation daily or weekly with complete sanitation visual reports.
                </p>
                <p className="font-mono text-[11px] font-bold text-primary pt-2">Custom Atelier Pricing</p>
              </div>
              <div className="pt-6 mt-6 border-t border-outline-variant/10 text-center">
                <a href="mailto:hello@getmeamaid.com" className="block w-full py-2.5 rounded-lg border border-primary/20 hover:bg-surface-low text-xs font-display tracking-wider uppercase font-bold text-primary transition-all">
                  Contact getmeamaid Office
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* The Toronto Standard - Local reviews */}
      <section className="py-20 lg:py-28 bg-surface-lowest">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              TORONTO FEEDBACK
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-primary">
              The Toronto Studio Standard
            </h2>
            <p className="font-sans text-xs text-on-surface-variant">
              The verdict of prominent architectural homeowners and business cores in the GTA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((rev, idx) => (
              <div key={idx} className="p-6 bg-surface-low rounded-2xl border border-outline-variant/15 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex gap-0.5 text-secondary">
                    {[...Array(rev.stars)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                  </div>
                  <h4 className="font-display text-sm font-bold text-primary">&ldquo;{rev.title}&rdquo;</h4>
                  <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                    {rev.body}
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/10">
                  <span className="font-display text-xs font-semibold text-primary block">{rev.name}</span>
                  <span className="font-mono text-[9px] text-on-surface-variant uppercase">{rev.neighborhood}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="py-20 lg:py-28 bg-surface-low border-t border-outline-variant/10">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              SERVICE INTELLIGENCE
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-primary">
              Frequently Asked Curation Questions
            </h2>
          </div>

          <div className="space-y-4">
            {torontoFaqItems.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface-lowest border border-outline-variant/15 rounded-xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-display text-sm font-semibold text-primary cursor-pointer hover:bg-surface-low/50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-on-surface-variant transition-transform duration-200 shrink-0",
                      isOpen ? "transform rotate-180" : ""
                    )} />
                  </button>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-outline-variant/5 bg-surface-low/20"
                      >
                        <p className="p-5 font-sans text-xs text-on-surface-variant leading-relaxed">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* final CTA */}
      <section className="bg-primary text-surface py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_bottom] from-[#006a60]/20 via-transparent to-transparent opacity-80 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10 space-y-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-lowest">
            Experience the Best Cleaning in Toronto
          </h2>
          <p className="font-sans text-xs text-surface-low max-w-lg mx-auto leading-relaxed">
            Configure your residence parameters, dynamic additions and check available schedule slots within seconds. Let us restore architectural excellence to your space.
          </p>
          <div className="pt-2">
            <button
              onClick={handleBookNow}
              className="px-8 py-3.5 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-extrabold hover:opacity-95 cursor-pointer shadow-lg active:scale-95 transition-all text-center inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              Configure Toronto Booking Now
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
