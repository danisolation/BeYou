import "@testing-library/jest-dom/vitest";
import React, { createContext, useContext, useState, useCallback } from "react";
import { vi } from "vitest";

const ToastContext = createContext<any>(null);

const mockToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<string[]>([]);
  const add = useCallback((msg: string) => {
    setToasts((prev) => [...prev, msg]);
  }, []);
  const value = {
    toast: add,
    success: add,
    error: add,
    info: add,
  };
  return React.createElement(
    ToastContext.Provider,
    { value },
    children,
    React.createElement(
      "div",
      null,
      toasts.map((msg, idx) => React.createElement("div", { key: idx }, msg))
    )
  );
};

const mockUseToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
};

vi.mock("@/components/toast", () => ({
  ToastProvider: mockToastProvider,
  useToast: mockUseToast,
}));
