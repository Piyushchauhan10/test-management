import React from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Link } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import useHttp from '@/hooks/use-http'
import { format } from "date-fns"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react'
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
  type VisibilityState
} from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"



const getColumns = (onDelete: (id: string) => void): ColumnDef<any>[] => [
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
      const projectId = row.original.ID as string

      return (
        <Link
          to={`/admin/project/${projectId}/sprints`}
          className="text-black hover:underline cursor-pointer font-medium"
        >
          {row.getValue("name")}
        </Link>
      )
    },
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "createdBy",
    header: "Created By",
  },
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
      const projectId = row.original.ID as string

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 bg-zinc-300">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/admin/project/${projectId}/sprints`}>
                View
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to={`/admin/project/edit/${projectId}`}>
                Edit
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onDelete(projectId)
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



const Project = () => {
  const httpHook = useHttp()

  const [projects, setProjects] = React.useState<any[]>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})


  const getProjects = async () => {
    try {
      const response = await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects`
      )

      if (response?.success) {
        setProjects(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
      toast.error("Failed to fetch projects")
    }
  }

  React.useEffect(() => {
    getProjects()
  }, [])


  const deleteProjectHandler = async (project_ID: string) => {
    try {
      await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects('${project_ID}')`,
        { method: "DELETE" }
      )

      toast.success("Project deleted successfully")
      await getProjects()
    } catch (error) {
      toast.error("Failed to delete project")
    }
  }


  const table = useReactTable({
    data: projects,
    columns: getColumns(deleteProjectHandler),
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
              <BreadcrumbPage>Projects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold">Projects</h2>

          <Button asChild>
            <Link to="/admin/project/create">Add Project</Link>
          </Button>
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

export default Project
