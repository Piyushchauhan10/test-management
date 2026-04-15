import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
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
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
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
        className={cn("flex flex-col gap-6")}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <FormField
            control={form.control}
            name="name"
            render={({
              field,
            }: {
              field: ControllerRenderProps<z.infer<typeof projectSchema>, "name">
            }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Write a project description..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Field>
            <Button className="cursor-pointer" type="submit">
              {id ? "Update" : "Add"} Project
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </Form>
  )
}

export default FormComponent
