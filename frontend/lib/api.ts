const DEFAULT_API_BASE_URL = "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: unknown,
  ) {
    super(typeof detail === "string" ? detail : "API request failed");
  }
}

function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  const parsed = await parseResponse(response);
  if (!response.ok) {
    throw new ApiError(response.status, parsed);
  }
  return parsed as T;
}
