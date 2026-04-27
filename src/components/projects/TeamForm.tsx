import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Pencil } from "lucide-react"
import { toast } from "sonner"

import useHttp from "@/hooks/use-http"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextContent } from "@/components/ui/rich-text-content"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

export default function TeamForm({ update, teamId }: TeamFormProps) {
  const navigate = useNavigate()
  const { sendRequest } = useHttp()

  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
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

      <Button type="submit" className="h-11 w-full rounded-lg text-sm font-medium">
        {update ? "Update Team" : "Add Team"}
      </Button>
    </>
  )

  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {update ? (
            <Tabs defaultValue="general" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                {generalFields}
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div className="space-y-2">
                  <Label>Team Members</Label>

                  <div className="max-h-56 space-y-2 overflow-y-auto">
                    {loadingUsers ? (
                      <p className="text-sm">Loading users...</p>
                    ) : users.length > 0 ? (
                      users.map((user) => (
                        <div
                          key={user.ID}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-muted"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                            {getInitials(getUserName(user))}
                          </div>

                          <span className="text-sm">{getUserName(user)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No users found</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            generalFields
          )}
        </form>
      </CardContent>
    </Card>
  )
}
