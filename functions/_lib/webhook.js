const DEFAULT_MAKE_LEAD_WEBHOOK =
  "https://hook.us2.make.com/pqvr2gify32nr99cybhb84feeofq4nww";

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
