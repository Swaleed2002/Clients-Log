import React, { useState, useMemo } from 'react';
import { 
  PrinterBrand, 
  LinxModel, 
  UbsModel, 
  RynanModel, 
  PartMasterItem, 
  PartCategory, 
  UserProfile 
} from '../types';
import { 
  LINX_MODELS, 
  UBS_MODELS, 
  RYNAN_MODELS, 
  LINX_8810_PLUS_MODELS, 
  getPartsForModel, 
  searchParts 
} from '../data/partsMaster';
import { getInksForModel, InkMasterItem } from '../data/inksMaster';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Package, 
  Droplet, 
  Plus, 
  Info,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface PartsCatalogProps {
  currentUser: UserProfile;
  onSelectPartForReport?: (part: PartMasterItem) => void;
  onRequestFromStore?: (part: PartMasterItem) => void;
}

export const PartsCatalog: React.FC<PartsCatalogProps> = ({ 
  currentUser, 
  onSelectPartForReport,
  onRequestFromStore 
}) => {
  const [activeTab, setActiveTab] = useState<'parts' | 'inks'>('parts');
  const [selectedBrand, setSelectedBrand] = useState<PrinterBrand>('LINX');
  const [selectedLinxModel, setSelectedLinxModel] = useState<LinxModel>('8920');
  const [selectedUbsModel, setSelectedUbsModel] = useState<UbsModel>('MRX 10');
  const [selectedRynanModel, setSelectedRynanModel] = useState<RynanModel>('B1040');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [includeObsolete, setIncludeObsolete] = useState(false);
  const [copiedPart, setCopiedPart] = useState<string | null>(null);

  // Active model depending on brand
  const activeModel = useMemo(() => {
    if (selectedBrand === 'LINX') return selectedLinxModel;
    if (selectedBrand === 'UBS') return selectedUbsModel;
    return selectedRynanModel;
  }, [selectedBrand, selectedLinxModel, selectedUbsModel, selectedRynanModel]);

  // Is Spectrum active
  const isLinxSpectrum = selectedBrand === 'LINX' && selectedLinxModel === '8940 Spectrum';
  const isLinx8810Plus = selectedBrand === 'LINX' && LINX_8810_PLUS_MODELS.includes(selectedLinxModel);

  // Filter parts strictly according to user rules
  const partsList = useMemo(() => {
    let list = searchParts(selectedBrand, activeModel, searchQuery, includeObsolete);
    if (selectedCategory !== 'ALL') {
      list = list.filter(p => p.category === selectedCategory);
    }
    return list;
  }, [selectedBrand, activeModel, searchQuery, selectedCategory, includeObsolete]);

  // Compatible inks
  const inksList = useMemo(() => {
    return getInksForModel(selectedBrand, activeModel);
  }, [selectedBrand, activeModel]);

  // Categories present in this filtered brand/model
  const availableCategories = useMemo(() => {
    const rawList = getPartsForModel(selectedBrand, activeModel, includeObsolete);
    const cats = new Set<string>();
    rawList.forEach(p => cats.add(p.category));
    return Array.from(cats).sort();
  }, [selectedBrand, activeModel, includeObsolete]);

  const handleCopy = (partNumber: string) => {
    navigator.clipboard.writeText(partNumber);
    setCopiedPart(partNumber);
    setTimeout(() => setCopiedPart(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-[#E61C24]">
                OFFICIAL PARTS MASTER
              </span>
              <span className="text-xs text-gray-500 font-medium">Verified from Technical Manuals</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 mt-1">
              Printer Parts & Consumables Catalog
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Select printer brand and model to view applicable spare parts, maintenance kits, and fluids.
            </p>
          </div>

          {/* Catalog Type Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setActiveTab('parts')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'parts' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-4 h-4 mr-1.5 text-blue-600" />
              SPARE PARTS ({partsList.length})
            </button>
            <button
              onClick={() => setActiveTab('inks')}
              className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'inks' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Droplet className="w-4 h-4 mr-1.5 text-red-600" />
              INKS & SOLVENTS ({inksList.length})
            </button>
          </div>
        </div>

        {/* Brand & Model Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          {/* Brand Buttons */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Printer Brand
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['LINX', 'UBS', 'RYNAN'] as PrinterBrand[]).map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    setSelectedBrand(brand);
                    setSelectedCategory('ALL');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all text-center border ${
                    selectedBrand === brand
                      ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selector */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Printer Model Selection
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedBrand === 'LINX' && LINX_MODELS.map(model => {
                const isSelected = selectedLinxModel === model;
                const isSpectrum = model === '8940 Spectrum';
                return (
                  <button
                    key={model}
                    onClick={() => {
                      setSelectedLinxModel(model);
                      setSelectedCategory('ALL');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? isSpectrum 
                          ? 'bg-purple-700 text-white border-purple-700 shadow-sm ring-2 ring-purple-300'
                          : 'bg-[#E61C24] text-white border-[#E61C24] shadow-sm'
                        : isSpectrum
                          ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {isSpectrum ? '⭐ 8940 Spectrum' : model}
                  </button>
                );
              })}

              {selectedBrand === 'UBS' && UBS_MODELS.map(model => (
                <button
                  key={model}
                  onClick={() => setSelectedUbsModel(model)}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                    selectedUbsModel === model
                      ? 'bg-[#E61C24] text-white border-[#E61C24] shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {model}
                </button>
              ))}

              {selectedBrand === 'RYNAN' && RYNAN_MODELS.map(model => (
                <button
                  key={model}
                  onClick={() => setSelectedRynanModel(model)}
                  className={`py-2 px-4 rounded-lg text-xs font-bold transition-all border ${
                    selectedRynanModel === model
                      ? 'bg-[#E61C24] text-white border-[#E61C24] shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Linx Model Group Rule Status Notice */}
        {selectedBrand === 'LINX' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {isLinxSpectrum ? (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-900">
                  <span className="font-bold">LINX 8940 SPECTRUM EXCLUSIVE PARTS SET ACTIVE:</span> Showing only official Spectrum parts (Double damper FA11189, heavy-duty pigmented pump FA11191, mix valve manifold FA11195, FA74514 pigmented kit, shaker, etc.). Common 8810+ standard CIJ parts are strictly excluded per official guidelines.
                </div>
              </div>
            ) : isLinx8810Plus ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <span className="font-bold">COMMON 8810+ PARTS SET APPLIED:</span> Linx models 8810, 8820, 8840, 8910, 8920, 9800, and 9900 share one synchronized master parts database. Selecting {selectedLinxModel} filters directly into this common parts set.
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start space-x-3">
                <Info className="w-5 h-5 text-gray-700 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-700">
                  <span className="font-bold">MODEL SPECIFIC PARTS ACTIVE:</span> Showing parts for LINX {selectedLinxModel}.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Parts Search & Filter Toolbar */}
      {activeTab === 'parts' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Box */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search part # or keyword (e.g. FA11065, pump, valve, filter)..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E61C24] focus:bg-white"
              />
            </div>

            {/* Category and Obsolete Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories ({availableCategories.length})</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  checked={includeObsolete}
                  onChange={e => setIncludeObsolete(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <span>Include Obsolete Parts</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'parts' ? (
        <div className="space-y-4">
          {partsList.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-bold text-gray-700">No parts found matching query</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching by different part number, keywords, or change the category filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partsList.map(part => {
                const isObsolete = part.status === 'OBSOLETE';
                return (
                  <div 
                    key={part.id}
                    className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all hover:shadow-md ${
                      isObsolete ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-700">
                          {part.category}
                        </span>
                        
                        {isObsolete ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" /> OBSOLETE
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium text-gray-400">
                            p.{part.sourcePage}
                          </span>
                        )}
                      </div>

                      {/* Part Number */}
                      <div className="flex items-center justify-between group">
                        <h3 className="text-lg font-black text-gray-900 tracking-tight font-mono">
                          {part.partNumber}
                        </h3>
                        <button
                          onClick={() => handleCopy(part.partNumber)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
                          title="Copy Part Number"
                        >
                          {copiedPart === part.partNumber ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-sm font-bold text-gray-800 mt-1 line-clamp-2">
                        {part.description}
                      </p>

                      {/* Comments / Tech details */}
                      {part.comments && (
                        <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          {part.comments}
                        </p>
                      )}

                      {/* Obsolete replacement notice */}
                      {isObsolete && part.replacementPartNumber && (
                        <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100 flex items-center">
                          <ArrowRight className="w-3.5 h-3.5 mr-1" />
                          Replacement: <span className="font-mono ml-1 font-black underline">{part.replacementPartNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-[11px] text-gray-400 truncate max-w-[150px]" title={part.sourceDoc}>
                        {part.sourceDoc}
                      </div>

                      <div className="flex items-center space-x-2">
                        {onSelectPartForReport && (
                          <button
                            onClick={() => onSelectPartForReport(part)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#E61C24] text-xs font-bold rounded-lg transition-colors"
                          >
                            + Report
                          </button>
                        )}
                        {onRequestFromStore && (
                          <button
                            onClick={() => onRequestFromStore(part)}
                            className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Request
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Inks and Solvents Tab */
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h2 className="text-lg font-black text-gray-900 mb-1">
              Compatible Inks, Solvents & Cleaning Fluids for {selectedBrand} {activeModel}
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Only fluids tested and certified for this model are shown below.
            </p>

            {inksList.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No specific fluids cataloged for this model. Contact technical support.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inksList.map(ink => (
                  <div key={ink.id} className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        ink.type === 'Ink' 
                          ? 'bg-blue-100 text-blue-800' 
                          : ink.type === 'Solvent' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ink.type}
                      </span>
                      {ink.chemistry && (
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {ink.chemistry}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-gray-900 font-mono">
                      Code: {ink.productCode}
                    </h4>
                    <p className="text-sm font-bold text-gray-700 mt-1">
                      {ink.name}
                    </p>
                    {ink.notes && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                        {ink.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
