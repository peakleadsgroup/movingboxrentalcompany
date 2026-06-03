/** Maps API payload keys → your Airtable column names (camelCase). */
const DEFAULT_FIELDS = {
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
};

export function getFieldMap(env) {
  if (!env.AIRTABLE_FIELD_MAP) return { ...DEFAULT_FIELDS };
  try {
    return { ...DEFAULT_FIELDS, ...JSON.parse(env.AIRTABLE_FIELD_MAP) };
  } catch {
    return { ...DEFAULT_FIELDS };
  }
}

function airtableUrl(env, recordId) {
  const base = env.AIRTABLE_BASE_ID;
  const table = encodeURIComponent(env.AIRTABLE_TABLE_NAME || "Leads");
  const path = recordId ? `/${recordId}` : "";
  return `https://api.airtable.com/v0/${base}/${table}${path}`;
}

async function airtableFetch(env, method, body, recordId) {
  const key = env.AIRTABLE_API_KEY;
  if (!key || !env.AIRTABLE_BASE_ID) {
    throw new Error("Airtable is not configured");
  }

  const res = await fetch(airtableUrl(env, recordId), {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || data?.error || res.statusText;
    throw new Error(`Airtable error: ${msg}`);
  }
  return data;
}

/** Payload keys that map to Airtable Number columns. */
const NUMERIC_PAYLOAD_KEYS = new Set([
  "zipFrom",
  "zipTo",
  "dropoffZip",
  "weeklyRate",
  "additionalWeekRate",
]);

function coerceAirtableValue(key, value) {
  if (!NUMERIC_PAYLOAD_KEYS.has(key)) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return value;
  const n = Number(digits);
  return Number.isFinite(n) ? n : value;
}

export function leadFieldsFromPayload(payload, fieldMap) {
  const fields = {};
  const set = (key, value) => {
    if (value !== undefined && value !== null && value !== "") {
      fields[fieldMap[key]] = coerceAirtableValue(key, value);
    }
  };

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
  set("dropoffZip", payload.dropoffZip);
  set("dropoffDate", payload.dropoffDate);
  set("dropoffTime", payload.dropoffTime);
  set("depositStatus", payload.depositStatus);
  set("paymentIntentId", payload.paymentIntentId);
  set("stripeCustomerId", payload.stripeCustomerId);
  set("stripePaymentMethodId", payload.stripePaymentMethodId);

  return fields;
}

function escapeFormulaValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/** Prevent duplicate rows from double-submit or parallel requests. */
export async function findRecentLeadByPhone(env, phone, withinMinutes = 5) {
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
    headers: { Authorization: `Bearer ${env.AIRTABLE_API_KEY}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Airtable duplicate check failed:", data);
    return null;
  }

  const record = data.records?.[0];
  return record ? { id: record.id, fields: record.fields } : null;
}

export async function createLead(env, payload) {
  const existing = await findRecentLeadByPhone(env, payload.phone);
  if (existing) {
    return { id: existing.id, fields: existing.fields, existing: true };
  }

  const fieldMap = getFieldMap(env);
  const fields = leadFieldsFromPayload(payload, fieldMap);
  const data = await airtableFetch(env, "POST", { fields });
  return { id: data.id, fields: data.fields, existing: false };
}

export async function updateLead(env, recordId, payload) {
  const fieldMap = getFieldMap(env);
  const fields = leadFieldsFromPayload(payload, fieldMap);
  const data = await airtableFetch(env, "PATCH", { fields }, recordId);
  return { id: data.id, fields: data.fields };
}
