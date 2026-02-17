import { createContext, useContext, useState } from "react"

type ErrorContextType = {
  error: string | null
  setError: (msg: string | null) => void
}

const ErrorContext = createContext<ErrorContextType | null>(null)

export const ErrorProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string | null>(null)

  return (
    <ErrorContext.Provider value={{ error, setError }}>
      {children}
    </ErrorContext.Provider>
  )
}

export const useGlobalError = () => {
  const ctx = useContext(ErrorContext)
  if (!ctx) {
    throw new Error("useGlobalError must be used inside ErrorProvider")
  }
  return ctx
}
