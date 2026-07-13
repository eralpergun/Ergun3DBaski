import React, { useState } from 'react';
import { Upload, Link2, Calculator, Plus, Check, Clock, Gauge, Zap } from 'lucide-react';
import { OrderItem } from '../types';

interface CustomPrintFormProps {
  pricePerGram: number;
  pricePerGramMultiColor: number;
  onAddCustomToCart: (item: OrderItem) => void;
}

export default function CustomPrintForm({ pricePerGram, pricePerGramMultiColor, onAddCustomToCart }: CustomPrintFormProps) {
  const [designName, setDesignName] = useState('');
  const [makerworldLink, setMakerworldLink] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState<number>(10);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [printType, setPrintType] = useState<'single' | 'multi'>('single');

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
    if (!designName) {
      alert('Lütfen model adı giriniz.');
      return;
    }
    if (!uploadedFile && !makerworldLink) {
      alert('Lütfen bir STL dosyası yükleyin veya Makerworld tasarım linki ekleyin.');
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
      },
    };

    onAddCustomToCart(orderItem);
    setSuccess(true);
    
    // Reset form fields
    setDesignName('');
    setMakerworldLink('');
    setEstimatedWeight(10);
    setUploadedFile(null);

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
              </div>

              {/* Weight selection */}
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex justify-between">
                  <span>Tahmini Ağırlık (Gram)</span>
                  <span className="text-white font-extrabold">{estimatedWeight}g</span>
                </label>
                <div className="flex items-center gap-4 bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800">
                  <input 
                    type="range" 
                    min="1" 
                    max="1000" 
                    value={estimatedWeight}
                    onChange={(e) => setEstimatedWeight(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Print Color Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Baskı Renk Seçeneği *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPrintType('single')}
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
                onClick={() => setPrintType('multi')}
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
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              success 
                ? 'bg-emerald-500 text-white shadow-emerald-950/30 shadow-xl' 
                : 'bg-white text-slate-950 hover:bg-slate-100 hover:shadow-white/5 hover:shadow-xl'
            }`}
          >
            {success ? (
              <>
                <Check className="h-5 w-5" />
                Özel Baskı Sepete Eklendi!
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                Özel Tasarımı Sepete Ekle
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
