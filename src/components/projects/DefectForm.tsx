import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
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

type Defect = {
  ID: string
  title: string
  description: string
  severity: string
  status: string
}

type Props = {
  update: boolean
  data?: Defect | null
}

type FormData = {
  title: string
  description: string
  severity: string
  status: string
}

export default function DefectForm({ update, data }: Props) {
  const navigate = useNavigate()
  const http = useHttp()

  const { control, register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      severity: "",
      status: "",
    },
  })

  useEffect(() => {
    if (update && data) {
      setValue("title", data.title)
      setValue("description", data.description)
      setValue("severity", data.severity)
      setValue("status", data.status)
    }
  }, [data, setValue, update])

  const severity = useWatch({ control, name: "severity" })
  const status = useWatch({ control, name: "status" })

  const onSubmit = async (values: FormData) => {
    try {
      const isEdit = Boolean(update && data?.ID)
      const url =
        import.meta.env.VITE_BACKEND_API_URL +
        (isEdit ? `/Defects('${data?.ID}')` : "/Defects")

      await http.sendRequest(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      toast.success(`Defect ${isEdit ? "updated" : "created"}`)
      navigate("/admin/defects")
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong")
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input {...register("title")} />
            </div>

            <div className="w-full">
              <Label>Severity</Label>

              <Select
                value={severity || ""}
                onValueChange={(value) => setValue("severity", value)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Label>Status</Label>

              <Select
                value={status || ""}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write the defect details, impact, and context..."
                />
              )}
            />
          </div>

          <Button type="submit" className="w-full">
            {update ? "Update Defect" : "Create Defect"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
