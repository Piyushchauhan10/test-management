import { useEffect, useState } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { format } from "date-fns"

import { testCycleSchema } from "@/lib/types/schema"
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
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover"
import { Calendar } from "../ui/calendar"
import { CalendarIcon } from "lucide-react"
import type { TestCycle } from "@/lib/types"

const TestCyclesForm = ({ testCycle }: { testCycle?: any }) => {
  const { projectId, sprintId, testCycleId } = useParams<{
    projectId: string
    sprintId: string
    testCycleId: string
  }>()

  const navigate = useNavigate()
  const http = useHttp()
  const [loading, setLoading] = useState(true)

  /* ===================== FORM ===================== */

  const form = useForm<TestCycle>({
    resolver: zodResolver(testCycleSchema),
    defaultValues: {
      title: "",
      startDate: new Date(),
      endDate: new Date(),
    },
  })

  useEffect(() => {
    if (testCycle?.title) {
      form.reset({
        title: testCycle.title,
        startDate: testCycle.startDate,
        endDate: testCycle.endDate,
      })
    }
  }, [testCycle?.title])


  const onSubmit: SubmitHandler<TestCycle> = async (values) => {
    try {

      let method = "POST"
      let url = import.meta.env.VITE_BACKEND_API_URL + "/TestCycles"

      if (testCycleId) {
        method = "PATCH"
        url = import.meta.env.VITE_BACKEND_API_URL + `/TestCycles(${testCycleId})`
      }

      await http.sendRequest(url,
        {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: values.title,
            startDate: format(values.startDate, "yyyy-MM-dd"),
            endDate: format(values.endDate, "yyyy-MM-dd"),
            project_ID: projectId,
            sprint_ID: sprintId
          }),
        }
      )

      toast.success("Test Cycle updated successfully")
      navigate(`/admin/project/${projectId}/sprint/${sprintId}`)
    } catch {
      toast.error("Update failed")
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6"
      >
        <FieldGroup>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Test Cycle Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(field.value as Date, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={field.value as Date}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(field.value, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <Calendar
                      mode="single"
                      selected={field.value as Date}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}
          />

          <Field>
            <Button type="submit" className="w-full">
              {testCycleId ? 'Update': 'Add'} Test Cycle
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  )
}

export default TestCyclesForm
