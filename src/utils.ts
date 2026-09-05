import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WorkEntry, TimeDuration } from './types';
import * as XLSX from 'xlsx-js-style';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateDuration(start: string, end: string): TimeDuration {
  if (!start || !end) return { hours: 0, minutes: 0, totalMinutes: 0 };
  
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  
  let startTotalM = startH * 60 + startM;
  let endTotalM = endH * 60 + endM;
  
  if (endTotalM < startTotalM) {
    endTotalM += 24 * 60;
  }
  
  const totalMinutes = endTotalM - startTotalM;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return { hours, minutes, totalMinutes };
}

export function formatDuration(duration: TimeDuration): string {
  if (duration.totalMinutes === 0) return '-';
  const h = duration.hours > 0 ? `${duration.hours}h ` : '';
  const m = duration.minutes > 0 ? `${duration.minutes}m` : '';
  return (h + m).trim() || '0m';
}

export function calculateEntryTotals(entry: any) {
  // Safe fallback for old entries during transition
  const tStart = entry.travelStart || entry.travelToStart || '';
  const tStop = entry.travelStop || entry.travelToEnd || '';
  const jStart = entry.jobStart || '';
  const jStop = entry.jobStop || entry.jobEnd || '';

  const travel = calculateDuration(tStart, tStop);
  const job = calculateDuration(jStart, jStop);
  
  const totalWorkAndTravelMinutes = travel.totalMinutes + job.totalMinutes;
  
  return {
    travel,
    job,
    totalWorkAndTravelMinutes
  };
}

export function exportToExcel(
  entries: WorkEntry[], 
  weekStart: Date, 
  userMap?: Record<string, string>,
  currentProfile?: { fullName: string; userId: string },
  selectedReportUser?: string
) {
  // Determine period strictly based on the selected weekStart
  const minDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  const maxDate = endOfWeek(weekStart, { weekStartsOn: 1 });
  
  const periodStr = `${format(minDate, 'dd-MMM-yyyy')} - ${format(maxDate, 'dd-MMM-yyyy')}`;
  
  // Determine Name and ID
  let engineerName = "";
  let engineerId = "";
  
  if (selectedReportUser && selectedReportUser !== 'ALL') {
    engineerId = selectedReportUser;
    engineerName = userMap?.[selectedReportUser] || engineerId;
  } else if (selectedReportUser === 'ALL') {
    engineerName = "All Engineers";
    engineerId = "ALL";
  } else if (currentProfile) {
    engineerName = currentProfile.fullName;
    engineerId = currentProfile.userId;
  }
  
  const aoa: any[][] = [];
  
  // Title
  aoa.push(["WEEKLY REPORT"]);
  aoa.push([]); // blank
  
  // Info rows
  aoa.push([`Name: ${engineerName}`, "", "", "", "", `ID: ${engineerId}`]);
  aoa.push([]);
  aoa.push([`Period / Date: ${periodStr}`]);
  aoa.push([]);
  
  // Main Table Headers
  aoa.push([
    "Date", "Customer", "Location", 
    "Travel Time", "", 
    "Job Time", "", 
    "Job Carried Out", "Checked By"
  ]);
  
  // Sub Headers
  aoa.push([
    "", "", "", 
    "From", "To", 
    "From", "To", 
    "", ""
  ]);
  
  // Data Rows
  entries.forEach(entry => {
    const dateObj = parseISO(entry.date);
    
    const isWorkshop = entry.workType === 'Workshop';
    const isDelivery = entry.workType === 'Delivery';
    
    const customer = isWorkshop ? "Workshop Jobs" : entry.customerName;
    const location = isWorkshop ? "Workshop" : entry.location;
    
    const travelFrom = isWorkshop ? "" : (entry.travelStart || (entry as any).travelToStart || "-");
    const travelTo = isWorkshop ? "" : (entry.travelStop || (entry as any).travelToEnd || "-");
    
    const jobFrom = entry.jobStart || "-";
    const jobTo = entry.jobStop || (entry as any).jobEnd || "-";
    
    let jobCarriedOut = entry.jobCategory || "";
    if (isDelivery) {
       const deliveryText = entry.deliveryType === 'Delivery of Consumables' 
         ? 'Delivery of Consumables' 
         : entry.deliveryType === 'Delivery of Parts' 
         ? 'Delivery of Parts' 
         : entry.workType;
         
       jobCarriedOut = jobCarriedOut ? `${deliveryText} / ${jobCarriedOut}` : deliveryText;
    }
    
    if (entry.remarks) {
      jobCarriedOut += jobCarriedOut ? ` (Remarks: ${entry.remarks})` : `(Remarks: ${entry.remarks})`;
    }
    
    aoa.push([
      format(dateObj, 'dd-MMM-yyyy'),
      customer,
      location,
      travelFrom,
      travelTo,
      jobFrom,
      jobTo,
      jobCarriedOut,
      "" // Checked By
    ]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(aoa);

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
        cell.s.font = { bold: true, sz: 18 };
        cell.s.alignment = { horizontal: 'center' };
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
  }
  
  // Merges
  // Row 6 (0-indexed) is the first header row:
  // D=3, E=4 (Travel Time)
  // F=5, G=6 (Job Time)
  ws['!merges'] = [
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
  ];
  
  // Column Widths
  const wscols = [
    { wch: 12 }, // A: Date
    { wch: 25 }, // B: Customer
    { wch: 20 }, // C: Location
    { wch: 10 }, // D: Travel From
    { wch: 10 }, // E: Travel To
    { wch: 10 }, // F: Job From
    { wch: 10 }, // G: Job To
    { wch: 45 }, // H: Job Carried Out
    { wch: 15 }  // I: Checked By
  ];
  
  ws['!cols'] = wscols;

  
  // --- PRINT SETTINGS ---
  ws['!fitToPage'] = true;
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
  ws['!printHeader'] = [1, 8]; // Repeat row 1 to 8 (1-indexed) // To print the first row (WEEKLY REPORT) - wait, let's just repeat the table headers
  // The table headers are at row 7 and 8 (index 6 and 7).
  // But wait, the standard library only supports repeating rows using '!printHeader' as an array of [startRow, endRow] (1-indexed? no, maybe it doesn't support it directly like this, let's stick to standard xlsx features that exist).
  // The actual property for repeating rows is ws['!printHeader'] = [7, 8]; (if 1-indexed, it's [7, 8])
  
  // Actually, sheetjs uses !pageSetup for fitToWidth etc.

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');

  const filename = `Weekly_Report_${engineerName.replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}
