'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Mail, Phone, MapPin, Instagram, ArrowRight } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary text-surface border-t border-surface-low/10">
      {/* Editorial Newsletter Header */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-24 border-b border-surface/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-accent font-mono text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3 h-3 fill-current" />
              The getmeamaid Standard
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-surface-lowest">
              Subscribe to Curated Home Care Intelligence
            </h2>
            <p className="font-sans text-sm text-surface-low/75 max-w-xl">
              Receive seasonal architectural care guides, botanical cleaning recipes, and exclusive seasonal invitations to standard cleaning rates.
            </p>
          </div>
          <div className="lg:col-span-5">
            <form className="flex flex-col sm:flex-row gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter email for editorial updates..."
                className="flex-1 px-5 py-4.5 rounded-full bg-surface-lowest/5 border border-surface-lowest/15 text-surface-lowest placeholder-surface-low/40 text-xs focus:outline-none focus:border-accent font-sans transition-colors"
                required
              />
              <button
                type="submit"
                className="px-6 py-4.5 rounded-full bg-accent text-primary text-xs font-display tracking-widest uppercase font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Subscribe
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Grid Map */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Identity Card */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex flex-col">
              <span className="font-display text-xl tracking-[0.18em] font-bold text-surface-lowest uppercase">
                getmeamaid
              </span>
              <span className="font-mono text-[9px] tracking-[0.3em] text-accent uppercase -mt-0.5">
                Premium Home Care
              </span>
            </div>
            <p className="font-sans text-xs text-surface-low/70 leading-relaxed max-w-sm">
              An uncompromising home care service curating meticulous cleaning and bespoke restoration for homes and beautiful spaces.
            </p>
            <div className="space-y-3.5">
              <div className="flex items-center gap-3 text-xs text-surface-low/80">
                <Phone className="w-4 h-4 text-accent" />
                <span>+1 (800) 587-0320</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-surface-low/80">
                <Mail className="w-4 h-4 text-accent" />
                <span>hello@getmeamaid.com</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-surface-low/80 align-top">
                <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>100 King Street West, Toronto, ON M5X 1A9</span>
              </div>
            </div>
          </div>

          {/* Links 1: Services */}
          <div className="lg:col-span-2.5 space-y-5 lg:pl-4">
            <h3 className="font-display text-xs tracking-widest uppercase font-bold text-accent">
              Suite Options
            </h3>
            <ul className="space-y-3 font-sans text-xs text-surface-low/75">
              <li>
                <Link href="/#services" className="hover:text-surface-lowest transition-colors">
                  Standard Maintenance
                </Link>
              </li>
              <li>
                <Link href="/services/deep-cleaning" className="hover:text-surface-lowest transition-colors font-semibold text-accent">
                  Deep Restoration Clean
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-surface-lowest transition-colors">
                  Move In / Out Curations
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-surface-lowest transition-colors">
                  Post-Stay Airbnb Care
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-surface-lowest transition-colors">
                  Eco-Ethical Premium
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-surface-lowest transition-colors">
                  Commercial Offices
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 2: Local Core */}
          <div className="lg:col-span-2.5 space-y-5">
            <h3 className="font-display text-xs tracking-widest uppercase font-bold text-accent">
              Service Cities
            </h3>
            <ul className="space-y-3 font-sans text-xs text-surface-low/75">
              <li>
                <Link href="/locations/toronto" className="hover:text-surface-lowest transition-colors">
                  Toronto Metropolitan, ON
                </Link>
              </li>
              <li>
                <Link href="/#locations" className="hover:text-surface-lowest transition-colors">
                  Vancouver Downtown, BC
                </Link>
              </li>
              <li>
                <Link href="/#locations" className="hover:text-surface-lowest transition-colors">
                  Calgary Core, AB
                </Link>
              </li>
              <li>
                <Link href="/#locations" className="hover:text-surface-lowest transition-colors">
                  Edmonton Central, AB
                </Link>
              </li>
              <li>
                <Link href="/#locations" className="hover:text-surface-lowest transition-colors">
                  Montréal Core, QC
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 3: Atelier */}
          <div className="lg:col-span-3 space-y-5">
            <h3 className="font-display text-xs tracking-widest uppercase font-bold text-accent">
              The Atelier
            </h3>
            <ul className="space-y-3 font-sans text-xs text-surface-low/75">
              <li>
                <Link href="/#philosophy" className="hover:text-surface-lowest transition-colors">
                  Our Scientific Philosophy
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-surface-lowest transition-colors">
                  Atelier Intelligent FAQ
                </Link>
              </li>
              <li>
                <Link href="/#gift-cards" className="hover:text-surface-lowest transition-colors">
                  Bespoke Gift Cards
                </Link>
              </li>
              <li>
                <Link href="/#recruitment" className="hover:text-surface-lowest transition-colors">
                  Join Strategic Cleaners
                </Link>
              </li>
              <li className="pt-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-lowest/5 border border-surface-lowest/10 hover:border-surface-lowest/30 hover:bg-surface-lowest/10 transition-all text-[11px] text-surface-low"
                >
                  <Instagram className="w-3.5 h-3.5 text-accent" />
                  @getmeamaid
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Deep Footer Signature */}
      <div className="bg-primary/50 py-8 border-t border-surface/5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] text-surface-low/50">
            &copy; {year} GETMEAMAID CO. ALL PRESERVED STANDARDS.
          </p>
          <div className="flex gap-6 font-mono text-[10px] text-surface-low/50">
            <Link href="/#privacy" className="hover:underline">
              PRIVACY CURATION
            </Link>
            <Link href="/#terms" className="hover:underline">
              TERMS OF RESTORATION
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
