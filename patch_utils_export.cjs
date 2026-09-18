const fs = require('fs');
let c = fs.readFileSync('src/utils.ts', 'utf8');

c = c.replace(
  /"Travel Time", "", \n\s*"Job Time", "", \n\s*"Job Carried Out", "Checked By"/,
  '"Travel Time", "", \n    "Job Time", "", \n    "Lunch Time", "", \n    "Job Carried Out", "Checked By"'
);

c = c.replace(
  /"From", "To", \n\s*"From", "To", \n\s*"", ""/,
  '"From", "To", \n    "From", "To", \n    "From", "To", \n    "", ""'
);

c = c.replace(
  /const jobFrom = entry\.jobStart \|\| "-";\n\s*const jobTo = entry\.jobStop \|\| \(entry as any\)\.jobEnd \|\| "-";/,
  `const jobFrom = entry.jobStart || "-";\n    const jobTo = entry.jobStop || (entry as any).jobEnd || "-";\n    const lunchFrom = entry.lunchStart || "-";\n    const lunchTo = entry.lunchEnd || "-";`
);

c = c.replace(
  /jobFrom,\n\s*jobTo,\n\s*jobCarriedOut,\n\s*"" \/\/ Checked By/,
  `jobFrom,\n      jobTo,\n      lunchFrom,\n      lunchTo,\n      jobCarriedOut,\n      "" // Checked By`
);

c = c.replace(
  /\/\/ Center WEEKLY REPORT across all 9 columns\n\s*\{ s: \{ r: 0, c: 0 \}, e: \{ r: 0, c: 8 \} \},\n\s*\/\/ Name and ID merges for clean layout\n\s*\{ s: \{ r: 2, c: 0 \}, e: \{ r: 2, c: 3 \} \}, \/\/ Name\n\s*\{ s: \{ r: 2, c: 5 \}, e: \{ r: 2, c: 8 \} \}, \/\/ ID\n\s*\/\/ Period merge\n\s*\{ s: \{ r: 4, c: 0 \}, e: \{ r: 4, c: 8 \} \},/,
  `// Lunch Time\n    { s: { r: 6, c: 7 }, e: { r: 6, c: 8 } },\n    // Center WEEKLY REPORT across all 11 columns\n    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },\n    // Name and ID merges for clean layout\n    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Name\n    { s: { r: 2, c: 7 }, e: { r: 2, c: 10 } }, // ID\n    // Period merge\n    { s: { r: 4, c: 0 }, e: { r: 4, c: 10 } },`
);

c = c.replace(
  /\{ wch: 10 \}, \/\/ D: Travel From\n\s*\{ wch: 10 \}, \/\/ E: Travel To\n\s*\{ wch: 10 \}, \/\/ F: Job From\n\s*\{ wch: 10 \}, \/\/ G: Job To\n\s*\{ wch: 35 \}, \/\/ H: Job Carried Out\n\s*\{ wch: 15 \}  \/\/ I: Checked By/,
  `{ wch: 10 }, // D: Travel From\n    { wch: 10 }, // E: Travel To\n    { wch: 10 }, // F: Job From\n    { wch: 10 }, // G: Job To\n    { wch: 10 }, // H: Lunch From\n    { wch: 10 }, // I: Lunch To\n    { wch: 35 }, // J: Job Carried Out\n    { wch: 15 }  // K: Checked By`
);

// ws['!printHeader'] = [1, 8];
// Oh, the length is not 9 anymore, let's fix the header merge in another way if needed.
fs.writeFileSync('src/utils.ts', c);
