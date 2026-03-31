import DefectForm from "@/components/projects/DefectForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import useHttp from "@/hooks/use-http"

type Defect = {
  ID: string
  title: string
  description: string
  severity: string
  status: string
}

const EditDefect = () => {
  const { defectId } = useParams<{ defectId: string }>()
  const http = useHttp()

  const [defect, setDefect] = useState<Defect | null>(null)
  const [loading, setLoading] = useState(true)

  const getDefect = async () => {
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Defects('${defectId}')`
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
          <DefectForm update={true} data={defect} />
        )}
      </CardContent>
    </Card>
  )
}

export default EditDefect