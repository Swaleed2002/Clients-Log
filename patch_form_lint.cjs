const fs = require('fs');
let c = fs.readFileSync('src/components/WorkEntryForm.tsx', 'utf8');

c = c.replace(
  /setTravelStart\(''\);\n\s*setTravelStop\(''\);/,
  "setTravelSegments([]);\n      setCurrentTravelStart('');"
);

c = c.replace(
  /lunchDurationMinutes: calculateDuration\(lunchStart, lunchEnd\),/,
  "lunchDurationMinutes: calculateDuration(lunchStart, lunchEnd).totalMinutes,"
);

c = c.replace(
  /const travelDur = calculateDuration\(travelStart, travelStop\);/,
  "const travelDur = calculateDuration(travelSegments.length > 0 ? travelSegments[0].start : '', travelSegments.length > 0 ? travelSegments[travelSegments.length - 1].end : '');"
);

c = c.replace(
  /<section className=\{cn\("bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-opacity", \(workType !== 'Workshop' && !travelStop\) \? "opacity-50 pointer-events-none" : "opacity-100"\)\}>/,
  `<section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">`
);

fs.writeFileSync('src/components/WorkEntryForm.tsx', c);
