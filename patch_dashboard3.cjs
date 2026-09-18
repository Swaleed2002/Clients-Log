const fs = require('fs');
const p = './src/components/Dashboard.tsx';
let c = fs.readFileSync(p, 'utf8');

const regexDesktopModules = /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">([\s\S]*?)<\/div>\s*<\/div>\s*\{\/\* Recent Activity Table for Desktop \*\/\}/;

let match = c.match(regexDesktopModules);
if (match) {
  let content = match[1];
  
  // Wrap Equipment Base button
  content = content.replace(/\{\/\* Equipment Base & Consumables CRM \*\/\}\s*<button[\s\S]*?<\/button>/, (m) => {
    return `{canAccessModule(currentUser, 'machines') && (\n${m}\n          )}`;
  });

  // Wrap Parts Master Catalog button
  content = content.replace(/\{\/\* Parts Master Catalog \*\/\}\s*<button[\s\S]*?<\/button>/, (m) => {
    return `{canAccessModule(currentUser, 'inventory') && (\n${m}\n          )}`;
  });

  // Wrap Store Room Inventory button
  content = content.replace(/\{\/\* Store Room Inventory \*\/\}\s*<button[\s\S]*?<\/button>/, (m) => {
    return `{canAccessModule(currentUser, 'inventory') && (\n${m}\n          )}`;
  });
  
  // Wrap Engineer Bag Stock button
  content = content.replace(/\{\/\* Engineer Bag Stock \*\/\}\s*<button[\s\S]*?<\/button>/, (m) => {
    return `{canAccessModule(currentUser, 'engineerBag') && (\n${m}\n          )}`;
  });

  // Wrap Testing / Backup Tracker button
  content = content.replace(/\{\/\* Testing \/ Backup Tracker \*\/\}\s*<button[\s\S]*?<\/button>/, (m) => {
    // We assume testing/backup uses partsIssue or inventory or machines. Let's use 'partsIssue' or add a custom one if missing. The prompt said "Testing & Backup Spares" or similar. Let's use 'partsIssue' because it is about tracking loaned parts. Actually, user has 'partsIssue' module. Let's just use 'partsIssue'.
    return `{canAccessModule(currentUser, 'partsIssue') && (\n${m}\n          )}`;
  });

  // Wrap Workshop Module button
  content = content.replace(/\{\/\* Workshop Module \*\/\}\s*<button[\s\S]*?<\/button>/, (m) => {
    return `{canAccessModule(currentUser, 'workshop') && (\n${m}\n          )}`;
  });

  // Wrap Weekly Report Timesheets button
  content = content.replace(/\{\/\* Weekly Report Timesheets \*\/\}\s*<button[\s\S]*?<\/button>/, (m) => {
    return `{canAccessModule(currentUser, 'reports') && (\n${m}\n          )}`;
  });

  c = c.replace(regexDesktopModules, `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">${content}</div>\n      </div>\n      {/* Recent Activity Table for Desktop */}`);
  fs.writeFileSync(p, c);
} else {
  console.log("Could not find Desktop modules");
}
