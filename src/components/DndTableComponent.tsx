import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { Table } from '../types';
import { DndStudentTile } from './DndStudentTile';
import { findClosestGridPosition, isPositionOccupied, findStudentAtPosition } from '../utils/gridPositions';

interface DndTableComponentProps {
  table: Table;
  allTables: Table[];
  allStudents: any[];
  onTableMove: (tableId: string, position: { x: number; y: number }) => void;
  onTableResize: (tableId: string, dimensions: { width: number; height: number }) => void;
  onStudentToggleLock: (studentId: string) => void;
  onStudentMove: (studentId: string, position: { x: number; y: number }, tableId?: string) => void;
  onStudentSwap: (studentId1: string, studentId2: string) => void;
  onSwapButtonClick: (studentId: string) => void;
  swapModeStudent: string | null;
}

export const DndTableComponent: React.FC<DndTableComponentProps> = ({
  table,
  allTables,
  allStudents,
  onTableMove,
  onTableResize,
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

      // Convert client coordinates to table-relative coordinates for grid snapping
      const tableElement = dropRef.current;
      if (!tableElement) return;

      const tableRect = tableElement.getBoundingClientRect();
      const relativeX = clientOffset.x - tableRect.left;
      const relativeY = clientOffset.y - tableRect.top - 25; // Account for header

      // Find closest grid position within this table
      const closestGridPosition = findClosestGridPosition(
        { x: relativeX, y: relativeY },
        [table]
      );

      if (!closestGridPosition) return;

      // Check if position is occupied by another student
      const occupyingStudent = isPositionOccupied(
        closestGridPosition,
        allStudents,
        item.id
      );

      if (occupyingStudent) {
        // Position occupied, don't move
        return;
      }

      // Check table capacity
      const studentsInTable = allStudents.filter(
        s => s.tableId === table.id && s.id !== item.id
      );

      if (studentsInTable.length >= table.size) {
        // Table at capacity
        return;
      }

      // Move student to grid position with new table assignment
      onStudentMove(item.id, closestGridPosition.position, table.id);

      return {
        position: closestGridPosition.position,
        tableId: table.id
      };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [table, allTables, allStudents]);

  const dropRef = React.useRef<HTMLDivElement>(null);

  // Add table dragging functionality
  const [{ isDraggingTable }, dragTable] = useDrag(() => ({
    type: 'table',
    item: { id: table.id, type: 'table' },
    collect: (monitor) => ({
      isDraggingTable: monitor.isDragging(),
    }),
  }), [table.id]);

  // Combine drop ref with the div ref
  const combinedRef = React.useCallback((node: HTMLDivElement) => {
    dropRef.current = node;
    drop(node);
  }, [drop]);

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = table.dimensions.width;
    const startHeight = table.dimensions.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(120, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(80, startHeight + (moveEvent.clientY - startY));
      onTableResize(table.id, { width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={combinedRef}
      style={{
        position: 'absolute',
        left: table.position.x,
        top: table.position.y,
        width: table.dimensions.width,
        height: table.dimensions.height,
        border: isOver ? '3px solid #00b894' : '3px solid #636e72',
        borderRadius: '8px',
        backgroundColor: isOver ? '#e8f5e8' : '#ddd',
        userSelect: 'none',
        zIndex: parseInt(table.id) || 1,
        transition: 'background-color 0.2s ease'
      }}
    >
      <div
        ref={dragTable}
        className="table-header"
        onMouseDown={(e) => {
          // Handle table dragging
          const startX = e.clientX;
          const startY = e.clientY;
          const startLeft = table.position.x;
          const startTop = table.position.y;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const newX = startLeft + (moveEvent.clientX - startX);
            const newY = startTop + (moveEvent.clientY - startY);
            onTableMove(table.id, { x: Math.max(0, newX), y: Math.max(0, newY) });
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        style={{
          height: '25px',
          backgroundColor: '#636e72',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'move',
          fontSize: '12px',
          fontWeight: 'bold',
          opacity: isDraggingTable ? 0.5 : 1
        }}
      >
        Table {table.id} (Max: {table.size})
      </div>
      
      <div style={{ position: 'relative', height: 'calc(100% - 25px)', zIndex: 2 }}>
        {table.students.map(student => (
          <DndStudentTile
            key={student.id}
            student={student}
            onToggleLock={onStudentToggleLock}
            onMove={onStudentMove}
            onSwapButtonClick={onSwapButtonClick}
            swapModeStudent={swapModeStudent}
          />
        ))}
      </div>
      
      {/* Resize handle */}
      <div
        onMouseDown={handleResize}
        style={{
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: '15px',
          height: '15px',
          cursor: 'nw-resize',
          backgroundColor: '#636e72'
        }}
      />
    </div>
  );
};
