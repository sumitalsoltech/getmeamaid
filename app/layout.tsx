import type {Metadata} from 'next';
import {Inter, Manrope} from 'next/font/google';
import './globals.css'; // Global styles

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'getmeamaid | Bespoke Premium Cleaning Curation & Home Care',
  description: 'Experience bespoke premium cleaning curation under getmeamaid. Serving Toronto, Vancouver, and Calgary with an uncompromising standard of high-fidelity restoration.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning className="bg-surface text-on-surface">
        {children}
      </body>
    </html>
  );
}

