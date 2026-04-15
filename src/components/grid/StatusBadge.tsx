import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { Status } from '../../lib/types/grid';
import { cn } from '@/lib/utils';

const statusStyles: Record<Status, string> = {
  Active: 'bg-green-500/15 text-green-500 border-green-500/30 hover:bg-green-500/20',
  Inactive: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20',
  Pending: 'bg-orange-500/15 text-orange-500 border-orange-500/30 hover:bg-orange-500/20',
};

const StatusBadge: React.FC<{ status: Status }> = React.memo(({ status }) => (
  <Badge variant="outline" className={cn('text-[10px] font-medium px-2 py-0.5', statusStyles[status])}>
    {status}
  </Badge>
));

StatusBadge.displayName = 'StatusBadge';
export default StatusBadge;
