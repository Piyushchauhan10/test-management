import React, { useEffect, useState } from "react"
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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

type Team = {
  ID: string
  name: string
  description?: string
}

type User = {
  ID: string
  username: string
  team_ID: string
}

export default function TeamsList() {
  const http = useHttp()

  const [teams, setTeams] = useState<Team[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedTeamName, setSelectedTeamName] = useState("")
  const [loading, setLoading] = useState(true)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({})

  
  const fetchTeams = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams`
      )

      let teamData: Team[] = []

      if (Array.isArray(response?.data)) {
        teamData = response.data
      } else if (Array.isArray(response?.data?.value)) {
        teamData = response.data.value
      }

      setTeams(teamData)
    } catch (error) {
      console.error("Failed to load teams", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeams()
  }, [])

 
  const fetchTeamUsers = async (teamId: string, teamName: string) => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users?$filter=team_ID eq '${teamId}'`
      )

      let userData: User[] = []

      if (Array.isArray(response?.data)) {
        userData = response.data
      } else if (Array.isArray(response?.data?.value)) {
        userData = response.data.value
      }

      setUsers(userData)
      setSelectedTeamName(teamName)
      setOpenDialog(true)
    } catch (error) {
      console.error("Failed to load users", error)
    }
  }

  const deleteTeamHandler = async (id: string) => {
    try {
      await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${id}`,
        "DELETE"
      )
      setTeams((prev) => prev.filter((t) => t.ID !== id))
    } catch (error) {
      console.error("Delete failed", error)
    }
  }

 
  const columns: ColumnDef<Team>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          Team Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      id: "users",
      header: "Users",
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            fetchTeamUsers(row.original.ID, row.original.name)
          }
        >
          Show Users
        </Button>
      ),
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

          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link to={`/admin/teams/create/${row.original.ID}`}>
                Edit
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-red-600"
              onClick={() => deleteTeamHandler(row.original.ID)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data: teams,
    columns,
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

  if (loading) return <p className="p-4">Loading teams...</p>

  return (
    <>
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
                <BreadcrumbPage>Teams</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Teams</h2>
            <Button asChild>
              <Link to="/admin/teams/create">Add Team</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
       
          <div className="flex items-center py-4 gap-4">
            <Input
              placeholder="Filter team name..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ??
                ""
              }
              onChange={(e) =>
                table
                  .getColumn("name")
                  ?.setFilterValue(e.target.value)
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
                    <TableHead key={header.id} className="text-left">
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
                      <TableCell
                        key={cell.id}
                        className="text-left"
                      >
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
                  <TableCell colSpan={4} className="text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Users in {selectedTeamName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.ID}
                  className="p-2 border rounded-md text-sm"
                >
                  {user.username}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">
                No users found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}