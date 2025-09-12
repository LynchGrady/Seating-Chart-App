import React, { useState } from 'react';
import { validateTableCount } from '../utils/validation';

interface InputFormProps {
  onSubmit: (data: {
    roster: string[];
    classSize: number;
    tableSize: number;
    numberOfTables: number;
  }) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit }) => {
  const [roster, setRoster] = useState<string>('');
  const [tableSize, setTableSize] = useState<number>(4);
  const [numberOfTables, setNumberOfTables] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const rosterArray = roster.split('\n').filter(name => name.trim() !== '');
    const classSize = rosterArray.length;
    
    if (classSize < 9 || classSize > 40) {
      setError('Class size must be between 9 and 40 students');
      return;
    }
    
    const desiredTables = numberOfTables ? parseInt(numberOfTables) : undefined;
    const validation = validateTableCount(classSize, tableSize, desiredTables);
    
    if (!validation.isValid) {
      setError(`Minimum ${validation.minTables} tables required for ${classSize} students with table size ${tableSize}`);
      return;
    }
    
    onSubmit({
      roster: rosterArray,
      classSize,
      tableSize,
      numberOfTables: validation.actualTables
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', maxWidth: '400px' }}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Student Roster (one name per line):
        </label>
        <textarea
          value={roster}
          onChange={(e) => setRoster(e.target.value)}
          rows={10}
          style={{ width: '100%', padding: '8px' }}
          placeholder="Enter student names..."
          required
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Table Size:
        </label>
        <select
          value={tableSize}
          onChange={(e) => setTableSize(parseInt(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value={1}>1 student per table</option>
          <option value={2}>2 students per table</option>
          <option value={4}>4 students per table</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>
          Number of Tables (optional):
        </label>
        <input
          type="number"
          value={numberOfTables}
          onChange={(e) => setNumberOfTables(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
          placeholder="Leave empty for minimum required"
        />
      </div>
      
      {error && (
        <div style={{ color: 'red', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      <button
        type="submit"
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Create Seating Chart
      </button>
    </form>
  );
};
