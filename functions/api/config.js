import { depositAmountCents, jsonResponse, withCors } from "../_lib/env.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const depositCents = depositAmountCents(env);

  return withCors(
    jsonResponse({
      ok: true,
      stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY || "",
      googleMapsApiKey: env.GOOGLE_MAPS_API_KEY || "",
      depositAmountCents: depositCents,
      depositAmountDisplay: `$${(depositCents / 100).toFixed(0)}`,
    }),
    request,
    env
  );
}
