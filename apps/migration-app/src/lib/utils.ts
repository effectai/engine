import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function decodeAuthorizePayload(authParam: string): {
  signature: Uint8Array;
  message: Uint8Array;
  foreignPublicKey: Uint8Array;
} | null {
  try {
    const base64 = authParam.replace(/-/g, "+").replace(/_/g, "/");

    const jsonStr = new TextDecoder().decode(
      Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
    );

    const parsed = JSON.parse(jsonStr);

    return {
      signature: new Uint8Array(Object.values(parsed.signature)),
      message: new Uint8Array(Object.values(parsed.message)),
      foreignPublicKey: new Uint8Array(Object.values(parsed.foreignPublicKey)),
    };
  } catch (e) {
    console.error("Failed to decode authorize payload:", e);
    return null;
  }
}
