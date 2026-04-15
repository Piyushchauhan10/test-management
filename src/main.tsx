import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from "@/components/provider/theme-provider"
import { Toaster } from "./components/ui/sonner"
import { ErrorProvider } from './Context/ErrorContext.tsx'
import { ProjectProvider } from './store/project-store.tsx'

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <ProjectProvider>
      <BrowserRouter>
        <ErrorProvider>
          <App />
        </ErrorProvider>
        <Toaster />
      </BrowserRouter>
    </ProjectProvider>
  </ThemeProvider>
)

