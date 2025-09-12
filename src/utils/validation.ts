export const calculateMinTables = (classSize: number, tableSize: number): number => {
  return Math.ceil(classSize / tableSize);
};

export const validateTableCount = (
  classSize: number,
  tableSize: number,
  desiredTables?: number
): { isValid: boolean; minTables: number; actualTables: number } => {
  const minTables = calculateMinTables(classSize, tableSize);
  const actualTables = desiredTables ?? minTables;
  
  return {
    isValid: actualTables >= minTables,
    minTables,
    actualTables
  };
};
