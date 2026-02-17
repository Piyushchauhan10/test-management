import { useState, useCallback } from "react"
import { useGlobalError } from "../Context/ErrorContext"

const useHttp = () => {
  const [data, setData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>({})

  // ⭐ STEP 3: Global error setter
  const { setError: setGlobalError } = useGlobalError()

  const sendRequest = useCallback(
    async (url: string, options: any = {}) => {
      setLoading(true)
      setError({})
      setGlobalError(null) // clear old global error

      try {
        const response = await fetch(url, {
           ...options,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
         
        })

        // ✅ HANDLE DELETE / 204 NO CONTENT
        if (response.status === 204) {
          const result = {
            success: true,
            data: null,
            message: "Deleted successfully",
          }
          setData(result)
          return result
        }

        const result = await response.json().catch(() => null)

        // ❌ BACKEND ERROR (400 / 500)
        if (!response.ok) {
          const message =
            result?.error?.message ||
            result?.message ||
            "Request failed"

          // ⭐ STEP 3: STORE BACKEND ERROR GLOBALLY
          setGlobalError(message)

          throw new Error(message)
        }

        const value = result?.value ?? result

        const finalResult = {
          success: true,
          data: value,
          message: "Data fetched successfully",
        }

        setData(finalResult)
        return finalResult
      } catch (err: any) {
        const message = err?.message || "Network / Server error"

        const errorResult = {
          success: false,
          data: [],
          message,
        }

        // ⭐ STEP 3: STORE ERROR GLOBALLY
        setGlobalError(message)

        setError(errorResult)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [setGlobalError]
  )

  return { data, loading, error, sendRequest }
}

export default useHttp
