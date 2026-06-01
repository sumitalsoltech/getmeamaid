import { NextRequest, NextResponse } from 'next/server';
import { getMysql } from '@/lib/mysql';
import { 
  INITIAL_BOOKINGS, 
  INITIAL_VOUCHERS, 
  resetLocalSeedStore, 
  getLocalBookings, 
  getLocalVouchers 
} from '@/lib/dbStore';

export async function POST(req: NextRequest) {
  try {
    const mysqlClient = getMysql();
    let seededBookingsCount = 0;
    let seededVouchersCount = 0;
    let mysqlConnected = false;
    let dbNotes = '';

    // Always reset local in-memory stores as well to make sure live review looks pristine
    resetLocalSeedStore();

    if (mysqlClient) {
      mysqlConnected = true;

      // 1. Try to seed bookings if empty
      const { data: existingBookings, error: fetchBookingsErr } = await mysqlClient
        .from('bookings')
        .select('id')
        .limit(1);

      if (!fetchBookingsErr) {
        if (!existingBookings || existingBookings.length === 0) {
          // Send all INITIAL_BOOKINGS
          const { error: insertErr } = await mysqlClient
            .from('bookings')
            .insert(INITIAL_BOOKINGS);
          
          if (!insertErr) {
            seededBookingsCount = INITIAL_BOOKINGS.length;
          } else {
            dbNotes += `Bookings insertion failed: ${insertErr.message}. Make sure table is created in MySQL. `;
          }
        } else {
          dbNotes += 'Bookings table already has records; did not overwrite. ';
        }
      } else {
        dbNotes += `Could not query bookings: ${fetchBookingsErr.message}. Make sure table 'bookings' is created. `;
      }

      // 2. Try to seed gift cards if empty
      const { data: existingVouchers, error: fetchVouchersErr } = await mysqlClient
        .from('gift_cards')
        .select('id')
        .limit(1);

      if (!fetchVouchersErr) {
        if (!existingVouchers || existingVouchers.length === 0) {
          const { error: insertErr } = await mysqlClient
            .from('gift_cards')
            .insert(INITIAL_VOUCHERS);
          
          if (!insertErr) {
            seededVouchersCount = INITIAL_VOUCHERS.length;
          } else {
            dbNotes += `Gift cards insertion failed: ${insertErr.message}. `;
          }
        } else {
          dbNotes += 'Gift cards table already has records; did not overwrite. ';
        }
      } else {
        dbNotes += `Could not query gift_cards: ${fetchVouchersErr.message}. Make sure table 'gift_cards' is created. `;
      }
    } else {
      // Local development seeding
      seededBookingsCount = getLocalBookings().length;
      seededVouchersCount = getLocalVouchers().length;
      dbNotes = 'Using local in-memory fallback. MySQL URL and Key are not set in environment yet.';
    }

    // Return visual confirmation, status, and precise instructions
    const sqlSchema = `
-- COPY & EXECUTE THIS SQL IN YOUR MYSQL SQL EDITOR TO CREATE TABLES:

-- 1. Create Bookings table 
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  postal_code TEXT,
  home_type TEXT,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  square_footage INTEGER,
  restoration_level TEXT,
  frequency TEXT,
  addons TEXT, -- JSON Array string
  selected_date TEXT,
  selected_time_slot TEXT,
  entry_method TEXT,
  custom_key_notes TEXT,
  customer_special_notes TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  card_name TEXT,
  pricing TEXT, -- JSON Object string
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Gift Cards table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id TEXT PRIMARY KEY,
  amount NUMERIC NOT NULL,
  from_name TEXT NOT NULL,
  to_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Public Select / Insert Roles (Or disable Row Level Security for demo ease)
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards DISABLE ROW LEVEL SECURITY;
    `.trim();

    return NextResponse.json({
      success: true,
      seeded_bookings_count: seededBookingsCount,
      seeded_vouchers_count: seededVouchersCount,
      is_mysql_connected: mysqlConnected,
      db_notes: dbNotes,
      sql_schema: sqlSchema
    });

  } catch (err: any) {
    console.error('Seed API error:', err);
    return NextResponse.json({ error: err.message || 'Unknown error during database seeding.' }, { status: 500 });
  }
}
