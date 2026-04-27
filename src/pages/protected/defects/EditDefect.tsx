import DefectForm from "@/components/projects/DefectForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Link, useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import useHttp from "@/hooks/use-http"

type Defect = {
  ID: string
  title: string
  description: string
  severity: string
  status: string
  assignedTo_ID?: string | null
  detectedCycle_ID?: string | null
  targetCycle_ID?: string | null
  assignedTo?: {
    ID: string
    username: string
  } | null
  targetCycle?: {
    ID: string
    project_ID: string
    sprint_ID: string
  } | null
  detectedCycle?: {
    ID: string
    project_ID: string
    sprint_ID: string
  } | null
}

const EditDefect = () => {
  const { defectId } = useParams<{ defectId: string }>()
  const http = useHttp()

  const [defect, setDefect] = useState<Defect | null>(null)
  const [loading, setLoading] = useState(true)

  const getDefect = async () => {
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Defects('${defectId}')?$expand=assignedTo,targetCycle,detectedCycle`
      )

      const data = res?.data
      if (data) setDefect(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (defectId) getDefect()
  }, [defectId])

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2>Edit Defect</h2>

        <Button asChild>
          <Link to="/admin/defects">Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        {loading && <p>Loading...</p>}
        {!loading && defect && (
          <div className="space-y-8">
            <DefectForm update={true} data={defect} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default EditDefect
