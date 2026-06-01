"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const MAX_PULL = 112;
const REFRESH_THRESHOLD = 80;

export function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isArmed, setIsArmed] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const armedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const canRefresh = () => window.innerWidth < 1024 && "ontouchstart" in window;

    function reset() {
      pullingRef.current = false;
      armedRef.current = false;
      setPullDistance(0);
      setIsArmed(false);
    }

    function onTouchStart(event: TouchEvent) {
      if (!canRefresh() || event.touches.length !== 1 || window.scrollY > 0) {
        reset();
        return;
      }
      startYRef.current = event.touches[0].clientY;
      pullingRef.current = true;
    }

    function onTouchMove(event: TouchEvent) {
      if (!pullingRef.current || event.touches.length !== 1) {
        return;
      }

      const distance = Math.max(0, event.touches[0].clientY - startYRef.current);
      const nextDistance = Math.min(MAX_PULL, distance);

      setPullDistance(nextDistance);
      const armed = nextDistance >= REFRESH_THRESHOLD;
      armedRef.current = armed;
      setIsArmed(armed);

      if (nextDistance > 0 && window.scrollY <= 0) {
        event.preventDefault();
      }
    }

    function onTouchEnd() {
      if (pullingRef.current && armedRef.current) {
        window.location.reload();
        return;
      }
      reset();
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2 rounded-full border border-outline-variant/30 bg-white/95 px-3 py-2 text-xs font-medium text-on-background shadow-sm backdrop-blur dark:bg-[#1a2244]/95 ${
        pullDistance > 0 ? "opacity-100" : "opacity-0"
      }`}
      style={{ transform: `translateX(-50%) translateY(${Math.min(24, pullDistance / 3)}px)` }}
    >
      <span className="inline-flex items-center gap-2">
        <RefreshCw className={isArmed ? "animate-spin motion-reduce:animate-none text-primary" : "motion-reduce:animate-none text-on-background/50"} size={14} />
        {isArmed ? "Thả để làm mới" : "Kéo xuống để làm mới"}
      </span>
    </div>
  );
}
