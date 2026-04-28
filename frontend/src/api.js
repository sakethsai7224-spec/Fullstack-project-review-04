const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const apiBaseUrl = rawBaseUrl.replace(/\/$/, "");

export function apiUrl(path) {
  return `${apiBaseUrl}${path}`;
}

export async function apiRequest(path, options) {
  const response = await fetch(apiUrl(path), options);
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with ${response.status}`);
  }

  return data;
}
