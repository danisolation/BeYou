import { apiFetch } from "@/lib/api";

export type WebPushPublicKeyResponse = {
  enabled: boolean;
  public_key: string | null;
};

export type WebPushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type WebPushSubscriptionResponse = {
  enabled: boolean;
  endpoint: string | null;
};

export function getWebPushPublicKey() {
  return apiFetch<WebPushPublicKeyResponse>("/api/push/public-key");
}

export function saveWebPushSubscription(payload: WebPushSubscriptionPayload) {
  return apiFetch<WebPushSubscriptionResponse>("/api/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteWebPushSubscription(payload: WebPushSubscriptionPayload) {
  return apiFetch<void>("/api/push/subscriptions", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export function pushSubscriptionToPayload(subscription: PushSubscription): WebPushSubscriptionPayload {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
}

export function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0))).buffer;
}