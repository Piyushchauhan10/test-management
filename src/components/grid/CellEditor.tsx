import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENTS, STATUSES } from '../../lib/types/grid';

interface CellEditorProps {
  value: string | number;
  columnId: string;
  onSave: (value: string | number) => void;
  onCancel: () => void;
}

const CellEditor: React.FC<CellEditorProps> = React.memo(({ value, columnId, onSave, onCancel }) => {
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const finalValue = ['salary', 'age', 'progress'].includes(columnId) ? Number(editValue) : editValue;
      onSave(finalValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
    e.stopPropagation();
  }, [editValue, columnId, onSave, onCancel]);

  const handleBlur = useCallback(() => {
    const finalValue = ['salary', 'age', 'progress'].includes(columnId) ? Number(editValue) : editValue;
    onSave(finalValue);
  }, [editValue, columnId, onSave]);

  if (columnId === 'department') {
    return (
      <Select value={editValue} onValueChange={(v) => { onSave(v); }}>
        <SelectTrigger className="h-7 text-xs border-blue-500">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (columnId === 'status') {
    return (
      <Select value={editValue} onValueChange={(v) => { onSave(v); }}>
        <SelectTrigger className="h-7 text-xs border-blue-500">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  const isNumber = ['salary', 'age', 'progress'].includes(columnId);

  return (
    <Input
      ref={inputRef}
      type={isNumber ? "number" : "text"}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="
    h-7 text-xs
    border !border-blue-500
    focus:!border-blue-500
    focus:!ring-1 focus:!ring-blue-500
    bg-grid-cell-edit
  "
    />
  );
});

CellEditor.displayName = 'CellEditor';
export default CellEditor;
