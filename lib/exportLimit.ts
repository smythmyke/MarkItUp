const STORAGE_KEY = 'markitup:directExports';
const DAILY_LIMIT = 10;

interface ExportRecord {
  date: string;
  count: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function getRecord(): ExportRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const record: ExportRecord = JSON.parse(raw);
      if (record.date === today()) return record;
    }
  } catch { /* ignore corrupt data */ }
  return { date: today(), count: 0 };
}

export function canDirectExport(): boolean {
  return getRecord().count < DAILY_LIMIT;
}

export function getDirectExportRemaining(): number {
  return Math.max(0, DAILY_LIMIT - getRecord().count);
}

export function incrementDirectExport(): void {
  const record = getRecord();
  record.count += 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}
