const fs = require('fs');
const adminPath = './src/components/AdminPanel.tsx';
let code = fs.readFileSync(adminPath, 'utf8');

if (!code.includes("import { UserRightsManager } from './UserRightsManager';")) {
  code = code.replace("import { exportToExcel } from '../utils';", "import { exportToExcel } from '../utils';\nimport { UserRightsManager } from './UserRightsManager';");
}

if (!code.includes("const [activeTab, setActiveTab] = useState")) {
  code = code.replace("const [exporting, setExporting] = useState(false);", "const [exporting, setExporting] = useState(false);\n  const [activeTab, setActiveTab] = useState<'users' | 'rights'>('users');");
}

const tabsHtml = `
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={\`px-6 py-3 font-bold text-sm border-b-2 transition-colors \${activeTab === 'users' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
        >
          Users Management
        </button>
        <button
          onClick={() => setActiveTab('rights')}
          className={\`px-6 py-3 font-bold text-sm border-b-2 transition-colors \${activeTab === 'rights' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
        >
          User Rights
        </button>
      </div>

      {activeTab === 'users' ? (
`;

code = code.replace('{message.text && (', tabsHtml + '\n      {message.text && (');

// We need to close the `activeTab === 'users'` ternary block at the end
const finalDivClose = `
          </div>
        </div>
      ) : (
        <UserRightsManager users={users} onUpdate={fetchUsers} />
      )}
    </div>
  );
`;
code = code.replace(/          <\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*}/, finalDivClose + '}');

fs.writeFileSync(adminPath, code);
console.log('Patched AdminPanel.tsx successfully');
