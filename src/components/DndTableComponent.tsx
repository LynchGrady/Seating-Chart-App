import React from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useDrop } from 'react-dnd';
import { Table, Student } from '../types';
import { DndStudentTile } from './DndStudentTile';
import { findClosestGridPosition, isPositionOccupied } from '../utils/gridPositions';

interface DndTableComponentProps {
  table: Table;
  allTables: Table[];
  allStudents: Student[];
  showTableDivider: boolean;
  onTableMove: (tableId: string, position: { x: number; y: number }) => void;
  onTableMoveEnd: (tableId: string, position: { x: number; y: number }) => void;
  onTableResize: (tableId: string, dimensions: { width: number; height: number }) => void;
  onTableNameUpdate: (tableId: string, customName: string) => void;
  onStudentToggleLock: (studentId: string) => void;
  onStudentMove: (studentId: string, position: { x: number; y: number }, tableId?: string | null) => void;
  onStudentSwap: (studentId1: string, studentId2: string) => void;
  onSwapButtonClick: (studentId: string) => void;
  swapModeStudent: string | null;
  hideUIElements: boolean;
}

export const DndTableComponent: React.FC<DndTableComponentProps> = ({
  table,
  allTables,
  allStudents,
  showTableDivider,
  onTableMove,
  onTableMoveEnd,
  onTableResize,
  onTableNameUpdate,
  onStudentToggleLock,
  onStudentMove,
  onStudentSwap,
  onSwapButtonClick,
  swapModeStudent,
  hideUIElements,
}) => {
  const tableRef = React.useRef<HTMLDivElement | null>(null);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editingName, setEditingName] = React.useState('');
  const [isDraggingTable, setIsDraggingTable] = React.useState(false);

  // Keep props referenced for API compatibility
  void allTables;
  void onStudentSwap;

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'student',
      drop: (item: { id: string }, monitor) => {
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;

        const tableElement = tableRef.current;
        if (!tableElement) return;

        // Convert client coordinates to table-relative coordinates for grid snapping
        const tableRect = tableElement.getBoundingClientRect();
        const relativeX = clientOffset.x - tableRect.left;
        const relativeY = clientOffset.y - tableRect.top - 25; // Account for header

        const closestGridPosition = findClosestGridPosition({ x: relativeX, y: relativeY }, [table]);
        if (!closestGridPosition) return;

        const occupyingStudent = isPositionOccupied(closestGridPosition, allStudents, item.id);
        if (occupyingStudent) {
          return;
        }

        const studentsInTable = allStudents.filter((student) => student.tableId === table.id && student.id !== item.id);
        if (studentsInTable.length >= table.size) {
          return;
        }

        onStudentMove(item.id, closestGridPosition.position, table.id);

        return {
          position: closestGridPosition.position,
          tableId: table.id,
        };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [table, allStudents, onStudentMove],
  );

  const combinedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      tableRef.current = node;
      drop(node);
    },
    [drop],
  );

  const handleEditNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentName = table.customName || `Table ${table.id}`;
    setEditingName(currentName);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    const normalizedName = editingName.trim();
    onTableNameUpdate(table.id, normalizedName);
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
    e.stopPropagation();

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

  const handleTableDragStart = (): false | void => {
    if (isEditingName) {
      return false;
    }

    setIsDraggingTable(true);
  };

  const handleTableDrag = (_event: DraggableEvent, data: DraggableData) => {
    onTableMove(table.id, { x: data.x, y: data.y });
  };

  const handleTableDragStop = (_event: DraggableEvent, data: DraggableData) => {
    setIsDraggingTable(false);
    const position = { x: data.x, y: data.y };
    onTableMove(table.id, position);
    onTableMoveEnd(table.id, position);
  };

  return (
    <Draggable
      bounds="parent"
      position={table.position}
      onStart={handleTableDragStart}
      onDrag={handleTableDrag}
      onStop={handleTableDragStop}
      cancel=".student-tile, .table-control, .table-name-input, .table-resize-handle"
    >
      <div
        ref={combinedRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: table.dimensions.width,
          height: table.dimensions.height,
          border: isOver ? '8px solid #00b894' : '8px solid #636e72',
          borderRadius: '8px',
          backgroundColor: isOver ? '#e8f5e8' : '#ddd',
          userSelect: 'none',
          zIndex: isDraggingTable ? 3000 : parseInt(table.id, 10) || 1,
          cursor: isDraggingTable ? 'grabbing' : 'grab',
          transition: isDraggingTable
            ? 'background-color 0.2s ease'
            : 'background-color 0.2s ease, transform 120ms ease',
          touchAction: 'none',
        }}
      >
        <div
          className="table-header"
          style={{
            height: '25px',
            backgroundColor: '#636e72',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '0 5px',
          }}
        >
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <input
                className="table-name-input table-control"
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
                  borderRadius: '2px',
                }}
              />
            </div>
          ) : (
            <>
              <span style={{ flex: 1, textAlign: 'center' }}>{table.customName || `Table ${table.id}`}</span>
              {!hideUIElements && (
                <button
                  className="table-control"
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
                    justifyContent: 'center',
                  }}
                  title="Edit table name"
                >
                  ✏️
                </button>
              )}
            </>
          )}
        </div>

        <div style={{ position: 'relative', height: 'calc(100% - 25px)', zIndex: 2 }}>
          {table.students.map((student) => (
            <DndStudentTile
              key={student.id}
              student={student}
              onToggleLock={onStudentToggleLock}
              onMove={onStudentMove}
              onSwapButtonClick={onSwapButtonClick}
              swapModeStudent={swapModeStudent}
              hideUIElements={hideUIElements}
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
                zIndex: 1,
              }}
            />
          )}
        </div>

        {!hideUIElements && (
          <div
            className="table-resize-handle table-control"
            onMouseDown={handleResize}
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '16px',
              height: '16px',
              cursor: 'nwse-resize',
              backgroundColor: '#636e72',
              borderTopLeftRadius: '4px',
            }}
            title="Resize table"
          />
        )}
      </div>
    </Draggable>
  );
};
