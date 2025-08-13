export function getBrowserName(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Unknown";
}

export async function getStableFingerprint(): Promise<string> {
  const screenRes = `${screen.width}x${screen.height}`;
  const platform = navigator.platform;
  const language = navigator.language;
  const cpuClass = navigator.hardwareConcurrency?.toString() ?? "unknown";
  const browserName = getBrowserName();
  const userAgent = navigator.userAgent;
  return [
    platform,
    language,
    screenRes,
    cpuClass,
    browserName,
    userAgent.replace(/[0-9.]+/g, ""),
  ].join("|");
}

export function modifySeedLast4Bytes(
  seed: Uint8Array,
  browserTagBytes: Uint8Array,
): Uint8Array {
  if (seed.length !== 32) throw new Error("Seed must be 32 bytes");
  if (browserTagBytes.length !== 4)
    throw new Error("Need exactly 4 bytes for tag");

  const modifiedSeed = new Uint8Array(seed);
  modifiedSeed.set(browserTagBytes, 28); // overwrite last 4 bytes
  return modifiedSeed;
}

export async function generateDeterministicSeed(): Promise<Uint8Array> {
  const fp = await getStableFingerprint();
  const encoder = new TextEncoder();
  const data = encoder.encode(fp);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest).slice(0, 4);
}
