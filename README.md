# getmeamaid — Luxury Cleaning & Restoration Suite Marketplace

Welcome to **getmeamaid**, a premium, hand-detailed cleaning and physical restoration scheduling marketplace. This application is crafted with a Swiss-modern aesthetic, deep structural hierarchy, spacious negative layouts, and pristine typography (featuring Inter, Outfit, and JetBrains Mono).

The platform delivers a seamless, bespoke customer booking experience backed by a sophisticated, real-time administrative panel to manage pricing adjustments, service catalogs, orders, invoices, coupons, and staff allocations.

---

## 🌟 Core Architectural Modules

### 1. The Customer Booking Wizard
The customer-facing application matches elegant high-fidelity curation with functional intelligence:
- **Interactive Multi-Step Estimation**: An intuitive workflow selecting house size (bedroom/bathroom configurations), space type, and preferred curate frequencies.
- **Dynamic Pricing Calculator**: Live calculations based on active database pricing rules and add-on selections.
- **Bespoke Add-Ons**: Includes services like Lavender-Sage Aromatherapy, Deep Oven Restoration, and Fibre Cabinet detailing.
- **Flexible Entry Instructions**: Complete curation checklists for lockboxes, concierge keys, or physical handovers.
- **Interactive Scheduling**: Select active calendar slots (Morning, Afternoon, Twilight Special).
- **High-Touch Manual Estimation Loop**: For customized suites marked as *"Manual Quote Required"*, the booking button transitions to **"Request High-Touch Estimation Quote"** and logs the order status as **"Quote Proposed"** for manual administrative review.

### 2. The Administrative Dashboard Desk
An industrial-grade control center featuring:
- **Service Catalog Customization**: Full CRUD on specialized services, adjusting base pricing, descriptions, and feature flags.
- **Dynamic Pricing Rules Mapper**: Establish adjustments (fixed rates or percentage scales) depending on residence profiles, bedroom or bathroom volume, slot urgency, or specific locations. It supports linking rules to specific services or applying them site-wide.
- **Coupon & Campaign Control**: Design and activate discount triggers with caps, limits, minimum spend requirements, and service applicability arrays.
- **Order Dispatch Center**: Oversee incoming schedules, modify live pricing, send custom payment links, adjust bookings, and allocate jobs to crew chiefs.
- **Support Ticket Portal**: Coordinate customer inquiries, prioritize issues (High, Medium, Low), and log resolutions.
- **Comprehensive Reports Suite**: Staggered analytics tabs for Settlements, Invoices, Service Performance, Coupon Usages, Revenue payment trackers, and CSV/XLS export capabilities.

### 3. Bulletproof Backend Resilience
The architecture is designed to handle multiple backend infrastructure topologies gracefully:
- **Double-Layer Fallback Control**: Real API hooks map to a Supabase PostgreSQL backend if credentials are provided in `.env`.
- **Automatic Multi-State Local Persistence**: If Supabase is unconfigured or offline, the system automatically redirects database requests to an in-memory cached state combined with a local, JSON-persisted database file (`pristine_db.json`).
- **Zero-Crash Execution Guarantee**: All CRUD endpoints for bookings, services, coupons, and pricing rules are fully resilient. Even in a raw sandboxed environment without databases, the application executes perfectly, loads seeded data, and saves CRUD operations locally.

---

## 🚀 Getting Started

Follow these step-by-step instructions to boot, develop, and build the application cleanly.

### 📋 Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.x or newer is recommended)
- **npm** (v9.x or newer)

---

### ⚙️ Installation and Setup

1. **Install Base Dependencies**:
   Open a terminal inside the project root directory and run:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file at the root of the project (or copy `.env.example`). To run with the resilient local DB engine, you do not need to provide any values. If you want to configure real Supabase persistence, populate the following:
   ```env
   # API Access Keys & Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Supabase Configuration (Optional - fallback turns on automatically if omitted)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

---

### 💻 Running the Application

To start the development server with Hot Module Replacement and live previews, navigate to the root directory and run:

```bash
npm run dev
```

The development server will boot-up at:
- **http://localhost:3000** (or the mapped reverse proxy port allocated by the container platform)

---

### 🏗️ Compiling and Production Build

To verify full type validation, lint correctness, and compile an optimized production-grade bundle, run:

```bash
# 1. Validate complete codebase syntax and ESLint directives
npm run lint

# 2. Build production-ready Client-Side static bundles and Server Actions
npm run build

# 3. Boot production static server
npm run start
```

Your production bundle compiles into the `.next` directory.

---

## 🛠️ Performing End-to-End Testing

To test the full lifecycle of a cleanup order:

### 1. Customer Estimation & Booking Test
1. Access the homepage at `http://localhost:3000`.
2. Click **Book Restoration Sweep** or input a postal code (e.g., `M5V 2N8`) to enter the booking wizard.
3. Configure your home setup: Select bedrooms (e.g., `2`), bathrooms (e.g., `2`), and choose the **"Deep Clean"** restoration level.
4. Add extra options like **"Deep Oven Curation"** or **"Interior Cabinets Polishing"**.
5. Select a preferred appointment date from the calendar and choose a preferred time slot (e.g., `09:00 AM - 12:00 PM`).
6. Input contact information (use a valid email like `test-client@getmeamaid.com`).
7. Enter a target name for the checkout card and click the action button to dispatch.
8. Validate that you are redirected to a beautiful, stylized **Restoration Sweep Confirmed** screen displaying a generated reservation number (e.g., `PRE-XXXXXX`) and pricing itemizations.

### 2. Administrative Order Check
1. Open the Admin Panel at `http://localhost:3000/admin`.
2. Select the **Bookings** tab to verify that the newly placed order is visualised instantly inside the live table.
3. Select the order item, load details, and verify that you can adjust its status, write internal notes, or assign a crew chief.

---

## 🎨 Design and Layout Framework

Every component leverages Tailwind CSS v4 styling standards:
- **Soft high-contrast light mode** using an elegant off-white canvas `#fafafa/F5F5F7` layered with heavy charcoal type.
- **Sophisticated displays** styled with standard Outfit pairings for titles and Inter for text.
- **Technical/monospaced labels** (like total rates, statuses, times, and order reference numbers) highlighted with JetBrains Mono tags to signify high reliability and craftsmanship.
