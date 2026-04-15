import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import useHttp from "@/hooks/use-http"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProjectContext } from "@/store/project-store"

type Requirement = {
  ID: string
  title: string
  description: string
  priority: string
  status: string
  project_ID: string
  sprint_ID?: string | null
}

type Sprint = {
  ID: string
  name: string
}

type User = {
  ID: string
  username: string
  email?: string
}

type Props = {
  update: boolean
  data?: Requirement | null
}

type FormData = {
  title: string
  description: string
  priority: string
  status: string
  project_ID: string
  sprint_ID: string
}

export default function RequirementForm({ update, data }: Props) {
  const navigate = useNavigate()
  const { sendRequest } = useHttp()

  const activeProjectId = localStorage.getItem("projectId") || ""

  const [sprints, setSprints] = useState<Sprint[]>([])
  const [users, setUsers] = useState<User[]>([])

  const { control, register,setValue, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      title: data?.title ?? "",
      description: data?.description ?? "",
      priority: data?.priority ?? "",
      status: data?.status ?? "",
      project_ID: activeProjectId,
      sprint_ID: data?.sprint_ID ?? "",
    },
  })

  const { currentProject } = useContext(ProjectContext);

  setValue("project_ID", currentProject || "");

  console.log(data);
  

 
  const fetchSprints = useCallback(async (projectId: string) => {
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Sprints?$filter=project_ID eq '${projectId}'`
      )
      setSprints(res?.data?.value || res?.data || [])
    } catch {
      toast.error("Failed to load sprints")
    }
  }, [sendRequest])

  const fetchUsers = useCallback(async () => {
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users`
      )
      setUsers(res?.data?.value || res?.data || [])
    } catch {
      toast.error("Failed to load users")
    }
  }, [sendRequest])

  useEffect(() => {
    if (activeProjectId) {
      fetchSprints(activeProjectId)
    }
    fetchUsers()
  }, [activeProjectId, fetchSprints, fetchUsers])

  useEffect(() => {
    if (!update || !data) {
      reset((prev) => ({
        ...prev,
        project_ID: activeProjectId,
      }))
      return
    }

    reset({
      title: data.title,
      description: data.description || "",
      priority: data.priority,
      status: data.status,
      project_ID: data.project_ID || activeProjectId,
      sprint_ID: data.sprint_ID || "",
    })

    if (data.project_ID) {
      fetchSprints(data.project_ID)
    }
  }, [activeProjectId, data, fetchSprints, reset, update])

  const mentionItems = useMemo(
    () =>
      users.map((user) => ({
        id: user.ID,
        label: user.username,
        // sublabel: user.email,
      })),
    [users]
  )

  const onSubmit = async (values: FormData) => {
    try {
      const isEdit = Boolean(update && data?.ID)

      const payload = {
        ...values,
        project_ID: values.project_ID || data?.project_ID || activeProjectId,
      }

      const url =
        import.meta.env.VITE_BACKEND_API_URL +
        (isEdit ? `/Requirements('${data?.ID}')` : "/Requirements")

      await sendRequest(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast.success(`Requirement ${isEdit ? "updated" : "created"}`)
      navigate("/admin/requirements")
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex w-full flex-col gap-2">
              <Label className="text-xs">Title</Label>
              <Input
                {...register("title")}
                placeholder="Enter requirement title"
                className="w-full rounded-xl"
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label className="text-xs">Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label className="text-xs">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label className="text-xs">Sprint</Label>
              <Controller
                control={control}
                name="sprint_ID"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <SelectValue placeholder="Select Sprint" />
                    </SelectTrigger>
                    <SelectContent>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.ID} value={sprint.ID}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Write detailed requirement description..."
                  minHeightClassName="min-h-[220px]"
                  mentionItems={mentionItems}
                />
              )}
            />
          </div>

          <Button type="submit" className="h-11 w-full">
            {update ? "Update Requirement" : "Add Requirement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}