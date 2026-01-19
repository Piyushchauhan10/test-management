import React from "react"
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

type AddUserForm = {
  username: string
  email: string
  role: string
}

export default function UserForm() {
  const navigate = useNavigate()
  const http = useHttp()

  const { register, handleSubmit, setValue } = useForm<AddUserForm>()

  const onSubmit = async (values: AddUserForm) => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: values.username,
            email: values.email,
            role: values.role,
          }),
        }
      )

      if (!response) throw new Error()

      toast.success("User created successfully")
      navigate("/admin/users")
    } catch (error) {
      console.error(error)
      toast.error("Failed to create user")
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Username</Label>
            <Input
              {...register("username", { required: true })}
              placeholder="Enter username"
            />
          </div>

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              {...register("email", { required: true })}
              placeholder="Enter email"
            />
          </div>

          <div>
            <Label>Role</Label>
            <Select onValueChange={(v) => setValue("role", v)}>
              <SelectTrigger>
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

          <Button type="submit" className="w-full">
            Add User
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
