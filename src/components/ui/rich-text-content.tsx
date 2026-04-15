import { cn, stripHtml, truncateText } from "@/lib/utils"

type RichTextContentProps = {
  value?: string | null
  className?: string
  plainTextFallback?: string
  clamp?: number
}

export function RichTextContent({
  value,
  className,
  plainTextFallback = "—",
  clamp,
}: RichTextContentProps) {
  const textValue = stripHtml(value)

  if (!textValue) {
    return <span className="text-muted-foreground">{plainTextFallback}</span>
  }

  if (clamp) {
    return (
      <span className={cn("block text-sm text-foreground", className)}>
        {truncateText(textValue, clamp)}
      </span>
    )
  }

  return (
    <div
      className={cn(
        "[&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_li]:ml-4 [&_ol]:list-decimal [&_p]:leading-6 [&_ul]:list-disc",
        className
      )}
      dangerouslySetInnerHTML={{ __html: value || plainTextFallback }}
    />
  )
}
