import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface LayoutShellProps {
  children: ReactNode;
  className?: string;
}

export function LayoutShell({ children, className }: LayoutShellProps) {
  return (
    <div className={cn("mx-auto max-w-container-stitch px-margin-mobile py-gutter lg:px-margin-desktop", className)}>
      {children}
    </div>
  );
}
