const fs = require('fs');
let c = fs.readFileSync('src/components/WeeklyReport.tsx', 'utf8');

c = c.replace(/let totalJobMinutes = 0;\n  let totalTravelMinutes = 0;/,
  "let totalJobMinutes = 0;\n  let totalTravelMinutes = 0;\n  let totalLunchMinutes = 0;");

c = c.replace(/totalJobMinutes \+= totals\.job\.totalMinutes;\n    totalTravelMinutes \+= totals\.travel\.totalMinutes;/,
  "totalJobMinutes += totals.job.totalMinutes;\n    totalTravelMinutes += totals.travel.totalMinutes;\n    if ((totals as any).lunch) totalLunchMinutes += (totals as any).lunch.totalMinutes;");

c = c.replace(/<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center bg-red-50">/,
  `<div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
            <p className="text-xs text-orange-500 font-semibold uppercase mb-1">Lunch Break</p>
            <p className="text-xl font-bold text-orange-700">{formatDuration({ hours: Math.floor(totalLunchMinutes/60), minutes: totalLunchMinutes%60, totalMinutes: totalLunchMinutes})}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center bg-red-50">`);

c = c.replace(/<p className="text-gray-400 text-xs uppercase font-bold mb-1">Job Time<\/p>\n\s*<p className="font-bold text-gray-900">\{totals\.job\.totalMinutes === 0 \? '0' : formatDuration\(totals\.job\)\}<\/p>\n\s*<\/div>/,
  `<p className="text-gray-400 text-xs uppercase font-bold mb-1">Job Time</p>
                         <p className="font-bold text-gray-900">{totals.job.totalMinutes === 0 ? '0' : formatDuration(totals.job)}</p>
                       </div>
                       <div>
                         <p className="text-orange-400 text-xs uppercase font-bold mb-1">Lunch Break</p>
                         <p className="font-bold text-orange-700">{!(totals as any).lunch || (totals as any).lunch.totalMinutes === 0 ? '0' : formatDuration((totals as any).lunch)}</p>
                       </div>`);

fs.writeFileSync('src/components/WeeklyReport.tsx', c);
