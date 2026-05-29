"use client";

import { useEffect } from "react";

/**
 * Warns users before leaving the page with unsaved changes.
 * Uses the browser `beforeunload` event which shows a native confirmation dialog.
 */
export function useUnsavedChanges(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
}
