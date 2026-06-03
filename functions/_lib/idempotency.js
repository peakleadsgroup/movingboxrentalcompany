/** Coalesce concurrent lead creates in the same worker (double-click / duplicate fetch). */
const inflight = new Map();

export function runOnce(key, fn) {
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

export function leadCreateKey(body) {
  if (body.submissionId) return `lead:${body.submissionId}`;
  if (body.phone) return `lead:phone:${body.phone}`;
  return null;
}
