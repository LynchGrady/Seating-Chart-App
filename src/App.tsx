import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ClassroomLayout } from './components/ClassroomLayout';
import { Student, Table, ClassroomState } from './types';
import { randomizeUnlockedStudents } from './utils/randomization';
import { findClosestGridPosition, isPositionOccupied, findStudentAtPosition } from './utils/gridPositions';

const App: React.FC = () => {
  const [classroomState, setClassroomState] = useState<ClassroomState | null>(null);
  const [swapModeStudent, setSwapModeStudent] = useState<string | null>(null);

  const initializeClassroom = (data: {
    roster: string[];
    classSize: number;
    tableSize: number;
    numberOfTables: number;
    showTableDivider: boolean;
  }) => {
    // Create tables
    const tables: Table[] = [];
    const tableWidth = 304; // Reduced by 5% (320 * 0.95)
    const tableHeight = 192; // Reduced by 20% (240 * 0.8)
    const tablesPerRow = Math.ceil(Math.sqrt(data.numberOfTables));
    
    for (let i = 0; i < data.numberOfTables; i++) {
      const row = Math.floor(i / tablesPerRow);
      const col = i % tablesPerRow;
      
      tables.push({
        id: (i + 1).toString(),
        size: data.tableSize,
        position: {
          x: 100 + col * (tableWidth + 50),
          y: 100 + row * (tableHeight + 50)
        },
        dimensions: { width: tableWidth, height: tableHeight },
        students: []
      });
    }

    // Create students
    const students: Student[] = data.roster.map((name, index) => ({
      id: index.toString(),
      name,
      isLocked: false,
      tableId: null,
      position: { x: 0, y: 0 }
    }));

    // Initial random assignment
    const { students: assignedStudents, tables: updatedTables } = 
      randomizeUnlockedStudents(students, tables);

    setClassroomState({
      students: assignedStudents,
      tables: updatedTables,
      classSize: data.classSize,
      tableSize: data.tableSize,
      numberOfTables: data.numberOfTables,
      showTableDivider: data.showTableDivider
    });
  };

  const handleStudentToggleLock = (studentId: string) => {
    if (!classroomState) return;

    const updatedStudents = classroomState.students.map(student =>
      student.id === studentId
        ? { ...student, isLocked: !student.isLocked }
        : student
    );

    // Also update the tables to reflect the updated students
    const updatedTables = classroomState.tables.map(table => ({
      ...table,
      students: updatedStudents.filter(student => student.tableId === table.id)
    }));

    setClassroomState({
      ...classroomState,
      students: updatedStudents,
      tables: updatedTables
    });
  };

  const handleStudentMove = (studentId: string, newPosition: { x: number; y: number }, newTableId?: string) => {
    if (!classroomState) return;

    const updatedStudents = classroomState.students.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          position: newPosition,
          tableId: newTableId || student.tableId
        };
      }
      return student;
    });

    const updatedTables = classroomState.tables.map(table => ({
      ...table,
      students: updatedStudents.filter(student => student.tableId === table.id)
    }));

    setClassroomState({
      ...classroomState,
      students: updatedStudents,
      tables: updatedTables
    });
  };

  const handleStudentSwap = (studentId1: string, studentId2: string) => {
    if (!classroomState) return;

    const student1 = classroomState.students.find(s => s.id === studentId1);
    const student2 = classroomState.students.find(s => s.id === studentId2);

    if (!student1 || !student2) return;

    const updatedStudents = classroomState.students.map(student => {
      if (student.id === studentId1) {
        return {
          ...student,
          tableId: student2.tableId,
          position: student2.position
        };
      } else if (student.id === studentId2) {
        return {
          ...student,
          tableId: student1.tableId,
          position: student1.position
        };
      }
      return student;
    });

    const updatedTables = classroomState.tables.map(table => ({
      ...table,
      students: updatedStudents.filter(student => student.tableId === table.id)
    }));

    setClassroomState({
      ...classroomState,
      students: updatedStudents,
      tables: updatedTables
    });
  };

  const handleSwapButtonClick = (studentId: string) => {
    if (swapModeStudent === null) {
      // First student selected for swap
      setSwapModeStudent(studentId);
    } else if (swapModeStudent === studentId) {
      // Same student clicked - cancel swap mode
      setSwapModeStudent(null);
    } else {
      // Second student selected - perform swap
      handleStudentSwap(swapModeStudent, studentId);
      setSwapModeStudent(null);
    }
  };

  const handleTableMove = (tableId: string, position: { x: number; y: number }) => {
    if (!classroomState) return;

    const updatedTables = classroomState.tables.map(table =>
      table.id === tableId
        ? { ...table, position }
        : table
    );

    setClassroomState({
      ...classroomState,
      tables: updatedTables
    });
  };

  const handleTableResize = (tableId: string, dimensions: { width: number; height: number }) => {
    if (!classroomState) return;

    const updatedTables = classroomState.tables.map(table =>
      table.id === tableId
        ? { ...table, dimensions }
        : table
    );

    setClassroomState({
      ...classroomState,
      tables: updatedTables
    });
  };

  const handleTableNameUpdate = (tableId: string, customName: string) => {
    if (!classroomState) return;

    const updatedTables = classroomState.tables.map(table =>
      table.id === tableId
        ? { ...table, customName }
        : table
    );

    setClassroomState({
      ...classroomState,
      tables: updatedTables
    });
  };

  const handleRandomize = () => {
    if (!classroomState) return;

    const { students, tables } = randomizeUnlockedStudents(
      classroomState.students,
      classroomState.tables
    );

    setClassroomState({
      ...classroomState,
      students,
      tables
    });
  };

  const resetClassroom = () => {
    setClassroomState(null);
  };

  if (!classroomState) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Seating Chart Application</h1>
        <InputForm onSubmit={initializeClassroom} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
        <button
          onClick={resetClassroom}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '5px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          New Chart
        </button>
        <span>
          Class Size: {classroomState.classSize} | 
          Table Size: {classroomState.tableSize} | 
          Tables: {classroomState.numberOfTables}
        </span>
      </div>
      
      <ClassroomLayout
        tables={classroomState.tables}
        showTableDivider={classroomState.showTableDivider}
        onTableMove={handleTableMove}
        onTableResize={handleTableResize}
        onTableNameUpdate={handleTableNameUpdate}
        students={classroomState.students}
        onStudentToggleLock={handleStudentToggleLock}
        onStudentMove={handleStudentMove}
        onStudentSwap={handleStudentSwap}
        onSwapButtonClick={handleSwapButtonClick}
        swapModeStudent={swapModeStudent}
        onRandomize={handleRandomize}
      />
    </div>
  );
};

export default App;
