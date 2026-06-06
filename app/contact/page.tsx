'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle, Sparkles, MessageCircle, HelpCircle } from 'lucide-react';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setErrorMsg('Please specify all mandatory fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed sending contact request.');
      }

      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-accent selection:text-primary overflow-x-hidden">
      <Header />

      {/* Hero Header Space */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 bg-surface-low border-b border-outline-variant/10">
        <div className="absolute inset-0 z-0 bg-radial-[circle_at_top_right] from-secondary-fixed/5 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-6">
          <span className="font-mono text-[10px] tracking-[0.34em] font-bold text-secondary uppercase block">
            ATELIER ENQUIRIES
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-primary">
            Connect With Our <span className="text-secondary italic">Curators</span>
          </h1>
          <p className="font-sans text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Whether coordinating standard corporate properties, organizing post-construction, or inquiring about bespoke schedules, our concierge guides are standing by.
          </p>
        </div>
      </section>

      {/* Primary Panels */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* Contact info and details - Left Side */}
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-4">
            <h3 className="font-display text-xl font-bold text-primary uppercase tracking-wider">
              Atelier Coordinates
            </h3>
            <p className="text-xs text-on-surface-variant leading-relaxed font-sans">
              For immediate support in Toronto Core, Vancouver Metropolitan, and Calgary Areas, call our dispatch line. Estimates can also be finalized dynamically through our secure wizard tracker.
            </p>
          </div>

          <div className="space-y-6 font-mono text-xs">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-low border border-outline-variant/10">
              <Mail className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant block uppercase tracking-wider mb-1">EMAIL CHANNELS</span>
                <span className="text-primary font-bold block hover:text-secondary transition-colors">admin@gmail.com</span>
                <span className="text-[10px] text-on-surface-variant/70 block mt-1">Response threshold: Under 12 Hours</span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-low border border-outline-variant/10">
              <Phone className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant block uppercase tracking-wider mb-1">CONCIERGE VOICE</span>
                <span className="text-primary font-bold block">+1 (800) 555-GETMEMAID</span>
                <span className="text-[10px] text-on-surface-variant/70 block mt-1">Available 8:00 AM - 9:00 PM EST Daily</span>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-surface-low border border-outline-variant/10">
              <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant block uppercase tracking-wider mb-1">HEADQUARTERS</span>
                <span className="text-primary font-bold block">The Editorial Studio, Queen West</span>
                <span className="text-on-surface-variant">Toronto, ON, M5V 2N8</span>
              </div>
            </div>
          </div>

          {/* Quick FAQ summary blocks */}
          <div className="pt-8 border-t border-outline-variant/10 space-y-4">
            <h4 className="font-display text-xs font-bold uppercase tracking-wider text-primary">Atelier Guidelines</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
              <div className="space-y-1">
                <span className="font-bold text-primary flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-secondary" /> Insured?</span>
                <p className="text-on-surface-variant/85 text-[11px] leading-relaxed">Bonded and insured up to $5M for physical damage coverages.</p>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-primary flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-secondary" /> Cancellations?</span>
                <p className="text-on-surface-variant/85 text-[11px] leading-relaxed">No penalty fee if schedule updates are made 24 hours prior.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Details - Right Side */}
        <div className="lg:col-span-7 bg-surface-low p-6 sm:p-10 rounded-3xl border border-outline-variant/10 shadow-sm relative">
          <div className="absolute top-0 right-10 -translate-y-1/2 px-4 py-1 rounded-full bg-accent border border-secondary/15 text-primary text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-secondary fill-current" /> SECURED ENTRY
          </div>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form 
                key="contact-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
              >
                <div className="space-y-1 border-b border-outline-variant/10 pb-4">
                  <h3 className="font-display text-lg font-bold text-primary">Submit Inquiries</h3>
                  <p className="text-xs text-on-surface-variant">Fill details out to check specialized corporate rates or out-of-boundary logistics availability.</p>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-xs text-red-700 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-primary">Your full name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/25 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="e.g., Charlotte Dupond"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-primary">Email address *</label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/25 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                      placeholder="e.g., charlotte@dupond.ca"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-primary">Phone coordinates</label>
                  <input
                    type="tel"
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/25 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40"
                    placeholder="e.g., +1 (416) 555-0103"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-primary">How can we support your vision? *</label>
                  <textarea
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-surface border border-outline-variant/25 text-xs focus:ring-1 focus:ring-secondary focus:border-secondary focus:outline-none transition-all placeholder:text-on-surface-variant/40 resize-none font-sans"
                    placeholder="Specify property size, specific details, frequency requirements or special requests..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-primary text-surface font-display text-xs tracking-widest uppercase font-bold hover:bg-secondary cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>transmitting concierge channels...</span>
                  ) : (
                    <>
                      <span>Transmit Message</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="sub-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-secondary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-xl font-bold text-primary uppercase tracking-wide">Transmission Complete</h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                    Thank you, your enquiry has been registered securely. An administrator curator has been alerted and will deliver specific diagnostics plans to your coordinates.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-full border border-primary text-xs font-display tracking-wider uppercase font-semibold text-primary hover:bg-surface transition-all"
                >
                  Transmit Another Message
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </div>
  );
}
