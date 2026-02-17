import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

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

import { format } from "date-fns"
import useHttp from "@/hooks/use-http"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenuCheckboxItem } from "@radix-ui/react-dropdown-menu"

 
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type TestCycle = {
  ID: string
  Name: string
  startDate: string
  endDate: string
  project_ID: string
  sprint_ID: string
}
 
const getColumns = (
  onDelete: (id: string) => void
): ColumnDef<TestCycle>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Name <ArrowUpDown />
      </Button>
    ),
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) =>
      format(new Date(row.getValue("startDate")), "PPP"),
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) =>
      format(new Date(row.getValue("endDate")), "PPP"),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const id = row.original.ID

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
                to={`/admin/project/${row.original.project_ID}/sprint/${row.original.sprint_ID}/test-cycles/${id}/edit`}
              >
                Edit
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onDelete(id)
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

const TestCyclesDetail = () => {
  const { projectId, sprintId } = useParams<{
    projectId: string
    sprintId: string
  }>()

  const http = useHttp()

  const [testCycles, setTestCycles] = useState<TestCycle[]>([])
  const [loading, setLoading] = useState(true)

  const [projectName, setProjectName] = useState("")
  const [sprintName, setSprintName] = useState("")

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({})

   
  const getProjectName = async () => {
    const res = await http.sendRequest(
      `${import.meta.env.VITE_BACKEND_API_URL}/Projects('${projectId}')`
    )
    if (res?.success) setProjectName(res.data.name)
  }
 
  const getSprintName = async () => {
    const res = await http.sendRequest(
      `${import.meta.env.VITE_BACKEND_API_URL}/Sprints('${sprintId}')`
    )
    if (res?.success) setSprintName(res.data.name)
  }
 
  const getTestCycles = async () => {
    setLoading(true)
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles?$filter=project_ID eq '${projectId}' and sprint_ID eq '${sprintId}'`
      )

      if (res?.success) {
        setTestCycles(res.data)
      }
    } catch (err) {
      console.error("Fetch failed", err)
    } finally {
      setLoading(false)
    }
  }

  const deleteHandler = async (id: string) => {
    try {
      await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles('${id}')`,
        { method: "DELETE" }
      )
      toast.success("Test Cycle deleted")
      getTestCycles()
    } catch {
      toast.error("Delete failed")
    }
  }

  const table = useReactTable({
    data: testCycles,
    columns: getColumns(deleteHandler),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  useEffect(() => {
    if (projectId && sprintId) {
      getProjectName()
      getSprintName()
      getTestCycles()
    }
  }, [projectId, sprintId])

  if (loading) return <p className="p-4">Loading...</p>

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
              <BreadcrumbLink asChild>
                <Link to={`/admin/project/${projectId}/sprints`}>
                  {projectName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>
                {sprintName} {">"} Test Cycles
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

 
        <div className="flex justify-between">
          <h2 className="text-xl font-semibold">Test Cycles</h2>

          <div className="space-x-2">
            <Button asChild>
              <Link
                to={`/admin/project/${projectId}/sprint/${sprintId}/test-cycles/create`}
              >
                Create Test Cycle
              </Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to={`/admin/project/${projectId}/sprints`}>
                Back
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex py-4">
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
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) =>
                      column.toggleVisibility(!!v)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(
                      h.column.columnDef.header,
                      h.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-left">
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
                <TableCell colSpan={5} className="text-center">
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

export default TestCyclesDetail
