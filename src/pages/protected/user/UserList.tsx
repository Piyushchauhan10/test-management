import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useHttp from "@/hooks/use-http";

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
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { ArrowUpDown, ChevronDown, MoreVertical } from "lucide-react";

type User = {
  ID: string;
  username: string;
  email: string;
  role: string;
  team_ID?: string | null;
  team?: {
    ID: string;
    name: string;
  };
};

const getColumns = (onDelete: (id: string) => void): ColumnDef<User>[] => [
  {
    accessorKey: "username",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Username <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    id: "team",
    header: "Team",
    accessorFn: (row) => row.team?.name ?? "N/A",
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
            <Link to={`/admin/users/create/${row.original.ID}`}>
              Edit
            </Link>
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
];

export default function UsersList() {
  const http = useHttp();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});

  const getDeletedUsers = (): string[] =>
    JSON.parse(localStorage.getItem("deletedUsers") || "[]");

  const saveDeletedUser = (id: string) => {
    const deleted = getDeletedUsers();
    if (!deleted.includes(id)) {
      localStorage.setItem(
        "deletedUsers",
        JSON.stringify([...deleted, id])
      );
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users?$expand=team`
      );

      let usersData: User[] = [];

      if (Array.isArray(response?.data?.value)) {
        usersData = response.data.value;
      } else if (Array.isArray(response?.data)) {
        usersData = response.data;
      }

      const deletedIds = getDeletedUsers();

      setUsers(
        usersData.filter((u) => !deletedIds.includes(u.ID))
      );
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUserHandler = async (id: string) => {
    try {
      await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users/${id}`,
        { method: "DELETE" }
      );

      saveDeletedUser(id);
      setUsers((prev) =>
        prev.filter((u) => u.ID !== id)
      );
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const table = useReactTable({
    data: users,
    columns: getColumns(deleteUserHandler),
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
  });

  if (loading)
    return <p className="p-4">Loading users...</p>;

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
              <BreadcrumbPage>Users</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Users
          </h2>

          <Button asChild>
            <Link to="/admin/users/create">
              Add User
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>

        
        <div className="flex items-center py-4 gap-4">
          <Input
            placeholder="Filter username..."
            value={
              (table.getColumn("username")?.getFilterValue() as string) ??
              ""
            }
            onChange={(e) =>
              table
                .getColumn("username")
                ?.setFilterValue(e.target.value)
            }
            className="max-w-sm"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto"
              >
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
                  <TableHead
                    key={header.id}
                    className="text-left"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody
           className="text-left" >
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row
                    .getVisibleCells()
                    .map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="text-left align-middle"
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
                <TableCell
                  colSpan={5}
                  className="text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
