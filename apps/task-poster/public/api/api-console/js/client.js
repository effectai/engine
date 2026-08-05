const API_BASE = (window.EFFECT_API_BASE || "") + "/v1";

// The key is kept in sessionStorage so a browser refresh stays connected, but
// it clears when the tab closes (never persisted to disk via localStorage).
const KEY_STORAGE = "effect-console-key";
let apiKey = sessionStorage.getItem(KEY_STORAGE) || "";
export const setApiKey = (key) => {
  apiKey = key || "";
  if (apiKey) sessionStorage.setItem(KEY_STORAGE, apiKey);
  else sessionStorage.removeItem(KEY_STORAGE);
};
export const clearApiKey = () => { apiKey = ""; sessionStorage.removeItem(KEY_STORAGE); };
export const hasApiKey = () => Boolean(apiKey);

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const response = await fetch(API_BASE + path, {
    method,
    headers: {
      ...(auth ? { Authorization: "Bearer " + apiKey } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) throw new Error((data && data.error && data.error.message) || response.status + " " + response.statusText);
  return data;
}

export async function fetchResultsCsv(jobId) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/results?format=csv`, {
    headers: { Authorization: "Bearer " + apiKey },
  });
  return response.blob();
}
