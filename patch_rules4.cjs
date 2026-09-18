const fs = require('fs');
const p = './firestore.rules';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/return p\.get\(module, \{\}\)\.get\('access', false\) == true && \(p\.get\(module, \{\}\)\.get\(action, false\) == true \|\| action == 'view'\);/, 
  "return module in p && 'access' in p[module] && p[module].access == true && (action == 'view' || (action in p[module] && p[module][action] == true));");

fs.writeFileSync(p, c);
