import type { ReactNode } from "react";

import { PageTransition } from "@/components/page-transition";
import { cn } from "@/lib/cn";

interface LayoutShellProps {
  children: ReactNode;
  className?: string;
}

export function LayoutShell({ children, className }: LayoutShellProps) {
  return (
    <div className={cn("min-w-0 pb-20 md:pb-0", className)}>
      <PageTransition>{children}</PageTransition>
    </div>
  );
}
