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
}

export function WorkOrderFields(p: Props) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activePartIndex, setActivePartIndex] = useState<number | null>(null);
  const [partSearch, setPartSearch] = useState<{ [index: number]: string }>({});

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

  return (
    <section className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-5">
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
          onChange={e => p.onMachine(p.machines.find(m => m.id === e.target.value))}
        >
          <option value="">Select machine for service work</option>
          {p.machines.map(m => (
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
              setActivePartIndex(nextIndex);
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
          const currentSearch = partSearch[i] ?? part.partNumber;
          
          // Machine-aware search & ranking
          let filteredParts: typeof PARTS_MASTER = [];
          if (currentSearch.trim().length > 0) {
            const query = currentSearch.toLowerCase().trim();
            const matched = PARTS_MASTER.filter(pm =>
              pm.partNumber.toLowerCase().includes(query) ||
              pm.description.toLowerCase().includes(query)
            );

            if (selectedMachineModel) {
              // Prioritize parts compatible with the selected machine
              const compatibleFirst = [...matched].sort((a, b) => {
                const aCompat = isPartCompatibleWithModel(a, selectedMachineModel);
                const bCompat = isPartCompatibleWithModel(b, selectedMachineModel);
                if (aCompat && !bCompat) return -1;
                if (!aCompat && bCompat) return 1;
                return 0;
              });
              filteredParts = compatibleFirst.slice(0, 8);
            } else {
              filteredParts = matched.slice(0, 8);
            }
          }

          // Determine compatible models for this selected part (from part.compatibleModels or matching PARTS_MASTER)
          const matchedMasterPart = PARTS_MASTER.find(pm => pm.partNumber.toLowerCase() === (part.partNumber || '').toLowerCase().trim());
          const partCompatibleList = part.compatibleModels && part.compatibleModels.length > 0
            ? part.compatibleModels
            : (matchedMasterPart ? getPartCompatibleModels(matchedMasterPart) : []);
          const compatibilityText = formatCompatibilityString(partCompatibleList);
          const isCompatibleWithCurrent = selectedMachineModel ? (matchedMasterPart ? isPartCompatibleWithModel(matchedMasterPart, selectedMachineModel) : true) : true;

          return (
            <div key={i} className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-gray-50/50 shadow-xs relative">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-700">Part #{i + 1}</span>
                <button
                  type="button"
                  className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center gap-1"
                  onClick={() => {
                    p.setParts(p.parts.filter((_, n) => n !== i));
                    if (activePartIndex === i) setActivePartIndex(null);
                  }}
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>

              {/* Part Number with Autocomplete */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  Part Number
                </label>
                <input
                  aria-label={`Part number ${i + 1}`}
                  placeholder="Search part number or enter manual code..."
                  className={field}
                  value={part.partNumber}
                  onFocus={() => setActivePartIndex(i)}
                  onChange={e => {
                    const val = e.target.value;
                    setPartSearch(prev => ({ ...prev, [i]: val }));
                    update(i, { partNumber: val, partId: val });
                    setActivePartIndex(i);
                  }}
                />

                {/* Autocomplete dropdown */}
                {activePartIndex === i && filteredParts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {filteredParts.map(pm => {
                      const pmCompatModels = getPartCompatibleModels(pm);
                      const pmCompatString = formatCompatibilityString(pmCompatModels);
                      const isMatchesMachine = selectedMachineModel ? isPartCompatibleWithModel(pm, selectedMachineModel) : false;

                      return (
                        <button
                          key={pm.id}
                          type="button"
                          className={`w-full text-left p-2.5 hover:bg-red-50 text-xs flex flex-col gap-1 transition-colors ${
                            isMatchesMachine ? 'bg-green-50/40 hover:bg-green-100/50' : ''
                          }`}
                          onClick={() => {
                            update(i, {
                              partNumber: pm.partNumber,
                              partId: pm.id,
                              description: pm.description,
                              brand: pm.brand,
                              compatibleModels: pmCompatModels,
                            });
                            setPartSearch(prev => ({ ...prev, [i]: pm.partNumber }));
                            setActivePartIndex(null);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-gray-900">{pm.partNumber}</span>
                              {isMatchesMachine && (
                                <span className="inline-flex items-center text-[9px] px-1.5 py-0.2 rounded bg-green-100 text-green-800 font-bold border border-green-200">
                                  ✓ Fits {selectedMachineModel}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold uppercase">{pm.brand}</span>
                          </div>
                          <span className="text-gray-800 text-[11px] font-medium leading-snug">{pm.description}</span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                            <span className="font-bold text-gray-700">Compatible:</span>
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono border border-blue-100">
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
              <div className="relative">
                <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                  Part Description
                </label>
                <input
                  aria-label={`Part description ${i + 1}`}
                  placeholder="Search by part description or name..."
                  className={field}
                  value={part.description}
                  onFocus={() => setActivePartIndex(i + 1000)} // offset for description focus
                  onChange={e => {
                    const val = e.target.value;
                    update(i, { description: val });
                    setPartSearch(prev => ({ ...prev, [i]: val }));
                    setActivePartIndex(i + 1000);
                  }}
                />

                {/* Description Autocomplete dropdown */}
                {activePartIndex === (i + 1000) && filteredParts.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-gray-100">
                    {filteredParts.map(pm => {
                      const pmCompatModels = getPartCompatibleModels(pm);
                      const pmCompatString = formatCompatibilityString(pmCompatModels);
                      const isMatchesMachine = selectedMachineModel ? isPartCompatibleWithModel(pm, selectedMachineModel) : false;

                      return (
                        <button
                          key={pm.id}
                          type="button"
                          className={`w-full text-left p-2.5 hover:bg-red-50 text-xs flex flex-col gap-1 transition-colors ${
                            isMatchesMachine ? 'bg-green-50/40 hover:bg-green-100/50' : ''
                          }`}
                          onClick={() => {
                            update(i, {
                              partNumber: pm.partNumber,
                              partId: pm.id,
                              description: pm.description,
                              brand: pm.brand,
                              compatibleModels: pmCompatModels,
                            });
                            setPartSearch(prev => ({ ...prev, [i]: pm.partNumber }));
                            setActivePartIndex(null);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-xs">{pm.description}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-bold uppercase">{pm.brand}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-gray-700 font-bold">Part No: {pm.partNumber}</span>
                            {isMatchesMachine && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-green-100 text-green-800 font-bold border border-green-200">
                                ✓ Fits {selectedMachineModel}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                            <span className="font-bold text-gray-700">Compatible:</span>
                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-mono border border-blue-100">
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
