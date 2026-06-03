import { updateLead } from "../../_lib/airtable.js";
import { logBookingError } from "../../_lib/booking-errors.js";
import { errorResponse, jsonResponse, withCors } from "../../_lib/env.js";
import { sendBookingWebhook } from "../../_lib/webhook.js";

export async function onRequestOptions(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  if (allowed && origin === allowed) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }
  return new Response(null, { status: 204 });
}

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const recordId = params.id;

  if (!recordId) {
    return withCors(errorResponse("Record id required"), request, env);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return withCors(errorResponse("Invalid JSON body"), request, env);
  }

  const errorContext = {
    recordId,
    paymentIntentId: body.paymentIntentId ?? null,
    payload: body,
  };

  let airtableOk = false;

  try {
    await updateLead(env, recordId, body);
    airtableOk = true;
  } catch (err) {
    console.error("Airtable booking update failed:", err);
    await logBookingError(env, recordId, "airtable_update", err, errorContext);
  }

  try {
    await sendBookingWebhook(env, body, recordId);
  } catch (webhookErr) {
    console.error("Make booking webhook error:", webhookErr);
    await logBookingError(env, recordId, "make_booking_webhook", webhookErr, errorContext);
  }

  return withCors(
    jsonResponse({
      ok: true,
      recordId,
      airtableOk,
    }),
    request,
    env
  );
}
