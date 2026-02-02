# 🏗️ RUTA-TECH: Project Master Context & Status
**Last Update:** 2026-02-02
**Version:** v0.5 (Foundation Phase)

## 1. Product Vision (The "Why")
**Goal:** Build a Universal Operating System for physical objects (Facility Management) in Switzerland.
**Region:** Lucerne – Zug – Zurich (DACH Focus).
**Core Logic:**
1.  **QR Code** is the entry point (Physical -> Digital).
2.  **AI Chat** is the interface (No complex forms, natural conversation).
3.  **Human Resolution** (Technicians/Approvals) via Magic Links.

**Key Values:**
- "Zero-Login" for residents (Token/Cookie based).
- "Swiss Quality" UI (Minimalist, Clean, Precision).
- Privacy First (Datensparsamkeit).

---

## 2. Tech Stack (The "How")
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS.
- **Backend / CMS:** Sanity.io (Headless, flexible data schema).
- **AI Engine:** Google Gemini (via Vercel AI SDK).
- **Email/Notif:** Resend (Magic Links).
- **Hosting:** Vercel (Production).
- **Styling:** "Vercel/Geist" Aesthetic (Inter font, clean borders, shadows).

**URLs:**
- App (Production): `https://immo.ruta-tech.ch`
- Marketing (Main): `https://ruta-tech.ch`
- CMS Studio: `https://immo.ruta-tech.ch/studio`

---

## 3. Data Hierarchy (The Structure)
Strict 7-layer hierarchy mapping physical reality to digital assets:

1.  **Firma (Tenant)** → The Paying Client (e.g., "Miele AG").
    * *Identified by:* Subdomain/Slug.
    * *Config:* Brand colors, logo, specialized prompt rules.
2.  **Immobilie (Building)** → Physical Address.
3.  **Gebäudeteil (Section)** → Logical part (Wing A, Garage, Basement).
4.  **Etage (Floor)** → Vertical level.
5.  **Wohnung (Unit)** → Rentable/Functional unit (Apartment 4B).
6.  **Asset Typ (Category)** → Classification (Heating, Sanitary, IT).
7.  **Asset (Device)** → The object with the QR Code.
    * *Key:* Contains the specific prompt context for AI.

---

## 4. Coding Standards (The Rules)
- **Language:** Code/Comments = **English (Strict)**. UI/Text = **German (DE-CH)**.
- **I18n:** No hardcoded strings. Use a translation dictionary or CMS content.
- **Routing:**
    - `/` -> Login (Admins).
    - `/[clientSlug]/chat/[assetId]` -> Resident Interface (QR Entry).
    - `/studio` -> Sanity CMS.
- **Security:**
    - Back link on login page must point to external `ruta-tech.ch`.
    - AI Requests must be server-validated against `clientSlug` (Multi-tenant isolation).

---

## 5. Current Status (Where we are NOW)
**Completed (✅):**
- [x] **Project Setup:** Next.js + Sanity integrated on Vercel.
- [x] **UI Framework:** Modern SaaS look (Globals.css, Tailwind).
- [x] **Authentication UI:** Login page acts as Gateway (redirects to Studio/Main site).
- [x] **Sanity Schema v1:** Basic structures for Company and Asset defined.
- [x] **Navigation Fix:** "Back to Home" correctly links to marketing site.

**In Progress (🚧):**
- [ ] **Data Relations:** Enforcing the 7-layer hierarchy in Sanity Schemas.
- [ ] **Context-Aware AI:** Connecting Gemini to Sanity Data (RAG-lite).


**Next Steps (Immediate):**
1.  Finalize Sanity Schemas for `Building/Unit/Asset` hierarchy.
2.  Implement `getAssetContext` to feed the AI.
3.  Build the Ticket Creation flow via Chat.

---

## 6. Prompt Injection (For AI Assistants)
*Use this prompt when starting a new session with Gemini/Claude:*
"You are acting as the Lead Developer for RUTA-TECH. We are in the 'Foundation Phase'. The tech stack is Next.js 14 and Sanity. Refer to the Data Hierarchy (7 layers) for all architectural decisions. Current focus: Connecting AI Chat to Sanity Backend."