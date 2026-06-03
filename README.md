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
| `MAKE_LEAD_WEBHOOK_URL` | Make hook below | Fired on first Airtable create (contact step) |
| `MAKE_BOOKING_WEBHOOK_URL` | Booking hook below | Fired on second Airtable update (after payment) |

Default lead webhook: `https://hook.us2.make.com/pqvr2gify32nr99cybhb84feeofq4nww`

Default booking webhook: `https://hook.us2.make.com/t2aufkom38h8ik31i09ct6ey3jwit21u`

**Duplicate Airtable rows:** Usually caused by two `POST /api/leads` requests at once (double-click or race). The API dedupes by `submissionId` (sent from the browser) and by matching `phone` within 5 minutes.

### Make webhook payload (`lead_created`)

```json
{
  "event": "lead_created",
  "airtableRecordId": "recXXXXXXXX",
  "zipFrom": 78701,
  "zipTo": 78704,
  "rooms": "2 Bedrooms",
  "packName": "📦📦 Standard Pack",
  "weeklyRate": 162,
  "additionalWeekRate": 81,
  "packDetails": "40 boxes, 1 dolly, 4 lbs paper, dry erase markers",
  "firstName": "Drew",
  "lastName": "Williams",
  "phone": "9193634740",
  "submittedAt": "2026-06-03T18:30:00.000Z",
  "source": "landing-page",
  "depositStatus": "Pending"
}
```

Zips and rates are numbers (matching your Airtable Number fields). A test payload with this shape was sent to your Make hook.

### Make booking webhook (`booking_completed`)

Fired after the second Airtable update (drop-off + payment). Default URL: `https://hook.us2.make.com/t2aufkom38h8ik31i09ct6ey3jwit21u`

Override with `MAKE_BOOKING_WEBHOOK_URL` in Cloudflare.

```json
{
  "event": "booking_completed",
  "airtableRecordId": "recXXXXXXXX",
  "zipFrom": 78701,
  "zipTo": 78704,
  "rooms": "2 Bedrooms",
  "packName": "📦📦 Standard Pack",
  "weeklyRate": 162,
  "additionalWeekRate": 81,
  "packDetails": "40 boxes, 1 dolly, 4 lbs paper, dry erase markers",
  "firstName": "Drew",
  "lastName": "Williams",
  "phone": "9193634740",
  "submittedAt": "2026-06-03T18:30:00.000Z",
  "source": "landing-page",
  "depositStatus": "Paid",
  "dropoffStreet": "1230 Shipyard Boulevard",
  "dropoffCity": "Wilmington",
  "dropoffState": "NC",
  "dropoffZip": 28412,
  "dropoffDate": "2026-06-10",
  "dropoffTime": "14:00",
  "paymentIntentId": "pi_TEST123",
  "stripeCustomerId": "cus_TEST123",
  "stripePaymentMethodId": "pm_TEST123",
  "completedAt": "2026-06-03T19:15:00.000Z"
}
```
| `AIRTABLE_FIELD_MAP` | — | JSON object mapping our payload keys to your Airtable column names (see below) |

### Airtable columns

**Already in your base (used by this lander):**

| Column | Filled when | Example |
|--------|-------------|---------|
| `zipFrom` | Contact step | `78701` (sent as **Number** if your Airtable columns are Number) |
| `zipTo` | Contact step | `78704` (same) |
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
| `dropoffZip` | **Single line text** (recommended) | After payment — sent as a 5-digit string |
| `dropoffDate` | Date | After payment |
| `dropoffTime` | Single line text | After payment |
| `depositStatus` | Single select (`Pending`, `Paid`) | `Pending` on create, `Paid` after Stripe |
| `paymentIntentId` | Single line text | After payment |
| `stripeCustomerId` | Single line text | After payment (`cus_…`) |
| `stripePaymentMethodId` | Single line text | After payment (`pm_…`) |
| `error` | **Long text** | Backend failures after a successful Stripe charge (detailed log; user still sees success) |

Override names with `AIRTABLE_FIELD_MAP` if your Airtable field names differ.

**After payment:** If Airtable or Make fails, the API still returns success to the visitor (payment already captured in Stripe). A detailed entry is appended to `error` so your team can fix the record manually.

**Number fields:** `zipFrom`, `zipTo`, `weeklyRate`, and `additionalWeekRate` are sent as numbers if your Airtable columns are Number. **`dropoffZip` is always sent as text** (e.g. `"78701"`). Use Single line text for `dropoffZip`; do not use a Number column unless you change the server mapping.

## API routes (Pages Functions)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/check-zip` | POST | `{ "zip": "78701" }` → `{ serviced: true/false }` |
| `/api/config` | GET | Public Stripe publishable key, Google Maps key, deposit amount |
| `/api/leads` | POST | Create lead after contact step; also POSTs to Make webhook |
| `/api/leads/:id` | PATCH | Update drop-off + payment after deposit |
| `/api/create-payment-intent` | POST | `{ "recordId": "rec..." }` → Stripe PaymentIntent |

## External setup checklist

### Stripe

1. Create account / use test mode.
2. Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to Cloudflare.
3. Payments are **card-only** (no Apple Pay, Google Pay, or Link in the Payment Element).
4. Each booking creates a **Stripe Customer** and saves the card with `setup_future_usage: off_session` so you can charge the same card later from the Stripe Dashboard or API using `stripeCustomerId` / `stripePaymentMethodId` stored in Airtable.

**Charge saved cards later (example):**

```bash
curl https://api.stripe.com/v1/payment_intents \
  -u sk_live_xxx: \
  -d amount=16200 \
  -d currency=usd \
  -d customer=cus_XXX \
  -d payment_method=pm_XXX \
  -d off_session=true \
  -d confirm=true
```

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
