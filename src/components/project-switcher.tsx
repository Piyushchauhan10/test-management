import * as React from "react"
import { ChevronsUpDown, Plus, ProjectorIcon } from "lucide-react"
import { Link } from "react-router-dom"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ProjectContext } from "@/store/project-store"
import { useContext } from "react"

export function ProjectSwitcher({
  projects,
}: {
  projects: {
    ID: string
    name: string
  }[]
}) {
  const { isMobile } = useSidebar()

  const { setCurrentProject } = useContext(ProjectContext)

  const [activeProject, setActiveProject] = React.useState<any>({})

  React.useEffect(() => {
    let pId = localStorage.getItem('projectId')

    if (pId) {
      let currentProject = projects.find((project) => project.ID == pId)

      setActiveProject(currentProject)
    }
    
  }, [projects.length])

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <ProjectorIcon className="size-4" />
              </div>

              {/* ===== ACTIVE PROJECT NAME ===== */}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeProject?.name || "Select Project"}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Projects
            </DropdownMenuLabel>

            {projects.map((project) => (
              <DropdownMenuItem key={project.ID} className="gap-2 p-2">
                <Link
                  onClick={() => {
                    setActiveProject(project)
                    localStorage.setItem("projectId", project.ID as string)
                    setCurrentProject(project.ID as string)
                  }}
                  to={`/admin/project/${project.ID}/sprints`}
                  className="flex gap-2 items-center w-full"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <ProjectorIcon className="size-4" />
                  </div>
                  {project.name}
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2 p-2">
              <Link
                to="/admin/project/create"
                className="flex gap-2 items-center text-muted-foreground font-medium"
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                Add Project
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
