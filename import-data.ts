import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// ... data ...
const clients = [
  { id: "CL-0001", name: "Dubai Pipes Factory Co LLC", industryCategory: "Pipe Manufacturing", telFax: "+97148851333", locationArea: "Dubai Investment Park First", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0002", name: "JSS Pipes And Fittings Trading LLC", industryCategory: "Pipe / Fittings", telFax: "+97148053900", locationArea: "Dubai Investment Park 2", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0003", name: "Perfect Foods Factory", industryCategory: "Food Processing", telFax: "+97148868111", locationArea: "Dubai Industrial City 1", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0004", name: "Zad Food Industries Co. LLC", industryCategory: "Food Manufacturing", telFax: "+97144508892", locationArea: "Dubai Industrial City", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0005", name: "Global Food Industries LLC", industryCategory: "Frozen Food", telFax: "+97165332655", locationArea: "Industrial Area", emirate: "Sharjah", country: "UAE", status: "Active" },
  { id: "CL-0006", name: "Essentially Juices Manufacturing LLC", industryCategory: "Juice / Beverage", telFax: "+97148895753", locationArea: "Al Quoz Industrial Area 2", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0007", name: "Dubai Refreshment Company", industryCategory: "Beverage Manufacturing", telFax: "+97148025000", locationArea: "Dubai Investment Park 2", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0008", name: "DUCAB (Dubai Cable Company Pvt Ltd)", industryCategory: "Cable Manufacturing", telFax: "+97148158888", locationArea: "Hessyan First", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0009", name: "Cable Tech Middle East & Africa LLC", industryCategory: "Cable Manufacturing", telFax: "+97148852895", locationArea: "Dubai Investment Park", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0010", name: "Neelkanth Cables Manufacturing L.L.C.", industryCategory: "Cable Manufacturing", telFax: "+971547102600", locationArea: "Dubai Industrial City", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0011", name: "Delta Duct Airconditioning L.L.C.", industryCategory: "HVAC / Duct Manufacturing", telFax: "+97145868930", locationArea: "Dubai Industrial City, Saih Shuaib 4", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0012", name: "Gulf Duct Industries LLC", industryCategory: "HVAC / Duct Manufacturing", telFax: "+97148877269", locationArea: "Dubai Investment Park 2", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0013", name: "KAD Air Conditioning L.L.C.", industryCategory: "HVAC Manufacturing", telFax: "+97145868900", locationArea: "Dubai Industrial City, Saih Shuaib 4", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0014", name: "AlRawabi Dairy Company", industryCategory: "Dairy Manufacturing", telFax: "+97147043000", locationArea: "Al Khawaneej", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0015", name: "Orontes Dairy Manufacturing LLC", industryCategory: "Dairy Manufacturing", telFax: "+97148847778", locationArea: "Dubai Investment Park 2", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0016", name: "Medisal for Pharmaceuticals Industry LLC", industryCategory: "Pharmaceutical", telFax: "+97125555850", locationArea: "ICAD I, Musaffah", emirate: "Abu Dhabi", country: "UAE", status: "Active" },
  { id: "CL-0017", name: "Gulf Pharmaceutical Industries JULPHAR", industryCategory: "Pharmaceutical", telFax: "+97172461461", locationArea: "Al Digdaga", emirate: "Ras Al Khaimah", country: "UAE", status: "Active" },
  { id: "CL-0018", name: "Gulf Center Cosmetics Manufacturing LLC", industryCategory: "Cosmetics Manufacturing", telFax: "+97142727353", locationArea: "Jebel Ali Industrial Area 1", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0019", name: "Milano Cosmetics Factory", industryCategory: "Cosmetics Manufacturing", telFax: "+97165321773", locationArea: "Emirates Industrial City, Al Sajaa", emirate: "Sharjah", country: "UAE", status: "Active" },
  { id: "CL-0020", name: "RAJYOG Water Bottling LLC", industryCategory: "Water Bottling", telFax: "+97143296923", locationArea: "Dubai Investment Park 2", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0021", name: "Jebel Jais Water Factory LLC", industryCategory: "Water Bottling", telFax: "+97180053235", locationArea: "Al Quoz Industrial Area 4", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0022", name: "Duboxx Packaging LLC", industryCategory: "Packaging", telFax: "+97145468455", locationArea: "Al Quoz Industrial Area 1", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0023", name: "Gulf Packaging Industry LLC", industryCategory: "Packaging", telFax: "+97142858858", locationArea: "Umm Ramool", emirate: "Dubai", country: "UAE", status: "Active" },
  { id: "CL-0024", name: "Excel Plastic Industry LLC", industryCategory: "Plastic / Packaging", telFax: "+97167431148", locationArea: "New Industrial Area", emirate: "Umm Al Quwain", country: "UAE", status: "Active" },
  { id: "CL-0025", name: "Aalmir Plastic Contract Manufacturer", industryCategory: "Plastic Manufacturing", telFax: "+97165342603", locationArea: "Industrial Area 11", emirate: "Sharjah", country: "UAE", status: "Active" },
  { id: "CL-0026", name: "National Paints HQ", industryCategory: "Paint Manufacturing", telFax: "+97165130000", locationArea: "Industrial Area 13", emirate: "Sharjah", country: "UAE", status: "Active" },
  { id: "CL-0027", name: "MAS Paints", industryCategory: "Paint Manufacturing", telFax: "+97165344880", locationArea: "Industrial Area 15", emirate: "Sharjah", country: "UAE", status: "Active" },
  { id: "CL-0028", name: "Jood Bakery Products Manufacturing LLC", industryCategory: "Bakery / Food", telFax: "+971503587001", locationArea: "Saih Shuaib 2", emirate: "Dubai", country: "UAE", status: "Active" }
];

const machines = [
  { id: "MC-0001", customerId: "CL-0001", customerName: "Dubai Pipes Factory Co LLC", brand: "LINX", model: "8900", serialNumber: "LI-466787", printHeadSerial: "PH-334053", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 2", status: "Active" },
  { id: "MC-0002", customerId: "CL-0001", customerName: "Dubai Pipes Factory Co LLC", brand: "LINX", model: "8940", serialNumber: "LI-982246", printHeadSerial: "PH-207473", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0003", customerId: "CL-0001", customerName: "Dubai Pipes Factory Co LLC", brand: "LINX", model: "8810", serialNumber: "LI-986646", printHeadSerial: "PH-671858", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 1", status: "Active" },
  { id: "MC-0004", customerId: "CL-0002", customerName: "JSS Pipes And Fittings Trading LLC", brand: "LINX", model: "5900", serialNumber: "LI-241244", printHeadSerial: "PH-198246", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 2", status: "Active" },
  { id: "MC-0005", customerId: "CL-0002", customerName: "JSS Pipes And Fittings Trading LLC", brand: "LINX", model: "8940", serialNumber: "LI-453962", printHeadSerial: "PH-629903", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line B", status: "Active" },
  { id: "MC-0006", customerId: "CL-0003", customerName: "Perfect Foods Factory", brand: "LINX", model: "99-10", serialNumber: "LI-418496", printHeadSerial: "PH-850800", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0007", customerId: "CL-0004", customerName: "Zad Food Industries Co. LLC", brand: "LINX", model: "99-10", serialNumber: "LI-681029", printHeadSerial: "PH-717889", ink: "Ink 1240", solvent: "Solvent 1505", location: "Packing Line", status: "Active" },
  { id: "MC-0008", customerId: "CL-0004", customerName: "Zad Food Industries Co. LLC", brand: "LINX", model: "5900", serialNumber: "LI-216814", printHeadSerial: "PH-895667", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 2", status: "Active" },
  { id: "MC-0009", customerId: "CL-0004", customerName: "Zad Food Industries Co. LLC", brand: "LINX", model: "8820", serialNumber: "LI-942052", printHeadSerial: "PH-543143", ink: "Ink 1240", solvent: "Solvent 1505", location: "Packing Line", status: "Active" },
  { id: "MC-0010", customerId: "CL-0005", customerName: "Global Food Industries LLC", brand: "LINX", model: "8840 Spectrum", serialNumber: "LI-435772", printHeadSerial: "PH-900581", ink: "Pigment Ink", solvent: "Spectrum Solvent", location: "Packing Line", status: "Active" },
  { id: "MC-0011", customerId: "CL-0006", customerName: "Essentially Juices Manufacturing LLC", brand: "LINX", model: "8900", serialNumber: "LI-608382", printHeadSerial: "PH-201414", ink: "Ink 1240", solvent: "Solvent 1505", location: "Packing Line", status: "Active" },
  { id: "MC-0012", customerId: "CL-0007", customerName: "Dubai Refreshment Company", brand: "UBS", model: "MRX10", serialNumber: "UB-487370", printHeadSerial: "PH-946335", ink: "Oil-Based Ink", solvent: "Cleaner / Solvent", location: "Line 1", status: "Active" },
  { id: "MC-0013", customerId: "CL-0008", customerName: "DUCAB (Dubai Cable Company Pvt Ltd)", brand: "LINX", model: "CJ400", serialNumber: "LI-606922", printHeadSerial: "PH-182627", ink: "CJ400 Ink", solvent: "CJ400 Solvent", location: "Production Line B", status: "Active" },
  { id: "MC-0014", customerId: "CL-0008", customerName: "DUCAB (Dubai Cable Company Pvt Ltd)", brand: "LINX", model: "99-10", serialNumber: "LI-517419", printHeadSerial: "PH-969693", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0015", customerId: "CL-0008", customerName: "DUCAB (Dubai Cable Company Pvt Ltd)", brand: "LINX", model: "8900", serialNumber: "LI-858564", printHeadSerial: "PH-479201", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line B", status: "Active" },
  { id: "MC-0016", customerId: "CL-0009", customerName: "Cable Tech Middle East & Africa LLC", brand: "RYNAN", model: "TIJ", serialNumber: "RY-282933", printHeadSerial: "PH-148050", ink: "TIJ Cartridge", solvent: "N/A", location: "Workshop Line", status: "Active" },
  { id: "MC-0017", customerId: "CL-0010", customerName: "Neelkanth Cables Manufacturing L.L.C.", brand: "LINX", model: "8810", serialNumber: "LI-293667", printHeadSerial: "PH-996865", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 2", status: "Active" },
  { id: "MC-0018", customerId: "CL-0011", customerName: "Delta Duct Airconditioning L.L.C.", brand: "LINX", model: "5900", serialNumber: "LI-501476", printHeadSerial: "PH-575435", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0019", customerId: "CL-0012", customerName: "Gulf Duct Industries LLC", brand: "LINX", model: "8840 Spectrum", serialNumber: "LI-598162", printHeadSerial: "PH-472528", ink: "Pigment Ink", solvent: "Spectrum Solvent", location: "Line 2", status: "Active" },
  { id: "MC-0020", customerId: "CL-0013", customerName: "KAD Air Conditioning L.L.C.", brand: "LINX", model: "8810", serialNumber: "LI-848720", printHeadSerial: "PH-765822", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 2", status: "Active" },
  { id: "MC-0021", customerId: "CL-0013", customerName: "KAD Air Conditioning L.L.C.", brand: "UBS", model: "LCX10 UV", serialNumber: "UB-770086", printHeadSerial: "PH-864544", ink: "UV Ink", solvent: "UV Cleaner", location: "Line 2", status: "Active" },
  { id: "MC-0022", customerId: "CL-0013", customerName: "KAD Air Conditioning L.L.C.", brand: "LINX", model: "8900", serialNumber: "LI-381339", printHeadSerial: "PH-584714", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line A", status: "Active" },
  { id: "MC-0023", customerId: "CL-0014", customerName: "AlRawabi Dairy Company", brand: "UBS", model: "LCX10 UV", serialNumber: "UB-931590", printHeadSerial: "PH-684004", ink: "UV Ink", solvent: "UV Cleaner", location: "Line 2", status: "Active" },
  { id: "MC-0024", customerId: "CL-0015", customerName: "Orontes Dairy Manufacturing LLC", brand: "LINX", model: "7900", serialNumber: "LI-243659", printHeadSerial: "PH-944151", ink: "Ink 1240", solvent: "Solvent 1505", location: "Packing Line", status: "Active" },
  { id: "MC-0025", customerId: "CL-0015", customerName: "Orontes Dairy Manufacturing LLC", brand: "LINX", model: "8940", serialNumber: "LI-630651", printHeadSerial: "PH-380746", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 1", status: "Active" },
  { id: "MC-0026", customerId: "CL-0015", customerName: "Orontes Dairy Manufacturing LLC", brand: "LINX", model: "8820", serialNumber: "LI-431231", printHeadSerial: "PH-694731", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0027", customerId: "CL-0016", customerName: "Medisal for Pharmaceuticals Industry LLC", brand: "LINX", model: "8820", serialNumber: "LI-897277", printHeadSerial: "PH-623481", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line A", status: "Active" },
  { id: "MC-0028", customerId: "CL-0017", customerName: "Gulf Pharmaceutical Industries JULPHAR", brand: "LINX", model: "CJ400", serialNumber: "LI-356413", printHeadSerial: "PH-358607", ink: "CJ400 Ink", solvent: "CJ400 Solvent", location: "Workshop Line", status: "Active" },
  { id: "MC-0029", customerId: "CL-0017", customerName: "Gulf Pharmaceutical Industries JULPHAR", brand: "LINX", model: "8840 Spectrum", serialNumber: "LI-798637", printHeadSerial: "PH-665158", ink: "Pigment Ink", solvent: "Spectrum Solvent", location: "Packing Line", status: "Active" },
  { id: "MC-0030", customerId: "CL-0017", customerName: "Gulf Pharmaceutical Industries JULPHAR", brand: "LINX", model: "8810", serialNumber: "LI-822982", printHeadSerial: "PH-549245", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line B", status: "Active" },
  { id: "MC-0031", customerId: "CL-0018", customerName: "Gulf Center Cosmetics Manufacturing LLC", brand: "LINX", model: "7900", serialNumber: "LI-355051", printHeadSerial: "PH-634277", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line A", status: "Active" },
  { id: "MC-0032", customerId: "CL-0018", customerName: "Gulf Center Cosmetics Manufacturing LLC", brand: "LINX", model: "8820", serialNumber: "LI-305325", printHeadSerial: "PH-892495", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 1", status: "Active" },
  { id: "MC-0033", customerId: "CL-0019", customerName: "Milano Cosmetics Factory", brand: "LINX", model: "8840 Spectrum", serialNumber: "LI-867924", printHeadSerial: "PH-267753", ink: "Pigment Ink", solvent: "Spectrum Solvent", location: "Workshop Line", status: "Active" },
  { id: "MC-0034", customerId: "CL-0020", customerName: "RAJYOG Water Bottling LLC", brand: "UBS", model: "MRX10", serialNumber: "UB-613457", printHeadSerial: "PH-500156", ink: "Oil-Based Ink", solvent: "Cleaner / Solvent", location: "Production Line B", status: "Active" },
  { id: "MC-0035", customerId: "CL-0020", customerName: "RAJYOG Water Bottling LLC", brand: "LINX", model: "8900", serialNumber: "LI-700785", printHeadSerial: "PH-654816", ink: "Ink 1240", solvent: "Solvent 1505", location: "Packing Line", status: "Active" },
  { id: "MC-0036", customerId: "CL-0021", customerName: "Jebel Jais Water Factory LLC", brand: "LINX", model: "8940", serialNumber: "LI-965731", printHeadSerial: "PH-220116", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0037", customerId: "CL-0021", customerName: "Jebel Jais Water Factory LLC", brand: "UBS", model: "LCX10 UV", serialNumber: "UB-773054", printHeadSerial: "PH-887352", ink: "UV Ink", solvent: "UV Cleaner", location: "Packing Line", status: "Active" },
  { id: "MC-0038", customerId: "CL-0022", customerName: "Duboxx Packaging LLC", brand: "LINX", model: "7900", serialNumber: "LI-665884", printHeadSerial: "PH-265840", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line A", status: "Active" },
  { id: "MC-0039", customerId: "CL-0022", customerName: "Duboxx Packaging LLC", brand: "LINX", model: "8900", serialNumber: "LI-213402", printHeadSerial: "PH-857168", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0040", customerId: "CL-0022", customerName: "Duboxx Packaging LLC", brand: "LINX", model: "8810", serialNumber: "LI-486183", printHeadSerial: "PH-624902", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 2", status: "Active" },
  { id: "MC-0041", customerId: "CL-0023", customerName: "Gulf Packaging Industry LLC", brand: "LINX", model: "8900", serialNumber: "LI-522942", printHeadSerial: "PH-982554", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0042", customerId: "CL-0023", customerName: "Gulf Packaging Industry LLC", brand: "UBS", model: "LCX10 UV", serialNumber: "UB-742323", printHeadSerial: "PH-738551", ink: "UV Ink", solvent: "UV Cleaner", location: "Line 2", status: "Active" },
  { id: "MC-0043", customerId: "CL-0024", customerName: "Excel Plastic Industry LLC", brand: "LINX", model: "7900", serialNumber: "LI-379396", printHeadSerial: "PH-665579", ink: "Ink 1240", solvent: "Solvent 1505", location: "Production Line B", status: "Active" },
  { id: "MC-0044", customerId: "CL-0025", customerName: "Aalmir Plastic Contract Manufacturer", brand: "UBS", model: "MRX10", serialNumber: "UB-549902", printHeadSerial: "PH-612340", ink: "Oil-Based Ink", solvent: "Cleaner / Solvent", location: "Line 1", status: "Active" },
  { id: "MC-0045", customerId: "CL-0026", customerName: "National Paints HQ", brand: "LINX", model: "7900", serialNumber: "LI-532451", printHeadSerial: "PH-351083", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 1", status: "Active" },
  { id: "MC-0046", customerId: "CL-0027", customerName: "MAS Paints", brand: "UBS", model: "MRX10", serialNumber: "UB-292582", printHeadSerial: "PH-189814", ink: "Oil-Based Ink", solvent: "Cleaner / Solvent", location: "Workshop Line", status: "Active" },
  { id: "MC-0047", customerId: "CL-0028", customerName: "Jood Bakery Products Manufacturing LLC", brand: "LINX", model: "8900", serialNumber: "LI-341869", printHeadSerial: "PH-234628", ink: "Ink 1240", solvent: "Solvent 1505", location: "Workshop Line", status: "Active" },
  { id: "MC-0048", customerId: "CL-0028", customerName: "Jood Bakery Products Manufacturing LLC", brand: "LINX", model: "99-10", serialNumber: "LI-708369", printHeadSerial: "PH-676510", ink: "Ink 1240", solvent: "Solvent 1505", location: "Line 2", status: "Active" }
];

const parts = [
  { partId: "PT-0001", partNumber: "79-VEN-001", description: "Venturi", brand: "LINX", compatibleModels: ["7900"], condition: "New", quantity: 4, minStock: 3, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 7900" },
  { partId: "PT-0002", partNumber: "79-MAN-002", description: "Ink Manifold", brand: "LINX", compatibleModels: ["7900"], condition: "New", quantity: 8, minStock: 2, location: "Main Store", binRack: "C-02", status: "Available", notes: "Compatible with LINX 7900" },
  { partId: "PT-0003", partNumber: "79-FLT-003", description: "Main Filter", brand: "LINX", compatibleModels: ["7900"], condition: "New", quantity: 4, minStock: 3, location: "Main Store", binRack: "C-02", status: "Available", notes: "Compatible with LINX 7900" },
  { partId: "PT-0004", partNumber: "79-LCF-004", description: "Last Chance Filter", brand: "LINX", compatibleModels: ["7900"], condition: "New", quantity: 4, minStock: 3, location: "Main Store", binRack: "C-01", status: "Available", notes: "Compatible with LINX 7900" },
  { partId: "PT-0005", partNumber: "79-PMP-005", description: "Pump", brand: "LINX", compatibleModels: ["7900"], condition: "New", quantity: 6, minStock: 1, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 7900" },
  { partId: "PT-0006", partNumber: "79-STK-006", description: "Solvent Tank", brand: "LINX", compatibleModels: ["7900"], condition: "New", quantity: 3, minStock: 1, location: "Main Store", binRack: "B-01", status: "Available", notes: "Compatible with LINX 7900" },
  { partId: "PT-0007", partNumber: "59-VEN-001", description: "Venturi", brand: "LINX", compatibleModels: ["5900"], condition: "New", quantity: 1, minStock: 2, location: "Main Store", binRack: "C-01", status: "Available", notes: "Compatible with LINX 5900" },
  { partId: "PT-0008", partNumber: "59-PMP-002", description: "Pump", brand: "LINX", compatibleModels: ["5900"], condition: "New", quantity: 3, minStock: 1, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 5900" },
  { partId: "PT-0009", partNumber: "59-FLT-003", description: "Main Filter", brand: "LINX", compatibleModels: ["5900"], condition: "New", quantity: 1, minStock: 2, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 5900" },
  { partId: "PT-0010", partNumber: "59-PHC-004", description: "Printhead Cover", brand: "LINX", compatibleModels: ["5900"], condition: "New", quantity: 1, minStock: 2, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 5900" },
  { partId: "PT-0011", partNumber: "88-VMF-001", description: "Venturi Manifold", brand: "LINX", compatibleModels: ["8810"], condition: "New", quantity: 8, minStock: 2, location: "Main Store", binRack: "B-01", status: "Available", notes: "Compatible with LINX 8810" },
  { partId: "PT-0012", partNumber: "88-PMP-002", description: "Pump", brand: "LINX", compatibleModels: ["8810"], condition: "New", quantity: 6, minStock: 2, location: "Main Store", binRack: "C-01", status: "Available", notes: "Compatible with LINX 8810" },
  { partId: "PT-0013", partNumber: "88-FLT-003", description: "Main Filter", brand: "LINX", compatibleModels: ["8810"], condition: "New", quantity: 2, minStock: 3, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 8810" },
  { partId: "PT-0014", partNumber: "88-STK-004", description: "Solvent Tank", brand: "LINX", compatibleModels: ["8810"], condition: "New", quantity: 6, minStock: 3, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 8810" },
  { partId: "PT-0015", partNumber: "8820-VMF-001", description: "Venturi Manifold", brand: "LINX", compatibleModels: ["8820"], condition: "New", quantity: 2, minStock: 1, location: "Main Store", binRack: "C-02", status: "Available", notes: "Compatible with LINX 8820" },
  { partId: "PT-0016", partNumber: "8820-PMP-002", description: "Pump", brand: "LINX", compatibleModels: ["8820"], condition: "New", quantity: 5, minStock: 2, location: "Main Store", binRack: "B-02", status: "Available", notes: "Compatible with LINX 8820" },
  { partId: "PT-0017", partNumber: "8820-PRS-003", description: "Pressure Sensor", brand: "LINX", compatibleModels: ["8820"], condition: "New", quantity: 5, minStock: 3, location: "Main Store", binRack: "C-02", status: "Available", notes: "Compatible with LINX 8820" },
  { partId: "PT-0018", partNumber: "8820-PHV-004", description: "Printhead Valve", brand: "LINX", compatibleModels: ["8820"], condition: "New", quantity: 1, minStock: 1, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 8820" },
  { partId: "PT-0019", partNumber: "8840-PMF-001", description: "Pigment Manifold", brand: "LINX", compatibleModels: ["8840 Spectrum"], condition: "New", quantity: 5, minStock: 2, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 8840 Spectrum" },
  { partId: "PT-0020", partNumber: "8840-PPM-002", description: "Pigment Pump", brand: "LINX", compatibleModels: ["8840 Spectrum"], condition: "New", quantity: 3, minStock: 2, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 8840 Spectrum" },
  { partId: "PT-0021", partNumber: "8840-AGT-003", description: "Agitator Assembly", brand: "LINX", compatibleModels: ["8840 Spectrum"], condition: "New", quantity: 8, minStock: 3, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 8840 Spectrum" },
  { partId: "PT-0022", partNumber: "8840-SFL-004", description: "Spectrum Filter", brand: "LINX", compatibleModels: ["8840 Spectrum"], condition: "New", quantity: 5, minStock: 2, location: "Main Store", binRack: "B-01", status: "Available", notes: "Compatible with LINX 8840 Spectrum" },
  { partId: "PT-0023", partNumber: "89-VMF-001", description: "Venturi Manifold", brand: "LINX", compatibleModels: ["8900"], condition: "New", quantity: 6, minStock: 2, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 8900" },
  { partId: "PT-0024", partNumber: "89-PMP-002", description: "Pump", brand: "LINX", compatibleModels: ["8900"], condition: "New", quantity: 6, minStock: 1, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 8900" },
  { partId: "PT-0025", partNumber: "89-FLT-003", description: "Main Filter", brand: "LINX", compatibleModels: ["8900"], condition: "New", quantity: 8, minStock: 1, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 8900" },
  { partId: "PT-0026", partNumber: "89-STK-004", description: "Solvent Tank", brand: "LINX", compatibleModels: ["8900"], condition: "New", quantity: 3, minStock: 2, location: "Main Store", binRack: "B-02", status: "Available", notes: "Compatible with LINX 8900" },
  { partId: "PT-0027", partNumber: "8940-VMF-001", description: "Venturi Manifold", brand: "LINX", compatibleModels: ["8940"], condition: "New", quantity: 6, minStock: 3, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 8940" },
  { partId: "PT-0028", partNumber: "8940-PMP-002", description: "Pump", brand: "LINX", compatibleModels: ["8940"], condition: "New", quantity: 5, minStock: 1, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 8940" },
  { partId: "PT-0029", partNumber: "8940-FLT-003", description: "Main Filter", brand: "LINX", compatibleModels: ["8940"], condition: "New", quantity: 5, minStock: 1, location: "Main Store", binRack: "B-02", status: "Available", notes: "Compatible with LINX 8940" },
  { partId: "PT-0030", partNumber: "8940-PHV-004", description: "Printhead Valve", brand: "LINX", compatibleModels: ["8940"], condition: "New", quantity: 4, minStock: 3, location: "Main Store", binRack: "B-01", status: "Available", notes: "Compatible with LINX 8940" },
  { partId: "PT-0031", partNumber: "9910-VEN-001", description: "Venturi", brand: "LINX", compatibleModels: ["99-10"], condition: "New", quantity: 5, minStock: 3, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 99-10" },
  { id: "PT-0032", partNumber: "9910-PMP-002", description: "Pump", brand: "LINX", compatibleModels: ["99-10"], condition: "New", quantity: 3, minStock: 2, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX 99-10" },
  { id: "PT-0033", partNumber: "9910-FLT-003", description: "Main Filter", brand: "LINX", compatibleModels: ["99-10"], condition: "New", quantity: 1, minStock: 1, location: "Main Store", binRack: "C-02", status: "Available", notes: "Compatible with LINX 99-10" },
  { id: "PT-0034", partNumber: "9910-STK-004", description: "Solvent Tank", brand: "LINX", compatibleModels: ["99-10"], condition: "New", quantity: 4, minStock: 1, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX 99-10" },
  { id: "PT-0035", partNumber: "CJ4-FLT-001", description: "Service Filter Kit", brand: "LINX", compatibleModels: ["CJ400"], condition: "New", quantity: 10, minStock: 3, location: "Main Store", binRack: "C-01", status: "Available", notes: "Compatible with LINX CJ400" },
  { id: "PT-0036", partNumber: "CJ4-PMP-002", description: "Pump Assembly", brand: "LINX", compatibleModels: ["CJ400"], condition: "New", quantity: 8, minStock: 2, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with LINX CJ400" },
  { id: "PT-0037", partNumber: "CJ4-PHC-003", description: "Printhead Cover", brand: "LINX", compatibleModels: ["CJ400"], condition: "New", quantity: 8, minStock: 1, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with LINX CJ400" },
  { id: "PT-0038", partNumber: "CJ4-ICH-004", description: "Ink Cartridge Holder", brand: "LINX", compatibleModels: ["CJ400"], condition: "New", quantity: 2, minStock: 1, location: "Main Store", binRack: "C-02", status: "Available", notes: "Compatible with LINX CJ400" },
  { id: "PT-0039", partNumber: "MRX-PMP-001", description: "Pump", brand: "UBS", compatibleModels: ["MRX10"], condition: "New", quantity: 3, minStock: 3, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with UBS MRX10" },
  { id: "PT-0040", partNumber: "MRX-FLT-002", description: "Ink Filter", brand: "UBS", compatibleModels: ["MRX10"], condition: "New", quantity: 10, minStock: 2, location: "Main Store", binRack: "C-01", status: "Available", notes: "Compatible with UBS MRX10" },
  { id: "PT-0041", partNumber: "MRX-SEN-003", description: "Sensor", brand: "UBS", compatibleModels: ["MRX10"], condition: "New", quantity: 10, minStock: 1, location: "Main Store", binRack: "C-01", status: "Available", notes: "Compatible with UBS MRX10" },
  { id: "PT-0042", partNumber: "MRX-PHC-004", description: "Printhead Cable", brand: "UBS", compatibleModels: ["MRX10"], condition: "New", quantity: 2, minStock: 3, location: "Main Store", binRack: "C-02", status: "Available", notes: "Compatible with UBS MRX10" },
  { id: "PT-0043", partNumber: "LCX-PMP-001", description: "UV Pump", brand: "UBS", compatibleModels: ["LCX10 UV"], condition: "New", quantity: 10, minStock: 2, location: "Main Store", binRack: "B-01", status: "Available", notes: "Compatible with UBS LCX10 UV" },
  { id: "PT-0044", partNumber: "LCX-FLT-002", description: "UV Filter", brand: "UBS", compatibleModels: ["LCX10 UV"], condition: "New", quantity: 3, minStock: 2, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with UBS LCX10 UV" },
  { id: "PT-0045", partNumber: "LCX-SEN-003", description: "UV Sensor", brand: "UBS", compatibleModels: ["LCX10 UV"], condition: "New", quantity: 4, minStock: 3, location: "Main Store", binRack: "A-02", status: "Available", notes: "Compatible with UBS LCX10 UV" },
  { id: "PT-0046", partNumber: "LCX-PHC-004", description: "Printhead Cable", brand: "UBS", compatibleModels: ["LCX10 UV"], condition: "New", quantity: 4, minStock: 3, location: "Main Store", binRack: "B-01", status: "Available", notes: "Compatible with UBS LCX10 UV" },
  { id: "PT-0047", partNumber: "TIJ-CHD-001", description: "Printhead Cartridge Holder", brand: "RYNAN", compatibleModels: ["TIJ"], condition: "New", quantity: 2, minStock: 1, location: "Main Store", binRack: "B-02", status: "Available", notes: "Compatible with RYNAN TIJ" },
  { id: "PT-0048", partNumber: "TIJ-SEN-002", description: "Photo Sensor", brand: "RYNAN", compatibleModels: ["TIJ"], condition: "New", quantity: 10, minStock: 1, location: "Main Store", binRack: "A-01", status: "Available", notes: "Compatible with RYNAN TIJ" },
  { id: "PT-0049", partNumber: "TIJ-ENC-003", description: "Encoder", brand: "RYNAN", compatibleModels: ["TIJ"], condition: "New", quantity: 8, minStock: 2, location: "Main Store", binRack: "C-01", status: "Available", notes: "Compatible with RYNAN TIJ" },
  { id: "PT-0050", partNumber: "TIJ-CBL-004", description: "Controller Cable", brand: "RYNAN", compatibleModels: ["TIJ"], condition: "New", quantity: 4, minStock: 2, location: "Main Store", binRack: "B-01", status: "Available", notes: "Compatible with RYNAN TIJ" }
];

async function run() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log('Signing in...');
  const userCredential = await signInWithEmailAndPassword(auth, 'ADMIN@engineerlog.local', 'Admin001');
  console.log('Signed in successfully.');

  const uid = userCredential.user.uid;

  // Make sure admin profile exists with correct UID to pass rules
  console.log('Ensuring admin user profile exists for UID:', uid);
  await setDoc(doc(db, 'users', uid), {
    userId: 'ADMIN',
    role: 'ADMIN',
    fullName: 'Administrator'
  }, { merge: true });

  let count = 0;
  
  const chunkArray = (array, size) => {
    const chunked = [];
    let index = 0;
    while (index < array.length) {
      chunked.push(array.slice(index, size + index));
      index += size;
    }
    return chunked;
  };

  // Batches of 500 max
  console.log('Importing Clients...');
  for (const chunk of chunkArray(clients, 400)) {
    const batch = writeBatch(db);
    for (const client of chunk) {
      const address = [client.locationArea, client.emirate, client.country].filter(Boolean).join(', ');
      const docRef = doc(db, 'clients', client.id);
      batch.set(docRef, {
        name: client.name,
        address: address,
        telFax: client.telFax,
        industryCategory: client.industryCategory,
        status: client.status,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
      count++;
    }
    await batch.commit();
  }

  console.log('Importing Machines...');
  for (const chunk of chunkArray(machines, 400)) {
    const batch = writeBatch(db);
    for (const machine of chunk) {
      const docRef = doc(db, 'customerMachines', machine.id);
      batch.set(docRef, {
        customerId: machine.customerId,
        customerName: machine.customerName,
        brand: machine.brand,
        model: machine.model,
        serialNumber: machine.serialNumber,
        printHeadSerial: machine.printHeadSerial,
        ink: machine.ink,
        solvent: machine.solvent,
        location: machine.location,
        status: machine.status,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
      count++;
    }
    await batch.commit();
  }

  console.log('Importing Parts Inventory...');
  for (const chunk of chunkArray(parts, 400)) {
    const batch = writeBatch(db);
    for (const part of chunk) {
      const docRef = doc(db, 'inventory', part.partId || part.id);
      batch.set(docRef, {
        partId: part.partId || part.id,
        partNumber: part.partNumber,
        description: part.description,
        brand: part.brand,
        applicableModels: part.compatibleModels,
        condition: part.condition,
        quantity: part.quantity,
        minStock: part.minStock,
        location: part.location,
        notes: part.notes,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }, { merge: true });
      count++;
    }
    await batch.commit();
  }

  console.log(`Imported ${count} records successfully.`);
  process.exit(0);
}

run().catch(e => {
  console.error("Error running import:", e);
  process.exit(1);
});
