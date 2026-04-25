import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Columns3, SlidersHorizontal, Filter } from 'lucide-react';

interface ColumnVisibility {
  [key: string]: boolean;
}

interface GridToolbarProps {
  selectedCount: number;
  groupBy: string;
  onGroupByChange: (value: string) => void;
  onAddRow: () => void;
  onDeleteSelected: () => void;
  columnVisibility: ColumnVisibility;
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  columns: { id: string; label: string }[];
  showFilters: boolean;
  onToggleFilters: () => void;
}

const GridToolbar: React.FC<GridToolbarProps> = React.memo(({
  selectedCount, groupBy, onGroupByChange, onAddRow, onDeleteSelected,
  columnVisibility, onColumnVisibilityChange, columns, showFilters, onToggleFilters,
}) => (
  <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
    <div className="flex items-center gap-2">
      <h1 className="text-lg font-semibold text-foreground mr-4">Data Grid</h1>
      <Button size="sm" onClick={onAddRow} className="gap-1.5 bg-blue-500 hover:bg-blue-600 cursor-pointer">
        <Plus className="h-3.5 w-3.5" /> Add Row
      </Button>
      {selectedCount > 0 && (
        <Button size="sm" variant="destructive" onClick={onDeleteSelected} className="gap-1.5">
          <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedCount})
        </Button>
      )}
    </div>
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={showFilters ? 'default' : 'outline'}
        onClick={onToggleFilters}
        className="gap-1.5 h-8 text-xs bg-blue-500 hover:bg-blue-600 cursor-pointer"
      >
        <Filter className="h-3.5 w-3.5" />
        Filters
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Columns
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="end">
          <div className="space-y-1">
            {columns.map(col => (
              <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-xs">
                <Checkbox
                  checked={columnVisibility[col.id] !== false}
                  onCheckedChange={(v) => onColumnVisibilityChange(col.id, !!v)}
                />
                {col.label}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Columns3 className="h-4 w-4 text-muted-foreground" />
      <Select value={groupBy} onValueChange={onGroupByChange}>
        <SelectTrigger className="w-40 h-8 text-xs">
          <SelectValue placeholder="Group by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No grouping</SelectItem>
          <SelectItem value="department">Department</SelectItem>
          <SelectItem value="status">Status</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
));

GridToolbar.displayName = 'GridToolbar';
export default GridToolbar;
