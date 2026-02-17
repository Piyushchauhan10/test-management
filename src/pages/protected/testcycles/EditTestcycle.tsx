import TestCycleForm from "@/components/projects/TestCycleForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { TestCycle } from "@/lib/types"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import useHttp from "@/hooks/use-http"

const EditTestCycle = () => {
  const { testCycleId, projectId, sprintId } = useParams<{
    testCycleId: string
    projectId: string
    sprintId: string
  }>()

  const http = useHttp()
  const [testCycle, setTestCycle] = useState<TestCycle | null>(null)
  const [loading, setLoading] = useState(true)

  const getTestCycleById = async (id: string) => {
    setLoading(true)
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles('${id}')`
      )

      if (response?.success) {
        setTestCycle(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch test cycle:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (testCycleId) {
      getTestCycleById(testCycleId)
    }
  }, [testCycleId])

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2 className="text-left">Edit Test Cycle</h2>

        <Button asChild variant="default">
          <Link
            to={`/admin/project/${projectId}/sprint/${sprintId}/test-cycles`}
          >
            Back
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {loading && (
          <p className="text-center">Loading test cycle...</p>
        )}

        {!loading && testCycle && (
          <TestCycleForm update={true} data={testCycle} />
        )}

        {!loading && !testCycle && (
          <p className="text-center text-red-500">
            Test Cycle not found
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default EditTestCycle
