import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { database } from '../lib/firebase';
import { ref, onValue } from 'firebase/database';
import { GalleryItem } from '../types';
import { 
  ZoomIn, 
  Layers, 
  Cpu, 
  Clock, 
  Flame, 
  X, 
  Sparkles, 
  ChevronRight, 
  Printer, 
  Gauge, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight
} from 'lucide-react';

interface PhotoGalleryProps {
  onSelectCustomPrint: () => void;
}

export default function PhotoGallery({ onSelectCustomPrint }: PhotoGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const galleryRef = ref(database, 'gallery');
    const unsubscribe = onValue(galleryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGalleryItems(Object.values(data));
      } else {
        setGalleryItems([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const categories = ['Tümü', 'Fidgets', 'Dekorasyon & Sanat', 'Kullanışlı Araçlar', 'Hediyelik & Aksesuar'];

  const filteredItems = selectedCategory === 'Tümü'
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory);

  return (
    <section className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl space-y-8 relative overflow-hidden">
      {/* Absolute Ambient Decor */}
      <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-50/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 h-40 w-40 bg-emerald-50/30 rounded-full blur-3xl pointer-events-none" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-2.5">
            <Sparkles className="h-3 w-3 text-indigo-600" />
            Baskı Galerisi
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Geçmiş Baskılarımız & Kalite Vitrini</h2>
          <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            Bambu Lab X1-Carbon ve A1 yazıcılarımızla Karabük atölyemizde ürettiğimiz bazı gerçek modeller. Katman pürüzsüzlüğünü, çok renkli geçiş hassasiyetini ve endüstriyel kalitemizi inceleyin.
          </p>
        </div>

        {/* Categories Selector */}
        <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/50 shrink-0 self-start md:self-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 border border-slate-150 rounded-2xl">
          <Printer className="h-10 w-10 text-slate-300 mx-auto mb-2.5" />
          <p className="text-slate-500 font-semibold text-xs">Henüz geçmiş baskı eklenmemiş.</p>
          <p className="text-[11px] text-slate-450 mt-1">Yönetici panelinden yeni geçmiş baskı modelleri ekleyebilirsiniz.</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 relative z-10"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, idx) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, delay: idx * 0.04 }}
              className="group relative bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col cursor-pointer"
              onClick={() => setActiveItem(item)}
            >
              {/* Image Container with Hover Effect */}
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <img
                  src={item.image}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-colors duration-300" />
                
                {/* Float Category Tag */}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[9px] font-extrabold px-2 py-0.8 rounded-lg shadow-sm border border-slate-100">
                  {item.category}
                </span>

                {/* Zoom Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="p-2.5 bg-white/95 backdrop-blur-md rounded-full text-slate-900 shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
                    <ZoomIn className="h-4.5 w-4.5 stroke-[2.5]" />
                  </span>
                </div>
              </div>

              {/* Text Info */}
              <div className="p-3.5 flex-grow flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors leading-tight">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
                    {item.printer}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Micro Tech Specs Summary */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-indigo-500/80" />
                    {item.layerHeight.split(' ')[0]}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-500/80" />
                    {item.duration}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      )}

      {/* Lightbox / Details Modal */}
      <AnimatePresence>
        {activeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveItem(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 210 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 max-w-3xl w-full relative z-10 grid grid-cols-1 md:grid-cols-12 max-h-[90vh] md:max-h-[80vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 z-20 p-2 bg-slate-900/60 hover:bg-slate-900 text-white hover:scale-105 active:scale-95 transition-all rounded-full cursor-pointer shadow-lg border border-white/10"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Left Column: Big Image Showcase */}
              <div className="md:col-span-6 relative bg-slate-950 h-56 md:h-auto flex items-center justify-center">
                <img
                  src={activeItem.image}
                  alt={activeItem.title}
                  referrerPolicy="no-referrer"
                  className="object-cover w-full h-full md:absolute md:inset-0"
                />
                
                {/* Quality Overlay Badge */}
                <span className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md text-[10px] font-extrabold px-3 py-1.5 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  {activeItem.qualityBadge}
                </span>
              </div>

              {/* Right Column: Detailed Info & Quality Metrics */}
              <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-5">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 mb-2">
                      {activeItem.category}
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                      {activeItem.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-0.5 tracking-wider">
                      Uygulanan Yazıcı: {activeItem.printer}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/55 p-3 rounded-2xl border border-slate-100 italic">
                    "{activeItem.description}"
                  </p>

                  {/* Tech Specs Block */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Üretim Parametreleri
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Katman Kalınlığı</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {activeItem.layerHeight}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Doluluk (Infill)</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {activeItem.infill}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Kullanılan Filament</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {activeItem.filament}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Baskı Süresi</span>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                          {activeItem.duration}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call To Actions */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setActiveItem(null);
                      onSelectCustomPrint();
                    }}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="h-4 w-4 text-slate-300" />
                    Benzer Özel Baskı Siparişi Ver
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveItem(null)}
                    className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-xl active:scale-98 transition-all cursor-pointer text-center border border-slate-100"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
