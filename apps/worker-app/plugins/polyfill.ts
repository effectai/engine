import { Buffer } from "buffer";
import processShim from "process";

if ((globalThis as any).global === undefined)
  (globalThis as any).global = globalThis;

const p: any = (globalThis as any).process || processShim || {};

if (typeof p.nextTick !== "function") {
  p.nextTick = (cb: (...args: any[]) => void, ...args: any[]) => {
    if (typeof queueMicrotask === "function") queueMicrotask(() => cb(...args));
    else Promise.resolve().then(() => cb(...args));
  };
}
(globalThis as any).process = p;

(globalThis as any).Buffer ||= Buffer;

export default defineNuxtPlugin((nuxtApp) => {});
