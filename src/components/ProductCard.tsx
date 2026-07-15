import React, { useState } from 'react';
import { ShoppingCart, FileCode, Check, Clock, Layers } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  key?: string | number;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const getFormattedDuration = (minutes?: number) => {
    let totalMinutes = minutes;
    if (totalMinutes === undefined || totalMinutes === null || totalMinutes <= 0) {
      // Fallback calculation: base 15 minutes + 1.2 minutes per lira of price (e.g. 50 TL -> 75 mins, 100 TL -> 135 mins)
      totalMinutes = Math.max(15, Math.round(15 + (product.price * 1.2)));
    }
    const hrs = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return hrs > 0 ? `${hrs} saat ${mins} dk` : `${mins} dk`;
  };

  // Modern placeholder imagery matching categories
  const getPlaceholderImage = (category: string) => {
    switch (category) {
      case 'Fidgets':
        return 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=400';
      case 'Accessories':
        return 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=400';
      case 'Toys':
        return 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&q=80&w=400';
      case 'Keychains':
        return 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=400';
      default:
        return 'https://images.unsplash.com/photo-1615840287214-7fe58a8bc685?auto=format&fit=crop&q=80&w=400';
    }
  };

  const imageSrc = product.imageUrl || getPlaceholderImage(product.category);

  // Determine if product is on sale or is special
  const isSale = product.tagType === 'sale' || (product.originalPrice && product.originalPrice > product.price);
  const isSpecial = product.tagType === 'special';
  const hasTag = isSale || isSpecial || !!product.tagLabel;

  // Determine markdown discount percentage
  let discountPercentage = 0;
  if (product.originalPrice && product.originalPrice > product.price) {
    discountPercentage = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }

  // Tag style and label
  let tagColorClass = 'bg-rose-600 text-white shadow-rose-200/50';
  let tagText = 'İndirim';

  if (isSale) {
    tagColorClass = 'bg-rose-600 text-white shadow-rose-200/50';
    tagText = product.tagLabel || (discountPercentage > 0 ? `%${discountPercentage} İndirim` : 'İndirim');
  } else if (isSpecial) {
    tagColorClass = 'bg-indigo-600 text-white shadow-indigo-200/50';
    tagText = product.tagLabel || 'Özel Ürün';
  } else if (product.tagLabel) {
    tagColorClass = 'bg-amber-500 text-slate-950 shadow-amber-200/50';
    tagText = product.tagLabel;
  }

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl hover:border-slate-200/80 transition-all duration-300 flex flex-col h-full relative">
      {/* Visual aspect */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img 
          src={imageSrc} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/95 text-slate-800 shadow-sm backdrop-blur-md border border-slate-100 uppercase tracking-wide">
            {product.category}
          </span>
        </div>

        {hasTag && (
          <div className="absolute top-4 right-4 z-10">
            <span className={`px-2.5 py-1 text-[10px] font-black rounded-full shadow-md tracking-wider uppercase border border-white/20 flex items-center justify-center ${tagColorClass}`}>
              {tagText}
            </span>
          </div>
        )}
        
        {product.stlFileName && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-900/80 text-slate-300 shadow-sm backdrop-blur-sm border border-slate-700/50">
              <FileCode className="h-3 w-3" />
              STL Hazır
            </span>
          </div>
        )}
      </div>

      {/* Details aspect */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-slate-900 text-lg group-hover:text-slate-700 transition-colors duration-200">
          {product.name}
        </h3>
        <p className={`text-sm text-slate-500 mt-2 flex-grow ${isExpanded ? '' : 'line-clamp-2'}`}>
          {product.description || 'Özel 3D tasarım ve hassas baskı detayları.'}
        </p>
        {product.description && product.description.length > 80 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-500 mt-1 cursor-pointer flex items-center gap-0.5 active:scale-95 transition-transform text-left"
            type="button"
          >
            {isExpanded ? 'Daha Az Gör ▲' : 'Devamını Gör ▼'}
          </button>
        )}

        {product.stlFileName && (
          <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 truncate font-mono">
            📄 {product.stlFileName}
          </p>
        )}

        {/* Stock & Print Duration Status */}
        <div className="mt-3.5 flex flex-wrap gap-2">
          {product.stockCount !== undefined && product.stockCount !== null ? (
            product.stockCount <= 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                Stokta Yok (Tükendi)
              </span>
            ) : product.stockCount <= 5 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Sınırlı Stok ({product.stockCount} Adet)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Stokta Var ({product.stockCount} Adet)
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-full border border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              Stokta Var (Sipariş Üzerine)
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            <Clock className="h-3 w-3 text-slate-500" />
            Baskı: ~{getFormattedDuration(product.printDuration)}
          </span>

          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-100">
            <Layers className="h-3 w-3 text-sky-500" />
            Malzeme: {product.material || 'PLA'}
          </span>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Baskı Fiyatı</span>
            <div className="flex items-baseline gap-1.5">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs font-semibold text-slate-400 line-through">
                  ₺{product.originalPrice.toLocaleString('tr-TR')}
                </span>
              )}
              <span className="text-xl font-extrabold text-slate-900">
                ₺{product.price.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={product.stockCount !== undefined && product.stockCount !== null && product.stockCount <= 0}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 ${
              added 
                ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' 
                : (product.stockCount !== undefined && product.stockCount !== null && product.stockCount <= 0)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-900 text-white hover:bg-slate-850 hover:shadow-slate-200/40 hover:shadow-lg'
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                Eklendi
              </>
            ) : (product.stockCount !== undefined && product.stockCount !== null && product.stockCount <= 0) ? (
              <>
                Tükendi
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Sepete Ekle
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
