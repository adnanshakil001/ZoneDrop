const TOKEN_KEY = "lastmile_token";

let customTokenGetter: (() => Promise<string | null> | string | null) | null = null;

export function setTokenGetter(getter: (() => Promise<string | null> | string | null) | null) {
  customTokenGetter = getter;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const base = import.meta.env.VITE_API_URL ?? "";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  let token = getToken();
  if (customTokenGetter) {
    try {
      const customToken = await customTokenGetter();
      if (customToken) token = customToken;
    } catch {
      // ignore
    }
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : JSON.stringify(data.error ?? data);
    throw new Error(message || res.statusText);
  }
  return data as T;
}
