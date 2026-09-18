const fs = require('fs');
const p = './src/components/Dashboard.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/\{canAccessModule\(([^)]+)\) && \(\s*\{\/\*([^*]+)\*\/\}\s*(<button[\s\S]*?<\/button>)\s*\)\}/g, (m, cond, comment, btn) => {
  return `{canAccessModule(${cond}) && (\n<> {/*${comment}*/}\n${btn}\n</>\n)}`;
});

fs.writeFileSync(p, c);
