import React, { useState } from 'react';
import { Upload, Link2, Calculator, Plus, Check, Clock, Gauge, Zap, X, Scale, Sparkles, Layers } from 'lucide-react';
import { OrderItem } from '../types';

export const AVAILABLE_COLORS = [
  { name: 'Siyah', hex: '#0f172a', textClass: 'text-white' },
  { name: 'Beyaz', hex: '#f8fafc', border: 'border-slate-300', textClass: 'text-slate-900' },
  { name: 'Gri', hex: '#64748b', textClass: 'text-white' },
  { name: 'Kırmızı', hex: '#ef4444', textClass: 'text-white' },
  { name: 'Mavi', hex: '#3b82f6', textClass: 'text-white' },
  { name: 'Yeşil', hex: '#22c55e', textClass: 'text-white' },
  { name: 'Sarı', hex: '#eab308', textClass: 'text-slate-900' },
  { name: 'Turuncu', hex: '#f97316', textClass: 'text-white' },
  { name: 'Mor', hex: '#a855f7', textClass: 'text-white' },
  { name: 'Pembe', hex: '#ec4899', textClass: 'text-white' },
];

export interface EstimatorPreset {
  name: string;
  icon: string;
  width: number;
  depth: number;
  height: number;
  infill: number;
  walls: number;
  shapePreset: string;
  material: string;
}

export const ESTIMATOR_PRESETS: EstimatorPreset[] = [
  { name: 'Mini Figür', icon: '👤', width: 40, depth: 40, height: 60, infill: 12, walls: 2, shapePreset: 'organic', material: 'PLA' },
  { name: 'Telefon Standı', icon: '📱', width: 70, depth: 85, height: 65, infill: 15, walls: 3, shapePreset: 'boxy', material: 'PLA' },
  { name: 'Mekanik Dişli', icon: '⚙️', width: 80, depth: 80, height: 18, infill: 40, walls: 4, shapePreset: 'boxy', material: 'PETG' },
  { name: 'Büyük Vazo', icon: '🏺', width: 90, depth: 90, height: 160, infill: 0, walls: 2, shapePreset: 'hollow', material: 'PLA' },
  { name: 'İnce Plaka', icon: '📋', width: 110, depth: 110, height: 4, infill: 20, walls: 3, shapePreset: 'flat', material: 'ABS' },
];

export interface StlComplexityPreset {
  label: string;
  desc: string;
  factor: number;
  icon: string;
}

export const STL_COMPLEXITIES: Record<string, StlComplexityPreset> = {
  high_poly: {
    label: 'Mini Figür / Detaylı Heykel (Yüksek Poligon)',
    desc: 'Çok fazla üçgen (polygon) içerir fakat fiziksel hacmi küçüktür',
    factor: 4,
    icon: '👤'
  },
  standard: {
    label: 'Standart / Dekoratif Nesneler',
    desc: 'Orta detaylı yüzeyler ve dengeli hacim oranı',
    factor: 10,
    icon: '🏺'
  },
  low_poly: {
    label: 'Mekanik / İşlevsel / Kutular (Düşük Poligon)',
    desc: 'Düzlüklerden oluşur, az sayıda üçgen ama geniş fiziksel hacim',
    factor: 25,
    icon: '⚙️'
  }
};

export const MATERIAL_DENSITIES: Record<string, { label: string; density: number; desc: string }> = {
  PLA: { label: 'PLA', density: 1.24, desc: 'En popüler, kolay basılan sert malzeme' },
  PETG: { label: 'PETG', density: 1.27, desc: 'Daha esnek, darbe ve sıcaklık dayanımlı' },
  ABS: { label: 'ABS / ASA', density: 1.04, desc: 'Hafif, dayanıklı, dış ortam ve güneş dayanımı' },
  TPU: { label: 'TPU (Esnek)', density: 1.20, desc: 'Kauçuk benzeri elastik ve darbe emici' },
};

export const SHAPE_PRESETS: Record<string, { label: string; desc: string; volumeFactor: number }> = {
  organic: { label: 'Organik / Heykel', desc: 'Düzensiz ve kavisli detaylar barındıran figür', volumeFactor: 0.22 },
  boxy: { label: 'Mekanik / Köşeli', desc: 'Kutular, mekanik parçalar, düz yüzeyli tasarımlar', volumeFactor: 0.45 },
  flat: { label: 'İnce Plaka / Düz', desc: 'Kılıflar, levhalar ve düz paneller', volumeFactor: 0.65 },
  solid: { label: 'Masif / Katı Obje', desc: 'Tamamı katı veya çok yoğun doldurulmuş cisim', volumeFactor: 0.85 },
  hollow: { label: 'Vazo / Boş Kabuk', desc: 'İçi tamamen boş, sadece ince duvarlı', volumeFactor: 0.08 },
};

