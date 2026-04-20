"use client"

import { useEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Quill from "quill"
import "quill/dist/quill.snow.css"

import { cn } from "@/lib/utils"

const Embed = Quill.import("blots/embed") as any

class MentionBlot extends Embed {
  static blotName = "mention"
  static className = "ql-mention"
  static tagName = "span"

  static create(value: { id: string; value: string }) {
    const node = super.create() as HTMLElement
    node.dataset.id = value.id
    node.dataset.value = value.value
    node.textContent = `@${value.value}`
    node.setAttribute("contenteditable", "false")
    return node
  }

  static value(node: HTMLElement) {
    return {
      id: node.dataset.id || "",
      value: node.dataset.value || "",
    }
  }
}

if (!Quill.imports["formats/mention"]) {
  Quill.register(MentionBlot as never)
}

type MentionItem = {
  id: string
  label: string
  sublabel?: string
}

type RichTextEditorProps = {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeightClassName?: string
  mentionItems?: MentionItem[]
}

type MentionState = {
  query: string
  anchorTop: number
  anchorLeft: number
  anchorHeight: number
  triggerIndex: number
  caretIndex: number
}

type MenuPosition = {
  top: number
  left: number
  width: number
  placement: "top" | "bottom"
}

const normalizeHtml = (value?: string) => {
  if (!value || value === "<p><br></p>") return ""
  return value
}

const getMentionMatch = (text: string) => {
  const match = text.match(/(?:^|\s)@([a-zA-Z0-9._-]*)$/)

  if (!match) return null

  return {
    query: match[1],
    length: match[1].length + 1,
  }
}

const getFilteredMentions = (items: MentionItem[], query: string) =>
  items
    .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))

const getMentionInitials = (label: string) =>
  label
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2)

