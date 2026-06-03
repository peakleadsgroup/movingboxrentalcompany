import { updateLead } from "../../_lib/airtable.js";
import { errorResponse, jsonResponse, withCors } from "../../_lib/env.js";

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

  try {
    await updateLead(env, recordId, body);
    return withCors(jsonResponse({ ok: true, recordId }), request, env);
  } catch (err) {
    console.error(err);
    return withCors(errorResponse(err.message || "Failed to update lead", 500), request, env);
  }
}
