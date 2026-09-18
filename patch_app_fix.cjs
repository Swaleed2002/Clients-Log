const fs = require('fs');
const p = './src/App.tsx';
let lines = fs.readFileSync(p, 'utf8').split('\n');

let start = lines.findIndex(l => l.includes("const NavItem = ({ view, icon: Icon, label }: any) => {"));
if (start !== -1) {
  let end = start + 5;
  for (let i = start; i < end; i++) {
    if (lines[i].includes("{canAccessModule(profile")) {
      lines[i] = "";
    }
  }
}

fs.writeFileSync(p, lines.join('\n'));
