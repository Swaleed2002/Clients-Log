const fs = require('fs');
const p = './src/components/DesktopSidebar.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/\{\/\* Quick Action Button for Desktop \*\/\}\s*<div className="mt-4 pt-3 border-t border-slate-800\/60">\s*<button[\s\S]*?<\/button>\s*<\/div>/, (m) => {
  return `{canAccessModule(profile, 'workEntries') && (\n        ${m}\n        )}`;
});

fs.writeFileSync(p, c);
