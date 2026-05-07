import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn("w-full", className)}
      {...props}
    />
  )
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm",
        "text-zinc-500 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn(
        "inline-flex items-center gap-1.5 group",
        className
      )}
      {...props}
    />
  )
}

function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn(
        "relative font-medium transition-all duration-200",
        
        // base colors
        "text-zinc-600 dark:text-zinc-400",

        // hover color
        "hover:text-emerald-600 dark:hover:text-emerald-400",

        // slight lift effect
        "hover:-translate-y-[1px]",

        // animated underline
        "after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:w-0",
        "after:bg-emerald-500 after:transition-all after:duration-300",
        "hover:after:w-full",

        // focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-sm",

        className
      )}
      {...props}
    />
  )
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn(
        "relative font-semibold tracking-tight",
        
        // gradient text (subtle premium touch)
        "bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent",
        "dark:from-emerald-400 dark:to-green-300",

        className
      )}
      {...props}
    />
  )
}

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "mx-1 text-zinc-400 dark:text-zinc-600",
        "transition-all duration-200 group-hover:translate-x-[2px]",
        className
      )}
      {...props}
    >
      {children ?? <ChevronRight className="size-3.5" />}
    </li>
  )
}

function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center px-1",
        "text-zinc-400 dark:text-zinc-500",
        "transition-all duration-200 hover:text-zinc-600 dark:hover:text-zinc-300",
        className
      )}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  )
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}