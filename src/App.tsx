import './App.css'
import { Route, useRoutes } from "react-router-dom";
import Login from '@/pages/guest/Login';
import Admin from '@/pages/protected/Admin';
import Dashboard from '@/pages/protected/Dashboard';
import Project from '@/pages/protected/project/Project';
import ProjectDetail from './pages/protected/project/ProjectDetail';
import AddUpdatePage from './pages/protected/project/ProjectAddUpdate';
import CreateSprint from './pages/protected/sprints/CreateSprint';
import EditSprint from './pages/protected/sprints/EditSprint';
import AddAndUpdateTestCycles from './pages/protected/testcycles/AddAndUpdateTestCycles';
import SprintsDetail from './pages/protected/sprints/SprintsDetail';
import UsersList from "./pages/protected/user/UserList";
import CreateUser from "./pages/protected/user/CreateUser";
import TeamList from './pages/teams/TeamList';
import CreateTeam from './pages/teams/CreateTeam';


function App() {
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
        { path: "project/:projectId/sprint/create", element: <CreateSprint /> },
        { path: "project/:projectId/sprint/:sprintId", element: <SprintsDetail /> },
        { path: "project/:projectId/sprint/:sprintId/edit", element: <EditSprint /> },
        { path: "test-cycles/create/:projectId/:sprintId", element: <AddAndUpdateTestCycles /> },
        { path: "test-cycles/edit/:projectId/:sprintId/:testCycleId", element: <AddAndUpdateTestCycles /> },
        { path: "users", element: <UsersList /> },
        { path: "users/create", element: <CreateUser /> },
        { path: "teams", element: <TeamList />, },
        { path: "teams/create", element: <CreateTeam /> },



      ]
    }
  ]);

  return routes
}

export default App
