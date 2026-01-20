import "./App.css"
import { useLocation, useRoutes } from "react-router-dom"

import Login from "@/pages/guest/Login"
import Admin from "@/pages/protected/Admin"
import Dashboard from "@/pages/protected/Dashboard"

import Project from "@/pages/protected/project/Project"
import ProjectDetail from "./pages/protected/project/ProjectDetail"
import AddUpdatePage from "./pages/protected/project/ProjectAddUpdate"

import CreateSprint from "./pages/protected/sprints/CreateSprint"
import EditSprint from "./pages/protected/sprints/EditSprint"
import SprintsDetail from "./pages/protected/sprints/SprintsDetail"

import AddAndUpdateTestCycles from "./pages/protected/testcycles/AddAndUpdateTestCycles"

import UsersList from "./pages/protected/user/UserList"
import CreateUser from "./pages/protected/user/CreateUser"

import TeamList from "./pages/teams/TeamList"
import CreateTeam from "./pages/teams/CreateTeam"
import { useEffect } from "react"

function App() {

  const location = useLocation()

  const routes = useRoutes([
    { path: "/sign-in", element: <Login /> },
    {
      path: "/admin",
      element: <Admin />,
      children: [
        { path: "dashboard", element: <Dashboard /> },

        /* ===== PROJECTS ===== */
        { path: "project", element: <Project /> },
        { path: "project/create", element: <AddUpdatePage /> },
        { path: "project/edit/:id", element: <AddUpdatePage /> },
        { path: "project/:id/sprints", element: <ProjectDetail /> },

        /* ===== SPRINTS ===== */
        {
          path: "project/:projectId/sprint/create",
          element: <CreateSprint />,
        },
        {
          path: "project/:projectId/sprint/:sprintId",
          element: <SprintsDetail />,
        },
        {
          path: "project/:projectId/sprint/:sprintId/edit",
          element: <EditSprint />,
        },

        /* ===== TEST CYCLES ===== */
        {
          path: "test-cycles/create/:projectId/:sprintId",
          element: <AddAndUpdateTestCycles />,
        },
        {
          path: "test-cycles/edit/:projectId/:sprintId/:testCycleId",
          element: <AddAndUpdateTestCycles />,
        },

        /* ===== USERS (SINGLE ADD / EDIT PAGE) ===== */
        { path: "users", element: <UsersList /> },
        { path: "users/create", element: <CreateUser /> },
        { path: "users/create/:id", element: <CreateUser /> },

        /* ===== TEAMS ===== */
        { path: "teams", element: <TeamList /> },
        { path: "teams/create", element: <CreateTeam /> },
        { path: "teams/create/:id", element: <CreateTeam /> },
      ],
    },
  ])

  useEffect(() => {
    localStorage.setItem("previous_url",location.pathname)
  },[location.pathname])

  return routes
}

export default App



// As we discussed

// Global State for Project with local storage    DONE
// Project switcher should change the global project   DONE
// Breadcrumbs and description for current project and sprint   DONE
// Show backend errors with alert component.
// User Module and Teams module.     DONE
// User assignment to Teams   DONE
// Add “Admin” option to user to open completely different admin layout    DONE
// Admin Layout     DONE
// Projects  - Manage Projects    DONE
// Users – Manage Users   DONE
// Teams – Manage Teams   DONE