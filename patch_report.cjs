const fs = require('fs');
let c = fs.readFileSync('src/components/WeeklyReport.tsx', 'utf8');

c = c.replace(/let totalJobMinutes = 0;\n  let totalTravelMinutes = 0;/,
  "let totalJobMinutes = 0;\n  let totalTravelMinutes = 0;\n  let totalLunchMinutes = 0;");

c = c.replace(/totalJobMinutes \+= totals\.job\.totalMinutes;\n    totalTravelMinutes \+= totals\.travel\.totalMinutes;/,
  "totalJobMinutes += totals.job.totalMinutes;\n    totalTravelMinutes += totals.travel.totalMinutes;\n    if (totals.lunch) totalLunchMinutes += totals.lunch.totalMinutes;");

c = c.replace(/<div>\n              <p className="text-sm text-gray-500 mb-1">Travel<\/p>\n              <p className="text-xl font-bold text-gray-900">\{formatDuration\(\{ totalMinutes: totalTravelMinutes, hours: 0, minutes: 0 \}\)\}<\/p>\n            <\/div>/,
  `<div>\n              <p className="text-sm text-gray-500 mb-1">Travel</p>\n              <p className="text-xl font-bold text-gray-900">{formatDuration({ totalMinutes: totalTravelMinutes, hours: 0, minutes: 0 })}</p>\n            </div>\n            <div>\n              <p className="text-sm text-gray-500 mb-1">Lunch Break</p>\n              <p className="text-xl font-bold text-orange-600">{formatDuration({ totalMinutes: totalLunchMinutes, hours: 0, minutes: 0 })}</p>\n            </div>`);

// wait, let's see what the totals box looks like.
