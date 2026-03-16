import { createHash } from "crypto";

export function signMd5(bodyJson: string, secretKey: string, txntime: string): string {
  return createHash("md5").update(bodyJson + secretKey + txntime, "utf8").digest("hex");
}

export function computeBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const expDelay = baseDelayMs * 2 ** attempt;
  return Math.min(maxDelayMs, expDelay);
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
