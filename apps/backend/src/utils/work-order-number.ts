// apps/backend/src/utils/work-order-number.ts

let localSequence = 1;

export function formatWorkOrderNumber(sequenceNum: number, date = new Date()): string {
  const year = date.getFullYear();
  const padded = String(sequenceNum).padStart(5, '0');
  return `WO-${year}-${padded}`;
}

export function generateNextLocalWorkOrderNumber(date = new Date()): string {
  const num = formatWorkOrderNumber(localSequence, date);
  localSequence += 1;
  return num;
}
