import React from 'react';
import { useDrag } from 'react-dnd';
import { Student } from '../types';

interface DndStudentTileProps {
  student: Student;
  onToggleLock: (studentId: string) => void;
  onMove: (studentId: string, position: { x: number; y: number }, tableId?: string) => void;
  onSwapButtonClick?: (studentId: string) => void;
  swapModeStudent?: string | null;
  isUnassigned?: boolean;
  hideUIElements?: boolean;
}

export const DndStudentTile: React.FC<DndStudentTileProps> = ({
  student,
  onToggleLock,
  onMove,
  onSwapButtonClick,
  swapModeStudent,
  isUnassigned = false,
  hideUIElements = false
}) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'student',
    item: { 
      id: student.id, 
      name: student.name, 
      isLocked: student.isLocked,
      initialPosition: student.position 
    },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (dropResult && item && dropResult.position && !dropResult.swapped) {
        // Position was already updated in the table component
        // This is just for consistency
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [student]);

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(student.id);
  };

  const handleSwapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSwapButtonClick) {
      onSwapButtonClick(student.id);
    }
  };

  const isInSwapMode = swapModeStudent === student.id;
  const isOtherStudentInSwapMode = swapModeStudent && swapModeStudent !== student.id;

  return (
    <div
      ref={drag}
      style={{
        position: 'absolute',
        left: student.position.x,
        top: student.position.y,
        width: '120px',
        height: '60px',
        backgroundColor: isInSwapMode ? '#fdcb6e' : (isUnassigned || !student.tableId ? '#ff7675' : '#74b9ff'),
        border: isOtherStudentInSwapMode ? '3px solid #00b894' : '2px solid #2d3436',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: student.isLocked ? 'not-allowed' : 'move',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#2d3436',
        userSelect: 'none',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        opacity: isDragging ? 0.3 : 1,
        zIndex: 1000,
      }}
    >
      <span style={{ marginRight: '4px', fontSize: '17px', marginTop: '15px' }}>
        {student.name.length > 12 ? `${student.name.substring(0, 12)}...` : student.name}
      </span>
      
      {/* Lock button */}
      {!hideUIElements && (
        <button
          onClick={handleLockClick}
          style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: '24px',
            height: '24px',
            border: '2px solid ' + (student.isLocked ? '#d63031' : '#00b894'),
            borderRadius: '4px',
            background: student.isLocked ? '#ffebee' : '#e8f5e8',
            cursor: 'pointer',
            fontSize: '14px',
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
      )}
      
      {/* Swap button */}
      {!hideUIElements && onSwapButtonClick && (
        <button
          onClick={handleSwapClick}
          style={{
            position: 'absolute',
            top: '3px',
            left: '3px',
            width: '24px',
            height: '24px',
            border: '2px solid ' + (isInSwapMode ? '#fdcb6e' : '#636e72'),
            borderRadius: '4px',
            background: isInSwapMode ? '#fff5d6' : '#f8f9fa',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isInSwapMode ? '#fdcb6e' : '#636e72',
            fontWeight: 'bold'
          }}
          title={isInSwapMode ? 'Cancel swap mode' : (isOtherStudentInSwapMode ? 'Click to swap with selected student' : 'Click to start swap mode')}
        >
          ↔️
        </button>
      )}
    </div>
  );
};
