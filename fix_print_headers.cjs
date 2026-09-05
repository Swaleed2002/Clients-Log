const fs = require('fs');
let content = fs.readFileSync('src/utils.ts', 'utf-8');

// I also need to ensure that the xlsx export sets FitToPage correctly and handles repeating rows.
// SheetJS page setup:
// ws['!fitToPage'] = true; (sometimes needed in addition to fitToWidth)
// and repeating rows can be set via wb.vbarules or similar in some versions, but standard is:
// ws['!margins']...

content = content.replace("fitToWidth: 1,", "fitToWidth: 1,\n    scale: 100, // Excel sometimes needs scale cleared for fitToWidth to work");

// Actually, wait, let's just make sure we center the title correctly.
const centerTitleStr = "cell.s.font = { bold: true, sz: 18 }; // WEEKLY REPORT";
const centerTitleRep = "cell.s.font = { bold: true, sz: 18 };\n        cell.s.alignment = { horizontal: 'center' };";
content = content.replace(centerTitleStr, centerTitleRep);

fs.writeFileSync('src/utils.ts', content);
