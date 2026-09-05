const fs = require('fs');

const content = fs.readFileSync('src/utils.ts', 'utf-8');

const newExportFunc = `export function exportToExcel(
  entries: WorkEntry[], 
  weekStart: Date, 
  userMap?: Record<string, string>, 
  currentProfile?: { fullName: string; userId: string },
  selectedReportUser?: string
) {
  const { startOfWeek, endOfWeek } = require('date-fns');

  // Determine period based on entries, or fallback to weekStart
  let minDate: Date;
  let maxDate: Date;
  
  if (entries.length > 0) {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    minDate = parseISO(sorted[0].date);
    maxDate = parseISO(sorted[sorted.length - 1].date);
  } else {
    // If startOfWeek/endOfWeek are not imported at top, this is safe since date-fns is imported in utils usually
    // Wait, date-fns imports format, parseISO in utils. I will add startOfWeek, endOfWeek there.
    minDate = weekStart; // Fallback without startOfWeek for a moment, let's fix imports
    maxDate = weekStart;
  }
}
`;
