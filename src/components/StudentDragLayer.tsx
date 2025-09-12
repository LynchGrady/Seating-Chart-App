import React from 'react';
import { useDragLayer } from 'react-dnd';

interface StudentDragLayerProps {}

const layerStyles: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 10000,
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
};

function getItemStyles(
  initialOffset: { x: number; y: number } | null,
  currentOffset: { x: number; y: number } | null
): React.CSSProperties {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }

  const { x, y } = currentOffset;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}

export const StudentDragLayer: React.FC<StudentDragLayerProps> = () => {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  function renderItem() {
    if (itemType !== 'student') {
      return null;
    }

    return (
      <div
        style={{
          position: 'absolute',
          width: '120px',
          height: '60px',
          backgroundColor: '#74b9ff',
          border: '2px solid #2d3436',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#2d3436',
          userSelect: 'none',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          opacity: 0.8,
        }}
      >
        <span style={{ marginRight: '4px', fontSize: '14px' }}>
          {item?.name?.length > 12 ? `${item.name.substring(0, 12)}...` : item?.name}
        </span>
        <div
          style={{
            position: 'absolute',
            top: '3px',
            right: '3px',
            width: '24px',
            height: '24px',
            border: '2px solid ' + (item?.isLocked ? '#d63031' : '#00b894'),
            borderRadius: '4px',
            background: item?.isLocked ? '#ffebee' : '#e8f5e8',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: item?.isLocked ? '#d63031' : '#00b894',
            fontWeight: 'bold'
          }}
        >
          {item?.isLocked ? '🔒' : '🔓'}
        </div>
      </div>
    );
  }

  if (!isDragging) {
    return null;
  }

  return (
    <div style={layerStyles}>
      <div style={getItemStyles(initialOffset, currentOffset)}>
        {renderItem()}
      </div>
    </div>
  );
};
