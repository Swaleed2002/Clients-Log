const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const searchState = "const [editingEntry, setEditingEntry] = useState<WorkEntry | undefined>(undefined);";
const replacementState = "const [editingEntry, setEditingEntry] = useState<WorkEntry | undefined>(undefined);\n  const [activeServiceReport, setActiveServiceReport] = useState<any>(undefined);";

if (!content.includes('activeServiceReport')) {
  content = content.replace(searchState, replacementState);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Patched App.tsx successfully");
}
