
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
import { Field, FieldGroup } from "../ui/field"
import { cn } from "@/lib/utils"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Popover } from "@radix-ui/react-popover"
import { PopoverContent, PopoverTrigger } from "../ui/popover"
import { CalendarIcon } from "lucide-react"
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
            name: values.name, // ✅ DO NOT send ID
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

  return (
    <Form {...form}>
      <form
        className={cn("flex flex-col gap-6")}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">
              {update ? "Edit Sprint" : "Add Sprint"}
            </h1>
          </div>

          {/* NAME */}
          <FormField
            control={form.control}
            name="name"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof sprintSchema>, "name">
            }) => (
              <FormItem>
                <FormLabel>Sprint Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter Sprint name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* START DATE */}
          <FormField
            control={form.control}
            name="startDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof sprintSchema>, "startDate">
            }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value as Date}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* END DATE */}
          <FormField
            control={form.control}
            name="endDate"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof sprintSchema>, "endDate">
            }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={field.value as Date}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <Button type="submit" disabled={update && !data}>
              {update ? "Update Sprint" : "Add Sprint"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  )
}

export default SprintForm
