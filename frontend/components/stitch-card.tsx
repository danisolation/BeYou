"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva(
  "rounded-2xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border border-outline-variant/30 bg-white dark:bg-[#1a2940] dark:border-outline-variant/20",
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
  }
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
      {/* Icon area */}
      {variant === "circular" ? (
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      ) : (
        <div className="mb-3 inline-flex items-center justify-center rounded-xl bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-base font-semibold text-on-background">{title}</h3>

      {/* Description */}
      {description ? (
        <p className="mt-1.5 text-sm text-on-background/60">{description}</p>
      ) : null}

      {/* CTA */}
      {ctaLabel ? (
        <div className="mt-4">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary no-underline transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
