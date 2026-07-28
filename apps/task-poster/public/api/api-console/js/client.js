const API_BASE = (window.EFFECT_API_BASE || "") + "/v1";

// The key lives only in memory, never in storage: a reload always returns
// the console to the signup view.
let apiKey = "";
export const setApiKey = (key) => { apiKey = key; };
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

// The one binary download; it bypasses the JSON wrapper above but stays in
// this file so the Authorization header never leaks into UI code.
export async function fetchResultsCsv(jobId) {
  const response = await fetch(`${API_BASE}/jobs/${jobId}/results?format=csv`, {
    headers: { Authorization: "Bearer " + apiKey },
  });
  return response.blob();
}
