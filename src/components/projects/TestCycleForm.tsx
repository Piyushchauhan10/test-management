import { useEffect } from "react"
import {
  useForm,
  type SubmitHandler,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import z from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import { testCycleSchema } from "@/lib/types/schema"
import type { TestCycle } from "@/lib/types"
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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarDays, CalendarIcon, ClipboardCheck, Save, Sparkles, X } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "../ui/calendar"

const TestCycleForm = ({
  update,
  data,
}: {
  update: boolean
  data?: TestCycle | null
}) => {
 
  const { projectId, sprintId, testCycleId } = useParams<{
    projectId: string
    sprintId: string
    testCycleId: string
  }>()

 
  const navigate = useNavigate()

  
  const http = useHttp()

 
  const form = useForm<z.infer<typeof testCycleSchema>>({
    resolver: zodResolver(testCycleSchema),
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

   
  const formatDateOnly = (date: Date | string) => {
    return new Date(date).toISOString().split("T")[0]
  }

 
  const onSubmit: SubmitHandler<
    z.infer<typeof testCycleSchema>
  > = async (values) => {
    try {
    
      if (!projectId || !sprintId) {
        toast.error("Project or Sprint ID missing in URL")
        return
      }

       
      const isEdit = Boolean(update && testCycleId)

    
      const url =
        import.meta.env.VITE_BACKEND_API_URL +
        (isEdit
          ? `/TestCycles(${testCycleId})`
          : `/TestCycles`)

     
      const payload = {
        name: values.name,
        startDate: formatDateOnly(values.startDate),
        endDate: formatDateOnly(values.endDate),
        project: { ID: projectId },
        sprint: { ID: sprintId },
      }

      console.log("Sending Payload:", payload)

     
      await http.sendRequest(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      })

       
      toast.success(
        `Test Cycle ${isEdit ? "updated" : "added"} successfully`
      )
 
      navigate(
        `/admin/project/${projectId}/sprint/${sprintId}/test-cycles`
      )
    } catch (error: any) {
      console.error("TEST CYCLE SAVE ERROR:", error)
      toast.error(
        error?.message || "Backend rejected request (400)"
      )
    }
  }

  const cycleName = form.watch("name")
  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")
  const formatDisplayDate = (date?: Date | string) =>
    date ? format(new Date(date), "PPP") : "Date not set"

return (
  <Form {...form}>
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-50">
                Test Cycle Details
              </h3>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex w-full flex-col gap-2 md:col-span-2">
                  <FormLabel className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <ClipboardCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Test Cycle Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-11 w-full border-slate-200 bg-slate-50/70 text-left shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
                      placeholder="Enter test cycle name"
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
              render={({ field }) => (
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
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            date && field.onChange(date)
                          }
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
              render={({ field }) => (
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
                          {field.value
                            ? format(new Date(field.value), "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            date && field.onChange(date)
                          }
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
            Test Cycle Summary
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {cycleName || "Cycle name not set"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Name the cycle around the validation scope or release window.
              </p>
            </div>
            <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {formatDisplayDate(startDate)}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Start date marks when execution begins.
              </p>
            </div>
            <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {formatDisplayDate(endDate)}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                End date keeps closure and reporting predictable.
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
          onClick={() => navigate(`/admin/project/${projectId}/sprint/${sprintId}/test-cycles`)}
        >
          <X className="size-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="h-10 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 sm:min-w-44 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          <Save className="size-4" />
          {form.formState.isSubmitting
            ? update
              ? "Updating..."
              : "Creating..."
            : update
              ? "Update Test Cycle"
              : "Create Test Cycle"}
        </Button>
      </div>
    </form>
  </Form>
)


}

export default TestCycleForm
