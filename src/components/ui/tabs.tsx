import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-center rounded-xl border border-zinc-200 bg-zinc-50 p-1 shadow-sm",
        "dark:border-zinc-800 dark:bg-zinc-900",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
        
        // default
        "text-zinc-600 hover:text-zinc-900 hover:bg-white/70",
        "dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800",

        // active state
        "data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm",
        "dark:data-[state=active]:bg-zinc-800 dark:data-[state=active]:text-white",

        // focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40",

        // disabled
        "disabled:pointer-events-none disabled:opacity-50",

        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm outline-none",
        "dark:border-zinc-800 dark:bg-zinc-900",
        "focus-visible:ring-2 focus-visible:ring-emerald-500/40",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }