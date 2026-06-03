# Moving Box Rental Company — Landing Page

Multi-step quote and reservation flow: zip validation, pack pricing, Airtable lead capture, Google address autocomplete, drop-off scheduling, and Stripe deposit.

## Deploy (Cloudflare Pages)

1. Connect this repo to **Cloudflare Pages**.
2. Build command: *(leave empty — static site)*
3. Build output directory: `/` (project root)
4. Add environment variables below under **Settings → Environment variables** (Production and Preview).

Local preview with API routes:

```bash
npx wrangler pages dev .
```

## Cloudflare environment variables

### Required for full production flow

| Variable | Secret? | Description |
|----------|---------|-------------|
| `AIRTABLE_API_KEY` | Yes | Personal access token from [Airtable](https://airtable.com/create/tokens) with `data.records:read` and `data.records:write` on your base |
| `AIRTABLE_BASE_ID` | Yes | Base ID from the Airtable URL (`appXXXXXXXX`) |
| `AIRTABLE_TABLE_NAME` | No | Table name for leads (default: `Leads`) |
| `STRIPE_SECRET_KEY` | Yes | Secret key (`sk_live_...` or `sk_test_...`) from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | No* | Publishable key (`pk_...`) — exposed to the browser via `/api/config` |
| `GOOGLE_MAPS_API_KEY` | No* | API key with **Maps JavaScript API** and **Places API** enabled — exposed via `/api/config` |
| `SERVICED_ZIPS` | No | Comma-separated 5-digit zips **or** JSON array, e.g. `78701,78702` or `["78701","78702"]` |

\* Treat as sensitive in practice; restrict Google key by HTTP referrer and Stripe key by domain in each provider’s dashboard.

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `DEPOSIT_AMOUNT_CENTS` | `10000` | Deposit amount in cents ($100) |
| `ALLOWED_ORIGIN` | — | If set, enables CORS for that origin only (usually unnecessary on same domain) |
| `AIRTABLE_FIELD_MAP` | — | JSON object mapping our payload keys to your Airtable column names (see below) |

### Airtable columns

**Already in your base (used by this lander):**

| Column | Filled when | Example |
|--------|-------------|---------|
| `zipFrom` | Contact step | `78701` |
| `zipTo` | Contact step | `78704` |
| `rooms` | Contact step | `2 Bedrooms` (bedroom count label) |
| `firstName`, `lastName`, `phone` | Contact step | |
| `submittedAt` | Contact step | ISO timestamp |
| `source` | Contact step | `landing-page` |

**Legacy columns (not used by this lander — safe to leave blank):** `moveTimeline`, `moveType`

**Add these columns for pack, drop-off, and payment:**

| Column | Type | Filled when |
|--------|------|-------------|
| `packName` | Single line text | Contact step |
| `weeklyRate` | Number | Contact step |
| `additionalWeekRate` | Number | Contact step |
| `packDetails` | Long text (optional) | Contact step |
| `dropoffStreet` | Single line text | After payment |
| `dropoffCity` | Single line text | After payment |
| `dropoffState` | Single line text | After payment |
| `dropoffZip` | Single line text | After payment |
| `dropoffDate` | Date | After payment |
| `dropoffTime` | Single line text | After payment |
| `depositStatus` | Single select (`Pending`, `Paid`) | `Pending` on create, `Paid` after Stripe |
| `paymentIntentId` | Single line text | After payment |

Override names with `AIRTABLE_FIELD_MAP` if your Airtable field names differ.

## API routes (Pages Functions)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/check-zip` | POST | `{ "zip": "78701" }` → `{ serviced: true/false }` |
| `/api/config` | GET | Public Stripe publishable key, Google Maps key, deposit amount |
| `/api/leads` | POST | Create lead after contact step |
| `/api/leads/:id` | PATCH | Update drop-off + payment after deposit |
| `/api/create-payment-intent` | POST | `{ "recordId": "rec..." }` → Stripe PaymentIntent |

## External setup checklist

### Stripe

1. Create account / use test mode.
2. Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to Cloudflare.
3. Enable **Payment methods** you want (card is default via Payment Element).

### Airtable

1. Create a **Leads** table with columns matching the field map above.
2. Create a token with write access to that base.
3. Set `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`.

### Google Cloud

1. Enable **Maps JavaScript API** and **Places API**.
2. Create an API key; restrict by HTTP referrer to your production domain.
3. Set `GOOGLE_MAPS_API_KEY`.

### Serviced zip codes

Add every zip you service to `SERVICED_ZIPS`. If empty, **all valid zips are accepted** (dev-friendly; set zips before launch).

## Assets

Place your logo at `assets/logo.png` (referenced from `index.html`).

## Flow summary

1. Zip from / zip to (validated against `SERVICED_ZIPS`)
2. Bedrooms → pack selection (Standard pre-selected)
3. Contact + TCPA → **Airtable create**
4. Google address autocomplete → drop-off fields
5. Date + time (9 AM–8 PM)
6. **Stripe** $100 deposit → **Airtable update** with drop-off + `Deposit Status: Paid`
7. Success screen with confetti
