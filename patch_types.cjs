const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace(
  /travelStop: string;\n\s*jobStart: string;/,
  "travelStop: string;\n  travelSegments?: { start: string; end: string; durationMinutes: number }[];\n  \n  jobStart: string;"
);
fs.writeFileSync('src/types.ts', content);
