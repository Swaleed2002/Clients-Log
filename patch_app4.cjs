const fs = require('fs');
const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/<NavItem view="partsCatalog" icon=\{Package\} label="PARTS" \/>/, `{canAccessModule(profile, 'inventory') && <NavItem view="partsCatalog" icon={Package} label="PARTS" />}`);

// Also the New Work Log button in bottom nav should ideally check `workEntries`
c = c.replace(/<button \s*onClick=\{handleAddEntry\}\s*className="relative -top-4/m, `{canAccessModule(profile, 'workEntries') && (\n          <button \n            onClick={handleAddEntry}\n            className="relative -top-4`);

c = c.replace(/<span className="text-\[9px\] font-black text-gray-700 mt-0\.5 tracking-wider uppercase">LOG<\/span>\s*<\/button>/, `<span className="text-[9px] font-black text-gray-700 mt-0.5 tracking-wider uppercase">LOG</span>\n          </button>\n          )}`);

fs.writeFileSync(p, c);
