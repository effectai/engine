<<<<<<< HEAD
<<<<<<< HEAD
const API_BASE = (window.EFFECT_API_BASE || "") + "/api/v1";
=======
// The single API seam: every network request the console makes goes through
// this file. If the API ever moves into the manager, only API_BASE (and the
// manager's CORS allowlist) changes; the rest of the console is untouched.
=======
>>>>>>> e770540814f2eed88d62c6440cf674ce3de1d142
const API_BASE = (window.EFFECT_API_BASE || "") + "/v1";
>>>>>>> 9145dae6f2b512375a7ca739b4435b79f9f08030

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
