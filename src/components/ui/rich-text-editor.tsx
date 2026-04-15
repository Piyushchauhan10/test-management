"use client"

import { useEffect, useId, useRef, useState } from "react"
import Quill from "quill"
import "quill/dist/quill.snow.css"

import { cn } from "@/lib/utils"

const Embed = Quill.import("blots/embed")

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
  Quill.register(MentionBlot)
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
  top: number
  left: number
  triggerIndex: number
  caretIndex: number
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
    .slice(0, 6)

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  className,
  minHeightClassName = "min-h-[180px]",
  mentionItems = [],
}: RichTextEditorProps) {
  const editorId = useId()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const quillRef = useRef<Quill | null>(null)
  const onChangeRef = useRef(onChange)
  const mentionStateRef = useRef<MentionState | null>(null)
  const mentionItemsRef = useRef<MentionItem[]>(mentionItems)
  const highlightedIndexRef = useRef(0)
  const initialValueRef = useRef(value)
  const [mentionState, setMentionState] = useState<MentionState | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

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

      setMentionState({
        query: match.query,
        top: bounds.top + bounds.height + 12,
        left: bounds.left,
        triggerIndex,
        caretIndex: selection.index,
      })
    }

    const handleTextChange = () => {
      onChangeRef.current(normalizeHtml(quill.root.innerHTML))
      syncMentionMenu()
    }

    const handleSelectionChange = () => {
      syncMentionMenu()
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

      {mentionState && filteredMentions.length > 0 && (
        <div
          className="absolute z-50 min-w-64 overflow-hidden rounded-2xl border border-slate-200/80 bg-popover p-1.5 shadow-[0_20px_45px_rgba(15,23,42,0.18)] backdrop-blur"
          style={{ top: mentionState.top, left: mentionState.left }}
        >
          <div className="border-b border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Mention Someone
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {filteredMentions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                  index === highlightedIndex
                    ? "bg-sky-50 text-sky-950"
                    : "hover:bg-slate-50"
                )}
                onMouseDown={(event) => {
                  event.preventDefault()
                  const quill = quillRef.current
                  const currentMention = mentionStateRef.current

                  if (!quill || !currentMention) return

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
                }}
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">
                    @{item.label}
                  </div>
                  {item.sublabel && (
                    <div className="truncate text-xs text-slate-500">
                      {item.sublabel}
                    </div>
                  )}
                </div>

                {index === highlightedIndex && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                    Enter
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
