
import { useEffect } from "react"
import { useForm, type ControllerRenderProps, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import moment from "moment"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { sprintSchema } from "@/lib/types/schema"
import type { Sprint } from "@/lib/types"
import useHttp from "@/hooks/use-http"

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Popover } from "@radix-ui/react-popover"
import { PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarDays, CalendarIcon, Flag, Save, Sparkles, X } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "../ui/calendar"

const SprintForm = ({
  update,
  data,
}: {
  update: boolean
  data?: Sprint | null
}) => {
  const { projectId, sprintId } = useParams<{
    projectId: string
    sprintId: string
  }>()
  const navigate = useNavigate()
  const http = useHttp()

  const form = useForm<z.infer<typeof sprintSchema>>({
    resolver: zodResolver(sprintSchema),
    defaultValues: {
      name: "",
      startDate: new Date(),
      endDate: new Date(),
    },
  })

  useEffect(() => {
    if (update && data) {
      form.reset({
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      })
    }
  }, [update, data, form])

  const onSubmit: SubmitHandler<z.infer<typeof sprintSchema>> = async (values) => {
    try {

      let method = "POST"
      let url = import.meta.env.VITE_BACKEND_API_URL + "/Sprints"

      if (sprintId) {
        method = "PATCH"
        url = import.meta.env.VITE_BACKEND_API_URL + `/Sprints(${sprintId})`
      }

      await http.sendRequest(url,
        {
          method: method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: values.name,  
            startDate: moment(values.startDate).format("YYYY-MM-DD"),
            endDate: moment(values.endDate).format("YYYY-MM-DD"),
            project_ID: projectId
          }),
        }
      )

      toast.success(`Sprint ${sprintId ? 'updated' : 'added'}  successfully`)
      navigate(`/admin/project/${projectId}/sprints`)
    } catch (error) {
      console.error("SPRINT SAVE ERROR:", error)
      toast.error("Operation failed")
    }
  }

  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")
  const sprintName = form.watch("name")
  const formatDisplayDate = (date?: Date | string) =>
    date ? format(new Date(date), "PPP") : "Date not set"

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
                  Sprint Details
                </h3>
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<z.infer<typeof sprintSchema>, "name">
                }) => (
                  <FormItem className="flex w-full flex-col gap-2 md:col-span-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <Flag className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Sprint Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter sprint name"
                        className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<z.infer<typeof sprintSchema>, "startDate">
                }) => (
                  <FormItem className="flex w-full flex-col gap-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <CalendarDays className="size-4 text-sky-600 dark:text-sky-400" />
                      Start Date
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-11 w-full justify-start border-slate-200 bg-slate-50/70 text-left font-normal shadow-none hover:bg-slate-100 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4 text-sky-600 dark:text-sky-400" />
                            {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => date && field.onChange(date)}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({
                  field,
                }: {
                  field: ControllerRenderProps<z.infer<typeof sprintSchema>, "endDate">
                }) => (
                  <FormItem className="flex w-full flex-col gap-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                      <CalendarDays className="size-4 text-teal-600 dark:text-teal-400" />
                      End Date
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "h-11 w-full justify-start border-slate-200 bg-slate-50/70 text-left font-normal shadow-none hover:bg-slate-100 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-900",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 size-4 text-teal-600 dark:text-teal-400" />
                            {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => date && field.onChange(date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <aside className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-950/70 dark:bg-sky-950/20">
            <p className="text-xs font-semibold uppercase text-sky-700 dark:text-sky-300">
              Sprint Summary
            </p>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {sprintName || "Sprint name not set"}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Name the sprint around the delivery goal or iteration.
                </p>
              </div>
              <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDisplayDate(startDate)}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Start date anchors planning and requirement intake.
                </p>
              </div>
              <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {formatDisplayDate(endDate)}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  End date keeps test execution and closure visible.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:min-w-28"
            onClick={() => navigate(`/admin/project/${projectId}/sprints`)}
          >
            <X className="size-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={(update && !data) || form.formState.isSubmitting}
            className="h-10 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 sm:min-w-40 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
          >
            <Save className="size-4" />
            {form.formState.isSubmitting
              ? update
                ? "Updating..."
                : "Creating..."
              : update
                ? "Update Sprint"
                : "Create Sprint"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default SprintForm
