import React from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Table, Student } from '../types';
import { DndTableComponent } from './DndTableComponent';
import { DndStudentTile } from './DndStudentTile';
import { StudentDragLayer } from './StudentDragLayer';

interface ClassroomLayoutProps {
  tables: Table[];
  students: Student[];
  showTableDivider: boolean;
  onTableMove: (tableId: string, position: { x: number; y: number }) => void;
  onTableResize: (tableId: string, dimensions: { width: number; height: number }) => void;
  onTableNameUpdate: (tableId: string, customName: string) => void;
  onStudentToggleLock: (studentId: string) => void;
  onStudentMove: (studentId: string, position: { x: number; y: number }, tableId?: string) => void;
  onStudentSwap: (studentId1: string, studentId2: string) => void;
  onSwapButtonClick: (studentId: string) => void;
  swapModeStudent: string | null;
  onRandomize: () => void;
}

const ClassroomArea: React.FC<{
  tables: Table[];
  students: Student[];
  showTableDivider: boolean;
  onTableMove: (tableId: string, position: { x: number; y: number }) => void;
  onTableResize: (tableId: string, dimensions: { width: number; height: number }) => void;
  onTableNameUpdate: (tableId: string, customName: string) => void;
  onStudentToggleLock: (studentId: string) => void;
  onStudentMove: (studentId: string, position: { x: number; y: number }, tableId?: string) => void;
  onStudentSwap: (studentId1: string, studentId2: string) => void;
  onSwapButtonClick: (studentId: string) => void;
  swapModeStudent: string | null;
}> = ({
  tables,
  students,
  showTableDivider,
  onTableMove,
  onTableResize,
  onTableNameUpdate,
  onStudentToggleLock,
  onStudentMove,
  onStudentSwap,
  onSwapButtonClick,
  swapModeStudent
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'student',
    drop: (item: any, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      // Check if dropped on empty classroom space (not on a table)
      const didDropOnTable = monitor.didDrop();
      if (!didDropOnTable) {
        // Student dropped on empty classroom space - remove from current table
        onStudentMove(item.id, { x: 50, y: 50 }, null);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [onStudentMove]);

  return (
    <div
      ref={drop}
      style={{
        height: '85vh',
        position: 'relative',
        border: '4px solid #2d3436',
        margin: '20px',
        backgroundColor: isOver ? '#e8f4f8' : '#f1f2f6',
        overflow: 'hidden',
        transition: 'background-color 0.2s ease'
      }}
    >
      {/* Front label */}
      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#2d3436',
          color: 'white',
          padding: '5px 15px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000
        }}
      >
        FRONT
      </div>
      
      {/* Back label */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#2d3436',
          color: 'white',
          padding: '5px 15px',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000
        }}
      >
        BACK
      </div>
      
      {/* Tables */}
      {tables.map(table => (
        <DndTableComponent
          key={table.id}
          table={table}
          allTables={tables}
          allStudents={students}
          showTableDivider={showTableDivider}
          onTableMove={onTableMove}
          onTableResize={onTableResize}
          onTableNameUpdate={onTableNameUpdate}
          onStudentToggleLock={onStudentToggleLock}
          onStudentMove={onStudentMove}
          onStudentSwap={onStudentSwap}
          onSwapButtonClick={onSwapButtonClick}
          swapModeStudent={swapModeStudent}
        />
      ))}

      {/* Students not assigned to any table */}
      {students.filter(s => !s.tableId).map(student => (
        <DndStudentTile
          key={student.id}
          student={student}
          onToggleLock={onStudentToggleLock}
          onMove={(studentId, position) => onStudentMove(studentId, position, null)}
          onSwapButtonClick={onSwapButtonClick}
          swapModeStudent={swapModeStudent}
          isUnassigned={true}
        />
      ))}
    </div>
  );
};

export const ClassroomLayout: React.FC<ClassroomLayoutProps> = ({
  tables,
  students,
  showTableDivider,
  onTableMove,
  onTableResize,
  onTableNameUpdate,
  onStudentToggleLock,
  onStudentMove,
  onStudentSwap,
  onSwapButtonClick,
  swapModeStudent,
  onRandomize
}) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Controls */}
        <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button
              onClick={onRandomize}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                marginRight: '15px'
              }}
            >
              Randomize
            </button>
            <span style={{ fontSize: '14px', color: '#6c757d' }}>
              💡 Tip: Drag students to move them manually, use ↔️ buttons to swap students
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            <div>🔵 Students at tables | 🔴 Unassigned students | 🔒 Locked (won't randomize)</div>
          </div>
        </div>
        
        {/* Classroom */}
        <ClassroomArea
          tables={tables}
          students={students}
          showTableDivider={showTableDivider}
          onTableMove={onTableMove}
          onTableResize={onTableResize}
          onTableNameUpdate={onTableNameUpdate}
          onStudentToggleLock={onStudentToggleLock}
          onStudentMove={onStudentMove}
          onStudentSwap={onStudentSwap}
          onSwapButtonClick={onSwapButtonClick}
          swapModeStudent={swapModeStudent}
        />
        
        {/* Custom drag layer for students */}
        <StudentDragLayer />
      </div>
    </DndProvider>
  );
};
