import { Student, Table } from '../types';

export const randomizeUnlockedStudents = (
  students: Student[],
  tables: Table[]
): { students: Student[]; tables: Table[] } => {
  // Get all unlocked students
  const unlockedStudents = students.filter(student => !student.isLocked);
  const lockedStudents = students.filter(student => student.isLocked);
  
  // Generate ALL possible positions for all tables
  const allPossiblePositions: Array<{ tableId: string; position: { x: number; y: number }; slotIndex: number }> = [];
  
  tables.forEach(table => {
    const tableCapacity = table.size;
    
    // Generate all possible positions for this table
    for (let i = 0; i < tableCapacity; i++) {
      let position: { x: number; y: number };
      
      if (tableCapacity === 1) {
        position = { x: 100, y: 90 };
      } else if (tableCapacity === 2) {
        position = { x: 30 + (i * 140), y: 90 };
      } else if (tableCapacity === 4) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        position = { x: 30 + (col * 140), y: 60 + (row * 80) };
      } else {
        position = { x: i * 90 + 15, y: 60 };
      }
      
      allPossiblePositions.push({
        tableId: table.id,
        position,
        slotIndex: i
      });
    }
  });
  
  // Filter out positions occupied by locked students
  const availablePositions = allPossiblePositions.filter(pos => {
    // Check if any locked student is in this exact position
    const isOccupiedByLockedStudent = lockedStudents.some(lockedStudent => 
      lockedStudent.tableId === pos.tableId &&
      Math.abs(lockedStudent.position.x - pos.position.x) < 10 &&
      Math.abs(lockedStudent.position.y - pos.position.y) < 10
    );
    return !isOccupiedByLockedStudent;
  });
  
  // Shuffle available positions
  const shuffledPositions = [...availablePositions].sort(() => Math.random() - 0.5);
  
  // Assign unlocked students to shuffled positions
  const updatedStudents = students.map(student => {
    if (student.isLocked) {
      return student; // Keep locked students exactly where they are
    }
    
    const newPosition = shuffledPositions.pop();
    if (newPosition) {
      return {
        ...student,
        tableId: newPosition.tableId,
        position: newPosition.position
      };
    }
    return student; // Fallback: keep in current position if no spots available
  });
  
  // Update tables with new student assignments
  const updatedTables = tables.map(table => ({
    ...table,
    students: updatedStudents.filter(student => student.tableId === table.id)
  }));
  
  return { students: updatedStudents, tables: updatedTables };
};
