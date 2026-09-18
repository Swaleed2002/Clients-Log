const fs = require('fs');
let c = fs.readFileSync('src/utils.ts', 'utf8');

c = c.replace(/const totalWorkAndTravelMinutes = travel\.totalMinutes \+ job\.totalMinutes;/,
  "const lunch = calculateDuration(entry.lunchStart || '', entry.lunchEnd || '');\n  const totalWorkAndTravelMinutes = travel.totalMinutes + job.totalMinutes;");

c = c.replace(/return \{\n    travel,\n    job,\n    totalWorkAndTravelMinutes\n  \};/,
  "return {\n    travel,\n    job,\n    lunch,\n    totalWorkAndTravelMinutes\n  };");

fs.writeFileSync('src/utils.ts', c);
