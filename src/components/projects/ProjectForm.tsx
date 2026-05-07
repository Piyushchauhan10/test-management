import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import useHttp from "@/hooks/use-http"
import { projectSchema } from "@/lib/types/schema"
import { zodResolver } from "@hookform/resolvers/zod"
import { AlignLeft, FolderKanban, Save, Sparkles, X } from "lucide-react"
import { useEffect } from "react"
import {
  useForm,
  type ControllerRenderProps,
  type SubmitHandler,
} from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import z from "zod"

const FormComponent = ({
  id,
  project,
}: {
  id?: string
  project?: { name: string; description: string }
}) => {
  const navigate = useNavigate()
  const http = useHttp()

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: project || {
      name: "",
      description: "",
    },
  })

  const onSubmit: SubmitHandler<z.infer<typeof projectSchema>> = async (
    values: z.infer<typeof projectSchema>
  ) => {
    let method = "POST"
    let url = `${import.meta.env.VITE_BACKEND_API_URL}/Projects`

    if (id) {
      method = "PATCH"
      url = `${import.meta.env.VITE_BACKEND_API_URL}/Projects(${id})`
    }

    const response = await http.sendRequest(url, {
      method,
      body: JSON.stringify(values),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })

    if (response.success) {
      toast.success("Project", {
        description: `Project ${id ? "updated" : "added"} successfully`,
      })
      navigate("/admin/project")
    } else {
      toast.error("Error", { description: "Failed to add project" })
    }
  }

  useEffect(() => {
    form.reset({
      name: project?.name || "",
      description: project?.description || "",
    })
  }, [form, project?.description, project?.name])

  return (
    <Form {...form}>
      <form
        className="space-y-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Sparkles className="size-4" />
              </div>
              <div>
                <h3 className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                  Project Details
                </h3>
              </div>
            </div>

          <FormField
            control={form.control}
            name="name"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof projectSchema>, "name">
            }) => (
              <FormItem className="flex w-full flex-col gap-2">
                <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <FolderKanban className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Project Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter project name"
                    className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          <aside className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-950/70 dark:bg-sky-950/20">
            <p className="text-xs font-semibold uppercase text-sky-700 dark:text-sky-300">
              Project Summary
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {form.watch("name") || "Project name not set"}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Use a clear name teams can recognize in planning and testing.
                </p>
              </div>
              <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {form.watch("description") ? "Description added" : "Description pending"}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  A focused description helps every sprint and cycle stay aligned.
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
                Add goals, scope, and delivery notes for this project.
              </p>
            </div>
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({
              field,
            }: {
              field: ControllerRenderProps<
                z.infer<typeof projectSchema>,
                "description"
              >
            }) => (
              <FormItem>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Write a project description..."
                    className="border-slate-200 bg-slate-50/70 shadow-none focus-within:border-emerald-500 focus-within:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                    minHeightClassName="min-h-[220px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              )}
            />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:min-w-28"
            onClick={() => navigate("/admin/project")}
          >
            <X className="size-4" />
            Cancel
          </Button>
          <Button
            className="h-10 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 sm:min-w-40 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            <Save className="size-4" />
            {form.formState.isSubmitting
              ? id
                ? "Updating..."
                : "Creating..."
              : id
                ? "Update Project"
                : "Create Project"}
            </Button>
        </div>
      </form>
    </Form>
  )
}

export default FormComponent
