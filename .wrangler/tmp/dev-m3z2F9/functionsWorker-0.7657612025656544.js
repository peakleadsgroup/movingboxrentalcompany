var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-OQT2XC/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// ../../../../.wrangler/tmp/pages-FFbawf/functionsWorker-0.7657612025656544.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
var DEFAULT_FIELDS = {
  firstName: "firstName",
  lastName: "lastName",
  phone: "phone",
  zipFrom: "zipFrom",
  zipTo: "zipTo",
  rooms: "rooms",
  submittedAt: "submittedAt",
  source: "source",
  packName: "packName",
  weeklyRate: "weeklyRate",
  additionalWeekRate: "additionalWeekRate",
  packDetails: "packDetails",
  dropoffStreet: "dropoffStreet",
  dropoffCity: "dropoffCity",
  dropoffState: "dropoffState",
  dropoffZip: "dropoffZip",
  dropoffDate: "dropoffDate",
  dropoffTime: "dropoffTime",
  depositStatus: "depositStatus",
  paymentIntentId: "paymentIntentId",
  stripeCustomerId: "stripeCustomerId",
  stripePaymentMethodId: "stripePaymentMethodId",
  error: "error"
};
function getFieldMap(env) {
  if (!env.AIRTABLE_FIELD_MAP) return { ...DEFAULT_FIELDS };
  try {
    return { ...DEFAULT_FIELDS, ...JSON.parse(env.AIRTABLE_FIELD_MAP) };
  } catch {
    return { ...DEFAULT_FIELDS };
  }
}
__name(getFieldMap, "getFieldMap");
__name2(getFieldMap, "getFieldMap");
function airtableUrl(env, recordId) {
  const base = env.AIRTABLE_BASE_ID;
  const table = encodeURIComponent(env.AIRTABLE_TABLE_NAME || "Leads");
  const path = recordId ? `/${recordId}` : "";
  return `https://api.airtable.com/v0/${base}/${table}${path}`;
}
__name(airtableUrl, "airtableUrl");
__name2(airtableUrl, "airtableUrl");
async function airtableFetch(env, method, body, recordId) {
  const key = env.AIRTABLE_API_KEY;
  if (!key || !env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable is not configured");
  }
  const res = await fetch(airtableUrl(env, recordId), {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : void 0
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || res.statusText;
    throw new Error(`Airtable error: ${msg}`);
  }
  return data;
}
__name(airtableFetch, "airtableFetch");
__name2(airtableFetch, "airtableFetch");
var NUMERIC_PAYLOAD_KEYS = /* @__PURE__ */ new Set([
  "zipFrom",
  "zipTo",
  "weeklyRate",
  "additionalWeekRate"
]);
function coerceZipText(value) {
  if (value === void 0 || value === null || value === "") return value;
  const digits = String(value).replace(/\D/g, "");
  return digits || String(value).trim();
}
__name(coerceZipText, "coerceZipText");
__name2(coerceZipText, "coerceZipText");
function coerceAirtableValue(key, value) {
  if (!NUMERIC_PAYLOAD_KEYS.has(key)) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return value;
  const n = Number(digits);
  return Number.isFinite(n) ? n : value;
}
__name(coerceAirtableValue, "coerceAirtableValue");
__name2(coerceAirtableValue, "coerceAirtableValue");
function leadFieldsFromPayload(payload, fieldMap) {
  const fields = {};
  const set = /* @__PURE__ */ __name2((key, value) => {
    if (value !== void 0 && value !== null && value !== "") {
      fields[fieldMap[key]] = coerceAirtableValue(key, value);
    }
  }, "set");
  set("firstName", payload.firstName);
  set("lastName", payload.lastName);
  set("phone", payload.phone);
  set("zipFrom", payload.zipFrom);
  set("zipTo", payload.zipTo);
  set("rooms", payload.rooms);
  set("submittedAt", payload.submittedAt);
  set("source", payload.source || "landing-page");
  set("packName", payload.packName);
  set("weeklyRate", payload.weeklyRate);
  set("additionalWeekRate", payload.additionalWeekRate);
  set("packDetails", payload.packDetails);
  set("dropoffStreet", payload.dropoffStreet);
  set("dropoffCity", payload.dropoffCity);
  set("dropoffState", payload.dropoffState);
  set("dropoffZip", coerceZipText(payload.dropoffZip));
  set("dropoffDate", payload.dropoffDate);
  set("dropoffTime", payload.dropoffTime);
  set("depositStatus", payload.depositStatus);
  set("paymentIntentId", payload.paymentIntentId);
  set("stripeCustomerId", payload.stripeCustomerId);
  set("stripePaymentMethodId", payload.stripePaymentMethodId);
  set("error", payload.error);
  return fields;
}
__name(leadFieldsFromPayload, "leadFieldsFromPayload");
__name2(leadFieldsFromPayload, "leadFieldsFromPayload");
async function getLeadRecord(env, recordId) {
  return airtableFetch(env, "GET", void 0, recordId);
}
__name(getLeadRecord, "getLeadRecord");
__name2(getLeadRecord, "getLeadRecord");
async function appendLeadError(env, recordId, message) {
  const fieldMap = getFieldMap(env);
  const errorField = fieldMap.error;
  if (!errorField) {
    throw new Error("Airtable error field is not configured");
  }
  let existing = "";
  try {
    const record = await getLeadRecord(env, recordId);
    if (record?.fields?.[errorField]) {
      existing = `

---

${String(record.fields[errorField])}`;
    }
  } catch {
    existing = "";
  }
  const fields = { [errorField]: `${message}${existing}` };
  return airtableFetch(env, "PATCH", { fields }, recordId);
}
__name(appendLeadError, "appendLeadError");
__name2(appendLeadError, "appendLeadError");
function escapeFormulaValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
__name(escapeFormulaValue, "escapeFormulaValue");
__name2(escapeFormulaValue, "escapeFormulaValue");
async function findRecentLeadByPhone(env, phone, withinMinutes = 5) {
  if (!phone || !env.AIRTABLE_API_KEY || !env.AIRTABLE_BASE_ID) {
    return null;
  }
  const fieldMap = getFieldMap(env);
  const phoneField = fieldMap.phone || "phone";
  const table = encodeURIComponent(env.AIRTABLE_TABLE_NAME || "Leads");
  const safePhone = escapeFormulaValue(phone);
  const formula = `AND({${phoneField}}="${safePhone}", IS_AFTER(CREATED_TIME(), DATEADD(NOW(), -${withinMinutes}, 'minutes')))`;
  const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${table}?filterByFormula=${encodeURIComponent(formula)}&maxRecords=1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Airtable duplicate check failed:", data);
    return null;
  }
  const record = data.records?.[0];
  return record ? { id: record.id, fields: record.fields } : null;
}
__name(findRecentLeadByPhone, "findRecentLeadByPhone");
__name2(findRecentLeadByPhone, "findRecentLeadByPhone");
async function createLead(env, payload) {
  const existing = await findRecentLeadByPhone(env, payload.phone);
  if (existing) {
    return { id: existing.id, fields: existing.fields, existing: true };
  }
  const fieldMap = getFieldMap(env);
  const fields = leadFieldsFromPayload(payload, fieldMap);
  const data = await airtableFetch(env, "POST", { fields });
  return { id: data.id, fields: data.fields, existing: false };
}
__name(createLead, "createLead");
__name2(createLead, "createLead");
async function updateLead(env, recordId, payload) {
  const fieldMap = getFieldMap(env);
  const fields = leadFieldsFromPayload(payload, fieldMap);
  const data = await airtableFetch(env, "PATCH", { fields }, recordId);
  return { id: data.id, fields: data.fields };
}
__name(updateLead, "updateLead");
__name2(updateLead, "updateLead");
function formatBookingError(stage, err, context = {}) {
  const lines = [
    `=== Booking error ===`,
    `Stage: ${stage}`,
    `Time: ${(/* @__PURE__ */ new Date()).toISOString()}`,
    `Message: ${err?.message || String(err)}`
  ];
  if (context.recordId) lines.push(`Airtable record: ${context.recordId}`);
  if (context.paymentIntentId) {
    lines.push(`PaymentIntent: ${context.paymentIntentId}`);
  }
  if (err?.stack) lines.push(`Stack:
${err.stack}`);
  const payload = context.payload || context.body;
  if (payload) {
    try {
      lines.push(`Payload:
${JSON.stringify(payload, null, 2)}`);
    } catch {
      lines.push("Payload: [unserializable]");
    }
  }
  return lines.join("\n");
}
__name(formatBookingError, "formatBookingError");
__name2(formatBookingError, "formatBookingError");
async function logBookingError(env, recordId, stage, err, context = {}) {
  const text = formatBookingError(stage, err, { ...context, recordId });
  try {
    await appendLeadError(env, recordId, text);
    return { logged: true };
  } catch (logErr) {
    console.error("Failed to write Airtable error field:", logErr);
    console.error(text);
    return { logged: false, logErr };
  }
}
__name(logBookingError, "logBookingError");
__name2(logBookingError, "logBookingError");
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
__name(jsonResponse, "jsonResponse");
__name2(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ ok: false, error: message }, status);
}
__name(errorResponse, "errorResponse");
__name2(errorResponse, "errorResponse");
function corsHeaders(origin) {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}
__name(corsHeaders, "corsHeaders");
__name2(corsHeaders, "corsHeaders");
function withCors(response, request, env) {
  const allowed = env.ALLOWED_ORIGIN || "";
  const origin = request.headers.get("Origin") || "";
  if (allowed && origin === allowed) {
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  }
  return response;
}
__name(withCors, "withCors");
__name2(withCors, "withCors");
function depositAmountCents(env) {
  const n = parseInt(env.DEPOSIT_AMOUNT_CENTS || "10000", 10);
  return Number.isFinite(n) && n > 0 ? n : 1e4;
}
__name(depositAmountCents, "depositAmountCents");
__name2(depositAmountCents, "depositAmountCents");
var DEFAULT_MAKE_LEAD_WEBHOOK = "https://hook.us2.make.com/pqvr2gify32nr99cybhb84feeofq4nww";
var DEFAULT_MAKE_BOOKING_WEBHOOK = "https://hook.us2.make.com/t2aufkom38h8ik31i09ct6ey3jwit21u";
function buildLeadWebhookPayload(body, recordId) {
  return {
    event: "lead_created",
    airtableRecordId: recordId,
    zipFrom: body.zipFrom ?? null,
    zipTo: body.zipTo ?? null,
    rooms: body.rooms ?? null,
    packName: body.packName ?? null,
    weeklyRate: body.weeklyRate ?? null,
    additionalWeekRate: body.additionalWeekRate ?? null,
    packDetails: body.packDetails ?? null,
    firstName: body.firstName,
    lastName: body.lastName,
    phone: body.phone,
    submittedAt: body.submittedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    source: body.source || "landing-page",
    depositStatus: body.depositStatus || "Pending",
    submissionId: body.submissionId ?? null
  };
}
__name(buildLeadWebhookPayload, "buildLeadWebhookPayload");
__name2(buildLeadWebhookPayload, "buildLeadWebhookPayload");
async function sendLeadWebhook(env, body, recordId) {
  const url = env.MAKE_LEAD_WEBHOOK_URL || DEFAULT_MAKE_LEAD_WEBHOOK;
  if (!url) return { ok: false, skipped: true };
  const payload = buildLeadWebhookPayload(body, recordId);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Make webhook failed (${res.status}): ${text || res.statusText}`);
  }
  return { ok: true, payload };
}
__name(sendLeadWebhook, "sendLeadWebhook");
__name2(sendLeadWebhook, "sendLeadWebhook");
function buildBookingWebhookPayload(body, recordId) {
  return {
    event: "booking_completed",
    airtableRecordId: recordId,
    zipFrom: body.zipFrom ?? null,
    zipTo: body.zipTo ?? null,
    rooms: body.rooms ?? null,
    packName: body.packName ?? null,
    weeklyRate: body.weeklyRate ?? null,
    additionalWeekRate: body.additionalWeekRate ?? null,
    packDetails: body.packDetails ?? null,
    firstName: body.firstName ?? null,
    lastName: body.lastName ?? null,
    phone: body.phone ?? null,
    submittedAt: body.submittedAt ?? null,
    source: body.source || "landing-page",
    depositStatus: body.depositStatus || "Paid",
    dropoffStreet: body.dropoffStreet ?? null,
    dropoffCity: body.dropoffCity ?? null,
    dropoffState: body.dropoffState ?? null,
    dropoffZip: body.dropoffZip ?? null,
    dropoffDate: body.dropoffDate ?? null,
    dropoffTime: body.dropoffTime ?? null,
    paymentIntentId: body.paymentIntentId ?? null,
    stripeCustomerId: body.stripeCustomerId ?? null,
    stripePaymentMethodId: body.stripePaymentMethodId ?? null,
    completedAt: body.completedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
}
__name(buildBookingWebhookPayload, "buildBookingWebhookPayload");
__name2(buildBookingWebhookPayload, "buildBookingWebhookPayload");
async function sendBookingWebhook(env, body, recordId) {
  const url = env.MAKE_BOOKING_WEBHOOK_URL || DEFAULT_MAKE_BOOKING_WEBHOOK;
  if (!url) return { ok: false, skipped: true };
  const payload = buildBookingWebhookPayload(body, recordId);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Make booking webhook failed (${res.status}): ${text || res.statusText}`);
  }
  return { ok: true, payload };
}
__name(sendBookingWebhook, "sendBookingWebhook");
__name2(sendBookingWebhook, "sendBookingWebhook");
async function onRequestOptions(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  if (allowed && origin === allowed) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  return new Response(null, { status: 204 });
}
__name(onRequestOptions, "onRequestOptions");
__name2(onRequestOptions, "onRequestOptions");
async function onRequestPatch(context) {
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
    payload: body
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
      airtableOk
    }),
    request,
    env
  );
}
__name(onRequestPatch, "onRequestPatch");
__name2(onRequestPatch, "onRequestPatch");
var SERVICED_ZIP_LIST = [
  "28320",
  "28328",
  "28332",
  "28337",
  "28349",
  "28393",
  "28398",
  "28401",
  "28402",
  "28403",
  "28404",
  "28405",
  "28406",
  "28407",
  "28408",
  "28409",
  "28410",
  "28411",
  "28412",
  "28420",
  "28421",
  "28422",
  "28423",
  "28424",
  "28425",
  "28428",
  "28429",
  "28430",
  "28431",
  "28432",
  "28433",
  "28434",
  "28435",
  "28436",
  "28438",
  "28441",
  "28442",
  "28443",
  "28444",
  "28445",
  "28447",
  "28448",
  "28449",
  "28450",
  "28451",
  "28452",
  "28453",
  "28454",
  "28455",
  "28456",
  "28457",
  "28458",
  "28459",
  "28460",
  "28461",
  "28462",
  "28463",
  "28464",
  "28465",
  "28466",
  "28467",
  "28468",
  "28469",
  "28470",
  "28472",
  "28478",
  "28479",
  "28480",
  "28518",
  "28521",
  "28522",
  "28539",
  "28540",
  "28541",
  "28542",
  "28543",
  "28544",
  "28545",
  "28546",
  "28547",
  "28555",
  "28572",
  "28574",
  "28582",
  "28584",
  "28594",
  "29566",
  "29568",
  "29582",
  "29597",
  "29598"
];
var SERVICED_ZIP_SET = new Set(SERVICED_ZIP_LIST);
function isServicedZip(zip) {
  const normalized = String(zip || "").trim();
  return /^\d{5}$/.test(normalized) && SERVICED_ZIP_SET.has(normalized);
}
__name(isServicedZip, "isServicedZip");
__name2(isServicedZip, "isServicedZip");
async function onRequestOptions2(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  if (allowed && origin === allowed) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  return new Response(null, { status: 204 });
}
__name(onRequestOptions2, "onRequestOptions2");
__name2(onRequestOptions2, "onRequestOptions");
async function onRequestPost(context) {
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
      message: serviced ? null : "We don't service that zip code yet."
    }),
    request,
    env
  );
}
__name(onRequestPost, "onRequestPost");
__name2(onRequestPost, "onRequestPost");
async function onRequestGet(context) {
  const { request, env } = context;
  const depositCents = depositAmountCents(env);
  return withCors(
    jsonResponse({
      ok: true,
      stripePublishableKey: env.STRIPE_PUBLISHABLE_KEY || "",
      googleMapsApiKey: env.GOOGLE_MAPS_API_KEY || "",
      depositAmountCents: depositCents,
      depositAmountDisplay: `$${(depositCents / 100).toFixed(0)}`
    }),
    request,
    env
  );
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
async function stripeRequest(secret, method, path, params) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params?.toString()
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error?.message || data.error || "Stripe request failed");
  }
  return data;
}
__name(stripeRequest, "stripeRequest");
__name2(stripeRequest, "stripeRequest");
function formatPhoneForStripe(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}
__name(formatPhoneForStripe, "formatPhoneForStripe");
__name2(formatPhoneForStripe, "formatPhoneForStripe");
async function ensureStripeCustomer(secret, { recordId, firstName, lastName, phone, email, existingCustomerId }) {
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
__name(ensureStripeCustomer, "ensureStripeCustomer");
__name2(ensureStripeCustomer, "ensureStripeCustomer");
async function createDepositPaymentIntent(secret, { amount, recordId, customerId }) {
  const params = new URLSearchParams({
    amount: String(amount),
    currency: "usd",
    customer: customerId,
    setup_future_usage: "off_session",
    description: "Moving box rental deposit"
  });
  params.append("payment_method_types[]", "card");
  params.set("metadata[airtable_record_id]", recordId);
  return stripeRequest(secret, "POST", "/payment_intents", params);
}
__name(createDepositPaymentIntent, "createDepositPaymentIntent");
__name2(createDepositPaymentIntent, "createDepositPaymentIntent");
async function onRequestOptions3(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  if (allowed && origin === allowed) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  return new Response(null, { status: 204 });
}
__name(onRequestOptions3, "onRequestOptions3");
__name2(onRequestOptions3, "onRequestOptions");
async function onRequestPost2(context) {
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
      existingCustomerId: body.stripeCustomerId
    });
    const amount = depositAmountCents(env);
    const paymentIntent = await createDepositPaymentIntent(secret, {
      amount,
      recordId,
      customerId
    });
    return withCors(
      jsonResponse({
        ok: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        customerId,
        amount
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
__name(onRequestPost2, "onRequestPost2");
__name2(onRequestPost2, "onRequestPost");
var inflight = /* @__PURE__ */ new Map();
function runOnce(key, fn) {
  if (!key) return fn();
  let pending = inflight.get(key);
  if (!pending) {
    pending = Promise.resolve().then(fn).finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, pending);
  }
  return pending;
}
__name(runOnce, "runOnce");
__name2(runOnce, "runOnce");
function leadCreateKey(body) {
  if (body.submissionId) return `lead:${body.submissionId}`;
  if (body.phone) return `lead:phone:${body.phone}`;
  return null;
}
__name(leadCreateKey, "leadCreateKey");
__name2(leadCreateKey, "leadCreateKey");
async function onRequestOptions4(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin") || "";
  const allowed = env.ALLOWED_ORIGIN || "";
  if (allowed && origin === allowed) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }
  return new Response(null, { status: 204 });
}
__name(onRequestOptions4, "onRequestOptions4");
__name2(onRequestOptions4, "onRequestOptions");
async function onRequestPost3(context) {
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
        duplicate: Boolean(record.existing)
      }),
      request,
      env
    );
  } catch (err) {
    console.error(err);
    return withCors(errorResponse(err.message || "Failed to save lead", 500), request, env);
  }
}
__name(onRequestPost3, "onRequestPost3");
__name2(onRequestPost3, "onRequestPost");
var routes = [
  {
    routePath: "/api/leads/:id",
    mountPath: "/api/leads",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions]
  },
  {
    routePath: "/api/leads/:id",
    mountPath: "/api/leads",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch]
  },
  {
    routePath: "/api/check-zip",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions2]
  },
  {
    routePath: "/api/check-zip",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/config",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/create-payment-intent",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions3]
  },
  {
    routePath: "/api/create-payment-intent",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/leads",
    mountPath: "/api",
    method: "OPTIONS",
    middlewares: [],
    modules: [onRequestOptions4]
  },
  {
    routePath: "/api/leads",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-OQT2XC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-OQT2XC/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.7657612025656544.js.map
