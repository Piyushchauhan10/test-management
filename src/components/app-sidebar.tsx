import * as React from "react"
import { FolderKanban, Users, UsersRound } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import useHttp from "@/hooks/use-http"
import { ProjectSwitcher } from "./project-switcher"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Projects",
      url: "/admin/projects",
      icon: FolderKanban,
      items: [
        {
          title: "Manage Projects",
          url: "/admin/project",
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
      items: [
        {
          title: "Manage Users",
          url: "/admin/users",
        },
      ],
    },
    {
      title: "Teams",
      url: "/admin/teams",
      icon: UsersRound,
      items: [
        {
          title: "Manage Teams",
          url: "/admin/teams",
        },
      ],
    },
  ],
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const http = useHttp()
  const [projects, setProjects] = React.useState<[]>([])

  const getProjects = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects`
      )

      if (response?.success) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  React.useEffect(() => {
    getProjects()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ProjectSwitcher projects={projects} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
