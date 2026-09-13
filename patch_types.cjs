const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf-8');

const searchStr = "export type ViewState = 'login' | 'dashboard' | 'form' | 'report' | 'admin';";
const replacementStr = "export type ViewState = 'login' | 'dashboard' | 'form' | 'report' | 'admin' | 'serviceReportsList' | 'serviceReportForm';";

content = content.replace(searchStr, replacementStr);

const serviceReportType = `

export interface ServiceReport {
  id?: string;
  userId: string;
  reportNo: string;
  date: string;
  customer: string;
  address: string;
  telFax: string;
  email: string;
  machineDetails: string;
  modelNumber: string;
  printerSerial: string;
  printHeadSerial: string;
  inkBatch: string;
  jobTypes: string[];
  invoiceNo: string;
  doNo: string;
  qtnNo: string;
  jobCarriedOut: string;
  partsReplaced: string;
  remarks: string;
  customerName: string;
  customerPosition: string;
  customerSignature: string;
  customerDate: string;
  engineerName: string;
  engineerPosition: string;
  engineerSignature: string;
  engineerDate: string;
  createdAt: number;
  updatedAt: number;
}
`;

content = content + serviceReportType;

fs.writeFileSync('src/types.ts', content);
