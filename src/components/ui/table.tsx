import * as React from "react"
import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <table
        data-slot="table"
        className={cn("w-full text-sm border-collapse", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        "bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700",
        "border-b border-emerald-800",
        "dark:from-emerald-800 dark:via-emerald-700 dark:to-emerald-800",
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(
        // 🌿 Light mode → subtle premium tint
        "[&>tr:nth-child(odd)]:bg-white",
        "[&>tr:nth-child(even)]:bg-emerald-50/40",

        // 🌙 Dark mode
        "dark:[&>tr:nth-child(odd)]:bg-zinc-900",
        "dark:[&>tr:nth-child(even)]:bg-emerald-900/20",

        className
      )}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-zinc-50 border-t border-zinc-200 font-medium",
        "dark:bg-zinc-800 dark:border-zinc-700",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-zinc-200 dark:border-zinc-800",
        "transition-all duration-200 ease-out",

        // ✨ professional hover (soft + layered)
        "[&:not(:has(th))]:hover:bg-emerald-100/60",
        "[&:not(:has(th))]:hover:shadow-[inset_0_0_0_9999px_rgba(16,185,129,0.06)]",

        // dark hover
        "dark:[&:not(:has(th))]:hover:bg-emerald-800/30",

        // selected state
        "data-[state=selected]:bg-emerald-100 dark:data-[state=selected]:bg-emerald-800/40",

        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // 🔽 compact header
        "h-8 px-3 py-1.5 text-left align-middle text-[11px] font-semibold uppercase tracking-wide",

        "text-white [&_*]:text-white",

        "hover:bg-transparent focus:bg-transparent active:bg-transparent",
        "transition-none",

        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // 🔽 compact rows
        "px-3 py-1.5 text-[13px] align-middle",
        "text-zinc-700 dark:text-zinc-200",

        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        "mt-4 text-sm text-zinc-500 dark:text-zinc-400",
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}