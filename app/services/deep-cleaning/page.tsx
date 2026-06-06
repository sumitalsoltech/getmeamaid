'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Check, CheckCircle2, ArrowRight, ShieldCheck, 
  HelpCircle, ChevronDown, ListTodo, Star, RefreshCw, X 
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { cn } from '@/lib/utils';

// Checklist categories
const checklistTabs = [
  {
    id: 'kitchen',
    label: 'Kitchen Suite',
    desc: 'Deep de-greasing, lime carbon breakdown, and complete vertical dusting.',
    items: [
      'Complete exterior scrubbing of all cabinets and shelves',
      'Intense hood vent grease extraction and grill wash',
      'Inside-out microwave deep sanitization',
      'Total stove range-top heat detail and burner extraction',
      'Heavy sink lime scaling and stainless tap restoration',
      'Meticulous kitchen countertops scrub (marble/granite treatment)',
      'Double mop water wash of tile surfaces & baseboard detailing'
    ]
  },
  {
    id: 'bathroom',
    label: 'Bathroom Sanctuary',
    desc: 'Total grout extraction, physical scales extraction, and sterile wash.',
    items: [
      'Steam-based shower tile grout stain extraction',
      'Deep glass shower enclosure scale removal and polish',
      'Bathtub structural ring lime extraction & scrub',
      'Toilet bowl high-concentration clinical sanitization',
      'Vanity sinks, mirror glass, & steel hardware polish',
      'Complete exhaust fan dust capture extraction',
      'Vertical disinfection of wall tiles & baseboards'
    ]
  },
  {
    id: 'sleeping',
    label: 'Sleeping Chambers',
    desc: 'Micro-allergic extract, delicate alignments, and heavy dusting.',
    items: [
      'Under-bed easy vertical vac extraction and dust wipe',
      'Window blind slats meticulous physical wipe down',
      'Baseboards detailing & door frame top extraction',
      'Light fixtures, fan blades, and switch plates wipe',
      'Complete mirror glass restoration and framing wipe',
      'Premium bed alignment & linen creasing (sheets changed optionally)',
      'Dual deep HEPA vacuum pass of carpeting & corner extractions'
    ]
  },
  {
    id: 'living',
    label: 'Living Spaces',
    desc: 'Full-spectrum vertical dust clearance and texture alignments.',
    items: [
      'Extensive window-sill, frame, and glass trim detail wipe',
      'Air vents, heating registers, and intake grates duster extract',
      'Under-cushion couch vacuuming and meticulous layout resets',
      'Electronic consoles, TV screen, and shelving safe micro-wipe',
      'Detailed door frames, panels, and baseboards corner scrub',
      'Stair rail hand detail, spindles, & banisters double wipe',
      'Complete floor perimeter detailing & HEPA high-suction vacuum sweep'
    ]
  }
];

// Interactive add-ons
const selectableAddons = [
  { id: 'fridge', label: 'Inside Refrigerator Detailing', price: 35, desc: 'Complete food sorting, shelf extraction, and premium vinegar-organic disinfection.' },
  { id: 'oven', label: 'Inside Oven Thermal Degreasing', price: 35, desc: 'Intense chemical-free eco heat extraction of carbon layers.' },
  { id: 'cabinets', label: 'Inside All Cabinets & Drawers', price: 45, desc: 'Vacuuming and structural interior wipes (for completely empty or transition properties).' },
  { id: 'windows', label: 'All Interior Window Sashes & Glass', price: 40, desc: 'Screen wiping, deep window rails extraction, and streak-free squeeze polish.' },
  { id: 'pethair', label: 'Heavy Pet Hair De-shedding Extraction', price: 45, desc: 'Detailed carpet agitation to extract deeply nested allergens and fur.' }
];

const faqs = [
  {
    q: "How does Deep Restoration differ from your Standard Maintenance?",
    a: "Standard Maintenance keeps a pre-cleaned home fresh. Deep Restoration is a thorough, systematic vertical dust extraction. It focuses heavily on deep calcium scales extraction on glass/grout, exhaustive baseboards corner scrubbing, high HVAC vent vacuuming, light fixture wipes, and other details that are vulnerable to atmospheric dust accumulation over months."
  },
  {
    q: "How long should I expect the Deep Restoration session to last?",
    a: "Due to the hand-detailed clinical nature of our work, a standard deep cleaning ranges from 4 to 8 hours depending on room count and layout square footage. We deploy highly specialized teams of 2-3 experienced curators to maintain optimal efficiency."
  },
  {
    q: "Is it necessary for me to vacate my residence during the sweep?",
    a: "No, you do not have to vacate, although many executive homeowners prefer to provide lock-fob concierges coordinates so they can return to a completed, magnificent space. If you work from home, our staff operates in quiet, systematic zones with minimum distraction."
  },
  {
    q: "Are the custom add-on rates fixed or variable?",
    a: "Our add-on prices are completely transparent and fixed. You pay the exact flat fee displayed on your booking card, regardless of the duration required to restore the specific appliance or cabinet interiors to Get me a maid standards."
  }
];

