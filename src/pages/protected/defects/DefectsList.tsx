import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import useHttp from "@/hooks/use-http"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table"

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
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import { ArrowUpDown, ChevronDown, MoreVertical } from "lucide-react"

type Defect = {
  ID: string
  title: string
  description: string
  severity: string
  status: string
  assignedTo_ID?: string | null
  targetCycle_ID?: string | null
  assignedTo?: {
    ID: string
    username: string
  } | null
  targetCycle?: {
    ID: string
    name: string
    project?: {
      ID: string
      name: string
    } | null
    sprint?: {
      ID: string
      name: string
    } | null
  } | null
}

const getColumns = (onDelete: (id: string) => void): ColumnDef<Defect>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Title <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severity",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "project",
    header: "Project",
    accessorFn: (row) => row.targetCycle?.project?.name ?? "N/A",
  },
  {
    id: "sprint",
    header: "Sprint",
    accessorFn: (row) => row.targetCycle?.sprint?.name ?? "N/A",
  },
  {
    id: "testCycle",
    header: "Test Cycle",
    accessorFn: (row) => row.targetCycle?.name ?? "N/A",
  },
  {
    id: "assignedTo",
    header: "Assigned To",
    accessorFn: (row) => row.assignedTo?.username ?? "Unassigned",
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/admin/defects/${row.original.ID}/comments`}>
              Comments
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to={`/admin/defects/${row.original.ID}/edit`}>Edit</Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="text-red-600 cursor-pointer"
            onClick={() => onDelete(row.original.ID)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export default function DefectsList() {
  const http = useHttp()

  const [defects, setDefects] = useState<Defect[]>([])
  const [loading, setLoading] = useState(true)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const fetchDefects = async () => {
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Defects?$expand=assignedTo,targetCycle($expand=project,sprint)`
      )

      const data = res?.data?.value || res?.data || []

      setDefects(data)
    } catch (error) {
      console.error("Failed to load defects", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDefects()
  }, [])

  const deleteHandler = async (id: string) => {
    try {
      await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Defects('${id}')`,
        { method: "DELETE" }
      )

      setDefects((prev) => prev.filter((d) => d.ID !== id))
    } catch (error) {
      console.error("Delete failed", error)
    }
  }

  const table = useReactTable({
    data: defects,
    columns: getColumns(deleteHandler),
    state: { sorting, columnFilters, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

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
              <BreadcrumbPage>Defects</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Defects</h2>

          <Button asChild>
            <Link to="/admin/defects/create">Add Defect</Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center py-4 gap-4">
          <Input
            placeholder="Filter title..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table.getColumn("title")?.setFilterValue(e.target.value)
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

        <Table>
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
                <TableCell colSpan={8} className="text-center">
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
