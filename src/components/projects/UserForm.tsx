import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useHttp from "@/hooks/use-http"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UserFormProps = {
  update: boolean
  userId?: string
}

type Team = {
  ID: string
  name: string
}

type UserFormData = {
  username: string
  email: string
  role: string
  team_ID: string
}

export default function UserForm({ update, userId }: UserFormProps) {
  const navigate = useNavigate()
  const http = useHttp()

  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  const { register, handleSubmit, setValue, watch } =
    useForm<UserFormData>({
      defaultValues: {
        username: "",
        email: "",
        role: "",
        team_ID: "",
      },
    })

  const selectedTeam = watch("team_ID")

 
  const fetchTeams = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams`
      )

      console.log("🔵 Teams API Raw Response:", response)

      let teamData: Team[] = []

      if (Array.isArray(response?.data)) {
        teamData = response.data
      } else if (Array.isArray(response?.data?.value)) {
        teamData = response.data.value
      }

      console.log("🟢 Processed Teams Data:", teamData)

      setTeams(teamData)
    } catch (error) {
      console.error("❌ Team fetch failed:", error)
      toast.error("Failed to load teams")
    } finally {
      setLoadingTeams(false)
    }
  }
 
  const fetchUser = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users/${userId}`
      )

      console.log(response)

      const user = response?.data

      if (user) {
        console.log(user)

        setValue("username", user.username || "")
        setValue("email", user.email || "")
        setValue("role", user.role || "")
        setValue("team_ID", user.team_ID || "")
      }
    } catch (error) {
      console.error("❌ Failed to load user:", error)
      toast.error("Failed to load user")
    }
  }

  useEffect(() => {
    fetchTeams()

    if (update && userId) {
      fetchUser()
    }
  }, [update, userId])

  
  const onSubmit = async (values: UserFormData) => {
    try {
      console.log(values)

      const url = update
        ? `${import.meta.env.VITE_BACKEND_API_URL}/Users/${userId}`
        : `${import.meta.env.VITE_BACKEND_API_URL}/Users`

      const method = update ? "PUT" : "POST"

      const payload = {
        username: values.username,
        email: values.email,
        role: values.role,
        team_ID: values.team_ID || null,
      }

      console.log(payload)

      const response = await http.sendRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log(response)

      toast.success(
        update ? "User updated successfully" : "User created successfully"
      )

      navigate("/admin/users")
    } catch (error) {
      console.error("❌ Submit Error:", error)
      toast.error("Something went wrong")
    }
  }

 return (
  <Card className="bg-background shadow-none border-0">
    <CardContent className="p-8">

 
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-tight">
          {update ? "Update User" : "Create New User"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the user details below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

       
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

         
          <div className="space-y-2">
            <Label className="text-sm font-medium">Username</Label>
            <Input
              {...register("username", { required: true })}
              placeholder="Enter username"
              className="h-11 w-full"
            />
          </div>

      
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              type="email"
              {...register("email", { required: true })}
              placeholder="Enter email address"
              className="h-11 w-full"
            />
          </div>

     
          <div className="space-y-2">
            <Label className="text-sm font-medium">Role</Label>
            <Select
              value={watch("role")}
              onValueChange={(v) => setValue("role", v)}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="QAManager">QA Manager</SelectItem>
                <SelectItem value="QATester">QA Tester</SelectItem>
                <SelectItem value="Developer">Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>

    
          <div className="space-y-2">
            <Label className="text-sm font-medium">Team</Label>
            <Select
              value={selectedTeam}
              onValueChange={(value) => setValue("team_ID", value)}
              disabled={loadingTeams}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Select Team" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.ID} value={team.ID}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

    
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="h-11 px-8 text-sm font-medium"
          >
            {update ? "Update User" : "Create User"}
          </Button>
        </div>

      </form>
    </CardContent>
  </Card>
)
}
