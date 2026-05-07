import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import {
  AlignLeft,
  ClipboardCheck,
  FileText,
  Flag,
  ListChecks,
  Save,
  Sparkles,
  X,
} from "lucide-react"
import { toast } from "sonner"

import useHttp from "@/hooks/use-http"
import { Button } from "@/components/ui/button"
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

  const {
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({
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

  useEffect(() => {
    setValue("project_ID", currentProject || activeProjectId || "")
  }, [activeProjectId, currentProject, setValue])

  const selectedPriority = watch("priority")
  const selectedStatus = watch("status")
  const selectedSprint = watch("sprint_ID")
  const selectedSprintName =
    sprints.find((sprint) => sprint.ID === selectedSprint)?.name || "Not assigned"
 
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm mt-2 font-semibold text-slate-950 dark:text-slate-50">
                Requirement Details
              </h3>
            
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex w-full flex-col gap-2 md:col-span-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
                Title
              </Label>
              <Input
                {...register("title")}
                placeholder="Enter requirement title"
                className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
              />
            </div>

            <div className="flex w-full flex-col gap-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Flag className="size-4 text-amber-600 dark:text-amber-400" />
                Priority
              </Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
                      <SelectValue placeholder="Select priority" />
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <ClipboardCheck className="size-4 text-teal-600 dark:text-teal-400" />
                Status
              </Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
                      <SelectValue placeholder="Select status" />
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

            <div className="flex w-full flex-col gap-2 md:col-span-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <ListChecks className="size-4 text-sky-600 dark:text-sky-400" />
                Sprint
              </Label>
              <Controller
                control={control}
                name="sprint_ID"
                render={({ field }) => (
                  <Select value={field.value || ""} onValueChange={field.onChange}>
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
                      <SelectValue placeholder="Select sprint" />
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
        </div>

        <aside className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-950/70 dark:bg-sky-950/20">
          <p className="text-xs font-semibold uppercase text-sky-700 dark:text-sky-300">
            Requirement Summary
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedPriority || "Priority not set"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Priority helps teams sequence testing effort.
              </p>
            </div>
            <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedStatus || "Status not set"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Keep status aligned with review readiness.
              </p>
            </div>
            <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedSprintName}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Sprint assignment keeps delivery traceable.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
            <AlignLeft className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              Description
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add acceptance notes, context, and mention teammates.
            </p>
          </div>
        </div>

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <RichTextEditor
              value={field.value || ""}
              onChange={field.onChange}
              placeholder="Write detailed requirement description..."
              className="border-slate-200 bg-slate-50/70 shadow-none focus-within:border-emerald-500 focus-within:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
              minHeightClassName="min-h-[220px]"
              mentionItems={mentionItems}
            />
          )}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10 sm:min-w-28"
          onClick={() => navigate("/admin/requirements")}
        >
          <X className="size-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 sm:min-w-44 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          <Save className="size-4" />
          {isSubmitting
            ? update
              ? "Updating..."
              : "Creating..."
            : update
              ? "Update Requirement"
              : "Create Requirement"}
        </Button>
      </div>
    </form>
  )
}
