const DEFAULT_API_BASE_URL = "http://localhost:8000";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

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

function isRetryable(error: unknown, status?: number): boolean {
  if (status === 502 || status === 503 || status === 504) return true;
  if (error instanceof TypeError) return true; // network error
  return false;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(apiUrl(path), {
        ...init,
        headers,
        credentials: "include",
      });
      if (isRetryable(null, response.status) && attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      const parsed = await parseResponse(response);
      if (!response.ok) {
        throw new ApiError(response.status, parsed);
      }
      return parsed as T;
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError) throw error;
      if (!isRetryable(error) || attempt === MAX_RETRIES) throw error;
      await delay(RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastError;
}
