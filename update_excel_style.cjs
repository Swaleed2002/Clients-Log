const fs = require('fs');

let content = fs.readFileSync('src/utils.ts', 'utf-8');

// Replace the import
content = content.replace(/import \* as XLSX from 'xlsx';/, "import * as XLSX from 'xlsx-js-style';");

// Locate the part where ws is created and styling should be applied
const searchStr = "const ws = XLSX.utils.aoa_to_sheet(aoa);";
const replacementStr = `const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Apply Styling
  const range = XLSX.utils.decode_range(ws['!ref']!);
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      let cell = ws[cellRef];
      
      // If cell doesn't exist but it's in the table area (headers or data), create an empty one for borders
      if (!cell && R >= 6) {
        cell = { t: 's', v: '' };
        ws[cellRef] = cell;
      }
      
      if (!cell) continue;
      
      if (!cell.s) cell.s = {};
      
      // Titles and Info
      if (R === 0 && C === 0) {
        cell.s.font = { bold: true, sz: 18 }; // WEEKLY REPORT
      } else if (R === 2) {
        cell.s.font = { bold: true, sz: 14 }; // Name and ID
      } else if (R === 4) {
        cell.s.font = { bold: true, sz: 12 }; // Period / Date
      }
      
      // Headers (Row 6 and 7, 0-indexed)
      if (R === 6 || R === 7) {
        cell.s.font = { bold: true, sz: 11 };
        cell.s.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
        cell.s.border = {
          top: { style: 'thick', color: { rgb: "000000" } },
          bottom: { style: 'thick', color: { rgb: "000000" } },
          left: { style: 'thick', color: { rgb: "000000" } },
          right: { style: 'thick', color: { rgb: "000000" } }
        };
      }
      
      // Data Cells (Row 8 and below)
      if (R >= 8) {
        cell.s.font = { sz: 11 };
        cell.s.alignment = { vertical: 'top', wrapText: true };
        
        // Center time columns and date
        if (C === 0 || (C >= 3 && C <= 6)) {
          cell.s.alignment.horizontal = 'center';
        }
        
        cell.s.border = {
          top: { style: 'thin', color: { rgb: "000000" } },
          bottom: { style: 'thin', color: { rgb: "000000" } },
          left: { style: 'thin', color: { rgb: "000000" } },
          right: { style: 'thin', color: { rgb: "000000" } }
        };
      }
    }
  }`;

content = content.replace(searchStr, replacementStr);

// Let's also adjust the column widths slightly to ensure they're perfect for the text
const oldWscols = `const wscols = [
    { wch: 15 }, // A: Date
    { wch: 30 }, // B: Customer
    { wch: 20 }, // C: Location
    { wch: 10 }, // D: Travel From
    { wch: 10 }, // E: Travel To
    { wch: 10 }, // F: Job From
    { wch: 10 }, // G: Job To
    { wch: 45 }, // H: Job Carried Out
    { wch: 15 }  // I: Checked By
  ];`;
  
const newWscols = `const wscols = [
    { wch: 12 }, // A: Date
    { wch: 25 }, // B: Customer
    { wch: 20 }, // C: Location
    { wch: 10 }, // D: Travel From
    { wch: 10 }, // E: Travel To
    { wch: 10 }, // F: Job From
    { wch: 10 }, // G: Job To
    { wch: 45 }, // H: Job Carried Out
    { wch: 15 }  // I: Checked By
  ];`;
  
content = content.replace(oldWscols, newWscols);

fs.writeFileSync('src/utils.ts', content);
console.log("Updated utils.ts with styles successfully");
