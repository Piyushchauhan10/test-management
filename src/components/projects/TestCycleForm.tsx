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
import { Field, FieldGroup } from "../ui/field"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Popover } from "../ui/popover"
import { PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarIcon } from "lucide-react"
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

  

return (
  <div className="w-full flex py-10">
    <div className="w-full px-4">
      <Form {...form}>
        <form
          className={cn("flex flex-col gap-6")}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup className="flex flex-col gap-6 items-start w-full">

            <div className="w-full">
              <h1 className="text-2xl font-bold text-left">
                {update ? "Edit Test Cycle" : "Add Test Cycle"}
              </h1>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="w-full text-left">
                  <FormLabel className="text-left">
                    Test Cycle Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="w-full text-left"
                      placeholder="Enter Test Cycle name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-left" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="w-full text-left">
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value as Date}
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
                <FormItem className="w-full text-left">
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value as Date}
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

            <Field className="w-full">
              <Button type="submit" className="w-full">
                {update ? "Update Test Cycle" : "Add Test Cycle"}
              </Button>
            </Field>

          </FieldGroup>
        </form>
      </Form>
    </div>
  </div>
)


}

export default TestCycleForm
