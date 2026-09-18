const fs = require('fs');
let c = fs.readFileSync('src/components/WorkEntryForm.tsx', 'utf8');

c = c.replace(
  /const \[travelStart, setTravelStart\] = useState\(initialData\?\.travelStart \|\| \(initialData as any\)\?\.travelToStart \|\| ''\);\n\s*const \[travelStop, setTravelStop\] = useState\(initialData\?\.travelStop \|\| \(initialData as any\)\?\.travelToEnd \|\| ''\);/,
  `const [travelSegments, setTravelSegments] = useState<{start: string; end: string; durationMinutes: number}[]>(() => {
    if (initialData?.travelSegments) return initialData.travelSegments;
    const oldStart = initialData?.travelStart || (initialData as any)?.travelToStart || '';
    const oldStop = initialData?.travelStop || (initialData as any)?.travelToEnd || '';
    if (oldStart && oldStop) {
      return [{ start: oldStart, end: oldStop, durationMinutes: calculateDuration(oldStart, oldStop) }];
    }
    return [];
  });
  const [currentTravelStart, setCurrentTravelStart] = useState(() => {
    if (!initialData?.travelSegments) {
       const oldStart = initialData?.travelStart || (initialData as any)?.travelToStart || '';
       const oldStop = initialData?.travelStop || (initialData as any)?.travelToEnd || '';
       if (oldStart && !oldStop) return oldStart;
    }
    return '';
  });`
);

c = c.replace(
  /if \(!date \|\| !workType \|\| !jobCategory\) \{\n\s*alert\('Please fill Date, Work Type, and Job Category'\);\n\s*return;\n\s*\}/,
  `if (!date || !workType) {
      alert('Please fill Date and Work Type');
      return;
    }
    if (jobStart && !jobCategory) {
      alert('Please fill Job Category as a job was started');
      return;
    }`
);

// update handleSave
c = c.replace(
  /travelStart,\n\s*travelStop,/,
  `travelStart: travelSegments.length > 0 ? travelSegments[0].start : '',
      travelStop: travelSegments.length > 0 ? travelSegments[travelSegments.length - 1].end : '',
      travelSegments,`
);

c = c.replace(
  /const jobDur = calculateDuration\(jobStart, jobStop\);/,
  `const jobDur = calculateDuration(jobStart, jobStop);
  
  const isTravelRunning = !!currentTravelStart;
  const isJobRunning = !!(jobStart && !jobStop);
  const isLunchRunning = !!(lunchStart && !lunchEnd);

  const canStartTravel = !isJobRunning && !isLunchRunning;
  const canStartJob = !isTravelRunning && !isLunchRunning;
  const canStartLunch = !isTravelRunning && !isJobRunning;
`
);


// Replace Travel Section completely
const travelOldRegex = /\{\/\* Travel Section \*\/\}.*?\{\/\* Job Section \*\/\}/s;
const travelNewCode = `{/* Travel Section */}
        {workType !== 'Workshop' && (
          <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-2 text-red-600" /> Travel
              </h3>
              {travelSegments.length > 0 && (
                 <button onClick={() => setIsEditingTravel(!isEditingTravel)} className="text-gray-400 hover:text-red-600 p-1">
                   <Pencil className="w-4 h-4" />
                 </button>
              )}
            </div>

            {!isTravelRunning ? (
              <button 
                onClick={() => setCurrentTravelStart(getCurrentTimeHHmm())}
                disabled={!canStartTravel}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-colors border-2",
                  canStartTravel 
                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300"
                    : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                )}
              >
                <PlayCircle className="w-6 h-6 mr-2" /> START TRAVEL
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-red-700 bg-red-50 py-2 rounded-lg">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                  <span className="font-semibold text-sm">TRAVEL IN PROGRESS (Started {currentTravelStart})</span>
                </div>
                <button 
                  onClick={() => {
                    const stop = getCurrentTimeHHmm();
                    setTravelSegments(prev => [...prev, { start: currentTravelStart, end: stop, durationMinutes: calculateDuration(currentTravelStart, stop) }]);
                    setCurrentTravelStart('');
                  }}
                  className="w-full py-4 bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
                >
                  <StopCircle className="w-6 h-6 mr-2" /> STOP TRAVEL
                </button>
              </div>
            )}

            {travelSegments.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="font-bold text-gray-800 text-center text-sm border-t border-gray-100 pt-4">COMPLETED TRAVEL SEGMENTS</p>
                {travelSegments.map((seg, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg text-center flex flex-col justify-center items-center relative">
                    <p className="text-sm text-gray-500">{seg.start} &rarr; {seg.end}</p>
                    <p className="font-bold text-emerald-600 mt-1">Duration: {formatDuration(seg.durationMinutes)}</p>
                    {isEditingTravel && (
                        <button onClick={() => {
                           const newSegments = [...travelSegments];
                           newSegments.splice(idx, 1);
                           setTravelSegments(newSegments);
                        }} className="absolute right-4 text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider">Delete</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Job Section */}`;
c = c.replace(travelOldRegex, travelNewCode);

// Replace Start Job button and Start Lunch button
c = c.replace(
  /<button \n\s*onClick=\{[^}]*setJobStart[^}]*\}\n\s*className="w-full py-4 bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-blue-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"\n\s*>/,
  `<button 
                onClick={() => setJobStart(getCurrentTimeHHmm())}
                disabled={!canStartJob}
                className={cn("w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-colors border-2",
                   canStartJob ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                )}
              >`
);

c = c.replace(
  /<button \n\s*onClick=\{[^}]*setLunchStart[^}]*\}\n\s*className="w-full py-4 bg-orange-100 text-orange-800 hover:bg-orange-200 border-2 border-orange-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"\n\s*>/,
  `<button 
              onClick={() => setLunchStart(getCurrentTimeHHmm())}
              disabled={!canStartLunch}
              className={cn("w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-colors border-2",
                  canStartLunch ? "bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300" : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              )}
            >`
);

// fix lunch section opacity pointer events logic
c = c.replace(
  /<section className=\{cn\("bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-opacity", \(workType !== 'Workshop' && !jobStop\) \? "opacity-50 pointer-events-none" : "opacity-100"\)\}>/,
  `<section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">`
);

// fix Job Category star (remove * if not mandatory or clarify it)
// we don't necessarily need to remove the star, but we can

fs.writeFileSync('src/components/WorkEntryForm.tsx', c);
