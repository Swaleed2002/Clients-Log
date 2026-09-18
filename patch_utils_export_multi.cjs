const fs = require('fs');
let c = fs.readFileSync('src/utils.ts', 'utf8');

c = c.replace(
  /const travelFrom = isWorkshop \? "" : \(entry\.travelStart \|\| \(entry as any\)\.travelToStart \|\| "-"\);\n\s*const travelTo = isWorkshop \? "" : \(entry\.travelStop \|\| \(entry as any\)\.travelToEnd \|\| "-"\);/,
  `let travelFrom = "-";
    let travelTo = "-";
    if (!isWorkshop) {
      if ((entry as any).travelSegments && (entry as any).travelSegments.length > 0) {
        travelFrom = (entry as any).travelSegments.map((s: any) => s.start).join(", ");
        travelTo = (entry as any).travelSegments.map((s: any) => s.end).join(", ");
      } else {
        travelFrom = entry.travelStart || (entry as any).travelToStart || "-";
        travelTo = entry.travelStop || (entry as any).travelToEnd || "-";
      }
    }`
);

fs.writeFileSync('src/utils.ts', c);
