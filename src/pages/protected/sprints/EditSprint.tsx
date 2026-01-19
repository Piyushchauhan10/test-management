import SprintForm from "@/components/projects/SprintForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { Sprint } from "@/lib/types"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import useHttp from "@/hooks/use-http"

const EditSprint = () => {
  const { sprintId, projectId, } = useParams<{
    sprintId: string
    projectId: string
  }>()

  const http = useHttp()
  const [sprint, setSprint] = useState<Sprint | null>(null)
  const [loading, setLoading] = useState(true)


  const getSprintById = async (id: string) => {
    setLoading(true)
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Sprints('${id}')`
      )

      if (response?.success) {
        setSprint(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch sprint:", error)
    } finally {
      setLoading(false)
    }
  }

  /* ===================== EFFECT ===================== */

  useEffect(() => {
    if (sprintId) {
      getSprintById(sprintId)
    }
  }, [sprintId])

  /* ===================== UI ===================== */

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2 className="text-left">Edit Sprint</h2>
        <Button asChild variant="default">
          <Link to={`/admin/project/${projectId}`}>Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {loading && <p className="text-center">Loading sprint...</p>}

        {!loading && sprint && (
          <SprintForm update={true} data={sprint} />
        )}

        {!loading && !sprint && (
          <p className="text-center text-red-500">
            Sprint not found
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default EditSprint
