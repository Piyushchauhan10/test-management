import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import useHttp from "@/hooks/use-http"
import DefectComments from "@/components/projects/DefectComments"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, MessagesSquare } from "lucide-react"

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
    <Card className="overflow-hidden border-slate-200/80 bg-white/95 py-0 shadow-sm shadow-slate-950/5 dark:border-slate-800/80 dark:bg-slate-950/85">
      <CardHeader className="border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-white px-5 py-5 dark:border-slate-800/80 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-950 sm:px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin/defects">Defects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Comments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <MessagesSquare className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                Defect Comments
              </CardTitle>
              {!loading && defect && (
                <p className="mt-1 truncate text-sm text-slate-600 dark:text-slate-400">
                  {defect.title}
                </p>
              )}
            </div>
          </div>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/admin/defects">
              <ArrowLeft className="size-4" />
              Back to Defects
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-6 sm:px-6">
        {loading && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            Loading defect comments...
          </div>
        )}
        {!loading && defectId && <DefectComments defectId={defectId} />}
      </CardContent>
    </Card>
  )
}
