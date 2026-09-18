const fs = require('fs');
const p = './src/components/UserRightsManager.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/const getRoleDefaults = \([\s\S]*?\}\n\};\n\n/, "import { getRoleDefaults } from '../utils/permissions';\n\n");

fs.writeFileSync(p, c);
