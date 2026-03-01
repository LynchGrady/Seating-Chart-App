import React, { useEffect, useState } from 'react';
import { validateTableCount } from '../utils/validation';

const FORM_OPTIONS_STORAGE_KEY = 'seating-chart-form-options-v1';

interface PersistedFormOptions {
  tableSize: number;
  numberOfTables: string;
  showTableDivider: boolean;
}

const DEFAULT_FORM_OPTIONS: PersistedFormOptions = {
  tableSize: 4,
  numberOfTables: '',
  showTableDivider: false,
};

const loadPersistedFormOptions = (): PersistedFormOptions => {
  if (typeof window === 'undefined') {
    return DEFAULT_FORM_OPTIONS;
  }

  try {
    const raw = window.localStorage.getItem(FORM_OPTIONS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_FORM_OPTIONS;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedFormOptions> | null;
    if (!parsed) {
      return DEFAULT_FORM_OPTIONS;
    }

    const tableSize = parsed.tableSize;
    const normalizedTableSize = tableSize === 1 || tableSize === 2 || tableSize === 4 ? tableSize : 4;

    const numberOfTablesRaw = parsed.numberOfTables;
    const normalizedNumberOfTables =
      typeof numberOfTablesRaw === 'string' && /^\d*$/.test(numberOfTablesRaw)
        ? numberOfTablesRaw
        : typeof numberOfTablesRaw === 'number' && Number.isInteger(numberOfTablesRaw) && numberOfTablesRaw > 0
          ? String(numberOfTablesRaw)
          : '';

    const showTableDivider = parsed.showTableDivider === true;

    return {
      tableSize: normalizedTableSize,
      numberOfTables: normalizedNumberOfTables,
      showTableDivider,
    };
  } catch {
    return DEFAULT_FORM_OPTIONS;
  }
};

interface InputFormProps {
  onSubmit: (data: {
    roster: string[];
    classSize: number;
    tableSize: number;
    numberOfTables: number;
    showTableDivider: boolean;
  }) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit }) => {
  const [initialOptions] = useState<PersistedFormOptions>(() => loadPersistedFormOptions());
  const [roster, setRoster] = useState<string>('');
  const [tableSize, setTableSize] = useState<number>(initialOptions.tableSize);
  const [numberOfTables, setNumberOfTables] = useState<string>(initialOptions.numberOfTables);
  const [showTableDivider, setShowTableDivider] = useState<boolean>(initialOptions.showTableDivider);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const optionsToPersist: PersistedFormOptions = {
      tableSize,
      numberOfTables,
      showTableDivider,
    };

    try {
      window.localStorage.setItem(FORM_OPTIONS_STORAGE_KEY, JSON.stringify(optionsToPersist));
    } catch {
      // Ignore localStorage write issues
    }
  }, [tableSize, numberOfTables, showTableDivider]);

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
      numberOfTables: validation.actualTables,
      showTableDivider
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

      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showTableDivider}
            onChange={(e) => setShowTableDivider(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          <span>Show table divider lines (for combined physical tables)</span>
        </label>
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', marginLeft: '20px' }}>
          Adds a vertical line through the middle of each table group
        </div>
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
