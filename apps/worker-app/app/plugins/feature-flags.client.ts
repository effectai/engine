import { defineNuxtPlugin } from "#app";

declare global {
  interface Window {
    enableFeature: (feature: string) => void;
    disableFeature: (feature: string) => void;
    listFeatures: () => Record<string, boolean>;
  }
}

const STORAGE_KEY = "effect-feature-flags";

const getFlags = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setFlags = (flags: Record<string, boolean>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
};

export default defineNuxtPlugin(() => {
  window.enableFeature = (feature: string) => {
    const flags = getFlags();
    flags[feature] = true;
    setFlags(flags);
    console.log(`[FeatureFlags] Enabled: ${feature}`);
  };

  window.disableFeature = (feature: string) => {
    const flags = getFlags();
    flags[feature] = false;
    setFlags(flags);
    console.log(`[FeatureFlags] Disabled: ${feature}`);
  };

  window.listFeatures = () => {
    const flags = getFlags();
    console.table(flags);
    return { ...flags };
  };
});