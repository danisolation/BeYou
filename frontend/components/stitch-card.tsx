"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const cardVariants = cva(
  "card-lift rounded-2xl border border-outline-variant/30 bg-white p-5 shadow-sm transition-all duration-200 dark:border-outline-variant/20 dark:bg-[#1a2940]",
  {
    variants: {
      variant: {
        rounded: "",
        circular: "",
      },
    },
    defaultVariants: {
      variant: "rounded",
    },
  },
);

export interface StitchCardProps extends VariantProps<typeof cardVariants> {
  icon: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function StitchCard({
  variant = "rounded",
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
}: StitchCardProps) {
  return (
    <div className={cn(cardVariants({ variant }), className)}>
      {variant === "circular" ? (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</div>
        </div>
      ) : (
        <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</div>
      )}

      <h3 className="text-base font-semibold text-on-background">{title}</h3>

      {description ? <p className="mt-1.5 text-sm text-on-background/60">{description}</p> : null}

      {ctaLabel ? (
        <div className="mt-4">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="btn-press inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary no-underline transition-all duration-150 hover:opacity-90"
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCtaClick}
              className="btn-press inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-all duration-150 hover:opacity-90"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
