import React, { useEffect, useState } from "react"
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

/* ===== SHADCN BREADCRUMB ===== */
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type TestCycle = {
  title: string
  startDate: string
  endDate: string
  status: string
  project_ID: string
  sprint_ID: string
  ID: string
}

/* ===== TABLE COLUMNS ===== */
const getColumns = (onDelete: (id: string) => void): ColumnDef<any>[] => [
  {
    accessorKey: "ID",
    header: "ID",
    cell: ({ row }) =>
      (row.getValue("ID") as string)?.split("-")?.[4],
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Title <ArrowUpDown />
      </Button>
    ),
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
      const id = row.original.ID as string

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
                to={`/admin/test-cycles/edit/${row.original.project_ID}/${row.original.sprint_ID}/${row.original.ID}`}
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

export default function SprintsDetail() {
  const { projectId, sprintId } = useParams<{
    projectId: string
    sprintId: string
  }>()

  const httpHook = useHttp()

  const [testCycles, setTestCycles] = useState<TestCycle[]>([])
  const [loading, setLoading] = useState(true)

  const [projectName, setProjectName] = useState("")
  const [sprintName, setSprintName] = useState("")

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({})

  /* ===== FETCH PROJECT NAME (FIXED) ===== */
  const getProjectName = async () => {
    try {
      const res = await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects('${projectId}')`
      )

      if (res?.success && res.data?.name) {
        setProjectName(res.data.name)
      }
    } catch (error) {
      console.error("Failed to fetch project name", error)
    }
  }

  /* ===== FETCH SPRINT NAME (FIXED) ===== */
  const getSprintName = async () => {
    try {
      const res = await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Sprints('${sprintId}')`
      )

      if (res?.success && res.data?.name) {
        setSprintName(res.data.name)
      }
    } catch (error) {
      console.error("Failed to fetch sprint name", error)
    }
  }

  /* ===== FETCH TEST CYCLES ===== */
  const getTestCycles = async () => {
    try {
      const response = await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles?$filter=project_ID eq '${projectId}' and sprint_ID eq '${sprintId}'`
      )

      if (response?.success) {
        setTestCycles(response.data)
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to fetch test cycles:", error)
    }
  }

  const deleteTestCycleHandler = async (id: string) => {
    try {
      await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles('${id}')`,
        { method: "DELETE" }
      )

      toast.success("Test Cycle deleted successfully")
      await getTestCycles()
    } catch {
      toast.error("Failed to delete test cycles")
    }
  }

  const table = useReactTable({
    data: testCycles,
    columns: getColumns(deleteTestCycleHandler),
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

  useEffect(() => {
    if (projectId && sprintId) {
      getProjectName()
      getSprintName()
      getTestCycles()
    }
  }, [projectId, sprintId])

  if (loading) return <p className="p-4">Loading data...</p>

  return (
    <Card>
      <CardHeader className="space-y-4">
        {/* ===== BREADCRUMB ===== */}
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
              <BreadcrumbLink asChild>
                <Link to={`/admin/project/${projectId}/sprints`}>
                  {sprintName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>Test Cycles</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* ===== HEADER ===== */}
        <div className="flex justify-between items-start">
          <h2 className="text-xl font-semibold">Test Cycles</h2>

          <div className="space-x-2">
            <Button asChild>
              <Link
                to={`/admin/test-cycles/create/${projectId}/${sprintId}`}
              >
                Create Test Cycles
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
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter title..."
            value={
              (table.getColumn("title")?.getFilterValue() as string) ??
              ""
            }
            onChange={(e) =>
              table.getColumn("title")?.setFilterValue(e.target.value)
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
                <TableCell colSpan={6} className="text-center">
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
