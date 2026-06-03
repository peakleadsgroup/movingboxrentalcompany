export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

export function errorResponse(message, status = 400) {
  return jsonResponse({ ok: false, error: message }, status);
}

export function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function withCors(response, request, env) {
  const allowed = env.ALLOWED_ORIGIN || "";
  const origin = request.headers.get("Origin") || "";
  if (allowed && origin === allowed) {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  }
  return response;
}

export function parseServicedZips(env) {
  const raw = env.SERVICED_ZIPS || "";
  if (!raw.trim()) return new Set();
  try {
    if (raw.trim().startsWith("[")) {
      return new Set(JSON.parse(raw).map((z) => String(z).padStart(5, "0")));
    }
  } catch {
    /* fall through */
  }
  return new Set(
    raw
      .split(/[\s,;]+/)
      .map((z) => z.trim())
      .filter((z) => /^\d{5}$/.test(z))
  );
}

export function depositAmountCents(env) {
  const n = parseInt(env.DEPOSIT_AMOUNT_CENTS || "10000", 10);
  return Number.isFinite(n) && n > 0 ? n : 10000;
}
