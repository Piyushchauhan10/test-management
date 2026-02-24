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

type RequirementFormProps = {
  update: boolean
  requirementId?: string
}

type Project = {
  ID: string
  name: string
}

type Sprint = {
  ID: string
  name: string
}

type RequirementFormData = {
  title: string
  description: string
  priority: string
  status: string
  project_ID: string
  sprint_ID: string
}

const BASE_URL =
  "http://72.61.244.79:4004/odata/v4/test-management"

export default function RequirementForm({
  update,
  requirementId,
}: RequirementFormProps) {
  const navigate = useNavigate()
  const http = useHttp()

  const [projects, setProjects] = useState<Project[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingSprints, setLoadingSprints] = useState(false)

  const { register, handleSubmit, setValue, watch } =
    useForm<RequirementFormData>({
      defaultValues: {
        title: "",
        description: "",
        priority: "",
        status: "",
        project_ID: "",
        sprint_ID: "",
      },
    })

  const selectedProject = watch("project_ID")

   
 const fetchProjects = async () => {
  try {
    const response = await http.sendRequest(
      `${BASE_URL}/Projects`
    )

    console.log("PROJECT RESPONSE:", response)

    const projectData =
      response?.data?.value ||
      response?.data ||
      []

    console.log("PROCESSED PROJECTS:", projectData)

    setProjects(projectData)

  } catch (error) {
    console.error(error)
    toast.error("Failed to load projects")
  } finally {
    setLoadingProjects(false)
  }
}
 
 const fetchSprints = async (projectId?: string) => {
  try {
    setLoadingSprints(true)

    let url = `${BASE_URL}/Sprints`

    if (projectId) {
      
      url += `?$filter=project_ID eq ${projectId}`
    }

    const response = await http.sendRequest(url)

    console.log("SPRINT RESPONSE:", response)

    const sprintData =
      response?.data?.value ||
      response?.data ||
      []

    console.log("PROCESSED SPRINTS:", sprintData)

    setSprints(sprintData)

  } catch (error) {
    console.error("Sprint fetch failed:", error)
    toast.error("Failed to load sprints")
  } finally {
    setLoadingSprints(false)
  }
}
 
  const fetchRequirement = async () => {
    try {
      const response = await http.sendRequest(
        `${BASE_URL}/Requirements(${requirementId})`
      )

      const requirement = response?.data

      if (requirement) {
        setValue("title", requirement.title || "")
        setValue("description", requirement.description || "")
        setValue("priority", requirement.priority || "")
        setValue("status", requirement.status || "")
        setValue("project_ID", requirement.project_ID || "")
        setValue("sprint_ID", requirement.sprint_ID || "")

        if (requirement.project_ID) {
          fetchSprints(requirement.project_ID)
        }
      }
    } catch (error) {
      toast.error("Failed to load requirement")
    }
  }
 
  useEffect(() => {
    if (selectedProject) {
      fetchSprints(selectedProject)
      setValue("sprint_ID", "")
    }
  }, [selectedProject])
 
  useEffect(() => {
    fetchProjects()

    if (update && requirementId) {
      fetchRequirement()
    }
  }, [update, requirementId])
 
  const onSubmit = async (values: RequirementFormData) => {
    try {
      const url = update
        ? `${BASE_URL}/Requirements(${requirementId})`
        : `${BASE_URL}/Requirements`

      const method = update ? "PATCH" : "POST"

      const payload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        project_ID: values.project_ID,
        sprint_ID: values.sprint_ID || null,
      }

      await http.sendRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      toast.success(
        update
          ? "Requirement updated successfully"
          : "Requirement created successfully"
      )

      navigate("/admin/requirements")
    } catch (error) {
      toast.error("Something went wrong")
    }
  }
 
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          <div>
            <Label>Title</Label>
            <Input
              {...register("title", { required: true })}
              placeholder="Enter title"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Input
              {...register("description", { required: true })}
              placeholder="Enter description"
            />
          </div>

          <div>
            <Label>Priority</Label>
            <Select
              value={watch("priority")}
              onValueChange={(v) => setValue("priority", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(v) => setValue("status", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Project</Label>
            <Select
              value={watch("project_ID")}
              onValueChange={(v) => setValue("project_ID", v)}
              disabled={loadingProjects}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.ID} value={project.ID}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Sprint</Label>
            <Select
              value={watch("sprint_ID")}
              onValueChange={(v) => setValue("sprint_ID", v)}
              disabled={!selectedProject || loadingSprints}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.ID} value={sprint.ID}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full">
            {update ? "Update Requirement" : "Add Requirement"}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}