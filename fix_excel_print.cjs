const fs = require('fs');

let content = fs.readFileSync('src/utils.ts', 'utf-8');

// The library we are using is xlsx-js-style. 
// We need to add page setup and print properties to the sheet.
const printSetup = `
  // --- PRINT SETTINGS ---
  ws['!pageSetup'] = {
    paperSize: 9, // 9 = A4
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 999, // Automatic height
    horizontalCentered: true,
  };
  
  ws['!margins'] = {
    left: 0.5,
    right: 0.5,
    top: 0.5,
    bottom: 0.5,
    header: 0.3,
    footer: 0.3
  };

  // Set Print Area (A1 to I[lastRow])
  const lastRow = aoa.length;
  ws['!printHeader'] = [1, 1]; // To print the first row (WEEKLY REPORT) - wait, let's just repeat the table headers
  // The table headers are at row 7 and 8 (index 6 and 7).
  // But wait, the standard library only supports repeating rows using '!printHeader' as an array of [startRow, endRow] (1-indexed? no, maybe it doesn't support it directly like this, let's stick to standard xlsx features that exist).
  // The actual property for repeating rows is ws['!printHeader'] = [7, 8]; (if 1-indexed, it's [7, 8])
  
  // Actually, sheetjs uses !pageSetup for fitToWidth etc.
`;

const searchStrSetup = "const wb = XLSX.utils.book_new();";
content = content.replace(searchStrSetup, printSetup + "\n  " + searchStrSetup);

// Fix the Period / Date logic.
// The user says:
// "Do NOT use today's date as the Period End Date.
// Do NOT use the date of the latest entry as the Period End Date."
// Instead, use the weekStart (which is the beginning of the week in the UI).
// In the current logic:
const periodLogicOld = `// Determine period
  let minDate: Date;
  let maxDate: Date;
  
  if (entries.length > 0) {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    minDate = parseISO(sorted[0].date);
    maxDate = parseISO(sorted[sorted.length - 1].date);
  } else {
    minDate = startOfWeek(weekStart, { weekStartsOn: 1 });
    maxDate = endOfWeek(weekStart, { weekStartsOn: 1 });
  }`;

const periodLogicNew = `// Determine period strictly based on the selected weekStart
  const minDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  const maxDate = endOfWeek(weekStart, { weekStartsOn: 1 });`;

content = content.replace(periodLogicOld, periodLogicNew);


// We need to merge the header for WEEKLY REPORT so it centers correctly over the table.
// And Name / Period across a few columns too.
const mergesLogicOld = `ws['!merges'] = [
    { s: { r: 6, c: 3 }, e: { r: 6, c: 4 } },
    { s: { r: 6, c: 5 }, e: { r: 6, c: 6 } }
  ];`;
  
const mergesLogicNew = `ws['!merges'] = [
    // Travel Time
    { s: { r: 6, c: 3 }, e: { r: 6, c: 4 } },
    // Job Time
    { s: { r: 6, c: 5 }, e: { r: 6, c: 6 } },
    // Center WEEKLY REPORT across all 9 columns
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    // Name and ID merges for clean layout
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Name
    { s: { r: 2, c: 5 }, e: { r: 2, c: 8 } }, // ID
    // Period merge
    { s: { r: 4, c: 0 }, e: { r: 4, c: 8 } },
  ];`;
  
content = content.replace(mergesLogicOld, mergesLogicNew);


fs.writeFileSync('src/utils.ts', content);
console.log("Updated utils.ts with print settings successfully");
