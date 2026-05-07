import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import useHttp from "@/hooks/use-http"
import React from "react"
import { Link, useLocation } from "react-router-dom"
import { ProjectContext } from "@/store/project-store"

type Project = {
  ID: string
  name: string
}

export function NavProjects() {
  const httpHook = useHttp()
  const location = useLocation()
  const { setCurrentProject } = React.useContext(ProjectContext)
  const [projects, setProjects] = React.useState<Project[]>([])

  const getProjects = async () => {
    const response = await httpHook.sendRequest(import.meta.env.VITE_BACKEND_API_URL + "/Projects")

    if (response.success) setProjects(response.data)
  }

  React.useEffect(() => {
    getProjects()
  }, [])

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((project) => {
          const projectUrl = `/admin/project/${project.ID}/sprints`
          const isActive = location.pathname.startsWith(projectUrl)

          return (
            <SidebarMenuItem key={project.ID}>
              <SidebarMenuButton asChild isActive={isActive}>
                <Link
                  to={projectUrl}
                  onClick={() => {
                    localStorage.setItem("projectId", project.ID)
                    setCurrentProject(project.ID)
                  }}
                >
                  <span className="text-sm">{project.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
