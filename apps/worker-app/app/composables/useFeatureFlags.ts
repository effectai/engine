const STORAGE_KEY = "effect-feature-flags";

type Feature = "device-storage" | "payment-storage";

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

/**
 * Use feature flags for gradual rollout of new features.
 *
 * Flags are stored in localStorage under `effect-feature-flags` and default
 * to `false`. Users can enable/disable from the web console:
 *
 *   enableFeature("device-storage")
 *   disableFeature("payment-storage")
 *   listFeatures()
 *
 * Production uses: gated rollouts, beta testing of device registration
 * and payment sync without shipping to all users at once.
 */
export function useFeatureFlags() {
  const isEnabled = (feature: Feature): boolean => {
    const flags = getFlags();
    return flags[feature] === true;
  };

  return { isEnabled };
}

// Expose a console API for users to toggle features
if (typeof window !== "undefined") {
  (window as any).enableFeature = (feature: Feature) => {
    const flags = getFlags();
    flags[feature] = true;
    setFlags(flags);
    console.log(`[FeatureFlags] Enabled: ${feature}`);
  };

  (window as any).disableFeature = (feature: Feature) => {
    const flags = getFlags();
    flags[feature] = false;
    setFlags(flags);
    console.log(`[FeatureFlags] Disabled: ${feature}`);
  };

  (window as any).listFeatures = () => {
    const flags = getFlags();
    console.table(flags);
    return { ...flags };
  };
}
