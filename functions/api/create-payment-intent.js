import { depositAmountCents, errorResponse, jsonResponse, withCors } from "../_lib/env.js";
import {
  createDepositPaymentIntent,
  ensureStripeCustomer,
} from "../_lib/stripe.js";

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

  try {
    const customerId = await ensureStripeCustomer(secret, {
      recordId,
      firstName: body.firstName,
      lastName: body.lastName,
      phone: body.phone,
      email: body.email,
      existingCustomerId: body.stripeCustomerId,
    });

    const amount = depositAmountCents(env);
    const paymentIntent = await createDepositPaymentIntent(secret, {
      amount,
      recordId,
      customerId,
    });

    return withCors(
      jsonResponse({
        ok: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId,
        amount,
      }),
      request,
      env
    );
  } catch (err) {
    console.error(err);
    return withCors(
      errorResponse(err.message || "Stripe payment intent failed", 500),
      request,
      env
    );
  }
}
