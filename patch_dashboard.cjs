const fs = require('fs');
const p = './src/components/Dashboard.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace("import { WorkEntry, UserProfile, PartTransaction } from '../types';", "import { WorkEntry, UserProfile, PartTransaction } from '../types';\nimport { canAccessModule } from '../utils/permissions';");

c = c.replace("{/* Dashboard Actions */}", "{/* Dashboard Actions */}\n        <div className=\"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6\">");
// Oh wait, Dashboard already has grid.

fs.writeFileSync(p, c);
