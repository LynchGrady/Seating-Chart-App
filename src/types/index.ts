export interface Student {
  id: string;
  name: string;
  isLocked: boolean;
  tableId: string | null;
  position: { x: number; y: number };
}

export interface Table {
  id: string;
  size: number; // 1, 2, or 4 students
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  students: Student[];
  customName?: string; // Optional custom name for table
}

export interface ClassroomState {
  students: Student[];
  tables: Table[];
  classSize: number;
  tableSize: number;
  numberOfTables: number;
  showTableDivider: boolean;
}
