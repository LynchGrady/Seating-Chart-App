import React from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { useDrop } from 'react-dnd';
import { Table, Student } from '../types';
import { DndStudentTile } from './DndStudentTile';
import { findClosestGridPosition, getAvailablePositionsInTable } from '../utils/gridPositions';

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
  const tableContentRef = React.useRef<HTMLDivElement | null>(null);
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editingName, setEditingName] = React.useState('');
  const [isDraggingTable, setIsDraggingTable] = React.useState(false);

  // Keep props referenced for API compatibility
  void allTables;
  void onStudentSwap;

  const evaluateStudentDrop = React.useCallback(
    (itemId: string, monitor: any) => {
      const sourceClientOffset = monitor.getSourceClientOffset() ?? monitor.getClientOffset();
      if (!sourceClientOffset) {
        return { canDrop: false as const, closestGridPosition: null };
      }

      const tableContentElement = tableContentRef.current;
      if (!tableContentElement) {
        return { canDrop: false as const, closestGridPosition: null };
      }

      // Use dragged tile top-left against table content bounds so slot snapping
      // does not depend on where the student tile was grabbed with the pointer.
      const contentRect = tableContentElement.getBoundingClientRect();
      const relativeX = sourceClientOffset.x - contentRect.left;
      const relativeY = sourceClientOffset.y - contentRect.top;

      const availablePositions = getAvailablePositionsInTable(table.id, [table], allStudents, itemId);
      if (availablePositions.length === 0) {
        return { canDrop: false as const, closestGridPosition: null };
      }

      const pointerClosestPosition = findClosestGridPosition({ x: relativeX, y: relativeY }, [table]);
      if (!pointerClosestPosition) {
        return { canDrop: false as const, closestGridPosition: null };
      }

      const closestGridPosition = availablePositions.reduce((closestAvailable, candidatePosition) => {
        const closestDistance = Math.hypot(
          closestAvailable.position.x - pointerClosestPosition.position.x,
          closestAvailable.position.y - pointerClosestPosition.position.y,
        );

        const candidateDistance = Math.hypot(
          candidatePosition.position.x - pointerClosestPosition.position.x,
          candidatePosition.position.y - pointerClosestPosition.position.y,
        );

        return candidateDistance < closestDistance ? candidatePosition : closestAvailable;
      });

      return { canDrop: true as const, closestGridPosition };
    },
    [table, allStudents],
  );

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: 'student',
      drop: (item: { id: string }, monitor) => {
        const { canDrop: isValidDrop, closestGridPosition } = evaluateStudentDrop(item.id, monitor);
        if (!isValidDrop || !closestGridPosition) {
          return {
            tableId: table.id,
            rejected: true,
          };
        }

        return {
          position: closestGridPosition.position,
          tableId: table.id,
          rejected: false,
        };
      },
      collect: (monitor) => {
        const isOverCurrentTable = monitor.isOver({ shallow: true });

        if (!isOverCurrentTable) {
          return {
            isOver: false,
            canDrop: false,
          };
        }

        const currentItem = monitor.getItem() as { id: string } | null;
        const isValidDrop = currentItem ? evaluateStudentDrop(currentItem.id, monitor).canDrop : false;

        return {
          isOver: true,
          canDrop: isValidDrop,
        };
      },
    }),
    [evaluateStudentDrop, table.id],
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
          border: isOver
            ? canDrop
              ? '8px solid #00b894'
              : '8px solid #e17055'
            : '8px solid #636e72',
          borderRadius: '8px',
          backgroundColor: isOver ? (canDrop ? '#e8f5e8' : '#ffe9e5') : '#ddd',
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

        <div
          ref={tableContentRef}
          style={{ position: 'relative', height: 'calc(100% - 25px)', zIndex: 2 }}
        >
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
