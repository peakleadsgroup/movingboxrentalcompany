import { depositAmountCents, errorResponse, jsonResponse, withCors } from "../_lib/env.js";

export async function onRequestOptions(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  if (allowed && origin === allowed) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return new Response(null, { status: 204 });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const secret = env.STRIPE_SECRET_KEY;
  if (!secret) {
    return withCors(errorResponse("Stripe is not configured", 500), request, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return withCors(errorResponse("Invalid JSON body"), request, env);
  }

  const recordId = body.recordId;
  if (!recordId) {
    return withCors(errorResponse("recordId is required"), request, env);
  }

  const amount = depositAmountCents(env);
  const params = new URLSearchParams({
    amount: String(amount),
    currency: "usd",
    "automatic_payment_methods[enabled]": "true",
    "metadata[airtable_record_id]": recordId,
    description: "Moving box rental deposit",
  });

  if (body.email) {
    params.set("receipt_email", body.email);
  }

  const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await stripeRes.json();
  if (!stripeRes.ok) {
    console.error(data);
    return withCors(
      errorResponse(data.error?.message || "Stripe payment intent failed", 500),
      request,
      env
    );
  }

  return withCors(
    jsonResponse({
      ok: true,
      clientSecret: data.client_secret,
      paymentIntentId: data.id,
      amount,
    }),
    request,
    env
  );
}
