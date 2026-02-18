import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useHttp from "@/hooks/use-http"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type TeamFormProps = {
  update: boolean
  teamId?: string
}

type TeamFormData = {
  name: string
  description?: string
}

export default function TeamForm({ update, teamId }: TeamFormProps) {
  const navigate = useNavigate()
  const http = useHttp()

  const { register, handleSubmit, setValue } = useForm<TeamFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  })

   
  const fetchTeam = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${teamId}`
      )

      if (response?.success && response.data) {
        setValue("name", response.data.name)
        setValue("description", response.data.description)
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to load team")
    }
  }

  useEffect(() => {
    if (update && teamId) {
      fetchTeam()
    }
  }, [update, teamId])
 
  const onSubmit = async (values: TeamFormData) => {
    try {
      const url = update
        ? `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${teamId}`
        : `${import.meta.env.VITE_BACKEND_API_URL}/Teams`

      const method = update ? "PUT" : "POST"

      await http.sendRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      toast.success(update ? "Team updated successfully" : "Team created successfully")
      navigate("/admin/teams")
    } catch (error) {
      console.error(error)
      toast.error(update ? "Failed to update team" : "Failed to create team")
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Team Name</Label>
            <Input
              {...register("name", { required: true })}
              placeholder="Enter team name"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              {...register("description")}
              placeholder="Enter description"
            />
          </div>

          <Button type="submit" className="w-full">
            {update ? "Update Team" : "Add Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
