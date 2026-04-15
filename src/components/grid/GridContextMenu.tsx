import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Copy, Plus, Trash2 } from 'lucide-react';

interface GridContextMenuProps {
  children: React.ReactNode;
  onCopy: () => void;
  onInsertBelow: () => void;
  onDelete: () => void;
}

const GridContextMenu: React.FC<GridContextMenuProps> = ({ children, onCopy, onInsertBelow, onDelete }) => (
  <ContextMenu>
    <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
    <ContextMenuContent className="w-48">
      <ContextMenuItem onClick={onCopy}>
        <Copy className="mr-2 h-3.5 w-3.5" /> Copy Row
      </ContextMenuItem>
      <ContextMenuItem onClick={onInsertBelow}>
        <Plus className="mr-2 h-3.5 w-3.5" /> Insert Below
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Row
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);

export default GridContextMenu;
