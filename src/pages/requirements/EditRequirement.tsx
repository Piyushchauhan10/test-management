import RequirementForm from "@/components/projects/RequirementForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import useHttp from "@/hooks/use-http"

type Requirement = {
  ID: string
  title: string
  description: string
  priority: string
  status: string
  project_ID: string
  sprint_ID?: string | null
}

const EditRequirement = () => {
  const { requirementId } = useParams<{ requirementId: string }>()
  const http = useHttp()

  const [requirement, setRequirement] =
    useState<Requirement | null>(null)

  const [loading, setLoading] = useState(true)

  const getRequirement = async () => {
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Requirements('${requirementId}')`
      )

      const data = res?.data

      if (data) {
        setRequirement(data)
      }
    } catch (error) {
      console.error("Failed to fetch requirement", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (requirementId) {
      getRequirement()
    }
  }, [requirementId])

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2>Edit Requirement</h2>

        <Button asChild>
          <Link to="/admin/requirements">Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {loading && <p>Loading...</p>}

        {!loading && requirement && (
          <RequirementForm update={true} data={requirement} />
        )}
      </CardContent>
    </Card>
  )
}

export default EditRequirement