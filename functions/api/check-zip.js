import { isServicedZip } from "../_lib/serviced-zips.js";
import { errorResponse, jsonResponse, withCors } from "../_lib/env.js";

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

  const zip = String(body.zip || "").trim();
  if (!/^\d{5}$/.test(zip)) {
    return withCors(errorResponse("Zip must be 5 digits"), request, env);
  }

  const serviced = isServicedZip(zip);
  return withCors(
    jsonResponse({
      ok: true,
      zip,
      serviced,
      message: serviced ? null : "We don't service that zip code yet.",
    }),
    request,
    env
  );
}
