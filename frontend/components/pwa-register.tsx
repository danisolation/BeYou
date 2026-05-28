"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: BeforeInstallPromptOutcome; platform: string }>;
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const visits = parseInt(localStorage.getItem("peerlight-visits") || "0", 10) + 1;
    localStorage.setItem("peerlight-visits", String(visits));

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPrompt(promptEvent);
      if (visits >= 2) {
        setShowBanner(true);
      }
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    setShowBanner(false);
    setInstallPrompt(null);
  };

  if (!showBanner || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-2xl border border-outline-variant/30 bg-white p-4 shadow-lg dark:bg-[#1a2940] md:left-auto md:right-4 md:w-80">
      <div>
        <p className="text-sm font-semibold text-on-background">Cài đặt Peerlight AI</p>
        <p className="text-xs text-on-background/60">Truy cập nhanh từ màn hình chính</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowBanner(false)}
          className="text-xs text-on-background/50 hover:text-on-background"
        >
          Để sau
        </button>
        <button
          type="button"
          onClick={() => void handleInstall()}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
        >
          Cài đặt
        </button>
      </div>
    </div>
  );
}
