import { Table, Student } from '../types';

export interface GridPosition {
  tableId: string;
  position: { x: number; y: number };
  slotIndex: number;
}

export const calculateGridPositions = (tables: Table[]): GridPosition[] => {
  const allPositions: GridPosition[] = [];
  
  tables.forEach(table => {
    const tableCapacity = table.size;
    
    for (let i = 0; i < tableCapacity; i++) {
      let position: { x: number; y: number };
      
      if (tableCapacity === 1) {
        position = { x: 80, y: 50 };
      } else if (tableCapacity === 2) {
        position = { x: 3 + (i * 142), y: 50 };
      } else if (tableCapacity === 4) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        position = { x: 13 + (col * 142), y: 10 + (row * 70) };
      } else {
        position = { x: i * 102 - 2, y: 25 };
      }
      
      allPositions.push({
        tableId: table.id,
        position,
        slotIndex: i
      });
    }
  });
  
  return allPositions;
};

export const findClosestGridPosition = (
  dropPosition: { x: number; y: number },
  tables: Table[]
): GridPosition | null => {
  const allGridPositions = calculateGridPositions(tables);
  let closestPosition: GridPosition | null = null;
  let minDistance = Infinity;
  
  allGridPositions.forEach(gridPos => {
    const table = tables.find(t => t.id === gridPos.tableId);
    if (!table) return;
    
    // For relative position within the table, compare directly
    const distance = Math.sqrt(
      Math.pow(dropPosition.x - gridPos.position.x, 2) + 
      Math.pow(dropPosition.y - gridPos.position.y, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPosition = gridPos;
    }
  });
  
  return closestPosition;
};

export const isPositionOccupied = (
  gridPosition: GridPosition,
  students: Student[],
  excludeStudentId?: string
): Student | null => {
  return students.find(student => 
    student.id !== excludeStudentId &&
    student.tableId === gridPosition.tableId &&
    Math.abs(student.position.x - gridPosition.position.x) < 10 &&
    Math.abs(student.position.y - gridPosition.position.y) < 10
  ) || null;
};

export const findStudentAtPosition = (
  dropPosition: { x: number; y: number },
  students: Student[],
  tables: Table[],
  excludeStudentId?: string
): Student | null => {
  // Check if drop position directly overlaps with any student tile
  for (const student of students) {
    if (student.id === excludeStudentId) continue;
    
    const table = tables.find(t => t.id === student.tableId);
    if (!table) continue;
    
    // Convert student position to absolute coordinates
    const absoluteStudentPos = {
      x: table.position.x + student.position.x,
      y: table.position.y + student.position.y + 25 // Account for table header
    };
    
    // Check if drop position center overlaps with student tile
    const tileWidth = 120;
    const tileHeight = 60;
    const overlapThreshold = 20; // Reduced threshold for easier swapping
    
    // Calculate distance between drop position and student center
    const studentCenterX = absoluteStudentPos.x + tileWidth / 2;
    const studentCenterY = absoluteStudentPos.y + tileHeight / 2;
    
    const distance = Math.sqrt(
      Math.pow(dropPosition.x - studentCenterX, 2) + 
      Math.pow(dropPosition.y - studentCenterY, 2)
    );
    
    // If drop is close enough to student center, consider it a collision
    if (distance <= overlapThreshold) {
      return student;
    }
  }
  
  return null;
};

export const getAvailablePositionsInTable = (
  tableId: string,
  tables: Table[],
  students: Student[],
  excludeStudentId?: string
): GridPosition[] => {
  const table = tables.find(t => t.id === tableId);
  if (!table) return [];
  
  const tablePositions = calculateGridPositions([table]);
  
  return tablePositions.filter(pos => 
    !isPositionOccupied(pos, students, excludeStudentId)
  );
};
