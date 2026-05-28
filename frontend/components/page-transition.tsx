"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState("enter");

  useEffect(() => {
    setTransitionStage("exit");
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage("enter");
    }, 150);
    return () => clearTimeout(timeout);
  }, [children, pathname]);

  return (
    <div
      className={`transition-all duration-150 ${
        transitionStage === "exit" ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      {displayChildren}
    </div>
  );
}
