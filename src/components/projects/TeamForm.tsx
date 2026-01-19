import React from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useHttp from "@/hooks/use-http"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

type CreateTeamForm = {
  name: string
  description: string
}

export default function TeamForm() {
  const http = useHttp()
  const navigate = useNavigate()

  const { register, handleSubmit } = useForm<CreateTeamForm>()

  const onSubmit = async (values: CreateTeamForm) => {
    try {
      await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
          }),
        }
      )

      toast.success("Team created successfully")
      navigate("/admin/teams")
    } catch (error) {
      console.error(error)
      toast.error("Failed to create team")
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="pt-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div>
            <Label>Team Name</Label>
            <Input
              {...register("name", { required: true })}
              placeholder="Enter team name"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              {...register("description")}
              placeholder="Enter team description"
            />
          </div>

          <Button type="submit" className="w-full">
            Create Team
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
