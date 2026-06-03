const DEFAULT_MAKE_LEAD_WEBHOOK =
  "https://hook.us2.make.com/pqvr2gify32nr99cybhb84feeofq4nww";

const DEFAULT_MAKE_BOOKING_WEBHOOK =
  "https://hook.us2.make.com/t2aufkom38h8ik31i09ct6ey3jwit21u";

export function buildLeadWebhookPayload(body, recordId) {
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
    submittedAt: body.submittedAt ?? new Date().toISOString(),
    source: body.source || "landing-page",
    depositStatus: body.depositStatus || "Pending",
    submissionId: body.submissionId ?? null,
  };
}

export async function sendLeadWebhook(env, body, recordId) {
  const url = env.MAKE_LEAD_WEBHOOK_URL || DEFAULT_MAKE_LEAD_WEBHOOK;
  if (!url) return { ok: false, skipped: true };

  const payload = buildLeadWebhookPayload(body, recordId);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Make webhook failed (${res.status}): ${text || res.statusText}`);
  }

  return { ok: true, payload };
}

export function buildBookingWebhookPayload(body, recordId) {
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
    completedAt: body.completedAt || new Date().toISOString(),
  };
}

export async function sendBookingWebhook(env, body, recordId) {
  const url = env.MAKE_BOOKING_WEBHOOK_URL || DEFAULT_MAKE_BOOKING_WEBHOOK;
  if (!url) return { ok: false, skipped: true };

  const payload = buildBookingWebhookPayload(body, recordId);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Make booking webhook failed (${res.status}): ${text || res.statusText}`);
  }

  return { ok: true, payload };
}
