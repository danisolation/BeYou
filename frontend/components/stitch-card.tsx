"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const cardVariants = cva(
  "card-lift soft-card rounded-[20px] border border-outline-variant/30 bg-white p-5 transition-all duration-200 dark:border-outline-variant/20 dark:bg-[#1a2244]",
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
  image?: string | null;
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
  image,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
}: StitchCardProps) {
  return (
    <div className={cn(cardVariants({ variant }), className)}>
      {image ? (
        <div className="mb-3 -mx-5 -mt-5 overflow-hidden rounded-t-2xl">
          <img src={image} alt="" className="h-36 w-full object-cover" />
        </div>
      ) : variant === "circular" ? (
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
              className="btn-press cta-gradient inline-flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold no-underline transition-all duration-150"
            >
              {ctaLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onCtaClick}
              className="btn-press cta-gradient inline-flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150"
            >
              {ctaLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
