import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import useHttp from "@/hooks/use-http"
import DefectComments from "@/components/projects/DefectComments"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

type Defect = {
  ID: string
  title: string
}

export default function DefectCommentsPage() {
  const { defectId } = useParams<{ defectId: string }>()
  const { sendRequest } = useHttp()

  const [defect, setDefect] = useState<Defect | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDefect = async () => {
      if (!defectId) return

      try {
        const res = await sendRequest(
          `${import.meta.env.VITE_BACKEND_API_URL}/Defects('${defectId}')`
        )
        setDefect(res?.data || null)
      } catch (error) {
        console.error("Failed to load defect details", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDefect()
  }, [defectId, sendRequest])

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Defect Comments</h2>
          {!loading && defect && (
            <p className="text-sm text-muted-foreground">{defect.title}</p>
          )}
        </div>

        <div className="flex gap-2">
          {defectId && (
            <Button variant="outline" asChild>
              {/* <Link to={`/admin/defects/${defectId}/edit`}>Edit Defect</Link> */}
            </Button>
          )}

          <Button asChild>
            <Link to="/admin/defects">Back</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading && <p>Loading...</p>}
        {!loading && defectId && <DefectComments defectId={defectId} />}
      </CardContent>
    </Card>
  )
}
