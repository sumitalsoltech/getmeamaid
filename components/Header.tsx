'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ChevronDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on page change
  useEffect(() => {
    const handle = setTimeout(() => {
      setIsOpen(false);
      setActiveDropdown(null);
    }, 0);
    return () => clearTimeout(handle);
  }, [pathname]);

  const navItems = [
    {
      label: 'Services',
      dropdown: [
        { name: 'Standard Maintenance', href: '/#services' },
        { name: 'Deep Restoration', href: '/services/deep-cleaning' },
        { name: 'Move In / Out Curation', href: '/#services' },
        { name: 'Airbnb / Post-Stay', href: '/#services' },
        { name: 'Commercial & Office', href: '/#services' },
        { name: 'Eco-Ethical Cleaning', href: '/#services' },
      ],
    },
    {
      label: 'Locations',
      dropdown: [
        { name: 'Toronto Metropolitan', href: '/locations/toronto' },
        { name: 'Vancouver Metro', href: '/#locations' },
        { name: 'Calgary Area', href: '/#locations' },
      ],
    },
    { label: 'Gift Cards', href: '/#gift-cards' },
    { label: 'Our Philosophy', href: '/#philosophy' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 transition-all border-b border-transparent',
        scrolled
          ? 'bg-surface/90 backdrop-blur-md shadow-sm border-outline-variant/10 py-3'
          : 'bg-transparent py-5'
      )}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between">
          {/* Logo / Title */}
          <Link href="/" className="group flex flex-col">
            <span className="font-display text-lg tracking-[0.18em] font-bold text-primary uppercase transition-colors group-hover:text-secondary">
              getmeamaid
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.3em] text-on-surface-variant group-hover:text-secondary/80 transition-colors uppercase -mt-0.5">
              Premium Home Care
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item, idx) => {
              if (item.dropdown) {
                return (
                  <div
                    key={idx}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <button className="flex items-center space-x-1 py-2 font-display text-xs tracking-wider uppercase font-semibold text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                      <span>{item.label}</span>
                      <ChevronDown className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        activeDropdown === item.label ? "transform rotate-180" : ""
                      )} />
                    </button>

                    <AnimatePresence>
                      {activeDropdown === item.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-1 w-56 bg-surface-lowest shadow-xl border border-outline-variant/15 rounded-lg py-2 z-50 overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
                          {item.dropdown.map((subItem, sIdx) => (
                            <Link
                              key={sIdx}
                              href={subItem.href}
                              className="block px-4 py-2.5 font-sans text-xs text-on-surface-variant hover:text-primary hover:bg-surface-low transition-colors"
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <Link
                  key={idx}
                  href={item.href!}
                  className="py-2 font-display text-xs tracking-wider uppercase font-semibold text-on-surface-variant hover:text-primary transition-colors"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Call To Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/#pricing-calculator"
              className="font-display text-xs tracking-wider uppercase font-semibold text-primary hover:text-secondary transition-colors"
            >
              Estimate Price
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-accent text-primary font-display text-xs tracking-wider uppercase font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-sm shadow-accent/20"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 fill-current" />
              Book Now
            </Link>
          </div>

          {/* Mobile Hamburguer Hamburger Menubutton */}
          <div className="md:hidden flex items-center space-x-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-accent text-primary font-display text-[10px] tracking-wider uppercase font-bold shadow-sm"
            >
              Book
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-primary hover:bg-surface-low rounded-lg transition-colors focus:outline-none"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-outline-variant/15 bg-surface-lowest overflow-hidden"
          >
            <div className="px-6 py-6 space-y-6">
              {navItems.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="font-display text-xs tracking-wider uppercase font-bold text-primary">
                    {item.label}
                  </div>
                  {item.dropdown ? (
                    <div className="pl-3 border-l border-outline-variant/15 space-y-2.5 py-1">
                      {item.dropdown.map((subItem, sIdx) => (
                        <Link
                          key={sIdx}
                          href={subItem.href}
                          className="block font-sans text-xs text-on-surface-variant hover:text-primary"
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Link
                      href={item.href!}
                      className="block font-sans text-xs text-on-surface-variant hover:text-primary pl-3"
                    >
                      Explore {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-outline-variant/10 flex flex-col space-y-3">
                <Link
                  href="/#pricing-calculator"
                  className="flex items-center justify-center w-full px-5 py-3 rounded-full border border-primary/20 hover:bg-surface-low font-display text-xs tracking-widest uppercase font-semibold text-primary transition-colors text-center"
                >
                  Estimate Price
                </Link>
                <Link
                  href="/book"
                  className="flex items-center justify-center w-full px-5 py-3 rounded-full bg-accent text-primary font-display text-xs tracking-widest uppercase font-bold hover:opacity-95 transition-all text-center"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2 fill-current" />
                  Book Premium Restorations
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
