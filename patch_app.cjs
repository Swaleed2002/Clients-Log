const fs = require('fs');
const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/import \{.*?\} from '\.\/types';/, (m) => {
  return m + "\nimport { canAccessModule } from './utils/permissions';";
});

c = c.replace(/\{\/\* Module Shortcuts \*\/\}\s*<button[\s\S]*?>[\s\S]*?Parts Master Catalog[\s\S]*?<\/button>/, (m) => {
  return `{canAccessModule(profile, 'inventory') && (\n${m}\n              )}`;
});

c = c.replace(/<button[\s\S]*?>[\s\S]*?Engineer Bag Stock[\s\S]*?<\/button>/, (m) => {
  return `{canAccessModule(profile, 'engineerBag') && (\n${m}\n              )}`;
});

c = c.replace(/\{\(profile\.role === 'STORE' \|\| profile\.role === 'ADMIN'\) && \(\s*<button[\s\S]*?>[\s\S]*?Store Room Inventory[\s\S]*?<\/button>\s*\)\}/, (m) => {
  return `{canAccessModule(profile, 'inventory') && (\n              <button \n                onClick={() => { setShowSettings(false); setCurrentView('storeInventory'); }}\n                className="w-full flex items-center p-2.5 font-bold text-gray-700 hover:bg-gray-100 rounded-xl"\n              >\n                <Warehouse className="w-4 h-4 mr-2.5 text-purple-600" /> Store Room Inventory\n              </button>\n              )}`;
});

c = c.replace(/<button[\s\S]*?>[\s\S]*?Testing & Backup Tracker[\s\S]*?<\/button>/, (m) => {
  return `{canAccessModule(profile, 'partsIssue') && (\n${m}\n              )}`;
});

c = c.replace(/<button[\s\S]*?>[\s\S]*?Equipment Registry & History[\s\S]*?<\/button>/, (m) => {
  return `{canAccessModule(profile, 'machines') && (\n${m}\n              )}`;
});

c = c.replace(/<button[\s\S]*?>[\s\S]*?Weekly Timesheets[\s\S]*?<\/button>/, (m) => {
  return `{canAccessModule(profile, 'reports') && (\n${m}\n              )}`;
});

c = c.replace(/\{profile\.role === 'ADMIN' && \(\s*<button[\s\S]*?>[\s\S]*?Admin User Management[\s\S]*?<\/button>\s*\)\}/, (m) => {
  return `{canAccessModule(profile, 'users') && (\n              <button \n                onClick={() => { setShowSettings(false); setCurrentView('admin'); }}\n                className="w-full flex items-center p-2.5 font-bold text-purple-700 hover:bg-purple-50 rounded-xl"\n              >\n                <ShieldCheck className="w-4 h-4 mr-2.5 text-purple-600" /> Admin User Management\n              </button>\n              )}`;
});


fs.writeFileSync(p, c);
