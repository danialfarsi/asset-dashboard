import * as React from "react"

import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------
 * Card
 *
 * API is backward compatible with the original primitive:
 *   <Card size="sm" /> still works, all sub-components keep their names,
 *   data-slot attributes are unchanged.
 *
 * New: `variant`, `size="lg"`, `interactive`, and a <CardMedia /> slot.
 * ---------------------------------------------------------------------- */

type CardVariant = "default" | "elevated" | "outline" | "muted" | "ghost"
type CardSize = "sm" | "default" | "lg"

const cardVariants: Record<CardVariant, string> = {
  // hairline ring, flat surface — the neutral default
  default: "bg-card ring-1 ring-foreground/10 shadow-xs",
  // lifted surface for cards that should read as the primary object on the page
  elevated:
    "bg-card ring-1 ring-foreground/[0.07] shadow-lg shadow-foreground/[0.06]",
  // stronger border, no shadow — good inside dense lists
  outline: "bg-card ring-1 ring-border shadow-none",
  // recessed panel for secondary content
  muted: "bg-muted/40 ring-1 ring-foreground/[0.06] shadow-none",
  // no chrome at all — just the layout rhythm
  ghost: "bg-transparent ring-0 shadow-none",
}

const cardSizes: Record<CardSize, string> = {
  sm: "[--card-spacing:--spacing(3)] [--card-radius:var(--radius-lg)]",
  default: "[--card-spacing:--spacing(5)] [--card-radius:var(--radius-xl)]",
  lg: "[--card-spacing:--spacing(7)] [--card-radius:var(--radius-2xl)]",
}

function Card({
  className,
  size = "default",
  variant = "default",
  interactive = false,
  ...props
}: React.ComponentProps<"div"> & {
  size?: CardSize
  variant?: CardVariant
  /** adds hover lift, pointer cursor and a keyboard focus ring */
  interactive?: boolean
}) {
  return (
    <div
      data-slot="card"
      data-size={size}
      data-variant={variant}
      data-interactive={interactive || undefined}
      className={cn(
        // structure
        "group/card relative flex flex-col gap-(--card-spacing) overflow-hidden",
        "rounded-(--card-radius) py-(--card-spacing)",
        // typography
        "text-sm text-card-foreground",
        // motion
        "transition-[box-shadow,transform,border-color] duration-200 ease-out",
        // edge handling: media flush to the card edges
        "has-data-[slot=card-footer]:pb-0 has-data-[slot=card-media]:has-[>[data-slot=card-media]:first-child]:pt-0",
        "has-[>img:first-child]:pt-0",
        "*:[img:first-child]:rounded-t-(--card-radius) *:[img:last-child]:rounded-b-(--card-radius)",
        // sizing + skin
        cardSizes[size],
        cardVariants[variant],
        // interactive affordances
        interactive && [
          "cursor-pointer outline-none",
          "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/[0.08]",
          "hover:ring-foreground/15 active:translate-y-0 active:shadow-sm",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ],
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5",
        "rounded-t-(--card-radius) px-(--card-spacing)",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        "has-data-[slot=card-description]:grid-rows-[auto_auto]",
        "[.border-b]:border-foreground/[0.07] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-semibold tracking-tight text-balance",
        "group-data-[size=sm]/card:text-sm",
        "group-data-[size=lg]/card:text-lg",
        className
      )}
      {...props}
    />
  )
}

/** Small uppercase label above the title — optional, purely typographic. */
function CardEyebrow({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-eyebrow"
      className={cn(
        "text-[11px] leading-none font-medium tracking-[0.14em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-sm leading-relaxed text-pretty text-muted-foreground",
        "group-data-[size=sm]/card:text-[13px]",
        className
      )}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

/**
 * Full-bleed media area. Cancels the card's padding and clips to the card
 * radius on whichever edge it touches.
 */
function CardMedia({
  className,
  ...props
}: React.ComponentProps<"div"> & { className?: string }) {
  return (
    <div
      data-slot="card-media"
      className={cn(
        "relative overflow-hidden bg-muted",
        "first:rounded-t-(--card-radius) last:rounded-b-(--card-radius)",
        "[&>img]:size-full [&>img]:object-cover",
        "[&>img]:transition-transform [&>img]:duration-500",
        "group-data-[interactive]/card:group-hover/card:[&>img]:scale-[1.03]",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "mt-auto flex items-center gap-2 rounded-b-(--card-radius)",
        "border-t border-foreground/[0.07] bg-muted/40 p-(--card-spacing)",
        "text-[13px] text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardEyebrow,
  CardAction,
  CardDescription,
  CardMedia,
  CardContent,
}
