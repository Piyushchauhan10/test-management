import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import useHttp from "@/hooks/use-http"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Mail, ShieldCheck, Sparkles, User, Users } from "lucide-react"

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

const roleLabels: Record<string, string> = {
  Admin: "Full workspace administration",
  QAManager: "Test planning and team oversight",
  QATester: "Execution, evidence, and reporting",
  Developer: "Defect review and delivery support",
}

export default function UserForm({ update, userId }: UserFormProps) {
  const navigate = useNavigate()
  const http = useHttp()

  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    defaultValues: {
      username: "",
      email: "",
      role: "",
      team_ID: "",
    },
  })

  const selectedRole = watch("role")
  const selectedTeam = watch("team_ID")
  const selectedTeamName = teams.find((team) => team.ID === selectedTeam)?.name

  const fetchTeams = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams`
      )

      let teamData: Team[] = []

      if (Array.isArray(response?.data)) {
        teamData = response.data
      } else if (Array.isArray(response?.data?.value)) {
        teamData = response.data.value
      }

      setTeams(teamData)
    } catch (error) {
      console.error("Team fetch failed:", error)
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

      const user = response?.data

      if (user) {
        setValue("username", user.username || "")
        setValue("email", user.email || "")
        setValue("role", user.role || "")
        setValue("team_ID", user.team_ID || "")
      }
    } catch (error) {
      console.error("Failed to load user:", error)
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

      await http.sendRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast.success(
        update ? "User updated successfully" : "User created successfully"
      )

      navigate("/admin/users")
    } catch (error) {
      console.error("Submit Error:", error)
      toast.error("Something went wrong")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm mt-2 font-semibold text-slate-950 dark:text-slate-50">
                Profile Details
              </h3>
              {/* <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Keep names readable and use a work email for notifications.
              </p> */}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <User className="size-4 text-emerald-600 dark:text-emerald-400" />
                Username
              </Label>
              <Input
                {...register("username", { required: true })}
                placeholder="Enter username"
                className="h-11 border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
              />
              {errors.username && (
                <p className="text-xs font-medium text-red-600">
                  Username is required.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Mail className="size-4 text-teal-600 dark:text-teal-400" />
                Email
              </Label>
              <Input
                type="email"
                {...register("email", { required: true })}
                placeholder="name@company.com"
                className="h-11 border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
              />
              {errors.email && (
                <p className="text-xs font-medium text-red-600">
                  Email is required.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <ShieldCheck className="size-4 text-cyan-600 dark:text-cyan-400" />
                Role
              </Label>
              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setValue("role", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
                  <SelectValue placeholder="Select role" />
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                Team
              </Label>
              <Select
                value={selectedTeam}
                onValueChange={(value) =>
                  setValue("team_ID", value, { shouldDirty: true })
                }
                disabled={loadingTeams}
              >
                <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
                  <SelectValue
                    placeholder={loadingTeams ? "Loading teams..." : "Select team"}
                  />
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
        </div>

        <aside className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-950/70 dark:bg-emerald-950/20">
          <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300">
            Account Access
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedRole || "Role not selected"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                {selectedRole
                  ? roleLabels[selectedRole]
                  : "Choose the permission level that matches this user's daily work."}
              </p>
            </div>
            <div className="border-t border-emerald-200/70 pt-3 dark:border-emerald-900/70">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedTeamName || "Team not assigned"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Team assignment keeps ownership and reporting clean.
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
          onClick={() => navigate("/admin/users")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 sm:min-w-36 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          {isSubmitting
            ? update
              ? "Updating..."
              : "Creating..."
            : update
              ? "Update User"
              : "Create User"}
        </Button>
      </div>
    </form>
  )
}
