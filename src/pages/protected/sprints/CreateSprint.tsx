import SprintForm from '@/components/projects/SprintForm'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ListPlus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

const CreateSprint = () => {
    const { projectId } = useParams<{ projectId: string }>()

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
                                <Link to="/admin/project">Projects</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Add Sprint</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <ListPlus className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <CardTitle className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                                Add Sprint
                            </CardTitle>
                        </div>
                    </div>

                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link to={projectId ? `/admin/project/${projectId}/sprints` : "/admin/project"}>
                            <ArrowLeft className="size-4" />
                            Back to Sprints
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-5 py-6 sm:px-6">
                <SprintForm update={false} />
            </CardContent>
        </Card>
    )
}

export default CreateSprint
