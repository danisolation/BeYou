import { apiFetch } from "@/lib/api";

export const DASHBOARD_READ_INIT = Object.freeze({ cache: "no-store" }) satisfies Readonly<RequestInit>;

export async function dashboardRead<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, { ...init, ...DASHBOARD_READ_INIT, headers: init.headers });
}

export type OptionalDashboardResult<T> =
  | { status: "ready"; data: T }
  | { status: "unavailable"; message: string };

export function readyDashboardResult<T>(data: T): OptionalDashboardResult<T> {
  return { status: "ready", data };
}

export function unavailableDashboardResult<T = never>(message: string): OptionalDashboardResult<T> {
  return { status: "unavailable", message };
}

export async function optionalDashboardRead<T>(
  read: () => Promise<T>,
  unavailableMessage: string,
): Promise<OptionalDashboardResult<T>> {
  try {
    return readyDashboardResult(await read());
  } catch {
    return unavailableDashboardResult(unavailableMessage);
  }
}

export function optionalDashboardData<T>(result: OptionalDashboardResult<T>, fallback: T): T {
  return result.status === "ready" ? result.data : fallback;
}
