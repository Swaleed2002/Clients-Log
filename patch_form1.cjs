const fs = require('fs');
let c = fs.readFileSync('src/components/WorkEntryForm.tsx', 'utf8');

// Insert lunch state
c = c.replace(/const \[jobStart.*?\n.*?isEditingJob.*?\n/s, 
  "const [jobStart, setJobStart] = useState(initialData?.jobStart || '');\n  const [jobStop, setJobStop] = useState(initialData?.jobStop || (initialData as any)?.jobEnd || '');\n  const [isEditingJob, setIsEditingJob] = useState(false);\n\n  const [lunchStart, setLunchStart] = useState(initialData?.lunchStart || '');\n  const [lunchEnd, setLunchEnd] = useState(initialData?.lunchEnd || '');\n  const [isEditingLunch, setIsEditingLunch] = useState(false);\n");

// Insert lunch into onSave payload
c = c.replace(/jobStop,\s+jobCategory,/s,
  "jobStop,\n      lunchStart: lunchStart || null,\n      lunchEnd: lunchEnd || null,\n      lunchDurationMinutes: calculateDuration(lunchStart, lunchEnd),\n      jobCategory,");

fs.writeFileSync('src/components/WorkEntryForm.tsx', c);
