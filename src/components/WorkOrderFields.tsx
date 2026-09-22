import React, { useRef, useState } from 'react';
import { CustomerMachine, ServiceReportPartUsed } from '../types';
import { PARTS_MASTER, getPartCompatibleModels, formatCompatibilityString, isPartCompatibleWithModel } from '../data/partsMaster';
import { Camera, Upload, Trash2, Plus, Image as ImageIcon, Check, Wrench, Sparkles, CheckCircle2 } from 'lucide-react';

// Keep the attachment below the document budget without silently degrading legibility.
export async function readWorkOrderImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Image must be smaller than 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, 2400 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.7]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= 700000) return result;
    }
    throw new Error('Image is too large. Crop around the Work Order and try again.');
  } finally { URL.revokeObjectURL(url); }
}

interface Props {
  machines: CustomerMachine[];
  machineId: string;
  onMachine: (machine?: CustomerMachine) => void;
  complaint: string;
  setComplaint: (value: string) => void;
  parts: ServiceReportPartUsed[];
  setParts: (parts: ServiceReportPartUsed[]) => void;
  image: string;
  onImage: (file: File) => Promise<void>;
  removeImage: () => void;
  busy: boolean;
  technician: string;
  customerName?: string;
  customerId?: string;
}

export function WorkOrderFields(p: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedMachines = React.useMemo(() => {
    if (!p.customerName) return p.machines;
    const target = p.customerName.trim().toLowerCase();
    const matches: CustomerMachine[] = [];
    const others: CustomerMachine[] = [];
    p.machines.forEach(m => {
      if (
        (m.customerName && m.customerName.trim().toLowerCase() === target) ||
        (p.customerId && m.customerId === p.customerId)
      ) {
        matches.push(m);
      } else {
        others.push(m);
      }
    });
    return [...matches, ...others];
  }, [p.machines, p.customerName, p.customerId]);

  // Track active autocomplete field: { index: number, field: 'partNumber' | 'description' } | null
  const [activeField, setActiveField] = useState<{ index: number; field: 'partNumber' | 'description' } | null>(null);
  // Separate search query strings for part number and description per row
  const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>({});

  const update = (index: number, data: Partial<ServiceReportPartUsed>) =>
    p.setParts(p.parts.map((part, i) => i === index ? { ...part, ...data } : part));

  const field = 'w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      void p.onImage(file);
    }
  };

    // Selected machine model for machine-aware prioritizing
  const selectedMachine = p.machines.find(m => m.id === p.machineId);
  const selectedMachineModel = selectedMachine?.model || '';
  // Close autocomplete on outside tap/click
  const containerRef = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleDocumentClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('touchstart', handleDocumentClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('touchstart', handleDocumentClick);
    };
  }, []);

  // Helper to get machine-aware search results for any query
  const getSuggestions = (rawQuery: string) => {
    const q = rawQuery.trim().toLowerCase();
    
    // If blank or very short, provide browse list (sorted by machine compatibility if selected)
    let pool = PARTS_MASTER;
    if (q.length > 0) {
      pool = PARTS_MASTER.filter(pm =>
        pm.partNumber.toLowerCase().includes(q) ||
        pm.description.toLowerCase().includes(q)
      );
    }

    // Sort machine-compatible parts first
    const sorted = [...pool].sort((a, b) => {
      if (selectedMachineModel) {
        const aCompat = isPartCompatibleWithModel(a, selectedMachineModel);
        const bCompat = isPartCompatibleWithModel(b, selectedMachineModel);
        if (aCompat && !bCompat) return -1;
        if (!aCompat && bCompat) return 1;
      }
      return 0;
    });

    return sorted.slice(0, 10);
  };


  return (
    <section ref={containerRef} className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
      <div className="border-b border-gray-100 pb-3">
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E61C24]"></span>
          Machine & Physical Work Order
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Select customer machine, capture/attach company paper Work Order, and log used parts
        </p>
      </div>

      {/* Machine Selection */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Machine
        </label>
        <select
          aria-label="Machine"
          className={field}
          value={p.machineId}
          onChange={e => p.onMachine(sortedMachines.find(m => m.id === e.target.value))}
        >
          <option value="">Select machine for service work</option>
          {sortedMachines.map(m => (
            <option key={m.id} value={m.id}>
              {m.customerName} — {m.model} (S/N: {m.serialNumber})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
        <span>Assigned Technician:</span>
        <span className="font-bold text-gray-900">{p.technician || 'Not Specified'}</span>
      </div>

      {/* Customer Complaint / Issue */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Reported Complaint / Issue
        </label>
        <textarea
          rows={2}
          placeholder="Describe customer complaint or failure symptom..."
          className={field}
          value={p.complaint}
          onChange={e => p.setComplaint(e.target.value)}
        />
      </div>

      {/* Physical Work Order Photo Options */}
      <div className="space-y-3 pt-1">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
          Physical Work Order Photo
        </label>

        {/* Hidden inputs for camera capture and file picker */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={p.busy}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={p.busy}
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option 1: Take Photo with Device Camera */}
          <button
            type="button"
            disabled={p.busy}
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2.5 px-4 py-3 border-2 border-dashed border-red-300 bg-red-50/50 hover:bg-red-50 text-[#E61C24] rounded-xl font-bold text-sm transition-all hover:border-red-500 active:scale-[0.99] disabled:opacity-50 shadow-sm"
          >
            <Camera className="w-5 h-5 text-[#E61C24]" />
            <span>Take Photo</span>
          </button>

          {/* Option 2: Upload Existing Photo / File Picker */}
          <button
            type="button"
            disabled={p.busy}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2.5 px-4 py-3 border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-bold text-sm transition-all hover:border-gray-400 active:scale-[0.99] disabled:opacity-50 shadow-sm"
          >
            <Upload className="w-5 h-5 text-gray-600" />
            <span>Upload Photo</span>
          </button>
        </div>

        {/* Work Order Preview */}
        {p.image && (
          <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Work Order Attached
              </span>
              <button
                type="button"
                disabled={p.busy}
                onClick={p.removeImage}
                className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
            <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white">
              <img
                src={p.image}
                alt="Physical Work Order preview"
                className="max-h-80 w-full object-contain mx-auto"
              />
            </div>
            <p className="text-[11px] text-gray-500 text-center">
              Make sure serials, customer signatures, and line items on the photo are readable before saving.
            </p>
          </div>
        )}
      </div>

      {/* Parts Used Section */}
      <div className="space-y-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            Parts Used
            {p.parts.length > 0 && (
              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {p.parts.length}
              </span>
            )}
          </h4>
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-[#E61C24] hover:bg-red-100 text-xs font-bold transition-all"
            onClick={() => {
              const nextIndex = p.parts.length;
              p.setParts([...p.parts, {
                partId: '',
                partNumber: '',
                description: '',
                quantity: 1,
                source: 'OTHER',
                condition: 'New'
              }]);
              setActiveField({ index: nextIndex, field: 'partNumber' });
            }}
          >
            <Plus className="w-3.5 h-3.5" /> Add Part
          </button>
        </div>

        {p.parts.length === 0 && (
          <p className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">
            No parts recorded yet for this service job. Click "Add Part" to add parts replaced or consumed.
          </p>
        )}

        {p.parts.map((part, i) => {
          const isPartNumberActive = activeField?.index === i && activeField?.field === 'partNumber';
          const isDescriptionActive = activeField?.index === i && activeField?.field === 'description';
          
          const pnQueryKey = `${i}_pn`;
          const descQueryKey = `${i}_desc`;

          const pnQuery = searchQueries[pnQueryKey] !== undefined ? searchQueries[pnQueryKey] : (part.partNumber || '');
          const descQuery = searchQueries[descQueryKey] !== undefined ? searchQueries[descQueryKey] : (part.description || '');

          const activeQuery = isPartNumberActive ? pnQuery : (isDescriptionActive ? descQuery : '');
          const suggestions = (isPartNumberActive || isDescriptionActive) ? getSuggestions(activeQuery) : [];

          // Determine compatible models for this selected part (from part.compatibleModels or matching PARTS_MASTER)
          const matchedMasterPart = PARTS_MASTER.find(pm => pm.partNumber.toLowerCase() === (part.partNumber || '').toLowerCase().trim());
          const partCompatibleList = part.compatibleModels && part.compatibleModels.length > 0
            ? part.compatibleModels
            : (matchedMasterPart ? getPartCompatibleModels(matchedMasterPart) : []);
          const compatibilityText = formatCompatibilityString(partCompatibleList);
          const isCompatibleWithCurrent = selectedMachineModel ? (matchedMasterPart ? isPartCompatibleWithModel(matchedMasterPart, selectedMachineModel) : true) : true;
          
          const isCardActive = activeField?.index === i;

          return (
            <div key={i} className={`border border-gray-200 rounded-xl p-3.5 space-y-3 bg-gray-50/50 shadow-xs relative ${isCardActive ? 'z-40' : 'z-0'}`}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-700">Part #{i + 1}</span>
                <button
                  type="button"
                  className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1"
                  onClick={() => {
                    p.setParts(p.parts.filter((_, n) => n !== i));
                    if (activeField?.index === i) setActiveField(null);
                  }}
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>

              {/* Part Number with Autocomplete */}
              <div className="relative z-50">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Part Number
                  </label>
                  {isPartNumberActive && (
                    <span className="text-[10px] text-red-600 font-bold animate-pulse">
                      Tap suggestion below
                    </span>
                  )}
                </div>
                <input
                  aria-label={`Part number ${i + 1}`}
                  placeholder="Type part # (e.g. FA16103, vent, pump)..."
                  className={field}
                  value={part.partNumber}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onFocus={() => {
                    setActiveField({ index: i, field: 'partNumber' });
                    setSearchQueries(prev => ({ ...prev, [pnQueryKey]: part.partNumber || '' }));
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchQueries(prev => ({ ...prev, [pnQueryKey]: val }));
                    update(i, { partNumber: val, partId: val });
                    setActiveField({ index: i, field: 'partNumber' });
                  }}
                />

                {/* Autocomplete dropdown for Part Number */}
                {isPartNumberActive && suggestions.length > 0 && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-red-500 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-100 ring-4 ring-red-500/10"
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                      <span>Suggestions ({suggestions.length})</span>
                      {selectedMachineModel && (
                        <span className="text-green-700 font-bold">Prioritizing {selectedMachineModel}</span>
                      )}
                    </div>
                    {suggestions.map(pm => {
                      const pmCompatModels = getPartCompatibleModels(pm);
                      const pmCompatString = formatCompatibilityString(pmCompatModels);
                      const isMatchesMachine = selectedMachineModel ? isPartCompatibleWithModel(pm, selectedMachineModel) : false;

                      return (
                        <button
                          key={pm.id}
                          type="button"
                          className={`w-full text-left p-3 hover:bg-red-50 active:bg-red-100 text-xs flex flex-col gap-1 transition-colors ${
                            isMatchesMachine ? 'bg-green-50/50' : ''
                          }`}
                          onClick={() => {
                            update(i, {
                              partNumber: pm.partNumber,
                              partId: pm.id,
                              description: pm.description,
                              brand: pm.brand,
                              compatibleModels: pmCompatModels,
                            });
                            setSearchQueries(prev => ({
                              ...prev,
                              [pnQueryKey]: pm.partNumber,
                              [descQueryKey]: pm.description,
                            }));
                            setActiveField(null);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-gray-900 text-sm">{pm.partNumber}</span>
                              {isMatchesMachine && (
                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-bold border border-green-300">
                                  ✓ Fits {selectedMachineModel}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold uppercase">{pm.brand}</span>
                          </div>
                          <span className="text-gray-800 text-[11px] font-semibold leading-snug">{pm.description}</span>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                            <span className="font-bold text-gray-700">Compatible:</span>
                            <span className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200">
                              {pmCompatString}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Description with reverse autocomplete */}
              <div className="relative z-40">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Part Description
                  </label>
                  {isDescriptionActive && (
                    <span className="text-[10px] text-red-600 font-bold animate-pulse">
                      Tap suggestion below
                    </span>
                  )}
                </div>
                <input
                  aria-label={`Part description ${i + 1}`}
                  placeholder="Search by part description or name..."
                  className={field}
                  value={part.description}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onFocus={() => {
                    setActiveField({ index: i, field: 'description' });
                    setSearchQueries(prev => ({ ...prev, [descQueryKey]: part.description || '' }));
                  }}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchQueries(prev => ({ ...prev, [descQueryKey]: val }));
                    update(i, { description: val });
                    setActiveField({ index: i, field: 'description' });
                  }}
                />

                {/* Description Autocomplete dropdown */}
                {isDescriptionActive && suggestions.length > 0 && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-red-500 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-100 ring-4 ring-red-500/10"
                    onMouseDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                  >
                    <div className="px-2.5 py-1 bg-gray-50 text-[10px] font-bold text-gray-500 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                      <span>Suggestions ({suggestions.length})</span>
                      {selectedMachineModel && (
                        <span className="text-green-700 font-bold">Prioritizing {selectedMachineModel}</span>
                      )}
                    </div>
                    {suggestions.map(pm => {
                      const pmCompatModels = getPartCompatibleModels(pm);
                      const pmCompatString = formatCompatibilityString(pmCompatModels);
                      const isMatchesMachine = selectedMachineModel ? isPartCompatibleWithModel(pm, selectedMachineModel) : false;

                      return (
                        <button
                          key={pm.id}
                          type="button"
                          className={`w-full text-left p-3 hover:bg-red-50 active:bg-red-100 text-xs flex flex-col gap-1 transition-colors ${
                            isMatchesMachine ? 'bg-green-50/50' : ''
                          }`}
                          onClick={() => {
                            update(i, {
                              partNumber: pm.partNumber,
                              partId: pm.id,
                              description: pm.description,
                              brand: pm.brand,
                              compatibleModels: pmCompatModels,
                            });
                            setSearchQueries(prev => ({
                              ...prev,
                              [pnQueryKey]: pm.partNumber,
                              [descQueryKey]: pm.description,
                            }));
                            setActiveField(null);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-sm">{pm.description}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold uppercase">{pm.brand}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] mt-0.5">
                            <span className="font-mono text-gray-800 font-bold">Part No: {pm.partNumber}</span>
                            {isMatchesMachine && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-800 font-bold border border-green-300">
                                ✓ Fits {selectedMachineModel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mt-0.5">
                            <span className="font-bold text-gray-700">Compatible:</span>
                            <span className="text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200">
                              {pmCompatString}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Compatible Machine / Model(s) Display Badge (Visible After Selection) */}
              {part.partNumber && (
                <div className="p-2.5 bg-blue-50/60 border border-blue-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-blue-950 uppercase text-[10px] tracking-wider">Compatible Machine / Model(s):</span>
                    <span className="font-mono font-bold text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 text-xs">
                      {compatibilityText}
                    </span>
                  </div>
                  {selectedMachineModel && (
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      {isCompatibleWithCurrent ? (
                        <span className="text-green-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          Verified for {selectedMachineModel}
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Notice: Check machine fit for {selectedMachineModel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity, Source, and Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className={field}
                    value={part.quantity}
                    onChange={e => update(i, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    Source
                  </label>
                  <select
                    className={field}
                    value={part.source}
                    onChange={e => update(i, { source: e.target.value as ServiceReportPartUsed['source'] })}
                  >
                    {['STORE', 'MY BAG', 'WORKSHOP MACHINE', 'OTHER'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                    Condition
                  </label>
                  <select
                    className={field}
                    value={part.condition}
                    onChange={e => update(i, { condition: e.target.value as ServiceReportPartUsed['condition'] })}
                  >
                    {['New', 'Used', 'Refurbished'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
