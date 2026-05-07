import RequirementForm from "@/components/projects/RequirementForm"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft, ClipboardPenLine } from "lucide-react"
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
                <Link to="/admin/requirements">Requirements</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Requirement</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ClipboardPenLine className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                Edit Requirement
              </CardTitle>
              <CardDescription className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Refine scope, priority, status, and sprint placement.
              </CardDescription>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/admin/requirements">
              <ArrowLeft className="size-4" />
              Back to Requirements
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-6 sm:px-6">
        {loading && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            Loading requirement...
          </div>
        )}

        {!loading && requirement && (
          <RequirementForm update={true} data={requirement} />
        )}
      </CardContent>
    </Card>
  )
}

export default EditRequirement
