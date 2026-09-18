const fs = require('fs');
const p = './src/components/DesktopSidebar.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/import React[\s\S]*?from 'react';/, "import React, { useEffect, useState } from 'react';\nimport { canAccessModule } from '../utils/permissions';");

c = c.replace(/<NavItem view="form" icon=\{Clock\} label="Daily Work Log" \/>/, `{canAccessModule(profile, 'workEntries') && <NavItem view="form" icon={Clock} label="Daily Work Log" />}`);
c = c.replace(/<NavItem view="workshop" icon=\{Wrench\} label="Workshop Machines" \/>/, `{canAccessModule(profile, 'workshop') && <NavItem view="workshop" icon={Wrench} label="Workshop Machines" />}`);

c = c.replace(/<NavItem \s*view="clientMachines"\s*icon=\{Printer\}\s*label="Equipment & Clients"\s*badge="CRM"\s*badgeColor="bg-emerald-950 text-emerald-300 border border-emerald-800\/50"\s*\/>/m, `{canAccessModule(profile, 'machines') && (\n          <NavItem \n             view="clientMachines" \n             icon={Printer} \n             label="Equipment & Clients" \n             badge="CRM"\n            badgeColor="bg-emerald-950 text-emerald-300 border border-emerald-800/50"\n          />\n          )}`);

c = c.replace(/<NavItem view="testingBackup" icon=\{Activity\} label="Testing & Backup Parts" \/>/, `{canAccessModule(profile, 'partsIssue') && <NavItem view="testingBackup" icon={Activity} label="Testing & Backup Parts" />}`);

c = c.replace(/<NavItem view="partsCatalog" icon=\{Package\} label="Parts Master Catalog" \/>/, `{canAccessModule(profile, 'inventory') && <NavItem view="partsCatalog" icon={Package} label="Parts Master Catalog" />}`);
c = c.replace(/<NavItem view="engineerBag" icon=\{Briefcase\} label="My Bag Stock" \/>/, `{canAccessModule(profile, 'engineerBag') && <NavItem view="engineerBag" icon={Briefcase} label="My Bag Stock" />}`);

c = c.replace(/\{\(isStore \|\| isAdmin\) && \(\s*<NavItem \s*view="storeInventory"\s*icon=\{Warehouse\}\s*label="Store Inventory"\s*badge="STORE"\s*badgeColor="bg-purple-950 text-purple-300 border border-purple-800\/50"\s*\/>\s*\)\}/m, `{canAccessModule(profile, 'inventory') && (\n            <NavItem \n               view="storeInventory" \n               icon={Warehouse} \n               label="Store Inventory" \n               badge="STORE"\n              badgeColor="bg-purple-950 text-purple-300 border border-purple-800/50"\n            />\n          )}`);

c = c.replace(/<NavItem view="report" icon=\{FileSpreadsheet\} label="Weekly Report" \/>/, `{canAccessModule(profile, 'reports') && <NavItem view="report" icon={FileSpreadsheet} label="Weekly Report" />}`);

c = c.replace(/\{isAdmin && \(\s*<NavItem \s*view="admin"\s*icon=\{ShieldCheck\}\s*label="Admin User Control"\s*badge="ADMIN"\s*badgeColor="bg-red-950 text-red-300 border border-red-800\/50"\s*\/>\s*\)\}/m, `{canAccessModule(profile, 'users') && (\n            <NavItem \n               view="admin" \n               icon={ShieldCheck} \n               label="Admin User Control" \n               badge="ADMIN"\n              badgeColor="bg-red-950 text-red-300 border border-red-800/50"\n            />\n          )}`);

fs.writeFileSync(p, c);
