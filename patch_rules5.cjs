const fs = require('fs');
const p = './firestore.rules';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/return module in p && 'access' in p\[module\] && p\[module\]\.access == true && \(action == 'view' \|\| \(action in p\[module\] && p\[module\]\[action\] == true\)\);/, 
  "return p[module] != null && p[module].access == true && (p[module][action] == true || action == 'view');");

fs.writeFileSync(p, c);
