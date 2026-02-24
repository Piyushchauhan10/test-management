import "./App.css"
import { useEffect } from "react"
import { useLocation, useRoutes } from "react-router-dom"

import Login from "@/pages/guest/Login"
import Admin from "@/pages/protected/Admin"
import Dashboard from "@/pages/protected/Dashboard"

import Project from "@/pages/protected/project/Project"
import ProjectDetail from "@/pages/protected/project/ProjectDetail"
import AddUpdatePage from "@/pages/protected/project/ProjectAddUpdate"

import CreateSprint from "@/pages/protected/sprints/CreateSprint"
import EditSprint from "@/pages/protected/sprints/EditSprint"
import SprintsDetail from "@/pages/protected/sprints/SprintsDetail"

import UsersList from "@/pages/protected/user/UserList"
import CreateUser from "@/pages/protected/user/CreateUser"

import TeamList from "@/pages/teams/TeamList"
import CreateTeam from "@/pages/teams/CreateTeam"

import TestCyclesDetail from "@/pages/protected/testcycles/TestcycleDetail"
import CreateTestCycle from "@/pages/protected/testcycles/CreateTestcycle"
import EditTestCycle from "@/pages/protected/testcycles/EditTestcycle"

import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"

import { useGlobalError } from "@/Context/ErrorContext"
import TestLibrary from "./pages/protected/test-library/TestLibrary"
import RequirementsList from "./pages/requirements/requirements"
import CreateRequirement from "./pages/requirements/RequirementAddUpdate"
import TestLibraryLayout from "./pages/protected/test-library/TestLibrary"


function App() {
  const location = useLocation()
  const { error, setError } = useGlobalError()


  useEffect(() => {
    setError(null)
    localStorage.setItem("previous_url", location.pathname)
  }, [location.pathname, setError])

  const routes = useRoutes([
    { path: "/sign-in", element: <Login /> },
    {
      path: "/admin",
      element: <Admin />,
      children: [
        { path: "dashboard", element: <Dashboard /> },


        { path: "project", element: <Project /> },
        { path: "project/create", element: <AddUpdatePage /> },
        { path: "project/edit/:id", element: <AddUpdatePage /> },
        { path: "project/:id/sprints", element: <ProjectDetail /> },


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


        {
          path: "project/:projectId/sprint/:sprintId/test-cycles",
          element: <TestCyclesDetail />,
        },
        {
          path: "project/:projectId/sprint/:sprintId/test-cycles/create",
          element: <CreateTestCycle />,
        },
        {
          path:
            "project/:projectId/sprint/:sprintId/test-cycles/:testCycleId/edit",
          element: <EditTestCycle />,
        },


        { path: "users", element: <UsersList /> },
        { path: "users/create", element: <CreateUser /> },
        { path: "users/create/:id", element: <CreateUser /> },

        { path: "requirements", element: <RequirementsList /> },
        { path: "requirements/create", element: < CreateRequirement /> },

        { path: "teams", element: <TeamList /> },
        { path: "teams/create", element: <CreateTeam /> },
        { path: "teams/create/:id", element: <CreateTeam /> },
        { path: "test-library", element: <TestLibrary /> },
      

      ],
    },
  ])

  return (
    <>

      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg px-4">
            <div className="relative rounded-xl border border-red-200 bg-white shadow-2xl">


              <div className="flex items-center gap-3 rounded-t-xl bg-red-50 px-5 py-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  ❗
                </div>
                <h2 className="text-lg font-semibold text-red-700">
                  Something went wrong
                </h2>
              </div>


              <div className="px-5 py-4">
                <p className="text-sm leading-relaxed text-gray-700">
                  {error}
                </p>
              </div>


              <div className="flex justify-end gap-3 rounded-b-xl bg-gray-50 px-5 py-3">
                <button
                  onClick={() => setError(null)}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                >
                  Dismiss
                </button>
              </div>


              <button
                onClick={() => setError(null)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {routes}
    </>
  )
}

export default App
