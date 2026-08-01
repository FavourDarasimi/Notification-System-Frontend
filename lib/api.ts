type Tokens = { access: string; refresh: string };

let pendingRefresh: Promise<Tokens> | null = null;

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";
}
function authHeaders(tokens: Tokens | null): Record<string, string> {
  if (!tokens) return {};
  return { Authorization: `Bearer ${tokens.access}` };
}

async function tryRefresh(tokens: Tokens): Promise<Tokens> {
  const r = await fetch(`${getApiBaseUrl()}/api/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!r.ok) throw new Error("Refresh failed");
  const data = await r.json();
  return { access: data.access, refresh: data.refresh ?? tokens.refresh };
}

export async function apiRequest<T>(
  tokens: Tokens | null,
  path: string,
  options: RequestInit = {},
  attempt = 1
): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const auth = authHeaders(tokens);
  for (const [k, v] of Object.entries(auth)) {
    headers.set(k, v);
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && tokens && attempt === 1) {
    if (!pendingRefresh) {
      pendingRefresh = tryRefresh(tokens).then(
        (t) => {
          pendingRefresh = null;
          return t;
        },
        (err) => {
          pendingRefresh = null;
          throw err;
        }
      );
    }
    const refreshed = await pendingRefresh;
    return apiRequest<T>(refreshed, path, options, 2);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json();
}

export async function login(
  email: string,
  password: string
): Promise<Tokens> {
  const data = await apiRequest<{ access: string; refresh: string }>(null, "/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { access: data.access, refresh: data.refresh };
}
