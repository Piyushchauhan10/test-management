import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import useHttp from "@/hooks/use-http"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { stripHtml } from "@/lib/utils"
import { MoreVertical } from "lucide-react"

const NONE_VALUE = "__none__"

type User = {
  ID: string
  username: string
  email?: string
}

type Comment = {
  ID: string
  user_ID: string
  description: string
  timestamp: string
  defect_ID?: string | null
  user?: {
    ID: string
    username: string
    email?: string
  } | null
}

type DefectAssignee = {
  ID: string
  title?: string
  description?: string
  severity?: string
  status?: string
  assignedTo_ID?: string | null
  detectedCycle_ID?: string | null
  targetCycle_ID?: string | null
  assignedTo?: {
    ID: string
    username: string
    email?: string
  } | null
  targetCycle?: {
    ID: string
    name?: string
  } | null
  detectedCycle?: {
    ID: string
    name?: string
  } | null
}

type Props = {
  defectId: string
}

const getUserInitials = (username?: string | null) => {
  if (!username) return "?"

  return username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

const formatTimestamp = (value?: string) => {
  if (!value) return "Unknown time"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

const getValueOrFallback = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed ? trimmed : "Not available"
}

export default function DefectComments({ defectId }: Props) {
  const { sendRequest } = useHttp()

  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [assignedToId, setAssignedToId] = useState("")
  const [defectAssignee, setDefectAssignee] = useState<DefectAssignee | null>(null)
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingDescription, setEditingDescription] = useState("")
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)

  const sortedComments = useMemo(
    () =>
      [...comments].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [comments]
  )

  const mentionItems = useMemo(
    () =>
      users.map((user) => ({
        id: user.ID,
        label: user.username,
        sublabel: user.email,
      })),
    [users]
  )

  const fetchUsers = useCallback(async () => {
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users`
      )
      const nextUsers = res?.data?.value || res?.data || []
      setUsers(nextUsers)
    } catch {
      toast.error("Failed to load users for comments")
    }
  }, [sendRequest])

  const fetchDefectAssignee = useCallback(async () => {
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Defects('${defectId}')?$expand=assignedTo,targetCycle,detectedCycle`
      )
      const data = (res?.data || null) as DefectAssignee | null
      setDefectAssignee(data)
      setAssignedToId(data?.assignedTo_ID || "")
    } catch {
      toast.error("Failed to load defect assignee")
    }
  }, [defectId, sendRequest])

  const fetchComments = useCallback(async () => {
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Comments?$filter=defect_ID eq '${defectId}'&$expand=user`
      )
      setComments(res?.data?.value || res?.data || [])
    } catch {
      toast.error("Failed to load defect comments")
    } finally {
      setLoading(false)
    }
  }, [defectId, sendRequest])

  useEffect(() => {
    fetchUsers()
    fetchDefectAssignee()
    fetchComments()
  }, [fetchComments, fetchDefectAssignee, fetchUsers])

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.ID)
    setEditingDescription(comment.description || "")
  }

  const cancelEditingComment = () => {
    setEditingCommentId(null)
    setEditingDescription("")
  }

  const updateAssignee = async (nextAssigneeId: string) => {
    setAssignedToId(nextAssigneeId)
    setAssigning(true)

    try {
      await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Defects('${defectId}')`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignedTo_ID: nextAssigneeId || null,
          }),
        }
      )

      toast.success(nextAssigneeId ? "Assignee updated" : "Assignee cleared")
      fetchDefectAssignee()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update assignee")
      setAssignedToId(defectAssignee?.assignedTo_ID || "")
    } finally {
      setAssigning(false)
    }
  }

  const submitComment = async () => {
    const trimmed = description.trim()
    const plainText = stripHtml(trimmed)

    if (!assignedToId) {
      toast.error("Assign the defect before posting a comment")
      return
    }

    if (!plainText) {
      toast.error("Comment cannot be empty")
      return
    }

    setSaving(true)

    try {
      const payload = {
        user_ID: assignedToId,
        description: trimmed,
        timestamp: new Date().toISOString(),
        defect_ID: defectId,
        requirement_ID: null,
      }

      await sendRequest(`${import.meta.env.VITE_BACKEND_API_URL}/Comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      setDescription("")
      toast.success("Comment added")
      fetchComments()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add comment")
    } finally {
      setSaving(false)
    }
  }

  const updateComment = async (commentId: string) => {
    const trimmed = editingDescription.trim()
    const plainText = stripHtml(trimmed)

    if (!plainText) {
      toast.error("Comment cannot be empty")
      return
    }

    setUpdatingCommentId(commentId)

    try {
      await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Comments('${commentId}')`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: trimmed,
          }),
        }
      )

      toast.success("Comment updated")
      cancelEditingComment()
      fetchComments()
    } catch (error) {
      console.error(error)
      toast.error("Failed to update comment")
    } finally {
      setUpdatingCommentId(null)
    }
  }

  const deleteComment = async (commentId: string) => {
    setDeletingCommentId(commentId)

    try {
      await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Comments('${commentId}')`,
        { method: "DELETE" }
      )

      toast.success("Comment deleted")

      if (editingCommentId === commentId) {
        cancelEditingComment()
      }

      fetchComments()
    } catch (error) {
      console.error(error)
      toast.error("Failed to delete comment")
    } finally {
      setDeletingCommentId(null)
    }
  }

  return (
    <Card className="border-0 bg-transparent py-0 shadow-none">
   

      <CardContent className="space-y-8 px-0 pt-6">
        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="border-b bg-muted/35 px-4 py-3">
            <div className="text-sm font-semibold">Defect details</div>
          </div>

          <div className="space-y-6 p-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-3  text-left space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Title
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {getValueOrFallback(defectAssignee?.title)}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3  text-left space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Severity
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {getValueOrFallback(defectAssignee?.severity)}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3  text-left space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Status
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {getValueOrFallback(defectAssignee?.status)}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3  text-left space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Assignee
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {getValueOrFallback(defectAssignee?.assignedTo?.username)}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3  text-left space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Detected Cycle
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {getValueOrFallback(
                    defectAssignee?.detectedCycle?.name ||
                      defectAssignee?.detectedCycle_ID
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3  text-left space-y-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Target Cycle
                </div>
                <div className="mt-1 text-sm font-medium text-foreground">
                  {getValueOrFallback(
                    defectAssignee?.targetCycle?.name ||
                      defectAssignee?.targetCycle_ID
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-muted/10 p-4  text-left">
              <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                Description
              </div>
              <RichTextContent
                value={defectAssignee?.description || ""}
                className="text-sm text-foreground [&_p:first-child]:mt-0"
                plainTextFallback="No defect description provided."
              />
            </div>
          </div>
        </section>

        <section className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-slate-900 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
            {getUserInitials(
              users.find((user) => user.ID === assignedToId)?.username ||
                defectAssignee?.assignedTo?.username ||
                "As"
            )}
          </div>

          <div className="min-w-0 flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Add a comment</div>
                {/* <div className="text-xs text-muted-foreground">
                  Use formatting, links, and `@mentions` to keep the discussion clear.
                </div> */}
              </div>

              <div className="w-full sm:w-64">
                <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
                  Assignee
                </Label>
                <Select
                  value={assignedToId || NONE_VALUE}
                  onValueChange={(value) =>
                    updateAssignee(value === NONE_VALUE ? "" : value)
                  }
                  disabled={assigning}
                >
                  <SelectTrigger className="h-10 w-full bg-background">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.ID} value={user.ID}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-4">
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Write a comment for this defect..."
                minHeightClassName="min-h-[180px]"
                mentionItems={mentionItems}
                className="rounded-lg border-slate-200 shadow-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
              <div className="text-xs text-muted-foreground">
                Supports rich text, code blocks, and `@user` mentions. New comments are posted by the current assignee.
              </div>

              <Button type="button" onClick={submitComment} disabled={saving}>
                {saving ? "Adding Comment..." : "Comment"}
              </Button>
            </div>
          </div>
        </section>

        <section className="relative space-y-5 pl-14 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-border">
          {loading && (
            <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              Loading comments...
            </div>
          )}

          {!loading && !sortedComments.length && (
            <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
              No comments yet for this defect.
            </div>
          )}

          {!loading &&
            sortedComments.map((comment) => (
              <article key={comment.ID} className="relative flex items-start gap-4">
                <div className="absolute -left-14 top-0 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-sm font-semibold text-foreground shadow-sm">
                  {getUserInitials(comment.user?.username)}
                </div>

                <div className="min-w-0 flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
                  <div className="flex items-start justify-between gap-3 border-b bg-muted/35 px-4 py-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="font-semibold text-foreground">
                          {comment.user?.username || "Unknown user"}
                        </span>
                        <span className="text-muted-foreground">commented</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(comment.timestamp)}
                        </span>
                      </div>

                      {comment.user?.email && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {comment.user.email}
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="mt-[-2px]"
                          disabled={deletingCommentId === comment.ID}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => startEditingComment(comment)}
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => deleteComment(comment.ID)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {editingCommentId === comment.ID ? (
                    <div className="space-y-4 p-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Edit Comment
                        </Label>
                        <RichTextEditor
                          value={editingDescription}
                          onChange={setEditingDescription}
                          placeholder="Update this comment..."
                          minHeightClassName="min-h-[170px]"
                          mentionItems={mentionItems}
                          className="rounded-lg border-slate-200 shadow-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditingComment}
                          disabled={updatingCommentId === comment.ID}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          onClick={() => updateComment(comment.ID)}
                          disabled={updatingCommentId === comment.ID}
                        >
                          {updatingCommentId === comment.ID
                            ? "Saving..."
                            : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <RichTextContent
                        value={comment.description}
                        className="text-sm text-foreground [&_p:first-child]:mt-0"
                        plainTextFallback="No content"
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
        </section>
      </CardContent>
    </Card>
  )
}
