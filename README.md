# Noor Bridal — Bridal E-Commerce & Business Platform

Implementation of [`MASTER_SPEC.md`](../MASTER_SPEC.md) — a made-to-order bridal e-commerce
platform for a solo founder with an enterprise-ready foundation.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Prisma · PostgreSQL (Neon-verified)

## Production-ready

- **PostgreSQL verified** — schema pushed + seeded + full 28-check QA suite passed against PostgreSQL 17 (`bash scripts/use-postgres.sh <url>`)
- **Stripe adapter implemented** — hosted Checkout via REST (no SDK) + HMAC-verified webhook at `/api/payments/webhook`; without keys the sandbox MOCK gateway runs
- **Email adapter** — set `RESEND_API_KEY` for real mail; otherwise the in-app dev outbox
- **Admin image uploads** — drag-free file upload (type/size validated), storage backend swappable
- **SEO** — `sitemap.xml`, `robots.txt`, product JSON-LD structured data, per-page meta
- **Deployment** — see `DEPLOYMENT.md` (Vercel/Neon or Docker), `.env.example`, `Dockerfile`

## Run

```bash
npm install            # also runs `prisma generate`
# Set DATABASE_URL in .env (any PostgreSQL — Neon free tier works great)
npm run db:push        # create/sync tables
npm run db:seed        # demo catalog, orders, users, CMS content (dev data)
npm run dev            # http://localhost:3000
```

Production first-run on Vercel: the one-time `/api/setup` endpoint (x-setup-key guarded)
creates tables + production seed + Super Admin — see DEPLOYMENT.md.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@noorbridal.test` | `Admin#2026` |
| Customer (US) | `sarah@example.com` | `Test#1234` |
| Customer (PK) | `ayesha@example.com` | `Test#1234` |
| Customer (CA) | `emma@example.com` | `Test#1234` |

Emails (verification / password reset) are written to an in-app dev outbox; the action link
is surfaced in the UI. Production swaps in a provider adapter.

## Structure

```
prisma/schema.prisma     merged enterprise-ready data model (~60 tables)
prisma/seed.ts           demo data (catalog, workflow, orders, CMS, coupons…)
scripts/qa.ts            full purchase-journey QA suite (npm run qa — 28 checks)
scripts/use-postgres.sh  one-command PostgreSQL switch (verified on PG 17)
DEPLOYMENT.md            production launch guide (hosting, keys, checklist)
scripts/backup.mjs       daily backup job with retention (npm run db:backup)
src/app/(shop)           customer storefront + checkout + order tracking
src/app/(auth)           register / verify / login / forgot / reset
src/app/admin            admin panel (dashboard, orders + manual orders, products, inventory,
                         customers, marketing, content/CMS, support, reviews, settings, audit)
src/app/api              cart, country, newsletter, wishlist endpoints
src/lib                  auth, orders (service), coupons, cart, pricing, audit, settings
```

## Stage status (see MASTER_SPEC §12)

- ✅ Stage 1 — Foundation: schema, seed, auth, sessions, throttling, audit, settings
- ✅ Stage 2 — storefront browsing, product detail (variants/customizations/measurements), cart, wishlist
- ✅ Stage 3 — checkout, coupon engine, mock payment adapter, order snapshots, stock reservation, invoices, order tracking, confirmation emails
- ✅ Stage 4 — admin dashboard/orders/products/inventory/customers/settings/audit + manual orders (Instagram/WhatsApp sales)
- ✅ Stage 5 — coupons admin, reviews moderation, CMS (banners/pages/FAQs/blog), support tickets, newsletter admin
- ✅ Stage 6 (dev-level) — QA suite (npm run qa, 28 checks), security headers, backup job (npm run db:backup)
- ✅ Production readiness — PostgreSQL verified, Stripe adapter + webhook, email adapter, uploads, SEO, Docker + deployment guide. Remaining before real launch: domain, Stripe keys, Resend key, legal pages review (see DEPLOYMENT.md checklist)
