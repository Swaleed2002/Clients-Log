const fs = require('fs');
const p = './firestore.rules';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/return module in p && action in p\[module\] && p\[module\]\[action\] == true;/, 
  "let mod = p.get(module, {});\n      return mod.get('access', false) == true && mod.get(action, false) == true;");

fs.writeFileSync(p, c);
