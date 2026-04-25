import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  RowSelectionState,
  GroupingState,
  ExpandedState,
  ColumnResizeMode,
  VisibilityState
} from '@tanstack/react-table';

import type { GridRow, EditingCell } from '../../lib/types/grid';
import { generateMockData, createEmptyRow } from '@/lib/mock-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';
import CellEditor from './CellEditor';
import StatusBadge from './StatusBadge';
import AvatarCell from './AvatarCell';
import ProgressCell from './ProgressCell';
import GridContextMenu from './GridContextMenu';
import GridFooter from './GridFooter';
import GridToolbar from './GridToolbar';
import { toast } from 'sonner';

const columnHelper = createColumnHelper<GridRow>();

const DataGrid: React.FC = () => {
  const [data, setData] = useState<GridRow[]>(() => generateMockData(250));
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [grouping, setGrouping] = useState<GroupingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [showFilters, setShowFilters] = useState(true);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [flashedCells, setFlashedCells] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

  const flashCell = useCallback((rowId: string, colId: string) => {
    const key = `${rowId}-${colId}`;
    setFlashedCells(prev => new Set(prev).add(key));
    setTimeout(() => setFlashedCells(prev => { const n = new Set(prev); n.delete(key); return n; }), 1000);
  }, []);

  const updateCell = useCallback((rowId: string, columnId: string, value: string | number) => {
    setData(prev => prev.map(row => row.id === rowId ? { ...row, [columnId]: value } : row));
    flashCell(rowId, columnId);
    setEditingCell(null);
  }, [flashCell]);

  const addRow = useCallback(() => {
    const newRow = createEmptyRow();
    setData(prev => [newRow, ...prev]);
    toast.success('Row added');
  }, []);

  const deleteRows = useCallback((ids: string[]) => {
    setData(prev => prev.filter(r => !ids.includes(r.id)));
    setRowSelection({});
    toast.success(`${ids.length} row(s) deleted`);
  }, []);

  const insertBelow = useCallback((rowId: string) => {
    const newRow = createEmptyRow();
    setData(prev => {
      const idx = prev.findIndex(r => r.id === rowId);
      const copy = [...prev];
      copy.splice(idx + 1, 0, newRow);
      return copy;
    });
  }, []);

  const copyRow = useCallback((row: GridRow) => {
    const text = Object.values(row).join('\t');
    navigator.clipboard.writeText(text).then(() => toast.success('Row copied'));
  }, []);

  const selectedCount = Object.keys(rowSelection).length;

  const deleteSelected = useCallback(() => {
    const ids = Object.keys(rowSelection);
    if (ids.length) deleteRows(ids);
  }, [rowSelection, deleteRows]);

  const groupByValue = grouping.length > 0 ? grouping[0] : 'none';
  const handleGroupByChange = useCallback((val: string) => {
    setGrouping(val === 'none' ? [] : [val]);
    setExpanded({});
  }, []);

  const columns = useMemo<ColumnDef<GridRow, any>[]>(() => [
    {
      id: 'select',
      size: 40,
      enableResizing: false,
      header: ({ table }) => (
        <Checkbox
           className="border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:text-white"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
           className="border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 data-[state=checked]:text-white"
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    columnHelper.accessor('name', {
      header: 'Name',
      size: 200,
      cell: info => <AvatarCell name={info.getValue()} />,
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      size: 220,
      cell: info => <span className="text-muted-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      size: 140,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      size: 110,
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
    columnHelper.accessor('salary', {
      header: 'Salary',
      size: 100,
      cell: info => <span className="font-mono">${(info.getValue() / 1000).toFixed(0)}k</span>,
    }),
    columnHelper.accessor('age', {
      header: 'Age',
      size: 70,
      cell: info => <span className="font-mono">{info.getValue()}</span>,
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      size: 150,
      cell: info => <ProgressCell value={info.getValue()} />,
    }),
    columnHelper.accessor('joinedDate', {
      header: 'Joined',
      size: 110,
      cell: info => <span className="text-muted-foreground">{info.getValue()}</span>,
    }),
  ], []);

  const toggleableColumns = useMemo(() => [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email' },
    { id: 'department', label: 'Department' },
    { id: 'status', label: 'Status' },
    { id: 'salary', label: 'Salary' },
    { id: 'age', label: 'Age' },
    { id: 'progress', label: 'Progress' },
    { id: 'joinedDate', label: 'Joined' },
  ], []);

  const handleColumnVisibilityChange = useCallback((colId: string, visible: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [colId]: visible }));
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection, grouping, expanded, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGroupingChange: setGrouping,
    onExpandedChange: setExpanded,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (row) => row.id,
    enableRowSelection: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange' as ColumnResizeMode,
  });

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingCell) return;
      if (e.key === 'Delete' && selectedCount > 0) {
        deleteSelected();
      }
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedCount > 0) {
        const id = Object.keys(rowSelection)[0];
        const row = data.find(r => r.id === id);
        if (row) copyRow(row);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingCell, selectedCount, rowSelection, data, deleteSelected, copyRow]);

  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col h-screen bg-background">
      <GridToolbar
        selectedCount={selectedCount}
        groupBy={groupByValue}
        onGroupByChange={handleGroupByChange}
        onAddRow={addRow}
        onDeleteSelected={deleteSelected}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        columns={toggleableColumns}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(prev => !prev)}
      />

      <div className="flex-1 overflow-auto" ref={tableRef}>
        <table className="w-full border-collapse text-xs" style={{ minWidth: table.getTotalSize() }}>
          <thead className="sticky top-0 z-10 bg-white">
            {table.getHeaderGroups().map(headerGroup => (
              <React.Fragment key={headerGroup.id}>
                <tr className="bg-grid-header border-b bg-white">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="relative text-left px-3 py-2 font-semibold text-muted-foreground select-none"
                      style={{ width: header.getSize() }}
                    >
                      {!header.isPlaceholder && (
                        <div
                          className="flex items-center gap-1 cursor-pointer hover:text-foreground transition-colors"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && <ArrowUp className="h-3 w-3" />}
                          {header.column.getIsSorted() === 'desc' && <ArrowDown className="h-3 w-3" />}
                          {!header.column.getIsSorted() && header.column.getCanSort() && (
                            <ArrowUpDown className="h-3 w-3 opacity-30" />
                          )}
                        </div>
                      )}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 active:bg-primary"
                        />
                      )}
                    </th>
                  ))}
                </tr>
                {/* Filter row */}
                {showFilters && <tr className="bg-grid-header border-b">
                  {headerGroup.headers.map(header => (
                    <th key={`filter-${header.id}`} className="px-2  mt-4 py-1">
                      {header.column.getCanFilter() && header.id !== 'select' ? (
                        <Input
                          placeholder="Filter..."
                          value={(header.column.getFilterValue() as string) ?? ''}
                          onChange={e => header.column.setFilterValue(e.target.value || undefined)}
                          className="h-6 text-[10px] bg-card"
                        />
                      ) : null}
                    </th>
                  ))}
                </tr>}
              </React.Fragment>
            ))}
          </thead>
          <tbody>
            {rows.map(row => {
              if (row.getIsGrouped()) {
                return (
                  <tr key={row.id} className="bg-muted/50 border-b">
                    <td colSpan={columns.length} className="px-3 py-2">
                      <button
                        onClick={() => row.toggleExpanded()}
                        className="flex items-center gap-1.5 font-semibold text-foreground text-xs"
                      >
                        {row.getIsExpanded() ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {String(row.groupingValue)} ({row.subRows.length})
                      </button>
                    </td>
                  </tr>
                );
              }

              const isSelected = row.getIsSelected();
              return (
                <GridContextMenu
                  key={row.id}
                  onCopy={() => copyRow(row.original)}
                  onInsertBelow={() => insertBelow(row.original.id)}
                  onDelete={() => deleteRows([row.original.id])}
                >
                  <tr
                    className={`border-b transition-colors ${isSelected ? 'bg-grid-row-selected' : 'hover:bg-grid-row-hover'}`}
                  >
                    {row.getVisibleCells().map(cell => {
                      const isEditing = editingCell?.rowId === row.original.id && editingCell?.columnId === cell.column.id;
                      const isFlashed = flashedCells.has(`${row.original.id}-${cell.column.id}`);
                      const canEdit = cell.column.id !== 'select';

                      return (
                        <td
                          key={cell.id}
                          className={`px-3 py-1.5 ${isFlashed ? 'cell-flash' : ''}`}
                          style={{ width: cell.column.getSize() }}
                          onDoubleClick={() => {
                            if (canEdit) setEditingCell({ rowId: row.original.id, columnId: cell.column.id });
                          }}
                        >
                          {isEditing ? (
                            <CellEditor
                              value={row.original[cell.column.id as keyof GridRow] as string | number}
                              columnId={cell.column.id}
                              onSave={(v) => updateCell(row.original.id, cell.column.id, v)}
                              onCancel={() => setEditingCell(null)}
                            />
                          ) : (
                            flexRender(cell.column.columnDef.cell, cell.getContext())
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </GridContextMenu>
              );
            })}
          </tbody>
        </table>
      </div>

      <GridFooter totalRows={data.length} selectedCount={selectedCount} data={data} />
    </div>
  );
};

export default DataGrid;
