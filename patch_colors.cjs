const fs = require('fs');
let content = fs.readFileSync('src/components/ServiceReportForm.tsx', 'utf-8');

// The A4 container replacement to ensure exact matching and pure white background
const searchA4 = `      {/* A4 Page Container */}
      <div className="mx-auto mt-8 bg-white shadow-xl print:shadow-none print:mt-0 relative" style={{ width: '210mm', minHeight: '297mm', padding: '10mm 15mm' }}>`;

const replaceA4 = `      {/* A4 Page Container */}
      <div 
        className="mx-auto mt-8 bg-white shadow-xl print:shadow-none print:mt-0 print:m-0 relative overflow-hidden" 
        style={{ 
          width: '210mm', 
          height: '297mm', 
          padding: '10mm 15mm',
          backgroundColor: 'white'
        }}
      >`;
      
content = content.replace(searchA4, replaceA4);

const searchStyle = `      {/* Print CSS adjustments */}
      <style>{\`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
        }
      \`}</style>`;

const replaceStyle = `      {/* Print CSS adjustments */}
      <style>{\`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important; 
            background: white !important; 
          }
          /* Ensure all colored elements retain their color and background */
          * {
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      \`}</style>`;
      
content = content.replace(searchStyle, replaceStyle);

fs.writeFileSync('src/components/ServiceReportForm.tsx', content);
console.log("Patched ServiceReportForm for A4 dimensions and print colors");
