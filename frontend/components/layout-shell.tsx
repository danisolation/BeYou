import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface LayoutShellProps {
  children: ReactNode;
  className?: string;
}

export function LayoutShell({ children, className }: LayoutShellProps) {
  return (
    <div className={cn("min-w-0 pb-20 lg:pb-6", className)}>
      {children}
    </div>
  );
}
