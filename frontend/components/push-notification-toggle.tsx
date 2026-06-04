"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";

import { useToast } from "@/components/toast";
import {
  deleteWebPushSubscription,
  getWebPushPublicKey,
  pushSubscriptionToPayload,
  saveWebPushSubscription,
  urlBase64ToArrayBuffer,
} from "@/lib/push-notifications-api";

type PushState = "loading" | "unsupported" | "not_configured" | "default" | "denied" | "enabled";

export function PushNotificationToggle() {
  const [state, setState] = useState<PushState>("loading");
  const [isBusy, setIsBusy] = useState(false);
  const { success, error, info } = useToast();

  useEffect(() => {
    async function inspect() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setState("unsupported");
        return;
      }
      const key = await getWebPushPublicKey().catch(() => ({ enabled: false, public_key: null }));
      if (!key.enabled || !key.public_key) {
        setState("not_configured");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setState(subscription ? "enabled" : "default");
    }
    void inspect();
  }, []);

  async function enablePush() {
    setIsBusy(true);
    try {
      const key = await getWebPushPublicKey();
      if (!key.enabled || !key.public_key) {
        setState("not_configured");
        info("Thông báo nền chưa được cấu hình trên máy chủ.");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "default");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(key.public_key),
        }));
      await saveWebPushSubscription(pushSubscriptionToPayload(subscription));
      setState("enabled");
      success("Đã bật thông báo SOS trên thiết bị này.");
    } catch {
      error("Chưa bật được thông báo nền. Hãy thử lại sau.");
    } finally {
      setIsBusy(false);
    }
  }

  async function disablePush() {
    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await deleteWebPushSubscription(pushSubscriptionToPayload(subscription)).catch(() => undefined);
        await subscription.unsubscribe();
      }
      setState("default");
      success("Đã tắt thông báo SOS trên thiết bị này.");
    } catch {
      error("Chưa tắt được thông báo nền. Hãy thử lại sau.");
    } finally {
      setIsBusy(false);
    }
  }

  if (state === "unsupported") {
    return null;
  }

  const isEnabled = state === "enabled";
  const isDisabled = state === "not_configured" || state === "denied" || state === "loading";
  const label = (() => {
    if (state === "loading") return "Đang kiểm tra...";
    if (state === "not_configured") return "Máy chủ chưa bật push";
    if (state === "denied") return "Trình duyệt đang chặn thông báo";
    if (isEnabled) return "Tắt thông báo SOS";
    return "Bật thông báo SOS";
  })();

  return (
    <button
      type="button"
      disabled={isBusy || isDisabled}
      onClick={() => void (isEnabled ? disablePush() : enablePush())}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition-all ${
        isEnabled
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
      }`}
      title={state === "denied" ? "Hãy mở cài đặt trình duyệt để cho phép thông báo." : undefined}
    >
      {isEnabled ? <BellOff size={14} aria-hidden="true" /> : <Bell size={14} aria-hidden="true" />}
      {label}
    </button>
  );
}