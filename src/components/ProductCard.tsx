import React, { useState } from 'react';
import { ShoppingCart, FileCode, Check } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  key?: string | number;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
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

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl hover:border-slate-200/80 transition-all duration-300 flex flex-col h-full">
      {/* Visual aspect */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img 
          src={imageSrc} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/95 text-slate-800 shadow-sm backdrop-blur-md border border-slate-100 uppercase tracking-wide">
            {product.category}
          </span>
        </div>
        
        {product.stlFileName && (
          <div className="absolute bottom-4 left-4">
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
        <p className="text-sm text-slate-500 mt-2 line-clamp-2 flex-grow">
          {product.description || 'Özel 3D tasarım ve hassas baskı detayları.'}
        </p>

        {product.stlFileName && (
          <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100 truncate font-mono">
            📄 {product.stlFileName}
          </p>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Baskı Fiyatı</span>
            <span className="text-xl font-extrabold text-slate-900">
              ₺{product.price.toLocaleString('tr-TR')}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300 ${
              added 
                ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg' 
                : 'bg-slate-900 text-white hover:bg-slate-850 hover:shadow-slate-200/40 hover:shadow-lg'
            }`}
          >
            {added ? (
              <>
                <Check className="h-4 w-4" />
                Eklendi
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
