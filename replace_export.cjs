const fs = require('fs');

const content = fs.readFileSync('src/utils.ts', 'utf-8');
const startIndex = content.indexOf('export function exportToExcel');

const newExportFunc = `export function exportToExcel(
  entries: WorkEntry[], 
  weekStart: Date, 
  userMap?: Record<string, string>,
  currentProfile?: { fullName: string; userId: string },
  selectedReportUser?: string
) {
  // Determine period
  let minDate: Date;
  let maxDate: Date;
  
  if (entries.length > 0) {
    const sorted = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    minDate = parseISO(sorted[0].date);
    maxDate = parseISO(sorted[sorted.length - 1].date);
  } else {
    minDate = startOfWeek(weekStart, { weekStartsOn: 1 });
    maxDate = endOfWeek(weekStart, { weekStartsOn: 1 });
  }
  
  const periodStr = \`\${format(minDate, 'dd-MMM-yyyy')} - \${format(maxDate, 'dd-MMM-yyyy')}\`;
  
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
  aoa.push([\`Name: \${engineerName}\`, "", "", "", "", \`ID: \${engineerId}\`]);
  aoa.push([]);
  aoa.push([\`Period / Date: \${periodStr}\`]);
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
         
       jobCarriedOut = jobCarriedOut ? \`\${deliveryText} / \${jobCarriedOut}\` : deliveryText;
    }
    
    if (entry.remarks) {
      jobCarriedOut += jobCarriedOut ? \` (Remarks: \${entry.remarks})\` : \`(Remarks: \${entry.remarks})\`;
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
  
  // Merges
  // Row 6 (0-indexed) is the first header row:
  // D=3, E=4 (Travel Time)
  // F=5, G=6 (Job Time)
  ws['!merges'] = [
    { s: { r: 6, c: 3 }, e: { r: 6, c: 4 } },
    { s: { r: 6, c: 5 }, e: { r: 6, c: 6 } }
  ];
  
  // Column Widths
  const wscols = [
    { wch: 15 }, // A: Date
    { wch: 30 }, // B: Customer
    { wch: 20 }, // C: Location
    { wch: 10 }, // D: Travel From
    { wch: 10 }, // E: Travel To
    { wch: 10 }, // F: Job From
    { wch: 10 }, // G: Job To
    { wch: 45 }, // H: Job Carried Out
    { wch: 15 }  // I: Checked By
  ];
  
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Weekly Report');

  const filename = \`Weekly_Report_\${engineerName.replace(/[^a-zA-Z0-9]/g, '_')}_\${format(new Date(), 'yyyy-MM-dd')}.xlsx\`;
  XLSX.writeFile(wb, filename);
}
`;

const newContent = content.substring(0, startIndex) + newExportFunc;
fs.writeFileSync('src/utils.ts', newContent);
console.log("Updated utils.ts successfully");
