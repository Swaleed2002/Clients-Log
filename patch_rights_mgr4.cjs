const fs = require('fs');
const p = './src/components/UserRightsManager.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/onChange=\{.*?handleToggle\(moduleKey as keyof UserPermissions, 'access'\).*?\}/, (m) => {
  return `onChange={() => {
                              if (moduleKey === 'users' && selectedUser?.role === 'ADMIN') {
                                alert("Primary Admin must retain access to the Admin Users module.");
                                return;
                              }
                              handleToggle(moduleKey as keyof UserPermissions, 'access');
                            }}`;
});

c = c.replace(/<div className=\{\`w-10 h-5 rounded-full p-0\.5 transition-colors \$\{\(mods as any\)\.access \? 'bg-indigo-600' : 'bg-gray-300'\}\`\}>/, (m) => {
  return `<div className={\`w-10 h-5 rounded-full p-0.5 transition-colors \${(mods as any).access ? 'bg-indigo-600' : 'bg-gray-300'} \${moduleKey === 'users' && selectedUser?.role === 'ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}\`}>`;
});

fs.writeFileSync(p, c);
