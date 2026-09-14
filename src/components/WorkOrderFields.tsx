import React from 'react';
import { CustomerMachine, ServiceReportPartUsed } from '../types';

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
  const update = (index: number, data: Partial<ServiceReportPartUsed>) => p.setParts(p.parts.map((part, i) => i === index ? { ...part, ...data } : part));
  const field = 'w-full p-2 border border-gray-300 rounded-lg';
  return <section className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
    <h3 className="font-bold text-gray-700">Machine / Physical Work Order</h3>
    <label className="block text-sm">Machine
      <select aria-label="Machine" className={field} value={p.machineId} onChange={e => p.onMachine(p.machines.find(m => m.id === e.target.value))}>
        <option value="">Select machine for service work</option>
        {p.machines.map(m => <option key={m.id} value={m.id}>{m.customerName} — {m.model} — {m.serialNumber}</option>)}
      </select>
    </label>
    <p className="text-sm">Technician: {p.technician}</p>
    <label className="block text-sm">Complaint<textarea className={field} value={p.complaint} onChange={e => p.setComplaint(e.target.value)} /></label>
    <label className="block text-sm">Upload physical Work Order image
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={p.busy} className={field} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void p.onImage(file); }} />
    </label>
    {p.image && <div><img src={p.image} alt="Work Order preview — check text is readable before saving" className="max-h-96 w-full object-contain" /><button type="button" disabled={p.busy} onClick={p.removeImage} className="text-red-700 text-sm">Remove image</button></div>}
    <h3 className="font-bold text-gray-700">Parts Used</h3>
    {p.parts.map((part, i) => <div key={i} className="border rounded-lg p-3 space-y-2">
      <input aria-label={`Part number ${i+1}`} placeholder="Part number" className={field} value={part.partNumber} onChange={e => update(i, { partNumber: e.target.value, partId: e.target.value })} />
      <input aria-label={`Part description ${i+1}`} placeholder="Description" className={field} value={part.description} onChange={e => update(i, { description: e.target.value })} />
      <label className="block text-sm">Quantity<input type="number" min="1" step="1" className={field} value={part.quantity} onChange={e => update(i, { quantity: Number(e.target.value) })} /></label>
      <label className="block text-sm">Source<select className={field} value={part.source} onChange={e => update(i, { source: e.target.value as ServiceReportPartUsed['source'] })}>{['STORE', 'MY BAG', 'WORKSHOP MACHINE', 'OTHER'].map(s => <option key={s}>{s}</option>)}</select></label>
      <label className="block text-sm">Condition<select className={field} value={part.condition} onChange={e => update(i, { condition: e.target.value as ServiceReportPartUsed['condition'] })}>{['New', 'Used', 'Refurbished'].map(s => <option key={s}>{s}</option>)}</select></label>
      <button type="button" className="text-red-700 text-sm" onClick={() => p.setParts(p.parts.filter((_, n) => n !== i))}>Remove part</button>
    </div>)}
    <button type="button" className="px-3 py-2 rounded-lg border text-sm font-bold" onClick={() => p.setParts([...p.parts, { partId: '', partNumber: '', description: '', quantity: 1, source: 'OTHER', condition: 'New' }])}>Add part</button>
  </section>;
}
