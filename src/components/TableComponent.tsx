import React from 'react';
import Draggable from 'react-draggable';
import { Table } from '../types';
import { StudentTile } from './StudentTile';

interface TableComponentProps {
  table: Table;
  onTableMove: (tableId: string, position: { x: number; y: number }) => void;
  onTableResize: (tableId: string, dimensions: { width: number; height: number }) => void;
  onStudentToggleLock: (studentId: string) => void;
  onStudentDrag: (studentId: string, position: { x: number; y: number }) => void;
  onStudentDragStop: (studentId: string, position: { x: number; y: number }) => void;
}

export const TableComponent: React.FC<TableComponentProps> = ({
  table,
  onTableMove,
  onTableResize,
  onStudentToggleLock,
  onStudentDrag,
  onStudentDragStop
}) => {
  const handleTableDrag = (_e: any, data: { x: number; y: number }) => {
    onTableMove(table.id, { x: data.x, y: data.y });
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
    <Draggable
      position={table.position}
      onDrag={handleTableDrag}
      handle=".table-header"
    >
      <div
        style={{
          position: 'absolute',
          width: table.dimensions.width,
          height: table.dimensions.height,
          border: '3px solid #636e72',
          borderRadius: '8px',
          backgroundColor: '#ddd',
          userSelect: 'none',
          zIndex: parseInt(table.id) || 1
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
            justifyContent: 'center',
            cursor: 'move',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
        >
          Table {table.id} (Max: {table.size})
        </div>
        
        <div style={{ position: 'relative', height: 'calc(100% - 25px)', zIndex: 2 }}>
          {table.students.map(student => (
            <StudentTile
              key={student.id}
              student={student}
              onToggleLock={onStudentToggleLock}
              onDrag={onStudentDrag}
              onDragStop={onStudentDragStop}
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
    </Draggable>
  );
};
