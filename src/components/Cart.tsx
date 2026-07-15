import React, { useState } from 'react';
import { ShoppingBag, X, Trash2, CreditCard, Copy, Check, FileCode, CheckCircle, ArrowRight } from 'lucide-react';
import { OrderItem, BankDetails } from '../types';

interface CartProps {
  cartItems: OrderItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  bankDetails: BankDetails;
  userId: string;
  onCheckoutComplete: (orderId: string) => void;
  onClose: () => void;
  ordersEnabled?: boolean;
}

export default function Cart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  bankDetails,
  userId,
  onCheckoutComplete,
  onClose,
  ordersEnabled = true
}: CartProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [senderName, setSenderName] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedIban, setCopiedIban] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  // Success summary details
  const [successTotalAmount, setSuccessTotalAmount] = useState<number>(0);
  const [successDiscountAmount, setSuccessDiscountAmount] = useState<number>(0);
  const [successOriginalAmount, setSuccessOriginalAmount] = useState<number>(0);
  const [successShippingFee, setSuccessShippingFee] = useState<number>(0);
  const [successWeight, setSuccessWeight] = useState<number>(0);
  const [successEstText, setSuccessEstText] = useState<string>('');

  // Coupon states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const totalAmount = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Discount calculations
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = (totalAmount * appliedCoupon.value) / 100;
    } else {
      discountAmount = appliedCoupon.value;
    }
  }
  discountAmount = Math.min(totalAmount, discountAmount);
  const finalAmount = Math.max(0, totalAmount - discountAmount);
  const shippingFee = (cartItems.length > 0 && finalAmount < 1000) ? 230 : 0;
  const grandTotal = finalAmount + shippingFee;

  // Ortalama teslimat/üretim süresi tahmini hesaplama
  const calculateDeliveryEstimation = (items: OrderItem[]) => {
    let totalWeightGrams = 0;
    items.forEach(item => {
      if (item.type === 'custom') {
        totalWeightGrams += (item.customPrint?.estimatedWeight || 0) * item.quantity;
      } else {
        const category = item.product?.category;
        let itemWeight = 25;
        if (category === 'Keychains') itemWeight = 15;
        else if (category === 'Fidgets') itemWeight = 25;
        else if (category === 'Accessories') itemWeight = 40;
        else if (category === 'Toys') itemWeight = 60;
        totalWeightGrams += itemWeight * item.quantity;
      }
    });

    const totalMinutes = 60 + (totalWeightGrams * 4);
    const hours = Math.ceil(totalMinutes / 60);

    let estimationText = '';
    if (totalWeightGrams === 0) {
      return { totalWeight: 0, text: '0 dk' };
    }

    if (hours < 24) {
      estimationText = `~${hours} Saat (Hızlı Gönderi)`;
    } else {
      const days = Math.ceil(hours / 24);
      estimationText = `~${days} Gün (${hours} Saat)`;
    }

    return {
      totalWeight: totalWeightGrams,
      text: estimationText
    };
  };

  const est = calculateDeliveryEstimation(cartItems);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponSuccess('');
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Lütfen bir kupon kodu girin.');
      return;
    }

    try {
      const { database } = await import('../lib/firebase');
      const { ref, get } = await import('firebase/database');
      
      const couponsRef = ref(database, 'coupons');
      const snapshot = await get(couponsRef);
      
      if (!snapshot.exists()) {
        setCouponError('Geçersiz kupon kodu.');
        return;
      }

      const allCoupons = snapshot.val();
      const matchedCouponKey = Object.keys(allCoupons).find(
        key => allCoupons[key].code === code
      );

      if (!matchedCouponKey) {
        setCouponError('Geçersiz veya süresi dolmuş kupon kodu.');
        return;
      }

      const coupon = { id: matchedCouponKey, ...allCoupons[matchedCouponKey] };

      if (!coupon.active) {
        setCouponError('Bu kupon kodu şu an aktif değil.');
        return;
      }

      if (coupon.usageCount >= coupon.maxUsage) {
        setCouponError('Bu kuponun kullanım sınırı dolmuştur.');
        return;
      }

      if (totalAmount < coupon.minOrderValue) {
        setCouponError(`Bu kuponu kullanmak için minimum sepet tutarı ₺${coupon.minOrderValue} olmalıdır.`);
        return;
      }

      setAppliedCoupon(coupon);
      setCouponSuccess(`Kupon uygulandı! ${coupon.type === 'percentage' ? `%${coupon.value} indirim` : `₺${coupon.value} indirim`} kazandınız.`);
    } catch (err) {
      console.error('Coupon query failed:', err);
      setCouponError('Kupon sorgulanırken bir hata oluştu.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponSuccess('');
    setCouponError('');
  };

  const handleCopyIban = () => {
    navigator.clipboard.writeText(bankDetails.iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2000);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ordersEnabled) {
      alert('Sipariş sistemi şu an geçici olarak yeni siparişlere kapalıdır.');
      return;
    }
    if (cartItems.length === 0) return;
    if (!customerName || !customerContact || !senderName || !city || !district || !address) {
      alert('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingFee = finalAmount >= 1000 ? 0 : 230;
      const grandTotalAmount = finalAmount + shippingFee;

      // Dynamic import to prevent dependency issues if database is used in multiple components
      const { database } = await import('../lib/firebase');
      const { ref, push, set, update } = await import('firebase/database');

      const ordersRef = ref(database, 'orders');
      const newOrderRef = push(ordersRef);
      const generatedId = newOrderRef.key || Math.random().toString(36).substring(2, 9).toUpperCase();

      const orderData = {
        id: generatedId,
        userId: userId || 'anonymous',
        customerName,
        customerContact,
        senderName,
        city,
        district,
        address,
        shippingFee,
        items: cartItems.map(item => ({
          type: item.type,
          price: item.price,
          quantity: item.quantity,
          product: item.product || null,
          customPrint: item.customPrint || null
        })),
        totalAmount: grandTotalAmount, // discounted amount + shippingFee
        originalAmount: totalAmount,
        discountAmount,
        appliedCoupon: appliedCoupon ? {
          id: appliedCoupon.id,
          code: appliedCoupon.code,
          type: appliedCoupon.type,
          value: appliedCoupon.value
        } : null,
        paymentStatus: 'Bekliyor',
        orderStatus: 'Sipariş Alındı',
        createdAt: Date.now(),
        notes: notes || ''
      };

      await set(newOrderRef, orderData);
      
      // Increment coupon usage count
      if (appliedCoupon) {
        const couponRef = ref(database, `coupons/${appliedCoupon.id}`);
        await update(couponRef, {
          usageCount: (appliedCoupon.usageCount || 0) + 1
        });
      }

      const estDetails = calculateDeliveryEstimation(cartItems);
      setSuccessWeight(estDetails.totalWeight);
      setSuccessEstText(estDetails.text);

      setSuccessTotalAmount(grandTotalAmount);
      setSuccessDiscountAmount(discountAmount);
      setSuccessOriginalAmount(totalAmount);
      setSuccessShippingFee(shippingFee);
      setCreatedOrderId(generatedId);
      setShowSuccess(true);
      onClearCart();
    } catch (error) {
      console.error('Sipariş oluşturulamadı:', error);
      alert('Sipariş kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-lg">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Siparişiniz Alındı!</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Siparişiniz başarıyla kaydedilmiştir. Havale/EFT ödemeniz onaylandıktan sonra baskı işlemlerine hemen başlayacağız.
        </p>

        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6 text-left space-y-2.5">
          <div className="flex justify-between border-b border-slate-200/60 pb-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sipariş Kodu</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono">{createdOrderId}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Ürünler Toplamı</span>
            <span>₺{successOriginalAmount.toLocaleString('tr-TR')}</span>
          </div>
          {successDiscountAmount > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-semibold">
              <span>Kupon İndirimi</span>
              <span>-₺{successDiscountAmount.toLocaleString('tr-TR')}</span>
            </div>
          )}
          <div className="flex justify-between text-xs text-slate-500">
            <span>Kargo Ücreti</span>
            <span>
              {successShippingFee === 0 ? (
                <span className="text-emerald-600 font-bold">Ücretsiz</span>
              ) : (
                `₺${successShippingFee.toLocaleString('tr-TR')}`
              )}
            </span>
          </div>
          {successWeight > 0 && (
            <div className="flex justify-between items-center text-xs text-indigo-600 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/50">
              <span className="font-semibold flex items-center gap-1">⚖️ Sipariş Ağırlığı & Tahmini Hazırlık</span>
              <span className="font-bold">{successWeight}g ({successEstText})</span>
            </div>
          )}
          <div className="flex justify-between border-t border-dashed border-slate-200 pt-2.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Toplam Ödenecek Tutar</span>
            <span className="text-sm font-extrabold text-slate-900">₺{successTotalAmount.toLocaleString('tr-TR')}</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 text-left bg-slate-50 p-4 rounded-xl border border-slate-200/50 leading-relaxed mb-6">
          ℹ️ <span className="font-semibold text-slate-800">Takip için Not:</span> Sipariş kodunuzu kopyalayarak üst menüdeki <strong>"Sipariş Takip"</strong> kısmından anlık olarak baskı durumunu izleyebilirsiniz!
        </div>

        <button
          onClick={() => {
            setShowSuccess(false);
            onCheckoutComplete(createdOrderId);
          }}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-slate-200 cursor-pointer"
        >
          Devam Et
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-4xl mx-auto grid md:grid-cols-12">
      {/* Items Section */}
      <div className="p-6 md:p-8 md:col-span-7 border-b md:border-b-0 md:border-r border-slate-100">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-slate-800" />
            Sepetim ({cartItems.length})
          </h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 font-medium mb-2">Sepetiniz şu an boş.</p>
            <p className="text-xs text-slate-400">Ürünlerimiz arasından dilediğiniz modeli ekleyebilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
            {cartItems.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-2xl bg-slate-50/60 border border-slate-100/80 hover:border-slate-200 transition-all duration-300">
                {/* Image / Icon */}
                <div className="h-16 w-16 rounded-xl bg-white border border-slate-100 shrink-0 flex items-center justify-center overflow-hidden">
                  {item.type === 'catalog' && item.product?.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : item.type === 'custom' ? (
                    <div className="p-3 bg-slate-100 text-slate-800 rounded-lg">
                      <FileCode className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 text-slate-400 rounded-lg">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-grow min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">
                    {item.type === 'catalog' ? item.product?.name : item.customPrint?.fileName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-medium">
                    {item.type === 'catalog' ? item.product?.category : `Özel Baskı (${item.customPrint?.estimatedWeight}g)`}
                  </p>
                  
                  {item.type === 'custom' && item.customPrint?.estimatedDuration && (
                    <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold mt-0.5">
                      <span>⏱️ Baskı Süresi:</span>
                      <span>{item.customPrint.estimatedDuration}</span>
                    </div>
                  )}

                  {item.type === 'custom' && item.customPrint?.selectedColors && item.customPrint.selectedColors.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] font-semibold text-slate-500">
                      <span>🎨 Renkler:</span>
                      <div className="flex gap-1 flex-wrap">
                        {item.customPrint.selectedColors.map((color, cIdx) => (
                          <span key={cIdx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] border border-slate-200 font-bold">
                            {color}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {item.type === 'custom' && item.customPrint?.makerworldLink && (
                    <a href={item.customPrint.makerworldLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-600 underline truncate block mt-0.5 max-w-[180px]">
                      Tasarım Linki
                    </a>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-slate-800">
                      ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                    </span>

                    <div className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg p-1">
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50 rounded"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold px-1 text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-50 rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemoveItem(index)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl self-start transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Coupon Input Area */}
        {cartItems.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              🎁 İndirim Kuponu / Hediye Kartı
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="KUPON KODU GİRİN"
                value={couponCodeInput}
                onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                disabled={!!appliedCoupon}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold uppercase outline-none text-slate-800 transition-all disabled:opacity-60"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 transition-all cursor-pointer"
                >
                  Kaldır
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Uygula
                </button>
              )}
            </div>
            {couponError && <p className="text-[10px] text-rose-600 font-bold">⚠️ {couponError}</p>}
            {couponSuccess && <p className="text-[10px] text-emerald-600 font-bold">✓ {couponSuccess}</p>}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Ürünler Toplamı</span>
            <span>₺{totalAmount.toLocaleString('tr-TR')}</span>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
              <span>Kupon İndirimi ({appliedCoupon.code})</span>
              <span>-₺{discountAmount.toLocaleString('tr-TR')}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Kargo Ücreti</span>
            <span>
              {shippingFee === 0 ? (
                <span className="text-emerald-600 font-bold">Ücretsiz</span>
              ) : (
                `₺${shippingFee.toLocaleString('tr-TR')}`
              )}
            </span>
          </div>
          {shippingFee > 0 && (
            <p className="text-[10px] text-indigo-600 font-medium">
              🎁 <strong>₺{(1000 - finalAmount).toLocaleString('tr-TR')}</strong> daha ekleyin, kargo ücretsiz olsun!
            </p>
          )}
          {est.totalWeight > 0 && (
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 text-xs text-indigo-900 shadow-sm animate-fade-in my-2">
              <div className="flex items-center gap-2">
                <span className="text-base">⚖️</span>
                <div>
                  <span className="font-bold text-slate-500 block text-[9px] uppercase tracking-wider">Toplam Ağırlık</span>
                  <span className="font-extrabold text-indigo-700">{est.totalWeight} gram</span>
                </div>
              </div>
              <div className="h-6 w-px bg-indigo-100" />
              <div className="flex items-center gap-2 text-right">
                <div>
                  <span className="font-bold text-slate-500 block text-[9px] uppercase tracking-wider">Tahmini Hazırlanma</span>
                  <span className="font-extrabold text-indigo-700 flex items-center gap-1 justify-end">
                    ⏱️ {est.text}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-200">
            <span className="text-sm font-bold text-slate-700">Genel Toplam</span>
            <span className="text-2xl font-black text-slate-900">₺{grandTotal.toLocaleString('tr-TR')}</span>
          </div>
        </div>
      </div>

      {/* Checkout and Bank Details */}
      <div className="p-6 md:p-8 md:col-span-5 bg-slate-50">
        <h4 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-1.5">
          <CreditCard className="h-4.5 w-4.5 text-slate-800" />
          Havale / EFT Ödemesi
        </h4>

        {/* Bank info box */}
        <div className="bg-white border border-slate-200/60 p-4 rounded-2xl mb-6 shadow-sm relative">
          <h5 className="font-bold text-slate-850 text-xs uppercase tracking-wide text-slate-800 mb-2">
            {bankDetails.bankName || 'Ziraat Bankası'}
          </h5>
          <div className="space-y-1 text-xs text-slate-600">
            <p><span className="text-slate-400">Alıcı:</span> <span className="font-semibold text-slate-800">{bankDetails.receiverName || 'Ergün 3D Baskı'}</span></p>
            <div className="flex items-center justify-between gap-2 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-mono text-slate-800 break-all select-all">{bankDetails.iban || 'TR00 0000 0000 0000 0000 0000 00'}</span>
              <button
                onClick={handleCopyIban}
                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-white rounded-md border border-slate-200 shadow-sm transition-colors shrink-0"
                title="Kopyala"
                type="button"
              >
                {copiedIban ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            {bankDetails.details && <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">{bankDetails.details}</p>}
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleCheckout} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Ad Soyad *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Adınız Soyadınız"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              İletişim (E-posta veya Telefon) *
            </label>
            <input
              type="text"
              required
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="Örn: 0530 000 0000"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                İl / Şehir *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Örn: Ankara"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                İlçe *
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Örn: Çankaya"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Açık Adres *
            </label>
            <textarea
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Mahalle, cadde, sokak, bina no, daire no..."
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all duration-200 resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Gönderen Ad Soyad (EFT Bilgisi) *
            </label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="EFT gönderen hesap sahibi adı"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all duration-200"
              title="Ödemeyi doğrulamak için gereklidir."
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Sipariş Notu
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Varsa özel renk veya baskı notunuz..."
              rows={2}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-800 transition-all duration-200 resize-none"
            />
          </div>

          {!ordersEnabled && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs font-semibold leading-relaxed">
              ⚠️ <strong>Siparişler Geçici Olarak Kapalıdır:</strong> Mağazamız şu anda yeni sipariş alımına kısa bir süreliğine kapalıdır. Mevcut siparişleriniz kesintisiz olarak hazırlanmaya devam etmektedir. Lütfen daha sonra tekrar deneyiniz.
            </div>
          )}

          <button
            type="submit"
            disabled={cartItems.length === 0 || isSubmitting || !ordersEnabled}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer ${
              (cartItems.length === 0 || !ordersEnabled)
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/35' 
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-200/50 hover:shadow-lg'
            }`}
          >
            {isSubmitting ? (
              <span>Siparişiniz Gönderiliyor...</span>
            ) : !ordersEnabled ? (
              <span>Sipariş Sistemi Geçici Olarak Kapalı</span>
            ) : (
              <>
                <span>Siparişi Havale ile Tamamla</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