export const POPULAR_MODEL_SITES = [
  { name: 'Makerworld', url: 'https://makerworld.com', desc: 'Bambu Lab resmi modelleri', icon: '🌍' },
  { name: 'Thingiverse', url: 'https://www.thingiverse.com', desc: 'Devasa 3D kütüphane', icon: '🌀' },
  { name: 'Printables', url: 'https://www.printables.com', desc: 'Kaliteli Prusa modelleri', icon: '📦' },
  { name: 'Yeggi', url: 'https://www.yeggi.com', desc: 'Tüm sitelerde arama', icon: '🔍' },
  { name: 'Cults 3D', url: 'https://cults3d.com', desc: 'Özel sanatsal figürler', icon: '🎨' },
  { name: 'Thangs', url: 'https://thangs.com', desc: 'Hızlı 3D arama motoru', icon: '⚡' },
  { name: 'MyMiniFactory', url: 'https://www.myminifactory.com', desc: 'Oyun & RPG tasarımları', icon: '🐉' },
  { name: 'Creality Cloud', url: 'https://www.crealitycloud.com', desc: 'Mobil uyumlu modeller', icon: '☁️' }
];

interface CustomPrintFormProps {
  pricePerGram: number;
  pricePerGramMultiColor: number;
  onAddCustomToCart: (item: OrderItem) => void;
  ordersEnabled?: boolean;
}

