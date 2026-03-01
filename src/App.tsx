import React, { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { InputForm } from './components/InputForm';
import { ClassroomLayout } from './components/ClassroomLayout';
import { Student, Table, ClassroomState } from './types';
import { randomizeUnlockedStudents } from './utils/randomization';

const TABLE_LAYOUT_STORAGE_PREFIX = 'seating-chart-table-layout-v2-size';
const DEFAULT_TABLE_WIDTH = 304;
const DEFAULT_TABLE_HEIGHT = 192;
const DEFAULT_TABLE_START_X = 100;
const DEFAULT_TABLE_START_Y = 100;
const DEFAULT_TABLE_GAP = 50;
const TABLE_POSITION_STEP = 24;
const TABLE_COLLISION_GAP = 8;

type SavedTableLayout = Record<string, { x: number; y: number; customName?: string }>;
type ClassroomBounds = { width: number; height: number };

const getLayoutStorageKey = (tableSize: number): string =>
  `${TABLE_LAYOUT_STORAGE_PREFIX}:${tableSize}`;

const createDefaultTables = (numberOfTables: number, tableSize: number): Table[] => {
  const tables: Table[] = [];
  const tablesPerRow = Math.ceil(Math.sqrt(numberOfTables));

  for (let i = 0; i < numberOfTables; i++) {
    const row = Math.floor(i / tablesPerRow);
    const col = i % tablesPerRow;

    tables.push({
      id: (i + 1).toString(),
      size: tableSize,
      position: {
        x: DEFAULT_TABLE_START_X + col * (DEFAULT_TABLE_WIDTH + DEFAULT_TABLE_GAP),
        y: DEFAULT_TABLE_START_Y + row * (DEFAULT_TABLE_HEIGHT + DEFAULT_TABLE_GAP),
      },
      dimensions: { width: DEFAULT_TABLE_WIDTH, height: DEFAULT_TABLE_HEIGHT },
      students: [],
    });
  }

  return tables;
};

const loadSavedTableLayout = (tableSize: number): SavedTableLayout => {
  if (typeof window === 'undefined') return {};

  try {
    const key = getLayoutStorageKey(tableSize);
    const raw = window.localStorage.getItem(key);

    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};

    const validatedEntries = Object.entries(parsed as Record<string, unknown>).filter(
      ([, value]) => {
        if (!value || typeof value !== 'object') return false;
        const candidate = value as { x?: unknown; y?: unknown; customName?: unknown };
        const hasValidCoords = typeof candidate.x === 'number' && typeof candidate.y === 'number';
        const hasValidName =
          candidate.customName === undefined ||
          (typeof candidate.customName === 'string' && candidate.customName.trim().length > 0);

        return hasValidCoords && hasValidName;
      },
    );

    if (validatedEntries.length === 0) return {};

    return Object.fromEntries(
      validatedEntries.map(([tableId, value]) => {
        const candidate = value as { x: number; y: number; customName?: string };
        const normalizedName = candidate.customName?.trim();

        return [
          tableId,
          {
            x: candidate.x,
            y: candidate.y,
            ...(normalizedName ? { customName: normalizedName } : {}),
          },
        ];
      }),
    );
  } catch {
    return {};
  }
};

const saveTableLayout = (tableSize: number, tables: Table[]) => {
  if (typeof window === 'undefined') return;

  try {
    const key = getLayoutStorageKey(tableSize);
    const existingLayout = loadSavedTableLayout(tableSize);
    const updatedLayout: SavedTableLayout = { ...existingLayout };

    tables.forEach((table) => {
      const normalizedName = table.customName?.trim();

      updatedLayout[table.id] = {
        x: table.position.x,
        y: table.position.y,
        ...(normalizedName ? { customName: normalizedName } : {}),
      };
    });

    window.localStorage.setItem(key, JSON.stringify(updatedLayout));
  } catch {
    // Ignore localStorage errors (private mode / quota)
  }
};

const clearSavedTableLayout = (tableSize: number) => {
  if (typeof window === 'undefined') return;

  try {
    const key = getLayoutStorageKey(tableSize);
    window.localStorage.removeItem(key);
  } catch {
    // Ignore localStorage errors
  }
};

const clampTablePosition = (
  table: Table,
  position: { x: number; y: number },
  bounds: ClassroomBounds,
): { x: number; y: number } => {
  const maxX = Math.max(0, bounds.width - table.dimensions.width);
  const maxY = Math.max(0, bounds.height - table.dimensions.height);

  return {
    x: Math.max(0, Math.min(position.x, maxX)),
    y: Math.max(0, Math.min(position.y, maxY)),
  };
};

