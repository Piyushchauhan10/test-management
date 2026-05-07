import UserForm from "@/components/projects/UserForm"
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
import { ArrowLeft, UserCog, UserPlus } from "lucide-react"
import { Link, useParams } from "react-router-dom"

const CreateUser = () => {
  const { id } = useParams()
  const update = Boolean(id)
  const Icon = update ? UserCog : UserPlus

  return (
    <Card className="overflow-hidden border-emerald-100/80 bg-white/95 shadow-sm shadow-emerald-950/5 dark:border-emerald-950/70 dark:bg-slate-950/80">
      <CardHeader className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 via-teal-50 to-white px-5 py-5 dark:border-emerald-950/70 dark:from-emerald-950/35 dark:via-teal-950/20 dark:to-slate-950 sm:px-6">
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
                <Link to="/admin/users">Users</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{update ? "Edit User" : "Add User"}</BreadcrumbPage>
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
                {update ? "Edit User" : "Add User"}
              </CardTitle>
              <CardDescription className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                {update
                  ? "Update account details, role permissions, and team assignment."
                  : "Create a teammate profile with the right role and team access."}
              </CardDescription>
            </div>
          </div>

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/admin/users">
              <ArrowLeft className="size-4" />
              Back to Users
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-5 py-6 sm:px-6">
        <UserForm update={update} userId={id} />
      </CardContent>
    </Card>
  )
}

export default CreateUser
