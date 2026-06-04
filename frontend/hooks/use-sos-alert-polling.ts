"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useToast } from "@/components/toast";
import type { SosAlert } from "@/lib/sos-api";

const SOS_POLL_INTERVAL_MS = 8000;

export function useSosAlertPolling(loadAlerts: () => Promise<SosAlert[]>, label: string) {
  const [alerts, setAlerts] = useState<SosAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const knownAlertIdsRef = useRef<Set<string>>(new Set());
  const hasLoadedRef = useRef(false);
  const { error: toastError } = useToast();

  const refresh = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError(false);
      }

      try {
        const nextAlerts = await loadAlerts();
        const nextIds = new Set(nextAlerts.map((alert) => alert.id));
        const newPendingAlerts = nextAlerts.filter(
          (alert) => alert.current_status === "sent" && !knownAlertIdsRef.current.has(alert.id),
        );

        if (hasLoadedRef.current && newPendingAlerts.length > 0) {
          toastError(`${newPendingAlerts.length} ${label} mới cần chú ý ngay.`);
        }

        knownAlertIdsRef.current = nextIds;
        hasLoadedRef.current = true;
        setAlerts(nextAlerts);
        setLastUpdated(new Date());
      } catch {
        if (!silent) setError(true);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [label, loadAlerts, toastError],
  );

  useEffect(() => {
    void refresh(false);

    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        void refresh(true);
      }
    };

    const intervalId = window.setInterval(refreshIfVisible, SOS_POLL_INTERVAL_MS);
    window.addEventListener("focus", refreshIfVisible);
    window.addEventListener("online", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      window.removeEventListener("online", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [refresh]);

  return { alerts, loading, error, lastUpdated, refresh };
}