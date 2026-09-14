import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { 
  ServiceReport, 
  UserProfile, 
  PartMasterItem, 
  EngineerBagItem, 
  ServiceReportPartUsed, 
  PartSource, 
  PartCondition, 
  PartAction,
  PrinterBrand,
  LinxModel
} from '../types';
import { SignaturePad } from './SignaturePad';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { offlineDb } from '../db/indexedDb';
import { 
  ChevronLeft, 
  Printer, 
  Save, 
  Package, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Info,
  Layers,
  CheckCircle2,
  Cpu,
  RotateCcw
} from 'lucide-react';
import { 
  LINX_MODELS, 
  LINX_8810_PLUS_MODELS, 
  getPartsForModel, 
  searchParts 
} from '../data/partsMaster';

interface ServiceReportFormProps {
  initialData?: ServiceReport;
  currentUser: UserProfile;
  preselectedBagItem?: EngineerBagItem | null;
  onBack: () => void;
  onSaved: () => void;
}

export function ServiceReportForm({ 
  initialData, 
  currentUser, 
  preselectedBagItem,
  onBack, 
  onSaved 
}: ServiceReportFormProps) {
  const [report, setReport] = useState<Partial<ServiceReport>>(initialData || {
    reportNo: '',
    date: format(new Date(), 'dd.MM.yyyy'),
    customer: '',
    address: '',
    telFax: '',
    email: '',
    machineDetails: '',
    modelNumber: '8920',
    printerSerial: '',
    printHeadSerial: '',
    inkBatch: '',
    jobTypes: ['SPOT JOB'],
    invoiceNo: '',
    doNo: '',
    qtnNo: '',
    jobCarriedOut: '',
    partsReplaced: '',
    remarks: '',
    customerName: '',
    customerPosition: '',
    customerSignature: '',
    customerDate: format(new Date(), 'dd.MM.yyyy'),
    engineerName: currentUser.fullName,
    engineerPosition: currentUser.role === 'ADMIN' ? 'Admin' : 'Service Engg.',
    engineerSignature: '',
    engineerDate: format(new Date(), 'dd.MM.yyyy'),
    partsUsed: []
  });

  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Structured parts used list
  const [partsUsedList, setPartsUsedList] = useState<ServiceReportPartUsed[]>(
    initialData?.partsUsed || []
  );

  // Helper Parts Drawer / Quick-add state
  const [showPartsHelper, setShowPartsHelper] = useState(true);
  const [helperBrand, setHelperBrand] = useState<PrinterBrand>('LINX');
  const [helperSearch, setHelperSearch] = useState('');
  const [selectedSource, setSelectedSource] = useState<PartSource>('MY BAG');
  const [selectedCondition, setSelectedCondition] = useState<PartCondition>('New');
  const [selectedAction, setSelectedAction] = useState<PartAction>('Installed');
  const [bagStock, setBagStock] = useState<EngineerBagItem[]>([]);

  // Load bag stock for quick insertion
  useEffect(() => {
    offlineDb.engineerBags.where('engineerId').equals(currentUser.userId).toArray().then(setBagStock);
  }, [currentUser.userId]);

  // Pre-fill bag item if passed
  useEffect(() => {
    if (preselectedBagItem) {
      handleAddPartToReport({
        partId: preselectedBagItem.partId,
        partNumber: preselectedBagItem.partNumber,
        description: preselectedBagItem.description,
        brand: preselectedBagItem.brand,
        quantity: 1,
        source: 'MY BAG',
        condition: preselectedBagItem.condition,
        action: 'Installed'
      });
    }
  }, [preselectedBagItem]);

  // Auto-generate report number if new
  useEffect(() => {
    if (!initialData) {
      const generateReportNo = async () => {
        try {
          const ref = doc(db, 'config', 'reportSequence');
          const snap = await getDoc(ref);
          let currentSeq = 40000;
          if (snap.exists()) {
            currentSeq = snap.data().current || 40000;
          }
          currentSeq++;
          setReport(prev => ({ ...prev, reportNo: currentSeq.toString() }));
        } catch (e) {
          const fallbackNo = Math.floor(40000 + Math.random() * 9000).toString();
          setReport(prev => ({ ...prev, reportNo: fallbackNo }));
        }
      };
      generateReportNo();
    }
  }, [initialData]);

  const handleChange = (field: keyof ServiceReport, value: any) => {
    setReport(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (type: string) => {
    const current = report.jobTypes || [];
    if (current.includes(type)) {
      handleChange('jobTypes', current.filter(t => t !== type));
    } else {
      handleChange('jobTypes', [...current, type]);
    }
  };

  // Model-based parts determination
  const detectedLinxModel = (report.modelNumber || '8920') as LinxModel;
  const isSpectrum = detectedLinxModel === '8940 Spectrum';
  const isLinx8810Common = LINX_8810_PLUS_MODELS.includes(detectedLinxModel);

  // Available applicable parts for the selected model
  const filteredCatalogParts = searchParts(
    helperBrand, 
    helperBrand === 'LINX' ? detectedLinxModel : 'MRX 10', 
    helperSearch, 
    false
  );

  // Add Part to Service Report
  const handleAddPartToReport = (partItem: ServiceReportPartUsed) => {
    const updated = [...partsUsedList, partItem];
    setPartsUsedList(updated);

    // Format text representation into the form's "Parts Replaced / Required :" area
    const formattedEntry = `${partItem.quantity}x ${partItem.partNumber} - ${partItem.description} (${partItem.condition}, ${partItem.action} from ${partItem.source})`;
    const currentText = report.partsReplaced ? report.partsReplaced.trim() : '';
    const newText = currentText ? `${currentText}\n${formattedEntry}` : formattedEntry;
    
    handleChange('partsReplaced', newText);
  };

  // Remove Part from Service Report
  const handleRemovePart = (index: number) => {
    const updated = partsUsedList.filter((_, i) => i !== index);
    setPartsUsedList(updated);

    // Rebuild text representation
    const textLines = updated.map(p => 
      `${p.quantity}x ${p.partNumber} - ${p.description} (${p.condition}, ${p.action} from ${p.source})`
    ).join('\n');
    handleChange('partsReplaced', textLines);
  };

  // Save Service Report & Update Inventory / Transactions
  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSave: ServiceReport = {
        ...(report as any),
        partsUsed: partsUsedList,
        userId: initialData?.userId || currentUser.userId,
        updatedAt: Date.now(),
        createdAt: initialData?.createdAt || Date.now(),
        syncStatus: 'synced'
      };

      let reportDocId = initialData?.id;
      if (reportDocId) {
        await updateDoc(doc(db, 'serviceReports', reportDocId), dataToSave as any);
      } else {
        const newDocRef = await addDoc(collection(db, 'serviceReports'), dataToSave as any);
        reportDocId = newDocRef.id;

        // update sequence
        try {
          const seqRef = doc(db, 'config', 'reportSequence');
          await setDoc(seqRef, { current: parseInt(report.reportNo || '40000') }, { merge: true });
        } catch (e) {}
      }

      // Save locally to IndexedDB
      await offlineDb.serviceReports.put({ id: reportDocId, ...dataToSave });

      // Automatically register machine if serial provided
      if (report.printerSerial && report.customer) {
        const machineId = `${report.customer.trim().toLowerCase()}_${report.printerSerial.trim()}`.replace(/[^a-z0-9_]/g, '_');
        const machineData = {
          id: machineId,
          customerId: report.customer.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
          customerName: report.customer.trim(),
          brand: helperBrand,
          model: report.modelNumber || '8920',
          serialNumber: report.printerSerial.trim().toUpperCase(),
          printHeadSerial: report.printHeadSerial ? report.printHeadSerial.trim() : undefined,
          ink: report.inkBatch ? report.inkBatch.trim() : undefined,
          updatedAt: Date.now(),
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'customerMachines', machineId), machineData, { merge: true });
        await offlineDb.customerMachines.put(machineData as any);
      }

      // Process Part Transactions & Bag / Store Deductions
      for (const part of partsUsedList) {
        const txId = doc(collection(db, 'partTransactions')).id;
        const txStatus = part.action === 'Installed' ? 'INSTALLED' : part.action === 'Left for Testing' ? 'TESTING' : 'BACKUP';

        const tx = {
          id: txId,
          partId: part.partNumber,
          partNumber: part.partNumber,
          description: part.description,
          brand: part.brand || helperBrand,
          sourceType: part.source,
          sourceDetails: part.sourceDetails || `Source: ${part.source}`,
          destinationType: 'CUSTOMER MACHINE',
          destinationDetails: `${report.customer} - ${report.printerSerial || report.modelNumber}`,
          engineerId: currentUser.userId,
          engineerName: currentUser.fullName,
          customerId: report.customer,
          customerName: report.customer,
          machineModel: report.modelNumber,
          machineSerial: report.printerSerial,
          serviceReportId: reportDocId,
          serviceReportNo: report.reportNo,
          quantity: part.quantity,
          condition: part.condition,
          purpose: part.action === 'Left for Testing' ? 'Testing' : part.action === 'Left as Backup' ? 'Backup' : 'Customer Replacement',
          status: txStatus,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: currentUser.fullName
        };

        await setDoc(doc(db, 'partTransactions', txId), tx);
        await offlineDb.partTransactions.put(tx as any);

        // If taken from Engineer's Bag, deduct from Bag Stock
        if (part.source === 'MY BAG') {
          const bagDocId = `${currentUser.userId}_${part.partNumber}_${part.condition}`.replace(/[^a-zA-Z0-9_]/g, '_');
          const bagSnap = await offlineDb.engineerBags.get(bagDocId);
          if (bagSnap) {
            const newQty = Math.max(0, bagSnap.quantity - part.quantity);
            if (newQty === 0) {
              await deleteDoc(doc(db, 'engineerBags', bagDocId)).catch(() => {});
              await offlineDb.engineerBags.delete(bagDocId).catch(() => {});
            } else {
              const updatedBag = { ...bagSnap, quantity: newQty, updatedAt: Date.now() };
              await setDoc(doc(db, 'engineerBags', bagDocId), updatedBag);
              await offlineDb.engineerBags.put(updatedBag);
            }
          }
        }
      }

      setSaving(false);
      onSaved();
    } catch (err: any) {
      console.error('Failed to save service report:', err);
      alert(`Failed to save report: ${err.message}`);
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Reusable subcomponents for visual form replica
  const EditableRow = ({ label, field, placeholder }: { label: string; field: keyof ServiceReport; placeholder?: string }) => (
    <div className="flex items-end mb-1 text-xs">
      <span className="w-56 font-serif font-bold text-gray-900 shrink-0 uppercase tracking-tight">{label}</span>
      <span className="w-4 font-bold text-gray-900 shrink-0">:</span>
      <div className="flex-grow border-b border-dotted border-gray-600 relative">
        <input
          type="text"
          value={report[field] as string || ''}
          onChange={e => handleChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full outline-none bg-transparent text-gray-900 font-sans text-xs px-1 print:text-black font-medium"
        />
      </div>
    </div>
  );

  const CheckboxItem = ({ label }: { label: string }) => {
    const isChecked = report.jobTypes?.includes(label);
    return (
      <div 
        className="flex items-center space-x-1.5 cursor-pointer select-none mb-1 text-[11px]"
        onClick={() => handleCheckbox(label)}
      >
        <span className="font-serif font-bold text-gray-900 uppercase text-[10px] w-24 text-right">
          {label}
        </span>
        <div className="w-3.5 h-3.5 border border-black flex items-center justify-center bg-white text-black font-black text-xs leading-none">
          {isChecked ? '✓' : ''}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 print:p-0 print:bg-white">
      {/* Non-print Top Action Toolbar */}
      <div className="max-w-[210mm] mx-auto mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={onBack}
          className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          BACK TO DASHBOARD
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPartsHelper(!showPartsHelper)}
            className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Package className="w-4 h-4 mr-1 text-[#E61C24]" />
            {showPartsHelper ? 'HIDE PARTS PICKER' : 'PARTS PICKER & DEDUCTOR'}
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1 text-gray-600" />
            PRINT A4 WORK ORDER
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center text-xs font-bold text-white bg-[#E61C24] hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? 'SAVING...' : 'SAVE WORK ORDER'}
          </button>
        </div>
      </div>

      {/* Non-print Parts Helper Drawer */}
      {showPartsHelper && (
        <div className="max-w-[210mm] mx-auto mb-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm print:hidden space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#E61C24]" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                Parts Replacement & Inventory Deductor
              </h3>
            </div>
            
            {isSpectrum ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                ⭐ LINX 8940 SPECTRUM EXCLUSIVE PARTS ACTIVE
              </span>
            ) : isLinx8810Common ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                ✓ COMMON 8810+ PARTS SET ACTIVE
              </span>
            ) : null}
          </div>

          {/* Configuration controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-gray-600 mb-1">Part Source</label>
              <select
                value={selectedSource}
                onChange={e => setSelectedSource(e.target.value as PartSource)}
                className="w-full p-2 border border-gray-200 rounded-lg font-bold bg-gray-50"
              >
                <option value="MY BAG">My Bag Stock</option>
                <option value="STORE">Store Room</option>
                <option value="WORKSHOP MACHINE">Workshop Machine (Company/Customer machine)</option>
                <option value="OTHER">Other Source</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-600 mb-1">Condition</label>
              <select
                value={selectedCondition}
                onChange={e => setSelectedCondition(e.target.value as PartCondition)}
                className="w-full p-2 border border-gray-200 rounded-lg font-bold bg-gray-50"
              >
                <option value="New">New</option>
                <option value="Refurbished">Refurbished</option>
                <option value="Used">Used</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-600 mb-1">Action / Purpose</label>
              <select
                value={selectedAction}
                onChange={e => setSelectedAction(e.target.value as PartAction)}
                className="w-full p-2 border border-gray-200 rounded-lg font-bold bg-gray-50"
              >
                <option value="Installed">Installed in Machine</option>
                <option value="Left for Testing">Left for Testing</option>
                <option value="Left as Backup">Left as Backup</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-600 mb-1">Search Catalog</label>
              <input
                type="text"
                value={helperSearch}
                onChange={e => setHelperSearch(e.target.value)}
                placeholder="Search part # or keyword..."
                className="w-full p-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Quick Selection: Bag items vs Catalog items */}
          <div className="border-t pt-3">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Available Parts (Click to Add into Work Order Form):
            </h4>
            
            {/* Bag items if selectedSource === 'MY BAG' */}
            {selectedSource === 'MY BAG' && bagStock.length > 0 && (
              <div className="mb-3 space-y-1">
                <p className="text-[10px] font-bold text-blue-700">From Your Bag Stock:</p>
                <div className="flex flex-wrap gap-2">
                  {bagStock.map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleAddPartToReport({
                        partId: b.partId,
                        partNumber: b.partNumber,
                        description: b.description,
                        brand: b.brand,
                        quantity: 1,
                        source: 'MY BAG',
                        condition: b.condition,
                        action: selectedAction
                      })}
                      className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 font-bold hover:bg-blue-100 flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1 text-blue-600" />
                      {b.partNumber} ({b.condition} - Bag Qty: {b.quantity})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Catalog matches */}
            <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-lg">
              {filteredCatalogParts.slice(0, 8).map(p => {
                const compatModels = getPartCompatibleModels(p);
                const compatText = formatCompatibilityString(compatModels);

                return (
                <div key={p.id} className="p-2 flex items-center justify-between text-xs hover:bg-gray-50">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-gray-900">{p.partNumber}</span>
                      <span className="text-gray-700 ml-1 font-medium">{p.description}</span>
                      <span className="text-gray-400 text-[10px] ml-1">({p.category})</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                      <span className="font-semibold text-gray-600">Compatible:</span>
                      <span className="text-blue-700 bg-blue-50 px-1 rounded font-mono text-[9px] border border-blue-100">{compatText}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddPartToReport({
                      partId: p.partNumber,
                      partNumber: p.partNumber,
                      description: p.description,
                      brand: p.brand,
                      quantity: 1,
                      source: selectedSource,
                      condition: selectedCondition,
                      action: selectedAction
                    })}
                    className="px-2 py-1 bg-gray-900 hover:bg-black text-white rounded text-[11px] font-bold"
                  >
                    + Add to Report
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Parts Currently Added */}
          {partsUsedList.length > 0 && (
            <div className="border-t pt-3 bg-red-50/50 p-3 rounded-xl border border-red-100">
              <h4 className="text-xs font-bold text-red-900 mb-2">
                Parts Configured on this Work Order ({partsUsedList.length}):
              </h4>
              <div className="space-y-1 text-xs">
                {partsUsedList.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-red-200">
                    <div>
                      <span className="font-mono font-bold text-gray-900">{p.quantity}x {p.partNumber}</span>
                      <span className="text-gray-700 ml-2">{p.description}</span>
                      <span className="text-gray-500 ml-2">({p.condition} • {p.action} from {p.source})</span>
                    </div>
                    <button
                      onClick={() => handleRemovePart(idx)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove part"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          THE EXACT A4 PHYSICAL PRINT REPLICA
          Dimensions: 210mm x 297mm
          Background: Pure White
          Colors: Original Header Red (#f03a3a), Linx Blue (#2d3282), Black Lines
          Handwriting: Completely removed, 100% clean editable fields
         ========================================================================= */}
      <div 
        className="w-full max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl p-4 sm:p-[12mm] text-black relative flex flex-col justify-between print:w-[210mm] print:shadow-none print:m-0 print:p-[10mm]"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff'
        }}
      >
        <div ref={printRef} style={{ fontFamily: 'Times New Roman, serif' }}>
          
          {/* HEADER (PRESERVING ORIGINAL COLORS & BRANDING) */}
          <div className="flex justify-between items-start border-b-2 border-[#f03a3a] pb-2 mb-2">
            
            {/* Left Header Branding */}
            <div className="w-[40%]">
              <h1 className="text-4xl font-bold text-[#f03a3a] tracking-widest" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>
                RELIABLE
              </h1>
              <p className="text-[9px] font-sans font-bold text-gray-900 mt-1">
                INDUSTRIAL CODING AND MARKING SYSTEMS CO. L.L.C.
              </p>
            </div>
            
            {/* Center Logo */}
            <div className="w-[20%] flex flex-col items-center pt-1">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="text-[#2a2a2a] text-5xl font-black italic -ml-2 -mt-1 select-none">R</div>
                <div className="absolute top-2 right-1 w-8 h-2 bg-[#f03a3a] rotate-12"></div>
              </div>
              <p className="text-[10px] italic font-serif mt-1 text-gray-800">Simply the best......</p>
            </div>
            
            {/* Right Header Arabic Branding */}
            <div className="w-[40%] text-right dir-rtl" dir="rtl">
              <h1 className="text-4xl font-bold text-[#f03a3a] mb-1 font-sans">
                شركة ريليابل
              </h1>
              <p className="text-[10px] font-sans font-bold text-gray-900">
                اندستريال كودينغ آند ماركينغ سيستمز ش.ذ.م.م.
              </p>
            </div>
          </div>
          
          {/* Address Line */}
          <div className="text-center text-[10px] font-sans font-medium mb-3 text-gray-800">
            P.O. BOX : 79048 , Dubai , U.A.E. TEL : +971 4 2896005, FAX : +971 4 2896605, E-mail : info@reliableglobal.com, Web.: www.reliableglobal.com
          </div>

          {/* Sub Header (LINX & WORK ORDER) */}
          <div className="flex justify-between items-end mb-4">
            <div className="flex items-center">
              <div className="bg-[#2d3282] text-white px-3 py-1 tracking-[0.3em] font-serif italic text-lg font-bold shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]">
                L I N X
              </div>
              <div className="text-[8px] font-sans font-bold text-[#2d3282] ml-2 tracking-widest uppercase">
                Thinking along your lines
              </div>
            </div>
            
            <div className="text-2xl font-bold underline decoration-2 underline-offset-4 tracking-wider text-black">
              WORK ORDER
            </div>
            
            <div className="text-lg font-serif">
              S. No. <span className="text-[#f03a3a] font-sans font-bold ml-1">
                <input 
                  type="text" 
                  value={report.reportNo || ''} 
                  onChange={e => handleChange('reportNo', e.target.value)} 
                  className="w-24 outline-none text-[#f03a3a] bg-transparent font-bold print:text-[#f03a3a]" 
                />
              </span>
            </div>
          </div>

          {/* MAIN FORM GRID */}
          <div className="flex justify-between gap-6 mb-3">
            
            {/* Left Column Fields */}
            <div className="w-[74%]">
              <EditableRow label="CUSTOMER" field="customer" />
              <EditableRow label="ADDRESS" field="address" />
              <EditableRow label="TEL & FAX" field="telFax" />
              <EditableRow label="E-MAIL" field="email" />
              <EditableRow label="DATE" field="date" />
            </div>

            {/* Right Column Checkboxes */}
            <div className="w-[26%] flex flex-col items-end">
              <CheckboxItem label="NEW INSTAL" />
              <CheckboxItem label="WARRANTY" />
              <CheckboxItem label="SPOT JOB" />
              <CheckboxItem label="AMC" />
              <CheckboxItem label="DEMO" />
              <CheckboxItem label="TRIAL" />
              <CheckboxItem label="OTHERS" />
            </div>
          </div>

          {/* Machine Details & Right-side Invoice numbers */}
          <div className="relative mb-3">
            <div className="w-[68%]">
              <EditableRow label="Machine Details / Work Description" field="machineDetails" />
              <EditableRow label="Model Number" field="modelNumber" />
              <EditableRow label="Printer / Controller Serial Number" field="printerSerial" />
              <EditableRow label="Print head Sr.No." field="printHeadSerial" />
              <EditableRow label="Ink / Sol / Catridge Batch Code" field="inkBatch" />
            </div>

            {/* Right Column Invoice / DO / QTN Fields */}
            <div className="absolute top-0 right-0 w-44 text-[11px] font-serif space-y-1.5 pt-1">
              <div className="flex justify-between items-end border-b border-dotted border-gray-600">
                <span className="font-bold">INVOICE NO.:</span>
                <input 
                  type="text" 
                  value={report.invoiceNo || ''} 
                  onChange={e => handleChange('invoiceNo', e.target.value)} 
                  className="w-20 outline-none bg-transparent text-gray-900 text-right font-sans font-medium" 
                />
              </div>
              <div className="flex justify-between items-end border-b border-dotted border-gray-600">
                <span className="font-bold">D/O. NO. :</span>
                <input 
                  type="text" 
                  value={report.doNo || ''} 
                  onChange={e => handleChange('doNo', e.target.value)} 
                  className="w-20 outline-none bg-transparent text-gray-900 text-right font-sans font-medium" 
                />
              </div>
              <div className="flex justify-between items-end border-b border-dotted border-gray-600">
                <span className="font-bold">QTN. NO. :</span>
                <input 
                  type="text" 
                  value={report.qtnNo || ''} 
                  onChange={e => handleChange('qtnNo', e.target.value)} 
                  className="w-20 outline-none bg-transparent text-gray-900 text-right font-sans font-medium" 
                />
              </div>
            </div>
          </div>

          {/* Ruled Multiline Text Areas */}
          {/* 1. Job Carried Out */}
          <div className="mb-3">
            <div className="text-xs font-serif font-bold text-gray-900 mb-0.5">Job Carried Out :</div>
            <textarea 
              value={report.jobCarriedOut || ''}
              onChange={e => handleChange('jobCarriedOut', e.target.value)}
              rows={4}
              className="w-full outline-none resize-none text-gray-900 font-sans text-xs leading-[28px] bg-transparent print:text-black font-medium"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #555 27px, #555 28px)',
                backgroundAttachment: 'local'
              }}
            ></textarea>
          </div>

          {/* 2. Parts Replaced / Required */}
          <div className="mb-3">
            <div className="text-xs font-serif font-bold text-gray-900 mb-0.5">Parts Replaced / Required :</div>
            <textarea 
              value={report.partsReplaced || ''}
              onChange={e => handleChange('partsReplaced', e.target.value)}
              rows={3}
              className="w-full outline-none resize-none text-gray-900 font-sans text-xs leading-[28px] bg-transparent print:text-black font-medium"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #555 27px, #555 28px)',
                backgroundAttachment: 'local'
              }}
            ></textarea>
          </div>

          {/* 3. Remarks / Status */}
          <div className="mb-4">
            <div className="text-xs font-serif font-bold text-gray-900 mb-0.5">Remarks / Status :</div>
            <textarea 
              value={report.remarks || ''}
              onChange={e => handleChange('remarks', e.target.value)}
              rows={2}
              className="w-full outline-none resize-none text-gray-900 font-sans text-xs leading-[28px] bg-transparent print:text-black font-medium"
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #555 27px, #555 28px)',
                backgroundAttachment: 'local'
              }}
            ></textarea>
          </div>

          {/* Legal / Confirmation Text */}
          <div className="text-[10px] font-sans text-gray-900 mb-4 font-medium leading-relaxed">
            I/We hereby confirm that the above mentioned work has been carried out to our utmost satisfaction and the equipment is working satisfactorily. I/We also accept to pay the service / spare parts charges as agreed.
          </div>

          {/* Signatures */}
          <div className="flex justify-between mb-4">
            {/* Customer Signature Box */}
            <div className="w-[46%]">
              <h3 className="font-bold font-serif text-xs mb-2">For Customer</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-end">
                  <span className="w-16 shrink-0">Name</span>
                  <span className="w-3 shrink-0">:</span>
                  <input 
                    type="text" 
                    value={report.customerName || ''} 
                    onChange={e => handleChange('customerName', e.target.value)} 
                    className="flex-grow outline-none border-b border-dotted border-gray-600 text-gray-900 px-1 print:text-black font-sans text-xs" 
                  />
                </div>
                <div className="flex items-end">
                  <span className="w-16 shrink-0">Position</span>
                  <span className="w-3 shrink-0">:</span>
                  <input 
                    type="text" 
                    value={report.customerPosition || ''} 
                    onChange={e => handleChange('customerPosition', e.target.value)} 
                    className="flex-grow outline-none border-b border-dotted border-gray-600 text-gray-900 px-1 print:text-black font-sans text-xs" 
                  />
                </div>
                <div className="flex items-end relative h-14">
                  <span className="w-16 shrink-0 mb-1">Signature</span>
                  <span className="w-3 shrink-0 mb-1">:</span>
                  <div className="flex-grow border-b border-dotted border-gray-600 h-full relative">
                    <div className="absolute inset-0 pb-1 print:hidden">
                       <SignaturePad 
                         initialData={report.customerSignature} 
                         onSave={val => handleChange('customerSignature', val)} 
                       />
                    </div>
                    {report.customerSignature && (
                      <img 
                        src={report.customerSignature} 
                        className="absolute inset-0 h-14 object-contain hidden print:block" 
                        alt="Customer Signature"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="w-16 shrink-0">Date</span>
                  <span className="w-3 shrink-0">:</span>
                  <input 
                    type="text" 
                    value={report.customerDate || ''} 
                    onChange={e => handleChange('customerDate', e.target.value)} 
                    className="flex-grow outline-none border-b border-dotted border-gray-600 text-gray-900 px-1 print:text-black font-sans text-xs" 
                  />
                </div>
              </div>
            </div>

            {/* Engineer Signature Box */}
            <div className="w-[50%]">
              <h3 className="font-bold font-serif text-xs mb-2 truncate">
                For RELIABLE IND. CODING AND MARKING SYSTEMS CO. L.L.C.
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-end">
                  <span className="w-16 shrink-0">Name</span>
                  <span className="w-3 shrink-0">:</span>
                  <input 
                    type="text" 
                    value={report.engineerName || ''} 
                    onChange={e => handleChange('engineerName', e.target.value)} 
                    className="flex-grow outline-none border-b border-dotted border-gray-600 text-gray-900 px-1 print:text-black font-sans text-xs" 
                  />
                </div>
                <div className="flex items-end">
                  <span className="w-16 shrink-0">Position</span>
                  <span className="w-3 shrink-0">:</span>
                  <input 
                    type="text" 
                    value={report.engineerPosition || ''} 
                    onChange={e => handleChange('engineerPosition', e.target.value)} 
                    className="flex-grow outline-none border-b border-dotted border-gray-600 text-gray-900 px-1 print:text-black font-sans text-xs" 
                  />
                </div>
                <div className="flex items-end relative h-14">
                  <span className="w-16 shrink-0 mb-1">Signature</span>
                  <span className="w-3 shrink-0 mb-1">:</span>
                  <div className="flex-grow border-b border-dotted border-gray-600 h-full relative">
                    <div className="absolute inset-0 pb-1 print:hidden">
                       <SignaturePad 
                         initialData={report.engineerSignature} 
                         onSave={val => handleChange('engineerSignature', val)} 
                       />
                    </div>
                    {report.engineerSignature && (
                      <img 
                        src={report.engineerSignature} 
                        className="absolute inset-0 h-14 object-contain hidden print:block" 
                        alt="Engineer Signature"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-end">
                  <span className="w-16 shrink-0">Date</span>
                  <span className="w-3 shrink-0">:</span>
                  <input 
                    type="text" 
                    value={report.engineerDate || ''} 
                    onChange={e => handleChange('engineerDate', e.target.value)} 
                    className="flex-grow outline-none border-b border-dotted border-gray-600 text-gray-900 px-1 print:text-black font-sans text-xs" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Copies (Customer, Account, Service) */}
          <div className="flex justify-between text-[10px] font-sans font-bold text-gray-800 mt-4 mb-2">
            <div>WHITE - CUSTOMER'S COPY</div>
            <div>PINK - ACCOUNT'S COPY</div>
            <div>BLUE - SERVICE DIV'S COPY</div>
          </div>
          
        </div>
        
        {/* Bottom Red Support Strip */}
        <div className="bg-[#f03a3a] text-white text-center text-[10px] py-1.5 font-sans font-medium tracking-tight">
          For any service related query or consumables requirement, kindly write to : <a href="mailto:support@reliableglobal.com" className="font-bold underline">support@reliableglobal.com</a>
        </div>
      </div>
      
      {/* Exact A4 Print Stylesheet */}
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0mm; 
          }
          html, body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .min-h-screen { 
            background: #ffffff !important; 
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

