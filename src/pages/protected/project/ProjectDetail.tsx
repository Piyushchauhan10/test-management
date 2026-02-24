import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link, useParams } from "react-router-dom"
import useHttp from "@/hooks/use-http"
import { format } from "date-fns"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { toast } from "sonner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

 
const getColumns = (
  projectId: string,
  onDelete: (id: string) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const sprint_ID = row.original.ID as string

      return (
        <Link
          to={`/admin/project/${projectId}/sprint/${sprint_ID}`}
          className="text-black hover:underline cursor-pointer font-medium"
        >
          {row.getValue("name")}
        </Link>
      )
    },
  },
  { accessorKey: "startDate", header: "Start Date" },
  { accessorKey: "endDate", header: "End Date" },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) =>
      format(new Date(row.getValue("createdAt")), "PPP"),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const sprint_ID = row.original.ID as string

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 bg-zinc-300">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                to={`/admin/project/${projectId}/sprint/${sprint_ID}`}
              >
                View Test Cycles
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                to={`/admin/project/${projectId}/sprint/${sprint_ID}/edit`}
              >
                Edit
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onDelete(sprint_ID)
              }}
              className="text-red-600 cursor-pointer"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

 

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const httpHook = useHttp()

  const [sprints, setSprints] = React.useState<any[]>([])
  const [projectName, setProjectName] = React.useState<string>("")

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})

  /* Fetch Project Details */
  const getProjectDetails = async () => {
    try {
      const response = await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects('${id}')`
      )

      if (response?.success) {
        setProjectName(response.data.name)
      }
    } catch (error) {
      console.error("Failed to fetch project details", error)
    }
  }

 
  const getSprintById = async () => {
    try {
      const response = await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Sprints?$filter=project_ID eq '${id}'`
      )

      if (response?.success) {
        setSprints(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch sprints:", error)
    }
  }

  React.useEffect(() => {
    if (id) {
      getSprintById()
      getProjectDetails()
    }
  }, [id])
 
  const deleteSprintHandler = async (sprint_ID: string) => {
    try {
      await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Sprints('${sprint_ID}')`,
        { method: "DELETE" }
      )

      toast.success("Sprint deleted successfully")
      await getSprintById()
    } catch {
      toast.error("Failed to delete sprint")
    }
  }

  const table = useReactTable({
    data: sprints,
    columns: getColumns(id!, deleteSprintHandler),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <Card>
      <CardHeader className="space-y-4">

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
              <BreadcrumbPage>Sprints</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold">
            {projectName}
          </h2>

          <div className="space-x-2">
            <Button asChild>
              <Link to={`/admin/project/${id}/sprint/create`}>
                Create Sprint
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to={`/admin/project`}>Back</Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter name..."
            value={
              (table.getColumn("name")?.getFilterValue() as string) ?? ""
            }
            onChange={(e) =>
              table.getColumn("name")?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Table className="text-left">
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
