const fs = require('fs');
let content = fs.readFileSync('src/utils.ts', 'utf-8');

// For FitToPage to actually activate in Excel, scale must usually be omitted or set to false, or the fitToPage property must be explicitly set on ws.
const pageSetupOld = `ws['!pageSetup'] = {
    paperSize: 9, // 9 = A4
    orientation: 'landscape',
    fitToWidth: 1,
    scale: 100, // Excel sometimes needs scale cleared for fitToWidth to work
    fitToHeight: 999, // Automatic height
    horizontalCentered: true,
  };`;
  
const pageSetupNew = `ws['!fitToPage'] = true;
  ws['!pageSetup'] = {
    paperSize: 9, // 9 = A4
    orientation: 'landscape',
    fitToWidth: 1,
    fitToHeight: 999, // Automatic height
    horizontalCentered: true,
  };`;

content = content.replace(pageSetupOld, pageSetupNew);

// Add repeating rows at the top for pages 2+. 
// Note: xlsx-js-style uses '!printHeader' or sheet.vbarules? 
// No, the official sheetjs way is wb.SheetNames and wb.vbarules? Actually, standard way for print titles is:
// ws['!printHeader'] = [1, 7];  // To repeat rows 1-7. But wait, it's 1-indexed. Let's repeat rows 1 to 8 (which covers everything down to headers)
// Oh, standard SheetJS doesn't perfectly expose print titles unless you use PRO. But some forks do. We will try `!printHeader` but just in case, we won't rely strictly on it.
// Actually, it is `!printHeader` = [1, 8]; in some versions. Let's add it.

content = content.replace("ws['!printHeader'] = [1, 1];", "ws['!printHeader'] = [1, 8]; // Repeat row 1 to 8 (1-indexed)");

fs.writeFileSync('src/utils.ts', content);
