import TeamForm from "@/components/projects/TeamForm"
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
import { ArrowLeft, UsersRound, UserRoundPlus } from "lucide-react"
import { Link, useParams } from "react-router-dom"

const CreateTeam = () => {
  const { id } = useParams()
  const update = !!id
  const Icon = update ? UsersRound : UserRoundPlus

  return (
    <Card className="overflow-hidden border-slate-200/80 bg-white/95 py-0 shadow-sm shadow-slate-950/5 dark:border-slate-800/80 dark:bg-slate-950/85">
      <CardHeader className="border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 via-sky-50 to-white px-5 py-5 dark:border-slate-800/80 dark:from-emerald-950/30 dark:via-sky-950/20 dark:to-slate-950 sm:px-6">
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
                <Link to="/admin/teams">Teams</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{update ? "Edit Team" : "Add Team"}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                {update ? "Edit Team" : "Add Team"}
              </CardTitle>
              <CardDescription className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                {update
                  ? "Refine the team identity, ownership notes, and member view."
                  : "Create a focused team space for assignments and reporting."}
              </CardDescription>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/admin/teams">
              <ArrowLeft className="size-4" />
              Back to Teams
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-6 sm:px-6">
        <TeamForm update={update} teamId={id} />
      </CardContent>
    </Card>
  )
}

export default CreateTeam
