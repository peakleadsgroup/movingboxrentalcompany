import { createLead } from "../_lib/airtable.js";
import { errorResponse, jsonResponse, withCors } from "../_lib/env.js";
import { leadCreateKey, runOnce } from "../_lib/idempotency.js";
import { sendLeadWebhook } from "../_lib/webhook.js";

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

  let body;
  try {
    body = await request.json();
  } catch {
    return withCors(errorResponse("Invalid JSON body"), request, env);
  }

  if (!body.firstName || !body.lastName || !body.phone) {
    return withCors(errorResponse("Contact information is required"), request, env);
  }

  try {
    const record = await runOnce(leadCreateKey(body), () => createLead(env, body));

    if (!record.existing) {
      try {
        await sendLeadWebhook(env, body, record.id);
      } catch (webhookErr) {
        console.error("Make webhook error:", webhookErr);
      }
    }

    return withCors(
      jsonResponse({
        ok: true,
        recordId: record.id,
        duplicate: Boolean(record.existing),
      }),
      request,
      env
    );
  } catch (err) {
    console.error(err);
    return withCors(errorResponse(err.message || "Failed to save lead", 500), request, env);
  }
}
