import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { ChevronDown, ChevronUp, Pencil, Search } from "lucide-react"
import { toast } from "sonner"

import useHttp from "@/hooks/use-http"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

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
  username: string
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default function TeamForm({ update, teamId }: TeamFormProps) {
  const navigate = useNavigate()
  const http = useHttp()

  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(false)
  const [search, setSearch] = useState("")
  const [editingField, setEditingField] = useState<"name" | "description" | null>(
    null
  )

  const { control, register, handleSubmit, reset, watch } =
    useForm<TeamFormData>({
      defaultValues: {
        name: "",
        description: "",
      },
    })

  const fetchTeam = useCallback(async () => {
    try {
      const response = await http.sendRequest(
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
  }, [http, reset, teamId])

  const fetchTeamUsers = useCallback(async () => {
    if (!teamId) return

    try {
      setLoadingUsers(true)

      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users?$filter=team_ID eq '${teamId}'`
      )

      let userData: User[] = []

      if (Array.isArray(response?.data)) {
        userData = response.data
      } else if (Array.isArray(response?.data?.value)) {
        userData = response.data.value
      }

      setUsers(userData)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoadingUsers(false)
    }
  }, [http, teamId])

  useEffect(() => {
    if (update && teamId) {
      fetchTeam()
      fetchTeamUsers()
    }
  }, [fetchTeam, fetchTeamUsers, teamId, update])

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase())
  )

  const onSubmit = async (values: TeamFormData) => {
    try {
      const url = update
        ? `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${teamId}`
        : `${import.meta.env.VITE_BACKEND_API_URL}/Teams`

      await http.sendRequest(url, {
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

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="group relative space-y-2">
            <Label>Team Name</Label>

            {!update ? (
              <Input
                {...register("name", { required: true })}
                className="h-11 rounded-lg"
              />
            ) : editingField === "name" ? (
              <Input
                {...register("name", { required: true })}
                className="h-11 rounded-lg"
                autoFocus
                onBlur={() => setEditingField(null)}
              />
            ) : (
              <div className="flex h-11 items-center rounded-lg border bg-muted/40 px-3 text-sm">
                {watch("name") || "-"}
              </div>
            )}

            {update && editingField !== "name" && (
              <button
                type="button"
                onClick={() => setEditingField("name")}
                className="absolute top-7 right-2 flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs opacity-0 shadow-sm transition-all duration-200 hover:bg-muted group-hover:opacity-100"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>

          <div className="group relative space-y-2">
            <Label>Description</Label>

            {!update ? (
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Add a summary for this team..."
                    minHeightClassName="min-h-[140px]"
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
                    minHeightClassName="min-h-[140px]"
                  />
                )}
              />
            ) : (
              <div className="rounded-lg border bg-muted/40 px-3 py-3 text-sm">
                <RichTextContent value={watch("description")} clamp={140} />
              </div>
            )}

            {update && editingField !== "description" && (
              <button
                type="button"
                onClick={() => setEditingField("description")}
                className="absolute top-7 right-2 flex items-center gap-1 rounded-md border bg-white px-2 py-1 text-xs opacity-0 shadow-sm transition-all duration-200 hover:bg-muted group-hover:opacity-100"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>

          {update && (
            <div className="space-y-2">
              <Label>Team Members</Label>

              <div className="rounded-xl border bg-white shadow-sm dark:bg-muted">
                <div
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex cursor-pointer items-center justify-between px-4 py-3 transition hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{users.length} Members</span>
                  {openDropdown ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>

                {openDropdown && (
                  <div className="space-y-3 border-t p-3">
                    <div className="relative">
                      <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="h-10 pl-9"
                      />
                    </div>

                    <div className="max-h-40 space-y-2 overflow-y-auto">
                      {loadingUsers ? (
                        <p className="text-sm">Loading users...</p>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.ID}
                            className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-muted"
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                              {getInitials(user.username)}
                            </div>

                            <span className="text-sm">{user.username}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No users found</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button type="submit" className="h-11 w-full rounded-lg text-sm font-medium">
            {update ? "Update Team" : "Add Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
