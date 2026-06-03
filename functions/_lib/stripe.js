export async function stripeRequest(secret, method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params?.toString(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || data.error || "Stripe request failed");
  }
  return data;
}

export function formatPhoneForStripe(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

export async function ensureStripeCustomer(
  secret,
  { recordId, firstName, lastName, phone, email, existingCustomerId }
) {
  if (existingCustomerId) {
    return existingCustomerId;
  }

  const params = new URLSearchParams();
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  if (name) params.set("name", name);

  const stripePhone = formatPhoneForStripe(phone);
  if (stripePhone) params.set("phone", stripePhone);
  if (email) params.set("email", email);
  params.set("metadata[airtable_record_id]", recordId);

  const customer = await stripeRequest(secret, "POST", "/customers", params);
  return customer.id;
}

export async function createDepositPaymentIntent(
  secret,
  { amount, recordId, customerId }
) {
  const params = new URLSearchParams({
    amount: String(amount),
    currency: "usd",
    customer: customerId,
    setup_future_usage: "off_session",
    description: "Moving box rental deposit",
  });
  params.append("payment_method_types[]", "card");
  params.set("metadata[airtable_record_id]", recordId);

  return stripeRequest(secret, "POST", "/payment_intents", params);
}
