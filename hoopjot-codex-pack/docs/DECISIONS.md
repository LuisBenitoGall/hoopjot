# Decision log

## D001 — Product name
**Decision:** Hoopnote.

## D002 — Client framework
**Decision:** React + TypeScript + Vite, not Next.js.

Reason: the product is an interactive offline-first PWA with limited SSR/SEO needs and a separate Supabase backend.

## D003 — Hosting/backend
**Decision:** Vercel for frontend deployment; Supabase for Auth, PostgreSQL, RLS, Storage and Edge/server functions.

## D004 — Persistence
**Decision:** IndexedDB via Dexie as local domain persistence. Supabase is remote durability/sync.

`localStorage` is not a domain database.

## D005 — Identity
**Decision:** Email registration from the first MVP. No anonymous product account flow.

## D006 — Internationalization
**Decision:** English + Spanish initially, architecture ready for additional locales.

## D007 — Audience
**Decision:** Gender-neutral, age 16+.

## D008 — AI
**Decision:** Not required for MVP. Later AI interprets free text into structured observations; it does not directly own recommendation selection.

## D009 — Video
**Decision:** Post-MVP.

## D010 — Basketball content
**Decision:** Curated editorial data separated from software logic and translated by stable IDs.
