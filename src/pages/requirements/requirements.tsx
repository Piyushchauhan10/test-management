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

 
type Requirement = {
  ID: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  project_ID: string;
  sprint_ID?: string | null;
  project?: {
    ID: string;
    name: string;
  };
  sprint?: {
    ID: string;
    name: string;
  };
};

 
const getStatusStyle = (status: string) => {
  switch (status) {
    case "Approved":
      return "bg-green-100 text-green-700";
    case "Draft":
      return "bg-gray-100 text-gray-700";
    case "Rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-blue-100 text-blue-700";
  }
};

 
const getColumns = (
  onDelete: (id: string) => void
): ColumnDef<Requirement>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Title <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "priority",
    header: "Priority",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded text-sm font-medium ${getStatusStyle(
          row.original.status
        )}`}
      >
        {row.original.status}
      </span>
    ),
  },
  {
    id: "project",
    header: "Project",
    accessorFn: (row) => row.project?.name ?? "N/A",
  },
  {
    id: "sprint",
    header: "Sprint",
    accessorFn: (row) => row.sprint?.name ?? "N/A",
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
            <Link to={`/admin/requirements/create/${row.original.ID}`}>
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

 
export default function RequirementsList() {
  const http = useHttp();

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({});

 
  const fetchRequirements = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Requirements?$expand=project,sprint`
      );

      const data =
        response?.data?.value ||
        response?.data ||
        [];

      setRequirements(data);
    } catch (error) {
      console.error("Failed to load requirements", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);
 
  const deleteHandler = async (id: string) => {
    try {
      await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Requirements(${id})`,
        { method: "DELETE" }
      );

      setRequirements((prev) =>
        prev.filter((r) => r.ID !== id)
      );
    } catch (error) {
      console.error("Delete failed", error);
    }
  };
 
  const table = useReactTable({
    data: requirements,
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
  });

  if (loading)
    return <p className="p-4">Loading requirements...</p>;
 
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
              <BreadcrumbPage>Requirements</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            Requirements
          </h2>

          <Button asChild>
            <Link to="/admin/requirements/create">
              Add Requirement
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center py-4 gap-4">
          <Input
            placeholder="Filter title..."
            value={
              (table.getColumn("title")?.getFilterValue() as string) ??
              ""
            }
            onChange={(e) =>
              table
                .getColumn("title")
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

        <Table className="text-left">
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

          <TableBody className="text-left">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
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
                <TableCell colSpan={6} className="text-left">
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