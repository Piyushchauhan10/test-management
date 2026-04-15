import React from 'react';
import type { GridRow } from '../../lib/types/grid';

interface GridFooterProps {
  totalRows: number;
  selectedCount: number;
  data: GridRow[];
}

const GridFooter: React.FC<GridFooterProps> = React.memo(({ totalRows, selectedCount, data }) => {
  const avgSalary = data.length ? Math.round(data.reduce((s, r) => s + r.salary, 0) / data.length) : 0;
  const avgAge = data.length ? Math.round(data.reduce((s, r) => s + r.age, 0) / data.length) : 0;

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t bg-card text-xs text-muted-foreground">
      <div className="flex gap-6">
        <span>Total: <strong className="text-foreground">{totalRows}</strong></span>
        <span>Selected: <strong className="text-foreground">{selectedCount}</strong></span>
      </div>
      <div className="flex gap-6">
        <span>Avg Salary: <strong className="text-foreground">${(avgSalary / 1000).toFixed(0)}k</strong></span>
        <span>Avg Age: <strong className="text-foreground">{avgAge}</strong></span>
      </div>
    </div>
  );
});

GridFooter.displayName = 'GridFooter';
export default GridFooter;
