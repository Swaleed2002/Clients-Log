const fs = require('fs');
const p = './src/components/AdminPanel.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace("{activeTab === 'users' ? ( <>", "{activeTab === 'users' ? ( <div className='w-full'>");
c = c.replace("      </>\n      ) : (", "      </div>\n      ) : (");

fs.writeFileSync(p, c);
