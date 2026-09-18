const fs = require('fs');
const p = './src/App.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace(/\{canAccessModule\(profile, 'machines'\) && \(\n/g, "");
c = c.replace(/\{canAccessModule\(profile, 'reports'\) && \(\n/g, "");
fs.writeFileSync(p, c);
