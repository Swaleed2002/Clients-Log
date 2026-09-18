const fs = require('fs');
const p = './src/components/AdminPanel.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace("      </div>\n      ) : (", "      </div>\n      </div>\n      ) : (");

fs.writeFileSync(p, c);
