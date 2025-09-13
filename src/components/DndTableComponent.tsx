import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { Table } from '../types';
import { DndStudentTile } from './DndStudentTile';
import { findClosestGridPosition, isPositionOccupied, findStudentAtPosition } from '../utils/gridPositions';

interface DndTableComponentProps {
  table: Table;
  allTables: Table[];
  allStudents: any[];
  showTableDivider: boolean;
  onTableMove: (tableId: string, position: { x: number; y: number }) => void;
  onTableResize: (tableId: string, dimensions: { width: number; height: number }) => void;
  onTableNameUpdate: (tableId: string, customName: string) => void;
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
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editingName, setEditingName] = React.useState('');

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

  const handleEditNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentName = table.customName || `Table ${table.id} (Max: ${table.size})`;
    setEditingName(currentName);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    onTableNameUpdate(table.id, editingName);
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };

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
        border: isOver ? '8px solid #00b894' : '8px solid #636e72',
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
          // Don't drag if we're editing the name
          if (isEditingName) return;
          
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
          justifyContent: 'space-between',
          cursor: isEditingName ? 'default' : 'move',
          fontSize: '12px',
          fontWeight: 'bold',
          opacity: isDraggingTable ? 0.5 : 1,
          padding: '0 5px'
        }}
      >
        {isEditingName ? (
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleNameSave}
              autoFocus
              style={{
                flex: 1,
                backgroundColor: 'white',
                color: 'black',
                border: 'none',
                fontSize: '11px',
                padding: '2px 4px',
                borderRadius: '2px'
              }}
            />
          </div>
        ) : (
          <>
            <span style={{ flex: 1, textAlign: 'center' }}>
              {table.customName || `Table ${table.id} (Max: ${table.size})`}
            </span>
            <button
              onClick={handleEditNameClick}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Edit table name"
            >
              ✏️
            </button>
          </>
        )}
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
        
        {/* Divider line for combined physical tables */}
        {showTableDivider && (table.size === 2 || table.size === 4) && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '0px',
              bottom: '0px',
              width: '8px',
              backgroundColor: '#636e72',
              transform: 'translateX(-50%)',
              zIndex: 1
            }}
          />
        )}
      </div>
    </div>
  );
};
