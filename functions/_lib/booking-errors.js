import { appendLeadError } from "./airtable.js";

export function formatBookingError(stage, err, context = {}) {
  const lines = [
    `=== Booking error ===`,
    `Stage: ${stage}`,
    `Time: ${new Date().toISOString()}`,
    `Message: ${err?.message || String(err)}`,
  ];

  if (context.recordId) lines.push(`Airtable record: ${context.recordId}`);
  if (context.paymentIntentId) {
    lines.push(`PaymentIntent: ${context.paymentIntentId}`);
  }

  if (err?.stack) lines.push(`Stack:\n${err.stack}`);

  const payload = context.payload || context.body;
  if (payload) {
    try {
      lines.push(`Payload:\n${JSON.stringify(payload, null, 2)}`);
    } catch {
      lines.push("Payload: [unserializable]");
    }
  }

  return lines.join("\n");
}

/** Log to Airtable `error` field; never throws. */
export async function logBookingError(env, recordId, stage, err, context = {}) {
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
