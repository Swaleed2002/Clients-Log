const fs = require('fs');
let c = fs.readFileSync('src/components/WorkEntryForm.tsx', 'utf8');

// I inserted it before Job Section, let's remove it and put it after Job Section.
c = c.replace(/\{\/\* Lunch Break Section \*\/\}.*?\{\/\* Job Section \*\/\}/s, '{/* Job Section */}');

const lunchSection = `

        {/* Lunch Break Section */}
        <section className={cn("bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4 transition-opacity", (workType !== 'Workshop' && !jobStop) ? "opacity-50 pointer-events-none" : "opacity-100")}>
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" /> Lunch Break
            </h3>
            {lunchStart && lunchEnd && (
               <button onClick={() => setIsEditingLunch(!isEditingLunch)} className="text-gray-400 hover:text-orange-600 p-1">
                 <Pencil className="w-4 h-4" />
               </button>
            )}
          </div>

          {!lunchStart ? (
            <button 
              onClick={() => setLunchStart(getCurrentTimeHHmm())}
              className="w-full py-4 bg-orange-100 text-orange-800 hover:bg-orange-200 border-2 border-orange-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
            >
              <PlayCircle className="w-6 h-6 mr-2" /> START LUNCH BREAK
            </button>
          ) : !lunchEnd ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-orange-700 bg-orange-50 py-2 rounded-lg">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <span className="font-semibold text-sm">LUNCH BREAK (Started {lunchStart})</span>
              </div>
              <button 
                onClick={() => setLunchEnd(getCurrentTimeHHmm())}
                className="w-full py-4 bg-red-100 text-red-800 hover:bg-red-200 border-2 border-red-300 rounded-xl font-bold text-lg flex items-center justify-center transition-colors"
              >
                <StopCircle className="w-6 h-6 mr-2" /> STOP LUNCH BREAK
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-xl text-center">
              <CheckCircle2 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-bold text-gray-800">LUNCH BREAK COMPLETED</p>
              <p className="text-sm text-gray-500 mt-1">{lunchStart} &rarr; {lunchEnd}</p>
              <p className="font-bold text-orange-600 mt-1">Duration: {formatDuration(calculateDuration(lunchStart, lunchEnd))}</p>
            </div>
          )}

          {isEditingLunch && (
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                <input type="time" value={lunchStart} onChange={e => setLunchStart(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Time</label>
                <input type="time" value={lunchEnd} onChange={e => setLunchEnd(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          )}
        </section>
`;

c = c.replace(/\{\/\* Job Category \*\/}/, lunchSection + '\n\n        {/* Job Category */}');
fs.writeFileSync('src/components/WorkEntryForm.tsx', c);
