import React from 'react';
import Draggable from 'react-draggable';
import { Student } from '../types';

interface StudentTileProps {
  student: Student;
  onToggleLock: (studentId: string) => void;
  onDrag: (studentId: string, position: { x: number; y: number }) => void;
  onDragStop: (studentId: string, position: { x: number; y: number }) => void;
  showInvalidMoveError?: boolean;
}

export const StudentTile: React.FC<StudentTileProps> = ({
  student,
  onToggleLock,
  onDrag,
  onDragStop,
  showInvalidMoveError = false
}) => {
  const [showError, setShowError] = React.useState(false);
  const [dragStartPos, setDragStartPos] = React.useState<{ x: number; y: number } | null>(null);
  const [hasDragged, setHasDragged] = React.useState(false);

  const handleDragStart = (_e: any, data: { x: number; y: number }) => {
    setDragStartPos({ x: data.x, y: data.y });
    setHasDragged(false);
  };

  const handleDrag = (_e: any, data: { x: number; y: number }) => {
    if (dragStartPos) {
      const distance = Math.sqrt(
        Math.pow(data.x - dragStartPos.x, 2) + Math.pow(data.y - dragStartPos.y, 2)
      );
      
      // Consider it a drag if moved more than 5 pixels
      if (distance > 5) {
        setHasDragged(true);
      }
    }
    
    onDrag(student.id, { x: data.x, y: data.y });
  };

  const handleDragStop = (_e: any, data: { x: number; y: number }) => {
    // Only process as a drag if the user actually dragged (moved > 5 pixels)
    if (hasDragged && dragStartPos) {
      onDragStop(student.id, { x: data.x, y: data.y });
    }
    
    // Reset drag tracking
    setDragStartPos(null);
    setHasDragged(false);
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(student.id);
  };

  return (
    <Draggable
      position={student.position}
      onStart={handleDragStart}
      onDrag={handleDrag}
      onStop={handleDragStop}
      disabled={student.isLocked}
      defaultClassName="student-draggable"
      defaultClassNameDragging="student-draggable-dragging"
    >
      <div
        className={hasDragged ? 'student-tile-dragging' : ''}
        style={{
          position: 'absolute',
          width: '80px',
          height: '40px',
          backgroundColor: '#74b9ff',
          border: showError ? '3px solid #ff4757' : '2px solid #2d3436',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: student.isLocked ? 'not-allowed' : 'move',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#2d3436',
          userSelect: 'none',
          boxShadow: showError ? '0 0 10px rgba(255,71,87,0.5)' : '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: hasDragged ? 10000 : 1000,
          transition: hasDragged ? 'none' : 'border 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        <span style={{ marginRight: '4px', fontSize: '10px' }}>
          {student.name.length > 8 ? `${student.name.substring(0, 8)}...` : student.name}
        </span>
        <button
          onClick={handleLockClick}
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '18px',
            height: '18px',
            border: '2px solid ' + (student.isLocked ? '#d63031' : '#00b894'),
            borderRadius: '3px',
            background: student.isLocked ? '#ffebee' : '#e8f5e8',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: student.isLocked ? '#d63031' : '#00b894',
            fontWeight: 'bold'
          }}
          title={student.isLocked ? 'Click to unlock student' : 'Click to lock student'}
        >
          {student.isLocked ? '🔒' : '🔓'}
        </button>
      </div>
    </Draggable>
  );
};
