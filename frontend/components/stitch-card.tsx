"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const cardVariants = cva(
  "rounded-[32px] p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-[#1a2940]",
  {
    variants: {
      variant: {
        rounded: "bg-surface-container",
        circular: "bg-surface-container",
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            {icon}
          </div>
        </div>
      ) : (
        <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-primary-container/20 p-3 text-primary">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-headline-md font-semibold text-on-background">{title}</h3>

      {/* Description */}
      {description ? (
        <p className="mt-2 text-body-md text-on-background/70">{description}</p>
      ) : null}

      {/* CTA */}
      {ctaLabel ? (
        <div className="mt-4">
          {ctaHref ? (
            <Link
              href={ctaHref}
              className="inline-flex items-center rounded-[16px] bg-primary px-6 py-3 font-semibold text-on-primary no-underline transition-all duration-150 hover:opacity-90 active:scale-95"
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCtaClick}
              className="inline-flex items-center rounded-[16px] bg-primary px-6 py-3 font-semibold text-on-primary transition-all duration-150 hover:opacity-90 active:scale-95"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
