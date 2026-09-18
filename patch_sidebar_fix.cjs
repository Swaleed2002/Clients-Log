const fs = require('fs');
const p = './src/components/DesktopSidebar.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/\{canAccessModule\(profile, 'workEntries'\) && \(\s*\{\/\* Quick Action Button for Desktop \*\/\}/g, "{canAccessModule(profile, 'workEntries') && (\n<> {/* Quick Action Button for Desktop */}");

c = c.replace(/<\/button>\s*<\/div>\s*\)\}/, "</button>\n        </div>\n        </>\n        )}");

fs.writeFileSync(p, c);
