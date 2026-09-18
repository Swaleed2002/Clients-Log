const fs = require('fs');
const p = './firestore.rules';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/return p\[module\] != null && p\[module\]\.access == true && \(p\[module\]\[action\] == true || action == 'view'\);/, 
  "return p.get(module, {}).get('access', false) == true && (p.get(module, {}).get(action, false) == true || action == 'view');");

fs.writeFileSync(p, c);
