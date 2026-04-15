import React from 'react';

const ProgressCell: React.FC<{ value: number }> = React.memo(({ value }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-blue-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
    <span className="text-[10px] text-muted-foreground w-8 text-right">{value}%</span>
  </div>
));

ProgressCell.displayName = 'ProgressCell';
export default ProgressCell;
