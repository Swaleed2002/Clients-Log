import React, { useState, useRef } from 'react';
import { read, utils, write } from 'xlsx';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ArrowRight,
  Database,
  Building2,
  Printer,
  Package
} from 'lucide-react';
import { 
  UserProfile, 
  StoreInventoryItem, 
  Client, 
  CustomerMachine, 
  PrinterBrand, 
  PartCondition,
  PartTransaction,
  validateMachineData
} from '../types';
import { db } from '../firebase';
import { collection, doc, getDocs } from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { 
  saveCustomerMachineWithSync, 
  saveClientWithSync, 
  saveInventoryItemWithSync 
} from '../utils/syncManager';
import { 
  REALISTIC_DEMO_INVENTORY, 
  REALISTIC_DEMO_CLIENTS, 
  REALISTIC_DEMO_MACHINES 
} from '../data/realisticDemoData';

export type ImportType = 'INVENTORY' | 'CLIENTS' | 'MACHINES';

interface BulkExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ImportType;
  currentUser: UserProfile;
  onSuccess?: () => void;
}

interface ParsedRow {
  rowNumber: number;
  data: any;
  isValid: boolean;
  errors: string[];
}

export const BulkExcelImportModal: React.FC<BulkExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'INVENTORY',
  currentUser,
  onSuccess
}) => {
  const [activeType, setActiveType] = useState<ImportType>(defaultType);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Helper to normalize object keys from excel headers
  const normalizeKey = (key: string): string => {
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
  };

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sampleData: any[] = [];
    let filename = '';

    if (activeType === 'INVENTORY') {
      filename = 'Realistic_Inventory_Demo_Dataset.xlsx';
      headers = [
        'Part Number', 
        'Part Description', 
        'Brand', 
        'Printer Model', 
        'Condition', 
        'Quantity', 
        'Location', 
        'Min Stock', 
        'Notes'
      ];
      sampleData = REALISTIC_DEMO_INVENTORY;
    } else if (activeType === 'CLIENTS') {
      filename = 'Realistic_Clients_Demo_Dataset.xlsx';
      headers = ['Client Name', 'Address', 'Tel/Fax', 'Email', 'Contact Person'];
      sampleData = REALISTIC_DEMO_CLIENTS;
    } else {
      filename = 'Realistic_Machines_Demo_Dataset.xlsx';
      headers = [
        'Client Name', 
        'Brand', 
        'Model', 
        'Machine Serial Number', 
        'Printhead Serial Number', 
        'Ink', 
        'Solvent', 
        'Location', 
        'Status',
        'Notes'
      ];
      sampleData = REALISTIC_DEMO_MACHINES;
    }

    const ws = utils.json_to_sheet(sampleData, { header: headers });
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Data');
    const out = write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadDemoDataset = () => {
    let dataToLoad: any[] = [];
    let name = '';
    if (activeType === 'INVENTORY') {
      dataToLoad = REALISTIC_DEMO_INVENTORY;
      name = 'realistic_inventory_test_dataset.xlsx';
    } else if (activeType === 'CLIENTS') {
      dataToLoad = REALISTIC_DEMO_CLIENTS;
      name = 'realistic_clients_test_dataset.xlsx';
    } else {
      dataToLoad = REALISTIC_DEMO_MACHINES;
      name = 'realistic_machines_test_dataset.xlsx';
    }
    setFileName(name);
    validateAndParseRows(dataToLoad);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const workbook = read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rawJson = utils.sheet_to_json<any>(sheet);

        validateAndParseRows(rawJson);
      } catch (err) {
        console.error('Error reading excel file:', err);
        alert('Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const validateAndParseRows = (rawJson: any[]) => {
    const results: ParsedRow[] = [];

    rawJson.forEach((row, index) => {
      const rowNum = index + 2; // Excel row numbering (1-indexed + header)
      const normalizedRow: Record<string, any> = {};
      
      Object.keys(row).forEach(key => {
        normalizedRow[normalizeKey(key)] = row[key];
      });

      const errors: string[] = [];

      if (activeType === 'INVENTORY') {
        const partNumber = (normalizedRow['partnumber'] || normalizedRow['partno'] || normalizedRow['pn'] || normalizedRow['part'])?.toString().trim();
        const description = (normalizedRow['partdescription'] || normalizedRow['description'] || normalizedRow['desc'] || '')?.toString().trim();
        const brand = (normalizedRow['brand'] || 'LINX')?.toString().trim().toUpperCase();
        const model = (normalizedRow['printermodel'] || normalizedRow['model'] || '')?.toString().trim();
        const condition = (normalizedRow['condition'] || 'New')?.toString().trim();
        const rawQty = normalizedRow['quantity'] ?? normalizedRow['qty'] ?? normalizedRow['count'];
        const location = (normalizedRow['location'] || normalizedRow['shelf'] || 'Shelf A1')?.toString().trim();
        const minStock = Number(normalizedRow['minstock'] ?? normalizedRow['minimumstock'] ?? 2);
        const notes = (normalizedRow['notes'] || '')?.toString().trim();

        if (!partNumber) {
          errors.push('Part Number is required.');
        }

        const quantity = Number(rawQty);
        if (isNaN(quantity) || quantity < 0) {
          errors.push(`Invalid quantity: "${rawQty}". Must be a valid positive number.`);
        }

        const validConditions: PartCondition[] = ['New', 'Refurbished', 'Used'];
        const finalCondition = validConditions.find(c => c.toLowerCase() === condition?.toLowerCase()) || 'New';

        const parsedData = {
          partNumber,
          description: description || partNumber,
          brand: ['LINX', 'UBS', 'RYNAN'].includes(brand) ? brand : 'LINX',
          applicableModels: model ? [model] : [],
          condition: finalCondition,
          quantity,
          location,
          minStock,
          notes
        };

        results.push({
          rowNumber: rowNum,
          data: parsedData,
          isValid: errors.length === 0,
          errors
        });

      } else if (activeType === 'CLIENTS') {
        const name = (normalizedRow['clientname'] || normalizedRow['customername'] || normalizedRow['client'] || normalizedRow['customer'] || normalizedRow['company'])?.toString().trim();
        const address = (normalizedRow['address'] || normalizedRow['location'] || '')?.toString().trim();
        const telFax = (normalizedRow['telfax'] || normalizedRow['phone'] || normalizedRow['tel'] || '')?.toString().trim();
        const email = (normalizedRow['email'] || '')?.toString().trim();
        const contactPerson = (normalizedRow['contactperson'] || normalizedRow['contact'] || '')?.toString().trim();

        if (!name) {
          errors.push('Client Name is required.');
        }
        if (!address) {
          errors.push('Address is required.');
        }

        results.push({
          rowNumber: rowNum,
          data: {
            id: 'client_' + (name || 'client').toLowerCase().replace(/[^a-z0-9]/g, '_'),
            name,
            address: address || 'N/A',
            telFax,
            email,
            contactPerson,
            createdAt: Date.now(),
            updatedAt: Date.now()
          },
          isValid: errors.length === 0,
          errors
        });

      } else if (activeType === 'MACHINES') {
        const customerName = (normalizedRow['clientname'] || normalizedRow['customername'] || normalizedRow['client'] || normalizedRow['customer'])?.toString().trim();
        const brandRaw = (normalizedRow['brand'] || 'LINX')?.toString().trim().toUpperCase();
        const model = (normalizedRow['model'] || normalizedRow['printermodel'] || '')?.toString().trim();
        const serialNumber = (normalizedRow['machineserial'] || normalizedRow['serialnumber'] || normalizedRow['serial'] || normalizedRow['printerserial'])?.toString().trim();
        const printHeadSerial = (normalizedRow['printheadserial'] || normalizedRow['printhead'] || normalizedRow['printheadserialnumber'] || normalizedRow['phserial'])?.toString().trim();
        const ink = (normalizedRow['ink'] || normalizedRow['inkcode'] || normalizedRow['inknumber'])?.toString().trim();
        const solvent = (normalizedRow['solvent'] || normalizedRow['solventcode'] || normalizedRow['makeup'])?.toString().trim();
        const location = (normalizedRow['location'] || normalizedRow['plantlocation'] || '')?.toString().trim();
        const notes = (normalizedRow['notes'] || '')?.toString().trim();

        // Strict Machine Validation as required by CRM specifications:
        if (!customerName) {
          errors.push('Client is required.');
        }
        if (!serialNumber) {
          errors.push('Machine Serial Number is required.');
        }
        if (!printHeadSerial) {
          errors.push('Printhead Serial Number is required.');
        }
        if (!ink) {
          errors.push('Ink is required.');
        }
        if (!solvent) {
          errors.push('Solvent is required.');
        }
        if (!model) {
          errors.push('Printer Model is required.');
        }

        const validBrand = ['LINX', 'UBS', 'RYNAN'].includes(brandRaw) ? brandRaw : 'LINX';

        const machineData: Partial<CustomerMachine> = {
          id: `mach_${(serialNumber || 'sn').toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`,
          customerId: (customerName || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
          customerName,
          brand: validBrand as PrinterBrand,
          model: model || '8920',
          serialNumber: serialNumber || '',
          printHeadSerial: printHeadSerial || '',
          ink: ink || '',
          solvent: solvent || '',
          location,
          status: 'Active',
          notes,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const backendValidation = validateMachineData(machineData, true);
        if (!backendValidation.valid) {
          backendValidation.errors.forEach(err => {
            if (!errors.includes(err)) errors.push(err);
          });
        }

        results.push({
          rowNumber: rowNum,
          data: machineData,
          isValid: errors.length === 0,
          errors
        });
      }
    });

    setParsedRows(results);
  };

  const handleCommitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert('No valid rows to import. Please check validation errors.');
      return;
    }

    setIsProcessing(true);
    let importedCount = 0;
    let skippedCount = parsedRows.length - validRows.length;

    try {
      if (activeType === 'INVENTORY') {
        // Load current inventory to update existing items properly
        const localInv = await offlineDb.storeInventory.toArray();

        for (const row of validRows) {
          const itemData = row.data;
          // Check if item with same partNumber & condition already exists
          const existing = localInv.find(
            i => i.partNumber === itemData.partNumber && i.condition === itemData.condition
          );

          const itemId = existing ? existing.id : doc(collection(db, 'inventory')).id;
          const updatedItem: StoreInventoryItem = {
            id: itemId,
            partId: itemData.partNumber,
            partNumber: itemData.partNumber,
            description: itemData.description,
            brand: itemData.brand,
            applicableModels: itemData.applicableModels || [],
            quantity: existing ? existing.quantity + Number(itemData.quantity) : Number(itemData.quantity),
            condition: itemData.condition,
            location: itemData.location || 'Shelf A1',
            minStock: itemData.minStock || 2,
            notes: itemData.notes,
            createdAt: existing ? existing.createdAt : Date.now(),
            updatedAt: Date.now()
          };

          await saveInventoryItemWithSync(updatedItem, !existing);

          // Log transaction for complete audit history
          const tx: PartTransaction = {
            id: doc(collection(db, 'partTransactions')).id,
            partId: itemData.partNumber,
            partNumber: itemData.partNumber,
            description: itemData.description,
            brand: itemData.brand,
            condition: itemData.condition,
            quantity: Number(itemData.quantity),
            sourceType: 'STORE',
            sourceDetails: `Excel Bulk Import: ${fileName || 'data.xlsx'}`,
            destinationType: 'STORE',
            destinationDetails: `Shelf: ${itemData.location || 'A1'}`,
            engineerId: currentUser.userId,
            engineerName: `${currentUser.fullName} (Store Manager)`,
            status: 'RETURNED',
            purpose: 'Other',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: currentUser.userId,
            remarks: 'Imported via Excel bulk upload'
          };
          await offlineDb.partTransactions.put(tx);

          importedCount++;
        }

      } else if (activeType === 'CLIENTS') {
        for (const row of validRows) {
          const clientData: Client = row.data;
          await saveClientWithSync(clientData, true);
          importedCount++;
        }

      } else if (activeType === 'MACHINES') {
        for (const row of validRows) {
          const machineData: CustomerMachine = row.data;
          await saveCustomerMachineWithSync(machineData, true);
          importedCount++;
        }
      }

      setImportSummary({ imported: importedCount, skipped: skippedCount });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error during bulk import commit:', err);
      alert(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.filter(r => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 tracking-tight uppercase">
                Excel Bulk Data Import
              </h2>
              <p className="text-xs text-gray-500">
                Additional method for fast bulk entry. Manual CRM forms remain fully available.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Import Category Selector */}
          <div>
            <label className="block font-black text-gray-700 uppercase tracking-wider mb-2 text-[11px]">
              Select Import Target Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveType('INVENTORY');
                  setParsedRows([]);
                  setFileName('');
                  setImportSummary(null);
                }}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeType === 'INVENTORY'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Package className="w-4 h-4 text-purple-600" />
                <span>Store Inventory</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveType('CLIENTS');
                  setParsedRows([]);
                  setFileName('');
                  setImportSummary(null);
                }}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeType === 'CLIENTS'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Clients CRM</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveType('MACHINES');
                  setParsedRows([]);
                  setFileName('');
                  setImportSummary(null);
                }}
                className={`p-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition-all ${
                  activeType === 'MACHINES'
                    ? 'border-[#E61C24] bg-red-50 text-[#E61C24] shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Printer className="w-4 h-4 text-[#E61C24]" />
                <span>Customer Machines</span>
              </button>
            </div>
          </div>

          {/* Download Template Banner */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <p className="font-black text-gray-800 uppercase tracking-wide">
                Need the official column template?
              </p>
              <p className="text-gray-500 mt-0.5 text-[11px]">
                {activeType === 'INVENTORY' && 'Includes Part Number, Quantity, Condition, Shelf location, and demo test quantities.'}
                {activeType === 'CLIENTS' && 'Includes Client Name, Address, Phone, Email, and Contact Person.'}
                {activeType === 'MACHINES' && 'Includes Client, Machine Serial, Printhead Serial, Ink, and Solvent.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>Download Demo Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleLoadDemoDataset}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg font-bold hover:bg-emerald-800 transition-colors shadow-sm"
                title="Loads realistic test dataset directly into the validation preview below"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
                <span>Load Realistic Test Data</span>
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/20"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-2">
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-bold text-gray-900 text-sm">
              {fileName ? fileName : 'Click to select or drag and drop Excel file'}
            </p>
            <p className="text-gray-500 mt-1 text-[11px]">
              Supports standard Excel workbooks (.xlsx, .xls) and CSV files
            </p>
          </div>

          {/* Validation & Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary Bar */}
              <div className="flex items-center justify-between bg-gray-100 p-3 rounded-xl font-bold">
                <span className="text-gray-700">
                  Total Rows Scanned: <span className="text-gray-900">{parsedRows.length}</span>
                </span>
                <div className="flex space-x-3">
                  <span className="flex items-center text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Valid: {validCount}
                  </span>
                  {invalidCount > 0 && (
                    <span className="flex items-center text-red-600">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      Invalid: {invalidCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-[10px] font-black text-gray-600 uppercase tracking-wider sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Row</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Key Identifiers</th>
                      <th className="p-2.5">Details / Validation Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px]">
                    {parsedRows.map((row) => (
                      <tr key={row.rowNumber} className={row.isValid ? 'bg-white' : 'bg-red-50/40'}>
                        <td className="p-2.5 font-mono text-gray-500">#{row.rowNumber}</td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              Valid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                              Error
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-bold text-gray-900">
                          {activeType === 'INVENTORY' && (
                            <span>{row.data.partNumber} ({row.data.condition || 'New'})</span>
                          )}
                          {activeType === 'CLIENTS' && (
                            <span>{row.data.name}</span>
                          )}
                          {activeType === 'MACHINES' && (
                            <span>{row.data.customerName} - {row.data.serialNumber || 'No S/N'}</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <div className="text-gray-600">
                              {activeType === 'INVENTORY' && `Qty: ${row.data.quantity} • Brand: ${row.data.brand} • Shelf: ${row.data.location}`}
                              {activeType === 'CLIENTS' && `Address: ${row.data.address} • Tel: ${row.data.telFax || 'N/A'}`}
                              {activeType === 'MACHINES' && (
                                <span className="font-mono text-gray-800">
                                  Model: {row.data.model} | Printhead: {row.data.printHeadSerial} | Ink: {row.data.ink} | Solvent: {row.data.solvent}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-red-700 font-bold flex items-center">
                              <AlertTriangle className="w-3.5 h-3.5 mr-1 shrink-0" />
                              {row.errors.join(' | ')}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success Summary */}
          {importSummary && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Import Operation Completed Successfully</span>
              </div>
              <p className="text-xs text-emerald-700">
                Successfully stored {importSummary.imported} record(s) in the database with local offline synchronization. 
                {importSummary.skipped > 0 && ` (${importSummary.skipped} invalid rows skipped).`}
              </p>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommitImport}
            disabled={isProcessing || parsedRows.length === 0 || validCount === 0}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-2"
          >
            <Database className="w-4 h-4" />
            <span>
              {isProcessing 
                ? 'Importing...' 
                : validCount > 0 
                  ? `Import ${validCount} Valid Record${validCount > 1 ? 's' : ''}` 
                  : 'Import Valid Rows'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
