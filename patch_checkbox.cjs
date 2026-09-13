const fs = require('fs');
let content = fs.readFileSync('src/components/ServiceReportForm.tsx', 'utf-8');

const searchStr = `className="flex items-center justify-end mb-1 cursor-pointer print:cursor-default"`;
const replacementStr = `className="flex items-center justify-end mb-1 cursor-pointer print:cursor-default w-full"`;

if (!content.includes('w-full" \n        onClick={() => handleCheckbox(label)}')) {
  content = content.replace(searchStr, replacementStr);
}

const searchStr2 = `<div className="w-6 h-6 border border-gray-600 flex items-center justify-center bg-white">`;
const replacementStr2 = `<div className="w-5 h-6 border border-gray-600 flex items-center justify-center bg-white shrink-0">`;

content = content.replace(searchStr2, replacementStr2);

fs.writeFileSync('src/components/ServiceReportForm.tsx', content);
console.log("Patched checkbox styling successfully");