export default function CustomPrintForm({ pricePerGram, pricePerGramMultiColor, onAddCustomToCart, ordersEnabled = true }: CustomPrintFormProps) {
  const [designName, setDesignName] = useState('');
  const [makerworldLink, setMakerworldLink] = useState('');
  const [showAllSites, setShowAllSites] = useState(false);
  const [estimatedWeight, setEstimatedWeight] = useState<number>(10);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [printType, setPrintType] = useState<'single' | 'multi'>('single');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Filament Usage Estimator States
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  const [estimatorTab, setEstimatorTab] = useState<'dimensions' | 'fileSize'>('dimensions');
  const [estWidth, setEstWidth] = useState<number>(60);
  const [estDepth, setEstDepth] = useState<number>(60);
  const [estHeight, setEstHeight] = useState<number>(60);
  const [estInfill, setEstInfill] = useState<number>(15);
  const [estWalls, setEstWalls] = useState<number>(3);
  const [estMaterial, setEstMaterial] = useState<string>('PLA');
  const [estShape, setEstShape] = useState<string>('organic');

  // STL File Size Estimator States
  const [stlSizeMb, setStlSizeMb] = useState<number>(8.5);
  const [stlComplexity, setStlComplexity] = useState<string>('standard');
  const [stlInfill, setStlInfill] = useState<number>(15);
  const [stlMaterial, setStlMaterial] = useState<string>('PLA');

  const currentPricePerGram = printType === 'multi' ? pricePerGramMultiColor : pricePerGram;
  const calculatedPrice = estimatedWeight * currentPricePerGram;

  // Bambu Lab A1 Combo print estimation logic based on grammage
  const calculatePrintTime = (weight: number, type: 'single' | 'multi') => {
    // Bambu Lab A1 has a preparation routine (heating, bed leveling, calibration, flow calibration) taking ~8 minutes
    const setupMinutes = 8;
    
    // Average speeds for Bambu Lab A1:
    // Single Color: Prints approx. 18-20g PLA per hour (~3 minutes per gram)
    // Multi Color: The AMS Lite spends a lot of time flushing color swaps, purging, wiping, and printing prime towers.
    // Each filament change adds about 1.5 - 2 minutes. On average, multi-color prints take ~11 minutes per gram.
    const minutesPerGram = type === 'multi' ? 11 : 3;
    
    const totalMinutes = setupMinutes + (weight * minutesPerGram);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    return {
      hours,
      minutes,
      totalMinutes,
      formatted: hours > 0 ? `${hours} saat ${minutes} dk` : `${minutes} dk`
    };
  };

  const printTime = calculatePrintTime(estimatedWeight, printType);

  // Estimator Math calculations
  const density = MATERIAL_DENSITIES[estMaterial]?.density || 1.24;
  const shapeFactor = SHAPE_PRESETS[estShape]?.volumeFactor || 0.25;

  // Volume in cm³ = (W * D * H) / 1000
  const boxVolume = (estWidth * estDepth * estHeight) / 1000;
  
  // Occupied volume is the volume containing the actual shell + infill space
  const occupiedVolume = boxVolume * shapeFactor;

  // Estimate wall volume based on surface area of bounding box and wall lines thickness
  // Surface area in cm² is 2 * (W*D + W*H + D*H) / 100
  const surfaceAreaCm2 = 2 * (estWidth * estDepth + estWidth * estHeight + estDepth * estHeight) / 100;
  // Wall line is approx 0.4mm = 0.04cm
  const wallThicknessCm = estWalls * 0.04;
  // Actual wall volume with curvature scaling factor
  const wallVolume = Math.min(occupiedVolume, surfaceAreaCm2 * wallThicknessCm * 0.6);

  // Infill volume based on empty interior space and selected infill percentage
  const infillVolume = estShape === 'hollow' ? 0 : Math.max(0, occupiedVolume - wallVolume) * (estInfill / 100);

  // Total material volume in cm³
  const totalMaterialVolume = wallVolume + infillVolume;
  
  // Math for STL File Size Estimator
  const stlDensity = MATERIAL_DENSITIES[stlMaterial]?.density || 1.24;
  const complexityFactor = STL_COMPLEXITIES[stlComplexity]?.factor || 10;
  // Weight estimation from size: Size in MB * complexityFactor * materialDensityRatio * infillRatio
  const stlInfillFactor = 0.5 + (stlInfill / 30); // 15% infill is 0.5 + 0.5 = 1.0 (baseline)
  const computedStlWeight = Math.max(1, Math.round(stlSizeMb * complexityFactor * (stlDensity / 1.24) * stlInfillFactor));
  
  // Total weight in grams
  const computedWeight = Math.max(1, Math.round(totalMaterialVolume * density));

  // Dimensions scaled for SVG isometric box preview
  const maxDim = Math.max(estWidth, estDepth, estHeight) || 1;
  const svgScale = 55 / maxDim;
  const w = estWidth * svgScale;
  const d = estDepth * svgScale;
  const h = estHeight * svgScale;

  const cx = 110;
  const cy = 110 + (h / 2);

  const handleApplyPreset = (preset: typeof ESTIMATOR_PRESETS[0]) => {
    setEstWidth(preset.width);
    setEstDepth(preset.depth);
    setEstHeight(preset.height);
    setEstInfill(preset.infill);
    setEstWalls(preset.walls);
    setEstShape(preset.shapePreset);
    setEstMaterial(preset.material);
  };

  const handleApplyWeight = () => {
    if (estimatorTab === 'dimensions') {
      setEstimatedWeight(computedWeight);
    } else {
      setEstimatedWeight(computedStlWeight);
    }
    setIsEstimatorOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.stl')) {
        setUploadedFile(file);
        const sizeMb = Number((file.size / 1024 / 1024).toFixed(2));
        setStlSizeMb(sizeMb);
        if (!designName) {
          setDesignName(file.name.replace('.stl', ''));
        }
      } else {
        alert('Lütfen yalnızca .stl uzantılı 3D modeller yükleyin.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.stl')) {
        setUploadedFile(file);
        const sizeMb = Number((file.size / 1024 / 1024).toFixed(2));
        setStlSizeMb(sizeMb);
        if (!designName) {
          setDesignName(file.name.replace('.stl', ''));
        }
      } else {
        alert('Lütfen yalnızca .stl uzantılı 3D modeller yükleyin.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordersEnabled) {
      alert('Sipariş sistemi şu an geçici olarak yeni siparişlere kapalıdır.');
      return;
    }
    if (!designName) {
      alert('Lütfen model adı giriniz.');
      return;
    }
    if (!uploadedFile && !makerworldLink) {
      alert('Lütfen bir STL dosyası yükleyin veya Makerworld tasarım linki ekleyin.');
      return;
    }
    if (printType === 'single' && selectedColors.length !== 1) {
      alert('Lütfen tek renk baskı için tam olarak 1 adet renk seçiniz.');
      return;
    }
    if (printType === 'multi' && (selectedColors.length < 2 || selectedColors.length > 4)) {
      alert('Lütfen çok renkli baskı için en az 2, en fazla 4 adet renk seçiniz.');
      return;
    }

    const orderItem: OrderItem = {
      type: 'custom',
      price: calculatedPrice,
      quantity: 1,
      customPrint: {
        fileName: uploadedFile ? uploadedFile.name : 'Makerworld Tasarımı',
        makerworldLink: makerworldLink || undefined,
        estimatedWeight: estimatedWeight,
        pricePerGram: currentPricePerGram,
        printType: printType,
        estimatedDuration: printTime.formatted,
        selectedColors: selectedColors,
      },
    };

    onAddCustomToCart(orderItem);
    setSuccess(true);
    
    // Reset form fields
    setDesignName('');
    setMakerworldLink('');
    setEstimatedWeight(10);
    setUploadedFile(null);
    setSelectedColors([]);

    setTimeout(() => {
      setSuccess(false);
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="mb-6">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold tracking-wider uppercase border border-slate-700">
            Kişiselleştirilmiş Hizmet
          </span>
          <h3 className="text-2xl font-bold mt-2 text-white">Özel 3D Baskı Siparişi</h3>
          <p className="text-slate-400 text-sm mt-1">
            Kendi STL dosyanızı yükleyin veya Makerworld linkinizi gönderin, gram başına fiyatla basalım!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Design Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Model Adı *
            </label>
            <input 
              type="text" 
              required
              placeholder="Örn: Telefon Standı, Kalemlik..."
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-600 transition-all duration-300"
            />
          </div>

          {/* Upload and link options */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Drag and Drop STL file */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                STL Dosyası Yükle
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[140px] ${
                  isDragOver 
                    ? 'border-slate-500 bg-slate-900/40' 
                    : uploadedFile 
                    ? 'border-emerald-500 bg-emerald-950/10' 
                    : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
                }`}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  accept=".stl" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <Upload className={`h-8 w-8 mb-3 ${uploadedFile ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'}`} />
                {uploadedFile ? (
                  <div>
                    <p className="text-sm font-medium text-emerald-400 truncate max-w-[200px]">
                      {uploadedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-slate-300">STL dosyasını buraya sürükleyin veya tıklayın</p>
                    <p className="text-[10px] text-slate-500 mt-1">Sadece .stl formatı desteklenir</p>
                  </div>
                )}
              </div>
            </div>

            {/* Makerworld Link */}
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Makerworld / Thingiverse Tasarım Linki
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <input 
                    type="url" 
                    placeholder="https://makerworld.com/tr/models/..."
                    value={makerworldLink}
                    onChange={(e) => setMakerworldLink(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/50 focus:border-slate-600 transition-all duration-300"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                  Dosya yüklemek yerine Makerworld, Thingiverse veya Printables üzerindeki tasarım linkini de bizimle paylaşabilirsiniz.
                </p>

                {/* Popular 3D Model Sharing Sites with See More Button */}
                <div className="mt-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                    💡 Popüler 3D Tasarım Siteleri
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(showAllSites ? POPULAR_MODEL_SITES : POPULAR_MODEL_SITES.slice(0, 4)).map((site) => (
                      <a
                        key={site.name}
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl flex items-center gap-1.5 text-xs transition-all duration-200 group active:scale-95 hover:border-slate-700"
                      >
                        <span className="text-sm shrink-0">{site.icon}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 group-hover:text-indigo-400 text-[10px] truncate">{site.name}</p>
                          <p className="text-[8px] text-slate-500 truncate">{site.desc}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAllSites(!showAllSites)}
                    className="w-full text-center py-1.5 mt-2 bg-slate-950/40 hover:bg-slate-950/80 hover:text-white border border-slate-800/40 rounded-xl text-[9px] text-slate-400 font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    {showAllSites ? 'Daha Az Göster ▲' : 'Devamını Gör (Tüm Model Linkleri) ▼'}
                  </button>
                </div>
              </div>

              {/* Weight selection */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Tahmini Ağırlık *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsEstimatorOpen(true)}
                    className="text-[10px] font-extrabold text-indigo-400 hover:text-white hover:bg-indigo-650 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                    title="STL boyutlarına göre filament kullanımını hesapla"
                  >
                    <Scale className="h-3 w-3" />
                    Filament Tahmincisi ⚖️
                  </button>
                </div>
                <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                  <input 
                    type="range" 
                    min="1" 
                    max="1000" 
                    value={estimatedWeight}
                    onChange={(e) => setEstimatedWeight(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                  <span className="text-white font-black text-sm shrink-0 min-w-[45px] text-right bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800">{estimatedWeight}g</span>
                </div>
                {uploadedFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setEstimatorTab('fileSize');
                      setIsEstimatorOpen(true);
                    }}
                    className="w-full text-left text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer mt-2"
                  >
                    <span className="flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5" />
                      STL Boyutuna Göre Tahmin Et
                    </span>
                    <span className="bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                      {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB saptandı ⚡
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Print Color Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Baskı Renk Seçeneği *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setPrintType('single');
                    setSelectedColors([]);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-center justify-between ${
                    printType === 'single'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div>
                    <span className="block text-sm font-bold">Tek Renk Baskı</span>
                    <span className="text-[10px] opacity-75">Standart tek renk filament</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300">
                    ₺{pricePerGram}/g
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPrintType('multi');
                    setSelectedColors([]);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex items-center justify-between ${
                    printType === 'multi'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                  }`}
                >
                  <div>
                    <span className="block text-sm font-bold flex items-center gap-1.5">
                      🌈 Çok Renkli Baskı
                    </span>
                    <span className="text-[10px] opacity-75">AMS ile çok renkli üretim</span>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 bg-slate-800 rounded-lg text-slate-300">
                    ₺{pricePerGramMultiColor}/g
                  </span>
                </button>
              </div>
            </div>

            {/* Filament Color Selection Panel */}
            <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                <span className="text-xs font-bold text-slate-300">
                  {printType === 'single' ? 'Filament Rengi Seçin (1 Adet)' : 'Filament Renkleri Seçin (2-4 Adet)'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {selectedColors.length} seçildi
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                {AVAILABLE_COLORS.map((color) => {
                  const isSelected = selectedColors.includes(color.name);
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        if (printType === 'single') {
                          setSelectedColors([color.name]);
                        } else {
                          if (isSelected) {
                            setSelectedColors(selectedColors.filter(c => c !== color.name));
                          } else {
                            if (selectedColors.length >= 4) {
                              alert('Maksimum 4 renk seçebilirsiniz (AMS Lite kapasitesi).');
                              return;
                            }
                            setSelectedColors([...selectedColors, color.name]);
                          }
                        }
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold ring-2 ring-indigo-500/30'
                          : 'border-slate-800 bg-slate-950/20 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <span 
                        className={`w-4.5 h-4.5 rounded-full border ${color.border || 'border-transparent'} shrink-0`} 
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs truncate">{color.name}</span>
                    </button>
                  );
                })}
              </div>
              {printType === 'multi' && selectedColors.length < 2 && (
                <p className="text-[10px] text-indigo-400 font-semibold">
                  💡 Çok renkli üretim için lütfen en az 2 renk seçiniz.
                </p>
              )}
              {printType === 'single' && selectedColors.length === 0 && (
                <p className="text-[10px] text-indigo-400 font-semibold">
                  💡 Tek renk üretim için lütfen 1 renk seçiniz.
                </p>
              )}
            </div>
          </div>

          {/* Bambu Lab A1 Combo Print Time Estimation */}
          <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800/60 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Gauge className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-slate-300">Yüksek Hızlı 3D Yazıcı Modeli</span>
              </div>
              <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Bambu Lab A1 Combo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-850 rounded-xl">
                  <Clock className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Tahmini Baskı Süresi</span>
                  <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                    {printTime.formatted}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-850 rounded-xl">
                  <Zap className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Teknik Özellik</span>
                  <span className="text-[11px] text-slate-300 font-semibold block leading-tight">
                    {printType === 'multi' 
                      ? '🌈 AMS Lite ile renk geçişi dahil' 
                      : '⚡ 500 mm/s Maksimum Hız'}
                  </span>
                </div>
              </div>
            </div>
            
            {printType === 'multi' && (
              <p className="text-[10px] text-amber-400/90 leading-relaxed bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                ⚠️ <strong>Çok Renkli Baskı:</strong> Filament renk değişimlerindeki temizleme (purge) ve geçiş süreleri nedeniyle üretim süresi tek renge kıyasla daha uzundur.
              </p>
            )}
          </div>

          {/* Pricing calculation display */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-800 rounded-xl text-slate-300">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Birim Gram Fiyatı: ₺{currentPricePerGram}</span>
                <span className="text-sm text-slate-300">
                  {estimatedWeight}g x ₺{currentPricePerGram}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Hesaplanan Toplam</span>
              <span className="text-2xl font-extrabold text-white">
                ₺{calculatedPrice.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <button
            type="submit"
            disabled={!ordersEnabled}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              !ordersEnabled
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : success 
                  ? 'bg-emerald-500 text-white shadow-emerald-950/30 shadow-xl' 
                  : 'bg-white text-slate-950 hover:bg-slate-100 hover:shadow-white/5 hover:shadow-xl'
            }`}
          >
            {success ? (
              <>
                <Check className="h-5 w-5" />
                Özel Baskı Sepete Eklendi!
              </>
            ) : !ordersEnabled ? (
              <>
                Sipariş Alımı Geçici Olarak Durduruldu
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Özel Tasarımı Sepete Ekle
              </>
            )}
          </button>
        </form>

        {/* Filament Usage Estimator Modal */}
        {isEstimatorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col text-white">
              {/* Modal Header */}
              <div className="flex justify-between items-start p-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-500/15 text-indigo-400 rounded-lg">
                      <Scale className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-black text-white">Filament Kullanım Tahmincisi</h3>
                    <span className="text-[9px] font-extrabold bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full uppercase tracking-wider">BETA</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">STL modelinizin ebatlarına veya dosya boyutuna göre tahmini filament ağırlığını hesaplayın.</p>
                </div>
                <button 
                  onClick={() => setIsEstimatorOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex border-b border-slate-800 px-6 bg-slate-950/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setEstimatorTab('dimensions')}
                  className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    estimatorTab === 'dimensions'
                      ? 'border-indigo-500 text-indigo-400 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Ebatlara Göre Tahmin (Boyutlar)
                </button>
                <button
                  type="button"
                  onClick={() => setEstimatorTab('fileSize')}
                  className={`py-3.5 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    estimatorTab === 'fileSize'
                      ? 'border-indigo-500 text-indigo-400 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  STL Dosya Boyutuna Göre Tahmin (Hızlı)
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                {/* Left Side: Inputs */}
                <div className="lg:col-span-7 space-y-5">
                  {estimatorTab === 'dimensions' ? (
                    <>
                      {/* Presets Row */}
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-indigo-400" /> Hızlı Tasarım Şablonları
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                          {ESTIMATOR_PRESETS.map((p) => (
                            <button
                              key={p.name}
                              type="button"
                              onClick={() => handleApplyPreset(p)}
                              className="px-3 py-2 bg-slate-950/40 border border-slate-800 hover:border-indigo-500 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-300 hover:text-white shrink-0 flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                            >
                              <span className="text-sm">{p.icon}</span>
                              <span>{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dimensions Box */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 space-y-4">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Ebatları (Bounding Box)</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Width */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium">Genişlik (X)</span>
                              <span className="font-bold text-white">{estWidth} mm</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="250" 
                              value={estWidth}
                              onChange={(e) => setEstWidth(Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer"
                            />
                          </div>

                          {/* Depth */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium">Derinlik (Y)</span>
                              <span className="font-bold text-white">{estDepth} mm</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="250" 
                              value={estDepth}
                              onChange={(e) => setEstDepth(Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer"
                            />
                          </div>

                          {/* Height */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium">Yükseklik (Z)</span>
                              <span className="font-bold text-white">{estHeight} mm</span>
                            </div>
                            <input 
                              type="range" 
                              min="5" 
                              max="250" 
                              value={estHeight}
                              onChange={(e) => setEstHeight(Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Slicing Parameters (Infill & Walls) */}
                      <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 space-y-4">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baskı / Dilimleme Parametreleri</span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          {/* Infill */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5 text-indigo-400" /> Doluluk Oranı (Infill)
                              </span>
                              <span className="font-bold text-indigo-400">{estInfill}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={estInfill}
                              onChange={(e) => setEstInfill(Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer"
                              disabled={estShape === 'hollow'}
                            />
                            {estShape === 'hollow' && (
                              <p className="text-[10px] text-amber-400 italic">Vazo modunda doluluk sıfırdır.</p>
                            )}
                          </div>

                          {/* Walls */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium">Duvar Çizgi Sayısı (Shell)</span>
                              <span className="font-bold text-indigo-400">{estWalls} Kat</span>
                            </div>
                            <input 
                              type="range" 
                              min="1" 
                              max="10" 
                              value={estWalls}
                              onChange={(e) => setEstWalls(Number(e.target.value))}
                              className="w-full accent-indigo-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dropdowns (Shape Style & Material) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Shape Style */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Tasarım Şekli / Yapı Tipi
                          </label>
                          <select
                            value={estShape}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEstShape(val);
                              if (val === 'hollow') {
                                setEstInfill(0);
                              } else if (estInfill === 0) {
                                setEstInfill(15);
                              }
                            }}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-300 font-semibold"
                          >
                            {Object.entries(SHAPE_PRESETS).map(([key, info]) => (
                              <option key={key} value={key}>
                                {info.label} ({info.desc.substring(0, 30)}...)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Material */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Filament Malzeme Türü
                          </label>
                          <select
                            value={estMaterial}
                            onChange={(e) => setEstMaterial(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-300 font-semibold"
                          >
                            {Object.entries(MATERIAL_DENSITIES).map(([key, info]) => (
                              <option key={key} value={key}>
                                {info.label} (Özgül Ağırlık: {info.density} g/cm³)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* STL FILE SIZE TAB INPUTS */}
                      <div className="bg-slate-950/30 p-5 rounded-2xl border border-slate-800/50 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            STL Dosya Boyutu (MB)
                          </span>
                          {uploadedFile && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                              Yüklenen Dosya Boyutu Aktif 📂
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min="0.1"
                            max="150"
                            step="0.1"
                            value={stlSizeMb}
                            onChange={(e) => setStlSizeMb(Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 shrink-0">
                            <input
                              type="number"
                              min="0.1"
                              max="1000"
                              step="0.1"
                              value={stlSizeMb}
                              onChange={(e) => setStlSizeMb(Math.max(0.1, Number(e.target.value)))}
                              className="w-16 bg-transparent text-white font-extrabold text-sm focus:outline-none"
                            />
                            <span className="text-xs text-slate-500 font-bold">MB</span>
                          </div>
                        </div>

                        {uploadedFile && (
                          <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                            <span className="text-slate-400 truncate max-w-[280px]">
                              Dosya: <strong>{uploadedFile.name}</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => setStlSizeMb(Number((uploadedFile.size / 1024 / 1024).toFixed(2)))}
                              className="text-[10px] text-indigo-400 hover:text-white font-bold bg-indigo-500/10 hover:bg-indigo-600 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                            >
                              Orijinal Boyutu Eşitle
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Model Geometry Complexity / Class Selector */}
                      <div className="space-y-3">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Model Geometrik Karmaşıklığı / Tipi
                        </span>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {Object.entries(STL_COMPLEXITIES).map(([key, item]) => {
                            const isSelected = stlComplexity === key;
                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() => setStlComplexity(key)}
                                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[120px] ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-lg shadow-indigo-950/20'
                                    : 'border-slate-800 bg-slate-950/30 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base">{item.icon}</span>
                                  <span className="text-xs font-black leading-tight">{item.label}</span>
                                </div>
                                <p className="text-[9px] text-slate-400 leading-normal mt-2">
                                  {item.desc}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Additional STL Slice controls (Infill & Material) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Infill Slider */}
                        <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5 text-indigo-400" /> Tahmini Doluluk (Infill)
                            </span>
                            <span className="font-bold text-indigo-400">{stlInfill}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="100"
                            value={stlInfill}
                            onChange={(e) => setStlInfill(Number(e.target.value))}
                            className="w-full accent-indigo-500 cursor-pointer"
                          />
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Doluluk oranı arttıkça fiziksel kütle ve dolayısıyla gramaj lineer artar.
                          </p>
                        </div>

                        {/* Material Dropdown */}
                        <div className="bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50 space-y-3">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Filament Malzeme Türü
                          </label>
                          <select
                            value={stlMaterial}
                            onChange={(e) => setStlMaterial(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-slate-300 font-semibold"
                          >
                            {Object.entries(MATERIAL_DENSITIES).map(([key, info]) => (
                              <option key={key} value={key}>
                                {info.label} (Yoğunluk: {info.density} g/cm³)
                              </option>
                            ))}
                          </select>
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Malzemenin özgül ağırlığı filament ağırlığını doğrudan etkiler.
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Right Side: Visual Preview and Calculation Output */}
                <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                  {estimatorTab === 'dimensions' ? (
                    <div className="space-y-3">
                      <div className="relative w-full aspect-square max-h-[190px] bg-slate-950/40 rounded-2xl border border-slate-800/40 overflow-hidden flex items-center justify-center">
                        <div className="absolute top-2 left-3 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                          3D Hacimsel Önizleme
                        </div>
                        
                        {/* Dynamic Sizing 3D Box SVG */}
                        <svg width="220" height="200" viewBox="0 0 220 200" className="drop-shadow-[0_8px_16px_rgba(79,70,229,0.15)]">
                          <defs>
                            <linearGradient id="topGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.45" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
                            </linearGradient>
                            <linearGradient id="leftGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.55" />
                              <stop offset="100%" stopColor="#312e81" stopOpacity="0.25" />
                            </linearGradient>
                            <linearGradient id="rightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#4338ca" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.3" />
                            </linearGradient>
                          </defs>

                          {/* Top Face */}
                          <polygon
                            points={`${cx},${cy - h} ${cx + 0.7 * w},${cy + 0.4 * w - h} ${cx + 0.7 * w - 0.7 * d},${cy + 0.4 * w + 0.4 * d - h} ${cx - 0.7 * d},${cy + 0.4 * d - h}`}
                            fill="url(#topGrad)"
                            stroke="#818cf8"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                          />

                          {/* Left Face */}
                          <polygon
                            points={`${cx - 0.7 * d},${cy + 0.4 * d} ${cx},${cy} ${cx},${cy - h} ${cx - 0.7 * d},${cy + 0.4 * d - h}`}
                            fill="url(#leftGrad)"
                            stroke="#4f46e5"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                          />

                          {/* Right Face */}
                          <polygon
                            points={`${cx},${cy} ${cx + 0.7 * w},${cy + 0.4 * w} ${cx + 0.7 * w},${cy + 0.4 * w - h} ${cx},${cy - h}`}
                            fill="url(#rightGrad)"
                            stroke="#4338ca"
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                          />

                          {/* Dimensions Annotation Labels inside SVG */}
                          <text x={cx + 0.35 * w + 12} y={cy + 0.2 * w + 12} fill="#818cf8" fontSize="8" fontWeight="extrabold" textAnchor="middle">
                            X: {estWidth}mm
                          </text>
                          <text x={cx - 0.35 * d - 12} y={cy + 0.2 * d + 12} fill="#6366f1" fontSize="8" fontWeight="extrabold" textAnchor="middle">
                            Y: {estDepth}mm
                          </text>
                          <text x={cx + 0.7 * w + 15} y={cy + 0.4 * w - (h / 2)} fill="#4f46e5" fontSize="8" fontWeight="extrabold" textAnchor="start">
                            Z: {estHeight}mm
                          </text>
                        </svg>
                      </div>

                      {/* Detailed Volume calculation output */}
                      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 text-[11px] space-y-1.5 text-slate-400">
                        <div className="flex justify-between">
                          <span>Sınır Kutusu Hacmi:</span>
                          <strong className="text-slate-300">{(estWidth * estDepth * estHeight / 1000).toFixed(1)} cm³</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Net Baskı Malzeme Hacmi:</span>
                          <strong className="text-slate-300">{totalMaterialVolume.toFixed(1)} cm³</strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-800/60 pt-1.5">
                          <span>Kabuk Ağırlığı ({estWalls} Duvar):</span>
                          <strong className="text-slate-300">{Math.round(wallVolume * density)}g</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>İç Dolgu Ağırlığı ({estInfill}%):</span>
                          <strong className="text-slate-300">{Math.round(infillVolume * density)}g</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative w-full aspect-square max-h-[190px] bg-slate-950/40 rounded-2xl border border-slate-800/40 overflow-hidden flex flex-col items-center justify-center p-4">
                        <div className="absolute top-2 left-3 text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                          STL Veri Analiz Süzgeci
                        </div>
                        
                        {/* Interactive scanning animation / blueprint layout */}
                        <svg width="120" height="120" viewBox="0 0 100 100" className="animate-pulse">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="4 2" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="40 10" className="animate-[spin_10s_linear_infinite]" />
                          
                          {/* Inner 3D Hexagon blueprint representational mesh */}
                          <polygon points="50,22 74,36 74,64 50,78 26,64 26,36" fill="none" stroke="#818cf8" strokeWidth="1.5" />
                          <line x1="50" y1="22" x2="50" y2="78" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="26" y1="36" x2="74" y2="64" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 2" />
                          <line x1="74" y1="36" x2="26" y2="64" stroke="#818cf8" strokeWidth="1" strokeDasharray="2 2" />

                          <path d="M15 50 H85" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
                          <path d="M50 15 V85" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
                        </svg>
                        
                        <span className="text-[10px] font-bold text-indigo-400 mt-2 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full inline-block"></span>
                          Dosya Analiz Ediliyor...
                        </span>
                      </div>

                      {/* Detailed STL analysis output */}
                      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 text-[11px] space-y-1.5 text-slate-400">
                        <div className="flex justify-between">
                          <span>STL Dosya Boyutu:</span>
                          <strong className="text-slate-300">{stlSizeMb.toFixed(2)} MB</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Tahmini Poligon Sayısı:</span>
                          <strong className="text-slate-300">~{(stlSizeMb * 20000).toLocaleString('tr-TR')} Üçgen</strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-800/60 pt-1.5">
                          <span>Yoğunluk Çarpanı ({stlMaterial}):</span>
                          <strong className="text-slate-300">x{(stlDensity / 1.24).toFixed(2)} ({stlDensity} g/cm³)</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Katsayı Oranı:</span>
                          <strong className="text-slate-300">{complexityFactor} g/MB</strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-800/60 pt-1.5 text-slate-500 text-[10px] italic">
                          <span>Hezarfen Formülü: Dosya Boyutu × Poligon Yoğunluğu × Doluluk Katsayısı</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Big estimation results card */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Hesaplanan Ağırlık</span>
                        <span className="text-3xl font-black text-white">
                          {estimatorTab === 'dimensions' ? computedWeight : computedStlWeight} gram
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold block">Tahmini Birim Fiyat</span>
                        <span className="text-xl font-bold text-emerald-400">
                          ₺{((estimatorTab === 'dimensions' ? computedWeight : computedStlWeight) * currentPricePerGram).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleApplyWeight}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-indigo-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                    >
                      <Check className="h-4 w-4" />
                      Hesaplanan Ağırlığı Uygula ({estimatorTab === 'dimensions' ? computedWeight : computedStlWeight}g)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
