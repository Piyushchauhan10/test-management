import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function decodeHtmlEntities(value?: string | null) {
  if (!value) return ""

  const entities: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
  }

  return value.replace(
    /&(lt|gt|amp|quot|apos|nbsp);|&#39;/g,
    (entity) => entities[entity] || entity
  )
}

export function stripHtml(html?: string | null) {
  if (!html) return ""

  return decodeHtmlEntities(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function truncateText(value: string, maxLength = 120) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trimEnd()}...`
}
