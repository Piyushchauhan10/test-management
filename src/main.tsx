import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from "@/components/provider/theme-provider"
import { Toaster } from "./components/ui/sonner"

createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </ThemeProvider>
)
