const fs = require('fs');
let c = fs.readFileSync('src/utils.ts', 'utf8');

c = c.replace(
  /export function calculateEntryTotals\(entry: any\) \{\n\s*\/\/ Safe fallback for old entries during transition\n\s*const tStart = entry\.travelStart \|\| entry\.travelToStart \|\| '';\n\s*const tStop = entry\.travelStop \|\| entry\.travelToEnd \|\| '';\n\s*const jStart = entry\.jobStart \|\| '';\n\s*const jStop = entry\.jobStop \|\| entry\.jobEnd \|\| '';\n\n\s*const travel = calculateDuration\(tStart, tStop\);\n\s*const job = calculateDuration\(jStart, jStop\);/,
  `export function calculateEntryTotals(entry: any) {
  let totalTravelMins = 0;
  if (entry.travelSegments && Array.isArray(entry.travelSegments) && entry.travelSegments.length > 0) {
    totalTravelMins = entry.travelSegments.reduce((sum, seg) => sum + (seg.durationMinutes || 0), 0);
  } else {
    const tStart = entry.travelStart || entry.travelToStart || '';
    const tStop = entry.travelStop || entry.travelToEnd || '';
    totalTravelMins = calculateDuration(tStart, tStop).totalMinutes;
  }
  
  const jStart = entry.jobStart || '';
  const jStop = entry.jobStop || entry.jobEnd || '';
  const job = calculateDuration(jStart, jStop);
  
  const travel = {
    hours: Math.floor(totalTravelMins / 60),
    minutes: totalTravelMins % 60,
    totalMinutes: totalTravelMins
  };`
);

fs.writeFileSync('src/utils.ts', c);