export default function DeepCleaningService() {
  const router = useRouter();

  // Selected checklist tab state
  const [activeTab, setActiveTab] = useState('kitchen');

  // Selected add-ons list state
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const baseServicePrice = 210;
  
  // Collapsible FAQs states
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const toggleAddon = (id: string) => {
    if (selectedAddons.includes(id)) {
      setSelectedAddons(selectedAddons.filter(item => item !== id));
    } else {
      setSelectedAddons([...selectedAddons, id]);
    }
  };

  const calculateTotal = () => {
    const addonsTotal = selectableAddons
      .filter(item => selectedAddons.includes(item.id))
      .reduce((sum, item) => sum + item.price, 0);
    return baseServicePrice + addonsTotal;
  };

  const handleBookNow = () => {
    // Generate navigation params pre-filling deep cleaning & checked add-ons
    const addonsString = selectedAddons.join(',');
    const queryParams = new URLSearchParams({
      restorationLevel: 'Deep Clean',
      addons: addonsString,
      price: calculateTotal().toString()
    });
    router.push(`/book?${queryParams.toString()}`);
  };

  const selectedClass = checklistTabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-surface selection:bg-accent selection:text-primary overflow-x-hidden">
      <Header />

      {/* Hero Header */}
      <section className="relative min-h-[55vh] flex items-center justify-center pt-32 pb-20 overflow-hidden">
        {/* Editorial Kitchen Hero Backdrop */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1600"
            alt="Get me a maid luxury modern kitchen"
            fill
            className="object-cover brightness-[0.35]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/35 to-transparent"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-accent font-mono text-[10px] uppercase tracking-widest font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Signature Premium Suite
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-surface-lowest">
              Deep Restoration Suite
            </h1>
            <p className="font-sans text-xs sm:text-sm lg:text-base text-surface-low/90 max-w-2xl mx-auto leading-relaxed">
              Our clinical top-to-bottom master-level overhaul. Dust, limescale, baseboards, and complex appliance interiors restored with hand-detailed scientific excellence.
            </p>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-2 text-[10px] font-mono text-surface-low/80"
          >
            <span className="bg-surface-lowest/10 border border-surface-lowest/15 px-3 py-1.5 rounded-full">
              AVERAGE TIME: 4 - 7 HOURS
            </span>
            <span className="bg-surface-lowest/10 border border-surface-lowest/15 px-3 py-1.5 rounded-full">
              STAFF ENGAGED: 2 - 3 CURATORS
            </span>
            <span className="bg-surface-lowest/10 border border-surface-lowest/15 px-3 py-1.5 rounded-full border-secondary/50 text-accent">
              ECO-BOTANICAL PRODUCTS ONLY
            </span>
          </motion.div>
        </div>
      </section>

      {/* The Science of Restoration Section */}
      <section className="py-20 lg:py-28 bg-surface-lowest">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Visual Left */}
          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl relative border border-secondary-fixed/5">
              <Image
                src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&q=80&w=800"
                alt="Bathroom sanctuary detailing tile scale"
                fill
                className="object-cover brightness-[0.93]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent"></div>
              
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-surface-lowest/90 backdrop-blur-md border border-surface-lowest/20 flex flex-col gap-2">
                <span className="font-mono text-[9px] tracking-widest text-secondary font-bold uppercase">ZERO CRUDE SYNTHETICS</span>
                <p className="font-sans text-[11px] text-on-surface-variant leading-relaxed">
                  We formulate custom cleaning oils rich in pine needles and lemon rind essence. Disinfects surfaces biologically without irritating baby skin or pets respiratory pathways.
                </p>
              </div>
            </div>
          </div>

          {/* Content Right */}
          <div className="lg:col-span-7 space-y-6">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              Meticulous RESTORATION STRATEGY
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
              The Science of Bespoke Restoration
            </h2>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Standard cleaners rush through visual planes. We track vertical planes, checking shadows, wall moldings, ceiling crevices, and structural hardware scales.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/10">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h4 className="font-display text-sm font-semibold text-primary">Micro-Extraction Vacuuming</h4>
                <p className="font-sans text-xs text-on-surface-variant/85 leading-relaxed">
                  We use medical-grade double HEPA filter vacuums, trapping 99.97% of micro-dander, dust allergens, and drywall sediment on hard surfaces and carpets.
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h4 className="font-display text-sm font-semibold text-primary">Calcium Grout Extraction</h4>
                <p className="font-sans text-xs text-on-surface-variant/85 leading-relaxed">
                  High-temperature continuous Steam vapor penetrates tile grout, releasing mold sediments and mineral crusts safely without relying on bleach, hydrochloric acid or chlorine fumes.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Meticulous Interactive Inclusion Checklist Tab Suite */}
      <section className="py-20 lg:py-28 bg-surface-low border-y border-outline-variant/10">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          
          <div className="text-center max-w-xl mx-auto space-y-4">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              ATELIER PROTOCOL MAP
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-primary font-display">
              Comprehensive Inclusion Checklist
            </h2>
            <p className="font-sans text-xs text-on-surface-variant">
              Witness the exact physical targets checked during your deep restoration restoration.
            </p>
          </div>

          {/* Tab buttons menu */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-b border-outline-variant/15 pb-2">
            {checklistTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-t-xl font-display text-xs tracking-wider uppercase font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-secondary text-primary bg-surface-lowest shadow-sm'
                    : 'border-transparent text-on-surface-variant/75 hover:text-primary hover:bg-surface-lowest/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dynamic Checklist Content Panel */}
          <AnimatePresence mode="wait">
            {selectedClass && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/15 shadow-sm space-y-6"
              >
                <div className="space-y-1">
                  <span className="font-mono text-[9px] tracking-wider text-secondary font-bold uppercase">REST RESTORATION PROTOCOL SECTION</span>
                  <p className="font-sans text-xs text-on-surface-variant font-medium">
                    {selectedClass.desc}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
                  {selectedClass.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 text-secondary" />
                      </div>
                      <span className="font-sans text-xs text-primary leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* Service Exclusions & Custom Add-ons Checkbox Calculator */}
      <section className="py-20 lg:py-28 bg-surface-lowest">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Content Left */}
          <div className="lg:col-span-5 space-y-6">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              DYNAMIC ADDITIONS CALCULATOR
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-primary">
              Custom Add-ons & Precise Exclusions
            </h2>
            <p className="font-sans text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Every home is structurally unique. Leverage our transparent add-on panels to expand your restoration suit parameters. Toggle items on the right to watch your dynamic estimate update.
            </p>

            {/* Exclusions Box */}
            <div className="p-5 rounded-2xl bg-surface-low border border-outline-variant/15 space-y-3.5">
              <span className="font-display text-[10px] tracking-widest uppercase font-bold text-primary block">
                Standard Exclusions
              </span>
              <ul className="space-y-2 font-mono text-[10px] text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>External window exterior wash (Heights concern)</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Removal of highly hazardous biological matter</span>
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>Moving heavy furniture exceeding 40 pounds</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Interactive Calculation Form Right */}
          <div className="lg:col-span-7 bg-surface-lowest p-6 sm:p-8 rounded-2xl border border-outline-variant/15 shadow-sm space-y-6">
            <span className="block font-display text-xs tracking-widest uppercase font-bold text-primary border-b border-outline-variant/10 pb-3">
              Configure Restoration Additions
            </span>

            <div className="space-y-4">
              {selectableAddons.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                      isSelected 
                        ? 'border-secondary bg-secondary/5' 
                        : 'border-outline-variant/15 bg-surface hover:bg-surface-low/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                          isSelected ? 'bg-secondary text-accent' : 'border border-outline-variant/50'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-sans text-xs font-bold text-primary">{addon.label}</span>
                      </div>
                      <p className="font-sans text-[11px] text-on-surface-variant/80 pl-6">{addon.desc}</p>
                    </div>

                    <span className="font-mono text-xs font-bold text-primary shrink-0">
                      +${addon.price}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Estimator output Panel board */}
            <div className="mt-8 p-6 rounded-2xl bg-primary text-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="block text-[10px] font-mono tracking-widest text-[#85f6e5] uppercase font-bold">ESTIMATED REST DESIGN COST</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-display font-semibold text-surface-lowest">${calculateTotal()}</span>
                  <span className="text-xs text-surface-low/75">including select selections</span>
                </div>
              </div>

              <button
                onClick={handleBookNow}
                className="px-6 py-3.5 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-bold hover:opacity-90 active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                Configure This Curation & Book
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Service Collapsible FAQ Accordion */}
      <section className="py-20 lg:py-28 bg-surface-low border-t border-outline-variant/10">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="font-mono text-[10px] tracking-[0.3em] font-semibold text-secondary uppercase block">
              SERVICE INTELLIGENCE
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-primary">
              Frequently Asked Service Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
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

      {/* ready CTA bottom */}
      <section className="bg-primary text-surface py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_bottom] from-secondary-fixed/10 via-transparent to-transparent opacity-80 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto px-6 relative z-10 space-y-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-surface-lowest">
            Ready to Restore Your Living Atmosphere?
          </h2>
          <p className="font-sans text-xs text-surface-low max-w-lg mx-auto leading-relaxed">
            Configure your space parameters, dynamic additions and check available schedule slots within seconds. Let us restore architectural excellence to your space.
          </p>
          <div className="pt-2">
            <button
              onClick={handleBookNow}
              className="px-8 py-3.5 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-extrabold hover:opacity-95 cursor-pointer shadow-lg active:scale-95 transition-all text-center inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              Configure Deep Clean Booking Now
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
