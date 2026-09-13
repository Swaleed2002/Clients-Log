const fs = require('fs');
let content = fs.readFileSync('src/components/ServiceReportForm.tsx', 'utf-8');

// Update A4 container styles
const searchStr = `<div className="w-full max-w-[794px] mx-auto mt-8 bg-white shadow-xl print:shadow-none print:mt-0 print:max-w-none relative" style={{ minHeight: '1123px' }}>`;
const replacementStr = `<div className="mx-auto mt-8 bg-white shadow-xl print:shadow-none print:mt-0 relative" style={{ width: '210mm', minHeight: '297mm', padding: '10mm 15mm' }}>`;

content = content.replace(searchStr, replacementStr);

// Change p-8 to p-0 since we added padding to the wrapper
const searchStr2 = `<div className="p-8 print:p-0" ref={printRef} style={{ fontFamily: 'Times New Roman, serif' }}>`;
const replacementStr2 = `<div className="p-0 print:p-0" ref={printRef} style={{ fontFamily: 'Times New Roman, serif' }}>`;

content = content.replace(searchStr2, replacementStr2);

// Fix print CSS
const searchCss = `      <style>{\`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      \`}</style>`;
      
const replacementCss = `      <style>{\`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: white !important; 
          }
          /* Ensure the container is exactly A4 and no margins break it */
          .min-h-screen { background: white !important; }
        }
      \`}</style>`;
      
content = content.replace(searchCss, replacementCss);

fs.writeFileSync('src/components/ServiceReportForm.tsx', content);
console.log("Patched styles");
