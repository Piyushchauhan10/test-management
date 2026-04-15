export type Department = 'Engineering' | 'Marketing' | 'Sales' | 'HR' | 'Finance' | 'Design' | 'Operations';
export type Status = 'Active' | 'Inactive' | 'Pending';

export interface GridRow {
  id: string;
  name: string;
  email: string;
  department: Department;
  status: Status;
  salary: number;
  age: number;
  progress: number;
  joinedDate: string;
}

export interface EditingCell {
  rowId: string;
  columnId: string;
}

export const DEPARTMENTS: Department[] = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Design', 'Operations'];
export const STATUSES: Status[] = ['Active', 'Inactive', 'Pending'];
