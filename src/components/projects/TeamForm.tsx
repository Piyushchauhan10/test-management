import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import {
  FileText,
  Pencil,
  Save,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  X,
} from "lucide-react"
import { toast } from "sonner"

import useHttp from "@/hooks/use-http"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type TeamFormProps = {
  update: boolean
  teamId?: string
}

type TeamFormData = {
  name: string
  description?: string
}

type User = {
  ID: string
  username?: string
  team_ID?: string | null
  team?: {
    ID: string
    name: string
  }
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

const getUserName = (user: User) => user.username?.trim() || "Unnamed user"

const getAvatarTone = (name: string) => {
  const tones = [
    "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-500/25",
    "bg-sky-100 text-sky-700 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/25",
    "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/25",
    "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/25",
  ]

  const total = Array.from(name).reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  )

  return tones[total % tones.length]
}

export default function TeamForm({ update, teamId }: TeamFormProps) {
  const navigate = useNavigate()
  const { sendRequest } = useHttp()

  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingField, setEditingField] = useState<"name" | "description" | null>(
    null
  )

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const fetchTeam = useCallback(async () => {
    try {
      const response = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${teamId}`
      )

      if (response?.success && response.data) {
        reset({
          name: response.data.name || "",
          description: response.data.description || "",
        })
      }
    } catch {
      toast.error("Failed to load team")
    }
  }, [reset, sendRequest, teamId])

  const fetchTeamUsers = useCallback(async () => {
    if (!teamId) return

    try {
      setLoadingUsers(true)

      const response = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users?$expand=team`
      )

      let userData: User[] = []

      if (Array.isArray(response?.data)) {
        userData = response.data
      }

      const teamUsers = userData.filter(
        (user) => user.team_ID === teamId || user.team?.ID === teamId
      )

      setUsers(teamUsers)
    } catch (error) {
      console.error("Failed to load team users", error)
      toast.error("Failed to load users")
    } finally {
      setLoadingUsers(false)
    }
  }, [sendRequest, teamId])

  useEffect(() => {
    if (update && teamId) {
      void fetchTeam()
      void fetchTeamUsers()
    }
  }, [fetchTeam, fetchTeamUsers, teamId, update])

  const onSubmit = async (values: TeamFormData) => {
    try {
      const url = update
        ? `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${teamId}`
        : `${import.meta.env.VITE_BACKEND_API_URL}/Teams`

      await sendRequest(url, {
        method: update ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      toast.success(
        update ? "Team updated successfully" : "Team created successfully"
      )
      navigate("/admin/teams")
    } catch {
      toast.error(update ? "Failed to update team" : "Failed to create team")
    }
  }

  const generalFields = (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h3 className="text-sm mt-2 font-semibold text-slate-950 dark:text-slate-50">
              Team Details
            </h3>
            
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex min-h-7 items-center justify-between gap-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <UsersRound className="size-4 text-emerald-600 dark:text-emerald-400" />
                Team Name
              </Label>

              {update && editingField !== "name" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingField("name")}
                  className="h-7 px-2 text-xs"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
            </div>

            {!update ? (
              <Input
                {...register("name", { required: true })}
                placeholder="Enter team name"
                className="h-11 border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
              />
            ) : editingField === "name" ? (
              <Input
                {...register("name", { required: true })}
                placeholder="Enter team name"
                className="h-11 border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                autoFocus
                onBlur={() => setEditingField(null)}
              />
            ) : (
              <div className="flex min-h-11 items-center rounded-lg border border-slate-200 bg-slate-50/70 px-3 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100">
                {watch("name") || "-"}
              </div>
            )}

            {errors.name && (
              <p className="text-xs font-medium text-red-600">
                Team name is required.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex min-h-7 items-center justify-between gap-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <FileText className="size-4 text-sky-600 dark:text-sky-400" />
                Description
              </Label>

              {update && editingField !== "description" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingField("description")}
                  className="h-7 px-2 text-xs"
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              )}
            </div>

            {!update ? (
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Add a summary for this team..."
                    className="border-slate-200 bg-slate-50/70 shadow-none focus-within:border-emerald-500 focus-within:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                    minHeightClassName="min-h-[150px]"
                  />
                )}
              />
            ) : editingField === "description" ? (
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Add a summary for this team..."
                    className="border-slate-200 bg-slate-50/70 shadow-none focus-within:border-emerald-500 focus-within:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                    minHeightClassName="min-h-[150px]"
                  />
                )}
              />
            ) : (
              <div className="min-h-[150px] rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200">
                <RichTextContent value={watch("description")} clamp={140} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10 sm:min-w-28"
          onClick={() => navigate("/admin/teams")}
        >
          <X className="size-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 sm:min-w-36 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          <Save className="size-4" />
          {isSubmitting
            ? update
              ? "Updating..."
              : "Creating..."
            : update
              ? "Update Team"
              : "Create Team"}
        </Button>
      </div>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {update ? (
        <Tabs defaultValue="general" className="space-y-5">
          <TabsList className="grid w-full grid-cols-2 border-slate-200 bg-slate-100/70 p-1 dark:border-slate-800 dark:bg-slate-900/70 sm:w-fit sm:min-w-80">
            <TabsTrigger value="general" className="gap-2">
              <Sparkles className="size-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserRoundCheck className="size-4" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="general"
            className="border-0 bg-transparent p-0 shadow-none"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="space-y-6">{generalFields}</div>

              <aside className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-950/70 dark:bg-sky-950/20">
                <p className="text-xs font-semibold uppercase text-sky-700 dark:text-sky-300">
                  Team Preview
                </p>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {watch("name") || "Unnamed team"}
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      {users.length} {users.length === 1 ? "member" : "members"} assigned
                    </p>
                  </div>
                  <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      Edit mode
                    </p>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">
                      Fields stay readable until you choose to edit them.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent
            value="users"
            className="border-0 bg-transparent p-0 shadow-none"
          >
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                    <UserRoundCheck className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                      Team Members
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      People currently assigned to this team.
                    </p>
                  </div>
                </div>

                <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200">
                  {users.length} {users.length === 1 ? "member" : "members"}
                </div>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {loadingUsers ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                    Loading users...
                  </div>
                ) : users.length > 0 ? (
                  users.map((user) => {
                    const name = getUserName(user)

                    return (
                      <div
                        key={user.ID}
                        className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900/60"
                      >
                        <div
                          className={cn(
                            "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1",
                            getAvatarTone(name)
                          )}
                        >
                          {getInitials(name)}
                        </div>

                        <span className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {name}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
                    No users found
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        generalFields
      )}
    </form>
  )
}