const getMentionAvatarTone = (label: string) => {
  const tones = [
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200",
    "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
  ]

  const total = Array.from(label).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  )

  return tones[total % tones.length]
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  className,
  minHeightClassName = "min-h-[180px]",
  mentionItems = [],
}: RichTextEditorProps) {
  const editorId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)
  const mentionStateRef = useRef<MentionState | null>(null)
  const mentionItemsRef = useRef<MentionItem[]>(mentionItems)
  const highlightedIndexRef = useRef(0)
  const initialValueRef = useRef(value)
  const syncMentionFrameRef = useRef<number | null>(null)
  const [mentionState, setMentionState] = useState<MentionState | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    mentionItemsRef.current = mentionItems
  }, [mentionItems])

  useEffect(() => {
    mentionStateRef.current = mentionState
    if (!mentionState) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(0)
      setMenuPosition(null)
    }
  }, [mentionState])

  useEffect(() => {
    highlightedIndexRef.current = highlightedIndex
  }, [highlightedIndex])

  const filteredMentions = mentionState
    ? getFilteredMentions(mentionItems, mentionState.query)
    : []

  useEffect(() => {
    if (!filteredMentions.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(0)
      return
    }

    setHighlightedIndex((current) =>
      Math.min(current, filteredMentions.length - 1)
    )
  }, [filteredMentions.length])

  useEffect(() => {
    const menu = menuRef.current
    const editor = editorRef.current

    if (!mentionState || !menu || !editor || !filteredMentions.length) {
      return
    }

    const editorRect = editor.getBoundingClientRect()
    const menuHeight = menu.offsetHeight
    const horizontalPadding = 16
    const verticalGap = 10
    const preferredWidth = Math.min(Math.max(editorRect.width - 100, 200), 260)
    const resolvedWidth = Math.min(preferredWidth, window.innerWidth - horizontalPadding * 2)
    const maxLeft = Math.max(
      horizontalPadding,
      window.innerWidth - resolvedWidth - horizontalPadding
    )
    const nextLeft = Math.min(
      Math.max(editorRect.left + mentionState.anchorLeft, horizontalPadding),
      maxLeft
    )

    const belowTop =
      editorRect.top + mentionState.anchorTop + mentionState.anchorHeight + verticalGap
    const canRenderBelow =
      belowTop + menuHeight <= window.innerHeight - horizontalPadding
    const aboveTop = editorRect.top + mentionState.anchorTop - menuHeight - verticalGap

    setMenuPosition({
      top: canRenderBelow
        ? belowTop
        : Math.max(horizontalPadding, aboveTop),
      left: nextLeft,
      width: resolvedWidth,
      placement: canRenderBelow ? "bottom" : "top",
    })
  }, [filteredMentions.length, highlightedIndex, mentionState])

  useEffect(() => {
    if (!mentionState) return

    const handleViewportChange = () => {
      setMenuPosition(null)
      const currentMention = mentionStateRef.current
      if (!currentMention) return

      setMentionState({ ...currentMention })
    }

    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [mentionState])

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return

    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["blockquote", "code-block", "link"],
          ["clean"],
        ],
      },
    })

    quillRef.current = quill
    quill.clipboard.dangerouslyPasteHTML(normalizeHtml(initialValueRef.current))

    const insertMention = (item: MentionItem) => {
      const currentMention = mentionStateRef.current
      if (!currentMention) return

      const replaceLength =
        currentMention.caretIndex - currentMention.triggerIndex

      quill.deleteText(currentMention.triggerIndex, replaceLength, "user")
      quill.insertEmbed(
        currentMention.triggerIndex,
        "mention",
        { id: item.id, value: item.label },
        "user"
      )
      quill.insertText(currentMention.triggerIndex + 1, " ", "user")
      quill.setSelection(currentMention.triggerIndex + 2, 0, "user")
      setMentionState(null)
    }

    const syncMentionMenu = () => {
      const selection = quill.getSelection()

      if (!selection || selection.length > 0 || !mentionItemsRef.current.length) {
        setMentionState(null)
        return
      }

      const start = Math.max(0, selection.index - 40)
      const context = quill.getText(start, selection.index - start)
      const match = getMentionMatch(context)

      if (!match) {
        setMentionState(null)
        return
      }

      const triggerIndex = selection.index - match.length
      const bounds = quill.getBounds(triggerIndex)

      if (!bounds) {
        setMentionState(null)
        return
      }

      setMentionState({
        query: match.query,
        anchorTop: bounds.top,
        anchorLeft: bounds.left,
        anchorHeight: bounds.height,
        triggerIndex,
        caretIndex: selection.index,
      })
    }

    const scheduleMentionSync = () => {
      if (syncMentionFrameRef.current) {
        cancelAnimationFrame(syncMentionFrameRef.current)
      }

      syncMentionFrameRef.current = requestAnimationFrame(() => {
        syncMentionFrameRef.current = null
        syncMentionMenu()
      })
    }

    const handleTextChange = () => {
      onChangeRef.current(normalizeHtml(quill.root.innerHTML))
      scheduleMentionSync()
    }

    const handleSelectionChange = () => {
      scheduleMentionSync()
    }

    quill.on("text-change", handleTextChange)
    quill.on("selection-change", handleSelectionChange)

    quill.keyboard.addBinding({ key: "Enter" }, () => {
      const currentMention = mentionStateRef.current
      if (!currentMention) return true

      const currentSuggestions = getFilteredMentions(
        mentionItemsRef.current,
        currentMention.query
      )

      if (!currentSuggestions.length) return true

      const selectedItem =
        currentSuggestions[highlightedIndexRef.current] || currentSuggestions[0]
      insertMention(selectedItem)
      return false
    })

    quill.keyboard.addBinding({ key: "Tab" }, () => {
      const currentMention = mentionStateRef.current
      if (!currentMention) return true

      const currentSuggestions = getFilteredMentions(
        mentionItemsRef.current,
        currentMention.query
      )

      if (!currentSuggestions.length) return true

      const selectedItem =
        currentSuggestions[highlightedIndexRef.current] || currentSuggestions[0]
      insertMention(selectedItem)
      return false
    })

    quill.keyboard.addBinding({ key: "ArrowDown" }, () => {
      const currentMention = mentionStateRef.current
      if (!currentMention) return true

      const currentSuggestions = getFilteredMentions(
        mentionItemsRef.current,
        currentMention.query
      )

      if (!currentSuggestions.length) return true

      setHighlightedIndex((current) =>
        current + 1 >= currentSuggestions.length ? 0 : current + 1
      )
      return false
    })

    quill.keyboard.addBinding({ key: "ArrowUp" }, () => {
      const currentMention = mentionStateRef.current
      if (!currentMention) return true

      const currentSuggestions = getFilteredMentions(
        mentionItemsRef.current,
        currentMention.query
      )

      if (!currentSuggestions.length) return true

      setHighlightedIndex((current) =>
        current - 1 < 0 ? currentSuggestions.length - 1 : current - 1
      )
      return false
    })

    quill.keyboard.addBinding({ key: "Escape" }, () => {
      if (!mentionStateRef.current) return true
      setMentionState(null)
      return false
    })

    return () => {
      if (syncMentionFrameRef.current) {
        cancelAnimationFrame(syncMentionFrameRef.current)
        syncMentionFrameRef.current = null
      }
      quill.off("text-change", handleTextChange)
      quill.off("selection-change", handleSelectionChange)
      quillRef.current = null
    }
  }, [placeholder])

  useEffect(() => {
    const quill = quillRef.current
    if (!quill) return

    const nextValue = normalizeHtml(value)
    const currentValue = normalizeHtml(quill.root.innerHTML)

    if (currentValue !== nextValue) {
      quill.clipboard.dangerouslyPasteHTML(nextValue)
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-xl border border-input bg-background shadow-xs transition focus-within:border-ring focus-within:ring-ring/40 focus-within:ring-[3px]",
        className
      )}
    >
      <div className="rich-text-editor">
        <div
          id={editorId}
          ref={editorRef}
          className={cn("bg-background", minHeightClassName)}
        />
      </div>

      {mentionState &&
        filteredMentions.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            className={cn(
              "fixed z-[100] overflow-hidden rounded-2xl border border-slate-200/80 bg-popover p-1.5 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-700/80 dark:shadow-[0_24px_60px_rgba(2,8,23,0.55)]",
              !menuPosition && "pointer-events-none opacity-0",
              menuPosition?.placement === "top" && "origin-bottom"
            )}
            style={{
              top:
                menuPosition?.top ??
                mentionState.anchorTop + mentionState.anchorHeight + 10,
              left: menuPosition?.left ?? mentionState.anchorLeft,
              width: menuPosition?.width ?? 220,
            }}
          >
            {/* <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                Users
              </div>
            </div> */}

            <div className="max-h-80 overflow-y-auto py-1">
              {filteredMentions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                    index === highlightedIndex
                      ? "bg-slate-100 text-slate-950 shadow-sm dark:bg-slate-800 dark:text-slate-50"
                      : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/80"
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    const quill = quillRef.current
                    const currentMention = mentionStateRef.current

                    if (!quill || !currentMention) return

                    const replaceLength =
                      currentMention.caretIndex - currentMention.triggerIndex

                    quill.deleteText(
                      currentMention.triggerIndex,
                      replaceLength,
                      "user"
                    )
                    quill.insertEmbed(
                      currentMention.triggerIndex,
                      "mention",
                      { id: item.id, value: item.label },
                      "user"
                    )
                    quill.insertText(currentMention.triggerIndex + 1, " ", "user")
                    quill.setSelection(currentMention.triggerIndex + 2, 0, "user")
                    setMentionState(null)
                  }}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold uppercase",
                      index === highlightedIndex
                        ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100"
                        : getMentionAvatarTone(item.label)
                    )}
                  >
                    {getMentionInitials(item.label)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {item.label}
                    </div>
                    {item.sublabel && (
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {/* {item.sublabel} */}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