const tablesOverlap = (tableA: Table, tableB: Table, gap = 0): boolean => {
  const aLeft = tableA.position.x - gap;
  const aTop = tableA.position.y - gap;
  const aRight = tableA.position.x + tableA.dimensions.width + gap;
  const aBottom = tableA.position.y + tableA.dimensions.height + gap;

  const bLeft = tableB.position.x;
  const bTop = tableB.position.y;
  const bRight = tableB.position.x + tableB.dimensions.width;
  const bBottom = tableB.position.y + tableB.dimensions.height;

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
};

const hasTableCollision = (table: Table, others: Table[]): boolean =>
  others.some((otherTable) => otherTable.id !== table.id && tablesOverlap(table, otherTable, TABLE_COLLISION_GAP));

const distanceBetweenPoints = (
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => Math.hypot(a.x - b.x, a.y - b.y);

const findNearestOpenPosition = (
  table: Table,
  preferredPosition: { x: number; y: number },
  occupiedTables: Table[],
  bounds: ClassroomBounds,
): { x: number; y: number } => {
  const clampedPreferred = clampTablePosition(table, preferredPosition, bounds);
  const maxX = Math.max(0, bounds.width - table.dimensions.width);
  const maxY = Math.max(0, bounds.height - table.dimensions.height);

  const candidates: Array<{ x: number; y: number }> = [];
  const seen = new Set<string>();

  const addCandidate = (candidate: { x: number; y: number }) => {
    const clamped = clampTablePosition(table, candidate, bounds);
    const key = `${Math.round(clamped.x)}:${Math.round(clamped.y)}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    candidates.push(clamped);
  };

  addCandidate(clampedPreferred);

  for (let y = 0; y <= maxY; y += TABLE_POSITION_STEP) {
    for (let x = 0; x <= maxX; x += TABLE_POSITION_STEP) {
      addCandidate({ x, y });
    }
  }

  addCandidate({ x: maxX, y: 0 });
  addCandidate({ x: 0, y: maxY });
  addCandidate({ x: maxX, y: maxY });

  candidates.sort(
    (leftCandidate, rightCandidate) =>
      distanceBetweenPoints(leftCandidate, clampedPreferred) -
      distanceBetweenPoints(rightCandidate, clampedPreferred),
  );

  for (const candidate of candidates) {
    const testTable: Table = {
      ...table,
      position: candidate,
    };

    if (!hasTableCollision(testTable, occupiedTables)) {
      return candidate;
    }
  }

  return clampedPreferred;
};

const resolveDroppedTableLayout = (
  tables: Table[],
  droppedTableId: string,
  bounds: ClassroomBounds,
): Table[] => {
  const droppedTable = tables.find((table) => table.id === droppedTableId);
  if (!droppedTable) {
    return tables;
  }

  const fixedDroppedTable: Table = {
    ...droppedTable,
    position: clampTablePosition(droppedTable, droppedTable.position, bounds),
  };

  const resolvedTables: Table[] = [fixedDroppedTable];

  tables
    .filter((table) => table.id !== droppedTableId)
    .forEach((table) => {
      const clampedTable: Table = {
        ...table,
        position: clampTablePosition(table, table.position, bounds),
      };

      if (!hasTableCollision(clampedTable, resolvedTables)) {
        resolvedTables.push(clampedTable);
        return;
      }

      const shiftedPosition = findNearestOpenPosition(
        clampedTable,
        clampedTable.position,
        resolvedTables,
        bounds,
      );

      resolvedTables.push({
        ...clampedTable,
        position: shiftedPosition,
      });
    });

  const byId = new Map(resolvedTables.map((table) => [table.id, table]));
  return tables.map((table) => byId.get(table.id) ?? table);
};

const copyBlobToClipboard = async (blob: Blob) => {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Clipboard image API is not available');
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);
};

const App: React.FC = () => {
  const [classroomState, setClassroomState] = useState<ClassroomState | null>(null);
  const [swapModeStudent, setSwapModeStudent] = useState<string | null>(null);
  const [hideUIElements, setHideUIElements] = useState<boolean>(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState<boolean>(false);
  const [screenshotFeedback, setScreenshotFeedback] = useState<string | null>(null);
  const classroomAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!screenshotFeedback) return;

    const timeoutId = window.setTimeout(() => {
      setScreenshotFeedback(null);
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [screenshotFeedback]);

  const setClassroomAreaNode = useCallback((node: HTMLDivElement | null) => {
    classroomAreaRef.current = node;
  }, []);

  const getClassroomBounds = useCallback((): ClassroomBounds | null => {
    const classroomAreaNode = classroomAreaRef.current;
    if (!classroomAreaNode) return null;

    return {
      width: classroomAreaNode.clientWidth,
      height: classroomAreaNode.clientHeight,
    };
  }, []);

  const initializeClassroom = (data: {
    roster: string[];
    classSize: number;
    tableSize: number;
    numberOfTables: number;
    showTableDivider: boolean;
  }) => {
    const defaultTables = createDefaultTables(data.numberOfTables, data.tableSize);
    const savedLayout = loadSavedTableLayout(data.tableSize);

    const tables: Table[] = defaultTables.map((table) => {
      const savedEntry = savedLayout[table.id];
      return savedEntry
        ? {
            ...table,
            position: { x: savedEntry.x, y: savedEntry.y },
            ...(savedEntry.customName ? { customName: savedEntry.customName } : {}),
          }
        : table;
    });

    const students: Student[] = data.roster.map((name, index) => ({
      id: index.toString(),
      name,
      isLocked: false,
      tableId: null,
      position: { x: 0, y: 0 },
    }));

    const { students: assignedStudents, tables: updatedTables } = randomizeUnlockedStudents(
      students,
      tables,
    );

    setClassroomState({
      students: assignedStudents,
      tables: updatedTables,
      classSize: data.classSize,
      tableSize: data.tableSize,
      numberOfTables: data.numberOfTables,
      showTableDivider: data.showTableDivider,
    });
  };

  const handleStudentToggleLock = (studentId: string) => {
    if (!classroomState) return;

    const updatedStudents = classroomState.students.map((student) =>
      student.id === studentId ? { ...student, isLocked: !student.isLocked } : student,
    );

    const updatedTables = classroomState.tables.map((table) => ({
      ...table,
      students: updatedStudents.filter((student) => student.tableId === table.id),
    }));

    setClassroomState({
      ...classroomState,
      students: updatedStudents,
      tables: updatedTables,
    });
  };

  const handleStudentMove = (
    studentId: string,
    newPosition: { x: number; y: number },
    newTableId?: string | null,
  ) => {
    if (!classroomState) return;

    const updatedStudents = classroomState.students.map((student) => {
      if (student.id === studentId) {
        return {
          ...student,
          position: newPosition,
          tableId: newTableId === undefined ? student.tableId : newTableId,
        };
      }
      return student;
    });

    const updatedTables = classroomState.tables.map((table) => ({
      ...table,
      students: updatedStudents.filter((student) => student.tableId === table.id),
    }));

    setClassroomState({
      ...classroomState,
      students: updatedStudents,
      tables: updatedTables,
    });
  };

  const handleStudentSwap = (studentId1: string, studentId2: string) => {
    if (!classroomState) return;

    const student1 = classroomState.students.find((student) => student.id === studentId1);
    const student2 = classroomState.students.find((student) => student.id === studentId2);

    if (!student1 || !student2) return;

    const updatedStudents = classroomState.students.map((student) => {
      if (student.id === studentId1) {
        return {
          ...student,
          tableId: student2.tableId,
          position: student2.position,
        };
      }

      if (student.id === studentId2) {
        return {
          ...student,
          tableId: student1.tableId,
          position: student1.position,
        };
      }

      return student;
    });

    const updatedTables = classroomState.tables.map((table) => ({
      ...table,
      students: updatedStudents.filter((student) => student.tableId === table.id),
    }));

    setClassroomState({
      ...classroomState,
      students: updatedStudents,
      tables: updatedTables,
    });
  };

  const handleSwapButtonClick = (studentId: string) => {
    if (swapModeStudent === null) {
      setSwapModeStudent(studentId);
    } else if (swapModeStudent === studentId) {
      setSwapModeStudent(null);
    } else {
      handleStudentSwap(swapModeStudent, studentId);
      setSwapModeStudent(null);
    }
  };

  const handleTableMove = (tableId: string, position: { x: number; y: number }) => {
    setClassroomState((previousState) => {
      if (!previousState) return previousState;

      const updatedTables = previousState.tables.map((table) =>
        table.id === tableId ? { ...table, position } : table,
      );

      return {
        ...previousState,
        tables: updatedTables,
      };
    });
  };

  const handleTableMoveEnd = (tableId: string, position: { x: number; y: number }) => {
    setClassroomState((previousState) => {
      if (!previousState) return previousState;

      const movedTables = previousState.tables.map((table) =>
        table.id === tableId ? { ...table, position } : table,
      );

      const classroomBounds = getClassroomBounds();
      const finalizedTables = classroomBounds
        ? resolveDroppedTableLayout(movedTables, tableId, classroomBounds)
        : movedTables;

      saveTableLayout(previousState.tableSize, finalizedTables);

      return {
        ...previousState,
        tables: finalizedTables,
      };
    });
  };

  const handleTableResize = (tableId: string, dimensions: { width: number; height: number }) => {
    if (!classroomState) return;

    const updatedTables = classroomState.tables.map((table) =>
      table.id === tableId ? { ...table, dimensions } : table,
    );

    setClassroomState({
      ...classroomState,
      tables: updatedTables,
    });
  };

  const handleTableNameUpdate = (tableId: string, customName: string) => {
    setClassroomState((previousState) => {
      if (!previousState) return previousState;

      const normalizedName = customName.trim();
      const defaultName = `Table ${tableId}`;
      const persistedName =
        normalizedName.length > 0 && normalizedName !== defaultName ? normalizedName : undefined;

      const updatedTables = previousState.tables.map((table) =>
        table.id === tableId ? { ...table, customName: persistedName } : table,
      );

      saveTableLayout(previousState.tableSize, updatedTables);

      return {
        ...previousState,
        tables: updatedTables,
      };
    });
  };

  const handleRandomize = () => {
    if (!classroomState) return;

    const { students, tables } = randomizeUnlockedStudents(
      classroomState.students,
      classroomState.tables,
    );

    setClassroomState({
      ...classroomState,
      students,
      tables,
    });
  };

  const handleResetLayout = () => {
    if (!classroomState) return;

    const defaultTables = createDefaultTables(classroomState.numberOfTables, classroomState.tableSize);
    const defaultPositionById = new Map(defaultTables.map((table) => [table.id, table.position]));

    const resetTables = classroomState.tables.map((table) => {
      const defaultPosition = defaultPositionById.get(table.id);
      return {
        ...table,
        position: defaultPosition ?? table.position,
        customName: undefined,
      };
    });

    clearSavedTableLayout(classroomState.tableSize);

    setClassroomState({
      ...classroomState,
      tables: resetTables,
    });
  };

  const handleCopyCleanScreenshot = async () => {
    if (!classroomAreaRef.current || isCapturingScreenshot) return;

    const previousHideUI = hideUIElements;
    setIsCapturingScreenshot(true);
    setHideUIElements(true);

    try {
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

      const canvas = await html2canvas(classroomAreaRef.current, {
        backgroundColor: '#f1f2f6',
        useCORS: true,
        scale: Math.max(2, window.devicePixelRatio || 1),
        logging: false,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((createdBlob) => resolve(createdBlob), 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to create screenshot blob');
      }

      await copyBlobToClipboard(blob);
      setScreenshotFeedback('✅ Screenshot copied to clipboard');
    } catch (error) {
      console.error(error);
      setScreenshotFeedback('❌ Could not copy screenshot. Check clipboard permissions.');
    } finally {
      setHideUIElements(previousHideUI);
      setIsCapturingScreenshot(false);
    }
  };

  const resetClassroom = () => {
    setClassroomState(null);
    setSwapModeStudent(null);
  };

  if (!classroomState) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Seating Chart Application</h1>
        <InputForm onSubmit={initializeClassroom} />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
        }}
      >
        <button
          onClick={resetClassroom}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '5px 15px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
          }}
        >
          New Chart
        </button>
        <span>
          Class Size: {classroomState.classSize} | Table Size: {classroomState.tableSize} | Tables:{' '}
          {classroomState.numberOfTables}
        </span>
      </div>

      <ClassroomLayout
        tables={classroomState.tables}
        showTableDivider={classroomState.showTableDivider}
        onTableMove={handleTableMove}
        onTableMoveEnd={handleTableMoveEnd}
        onTableResize={handleTableResize}
        onTableNameUpdate={handleTableNameUpdate}
        students={classroomState.students}
        onStudentToggleLock={handleStudentToggleLock}
        onStudentMove={handleStudentMove}
        onStudentSwap={handleStudentSwap}
        onSwapButtonClick={handleSwapButtonClick}
        swapModeStudent={swapModeStudent}
        onRandomize={handleRandomize}
        hideUIElements={hideUIElements}
        onToggleUIElements={() => setHideUIElements(!hideUIElements)}
        onCopyCleanScreenshot={handleCopyCleanScreenshot}
        onResetLayout={handleResetLayout}
        isCapturingScreenshot={isCapturingScreenshot}
        screenshotFeedback={screenshotFeedback}
        onClassroomAreaRef={setClassroomAreaNode}
      />
    </div>
  );
};

export default App;
