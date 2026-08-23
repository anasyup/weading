# Deployment Guide — Noor Bridal Platform

The dev preview runs SQLite for zero-setup. Production is a **three-switch launch**:
database, email, payments — all behind adapters, no code changes.

---

## 1. PostgreSQL (recommended: Neon · Supabase · Railway)

The schema was **verified against a real PostgreSQL 16 server** (push + seed + full QA suite).

```bash
bash scripts/use-postgres.sh "postgresql://user:pass@host:5432/noor_bridal?sslmode=require"
npx tsx prisma/seed.ts     # only if you want demo data; otherwise create your admin below
```

To create the first Super Admin on a fresh production DB:
```bash
npx tsx -e "import('./prisma/admin-bootstrap.ts')"   # or see scripts/bootstrap-admin.ts
```

## 2. Email — Resend (or any HTTP provider)

Set in `.env`:
```
RESEND_API_KEY=re_xxx
EMAIL_FROM="Noor Bridal <care@yourdomain.com>"
```
Without keys, mail goes to the in-app dev outbox (Admin → visible in DB) — never silently lost.

## 3. Payments — Stripe (US/CA) today, PK gateway later

1. `.env`: `STRIPE_SECRET_KEY=sk_...` and `STRIPE_WEBHOOK_SECRET=whsec_...`
2. Stripe Dashboard → Webhooks → `{APP_URL}/api/payments/webhook`, event **checkout.session.completed**
3. Admin → Settings → Payment gateway: set provider `STRIPE` (or add a second gateway row for
   PayFast/Safepay for Pakistan — checkout picks the default per market automatically once configured).

Signature verification is implemented without the Stripe SDK (HMAC-SHA256, timing-safe).

## 4. Hosting

**Option A — Vercel + Neon (simplest)**
- Import repo → Vercel; add env vars from `.env.example`
- Neon connection string as `DATABASE_URL`
- Run `prisma db push` once from CI or locally against the prod DB

**Option B — Railway / Render / any Docker host**
- `docker build -t noor-bridal . && docker run -e DATABASE_URL=... -p 3000:3000 noor-bridal`

## 5. Launch checklist

- [ ] PostgreSQL live + `prisma db push` + backup schedule (provider-side PITR)
- [ ] First Super Admin created; dev demo accounts **deleted**
- [ ] Stripe keys + webhook verified with a test payment
- [ ] Resend domain verified (SPF/DKIM)
- [ ] Tax rates reviewed with your accountant (Admin → Settings)
- [ ] Legal pages finalized (Admin → Content → Pages: Terms/Privacy/Shipping/Returns)
- [ ] Brand name/WhatsApp/email set (Admin → Settings → General)
- [ ] Domain + HTTPS + `NEXT_PUBLIC_APP_URL` set
- [ ] Run `npm run qa` against staging once more

## Security notes (already implemented)

Sessions are opaque hashed tokens · login lockout after 8 failures/15 min · audit log on every
admin mutation · security headers via `next.config.ts` · no card data stored (SAQ-A-style
hosted checkout) · uploads type/size validated · rate-limited APIs.
