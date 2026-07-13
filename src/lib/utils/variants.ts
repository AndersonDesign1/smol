import type { CompressionJob, CompressionVariant } from "./types";

// In Auto mode the primary candidate (Smart PNG / same-format) is what the user
// came for; the WebP "smaller" candidate is only offered once the primary is
// ready. The worker runs both concurrently, so WebP can finish first — we gate
// its reveal on the primary's status, not on which one happens to finish first.

export function primaryAutoVariant(
  job: CompressionJob
): CompressionVariant | null {
  return job.variants.find((v) => v.auto && v.strategy !== "webp-lossy") ?? null;
}

// True while the primary auto candidate is still processing and a WebP secondary
// exists — the window in which WebP should stay hidden across the whole UI.
export function isSecondaryPending(job: CompressionJob): boolean {
  const primary = primaryAutoVariant(job);
  if (!primary || primary.status !== "processing") {
    return false;
  }
  return job.variants.some((v) => v.auto && v.strategy === "webp-lossy");
}

export function visibleVariants(job: CompressionJob): CompressionVariant[] {
  if (!isSecondaryPending(job)) {
    return job.variants;
  }
  return job.variants.filter((v) => !(v.auto && v.strategy === "webp-lossy"));
}
