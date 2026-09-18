const fs = require('fs');
const p = './src/components/AdminPanel.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace("{activeTab === 'users' ? (\n      {message.text", "{activeTab === 'users' ? (\n      <>\n      {message.text");

c = c.replace(/          <\/div>\s*<\/div>\s*\) : \(\s*<UserRightsManager users=\{users\} onUpdate=\{fetchUsers\} \/>/, "          </div>\n        </div>\n      </>\n      ) : (\n        <UserRightsManager users={users} onUpdate={fetchUsers} />");

fs.writeFileSync(p, c);
