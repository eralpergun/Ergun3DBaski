import React, { useState, useEffect } from 'react';
import { Search, Loader2, Package, Clock, ShieldAlert, BadgeCheck, FileText, Smartphone, KeyRound, UserPlus, Trash2 } from 'lucide-react';
import { database } from '../lib/firebase';
import { ref, get, child, onValue, query, orderByChild, equalTo, remove } from 'firebase/database';
import { hashPasscodeSync } from '../utils/hash';
import { Order, OrderStatus } from '../types';

interface OrderTrackerProps {
  onUserLogin: (user: { emailOrPhone: string; role: string; id: string }) => void;
  currentUser: { emailOrPhone: string; role: string; id: string } | null;
  onLogout: () => void;
}

export default function OrderTracker({ onUserLogin, currentUser, onLogout }: OrderTrackerProps) {
  // Search state
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Auth state
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [fullName, setFullName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // User orders state
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Search single order
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdSearch.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchedOrder(null);

    try {
      const dbRef = ref(database);
      const snapshot = await get(child(dbRef, `orders`));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Search by order code or key
        const foundOrder = Object.values(data).find(
          (o: any) => o.id?.toLowerCase() === orderIdSearch.trim().toLowerCase()
        ) as Order | undefined;

        if (foundOrder) {
          setSearchedOrder(foundOrder);
        } else {
          setSearchError('Sipariş bulunamadı. Lütfen sipariş kodunu kontrol edin.');
        }
      } else {
        setSearchError('Sipariş bulunamadı.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Arama sırasında bir hata oluştu.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Sign in or Register
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !passcode) {
      setAuthError('Lütfen tüm alanları doldurun.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    const formattedKey = emailOrPhone.replace(/[.#$[\]]/g, '_'); // Firebase key safe
    const passcodeHash = hashPasscodeSync(passcode);

    try {
      const userRef = ref(database, `users/${formattedKey}`);
      const userSnapshot = await get(userRef);

      if (isRegisterMode) {
        // Registering
        if (userSnapshot.exists()) {
          setAuthError('Bu telefon veya e-posta adresi zaten kayıtlı.');
          setAuthLoading(false);
          return;
        }

        const newUser = {
          id: formattedKey,
          emailOrPhone,
          fullName: fullName || emailOrPhone,
          role: 'customer',
          passcodeHash,
          createdAt: Date.now()
        };

        const { set } = await import('firebase/database');
        await set(userRef, newUser);

        onUserLogin({ emailOrPhone, role: 'customer', id: formattedKey });
        setIsRegisterMode(false);
      } else {
        // Logging in
        if (!userSnapshot.exists()) {
          setAuthError('Kullanıcı bulunamadı. Lütfen kayıt olun.');
          setAuthLoading(false);
          return;
        }

        const userData = userSnapshot.val();
        if (userData.passcodeHash !== passcodeHash) {
          setAuthError('Hatalı şifre/parola.');
          setAuthLoading(false);
          return;
        }

        onUserLogin({ 
          emailOrPhone: userData.emailOrPhone, 
          role: userData.role || 'customer', 
          id: formattedKey 
        });
      }
    } catch (err) {
      console.error(err);
      setAuthError('İşlem gerçekleştirilirken bir hata oluştu.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch logged in user's orders
  useEffect(() => {
    if (!currentUser) {
      setUserOrders([]);
      return;
    }

    setOrdersLoading(true);
    const ordersRef = ref(database, 'orders');
    
    // Set up real-time listener for current user's orders
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allOrders = Object.values(snapshot.val()) as Order[];
        // Match either user identifier (id or contact detail matching email/phone)
        const matched = allOrders.filter(
          o => o.userId === currentUser.id || 
               o.customerContact?.toLowerCase() === currentUser.emailOrPhone.toLowerCase()
        );
        // Sort descending by date
        matched.sort((a, b) => b.createdAt - a.createdAt);
        setUserOrders(matched);
      } else {
        setUserOrders([]);
      }
      setOrdersLoading(false);
    }, (error) => {
      console.error(error);
      setOrdersLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    if (!window.confirm('Hesabınızı tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm sipariş takip bilgileriniz kaybolacaktır.')) {
      return;
    }
    
    try {
      const userRef = ref(database, `users/${currentUser.id}`);
      await remove(userRef);
      alert('Hesabınız başarıyla silindi.');
      onLogout();
    } catch (err) {
      console.error(err);
      alert('Hesap silinirken bir hata oluştu.');
    }
  };

  // Order status styles helper
  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'Sipariş Alındı':
        return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Ödeme Bekleniyor':
        return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'Baskıda':
        return 'bg-indigo-50 text-indigo-600 border border-indigo-200 animate-pulse';
      case 'Hazır':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'Kargolandı':
        return 'bg-teal-50 text-teal-600 border border-teal-200';
      case 'İptal Edildi':
        return 'bg-rose-50 text-rose-600 border border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Upper header section */}
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sipariş Takip Merkezi</h2>
        <p className="text-slate-500 text-sm mt-2">Siparişlerinizin durumunu anlık ve gerçek zamanlı olarak izleyin.</p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Side: Order Search (Fast without Login) */}
        <div className="md:col-span-5 bg-white border border-slate-100 p-6 rounded-3xl shadow-lg h-fit space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-900" />
              Sipariş Kodu ile Hızlı Takip
            </h3>
            <p className="text-xs text-slate-400 mt-1">Üye girişi yapmadan sipariş numaranızla anlık durum sorgulayın.</p>
          </div>

          <form onSubmit={handleSearchOrder} className="relative">
            <input
              type="text"
              placeholder="Örn: -Od98X..."
              value={orderIdSearch}
              onChange={(e) => setOrderIdSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-200 cursor-pointer"
            >
              {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </form>

          {searchError && (
            <p className="text-xs text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              {searchError}
            </p>
          )}

          {searchedOrder && (
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Müşteri</span>
                  <p className="text-xs font-semibold text-slate-800">{searchedOrder.customerName}</p>
                </div>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${getStatusStyle(searchedOrder.orderStatus)}`}>
                  {searchedOrder.orderStatus}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sipariş İçeriği</span>
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 truncate max-w-[180px]">
                      {item.type === 'catalog' ? item.product?.name : item.customPrint?.fileName}
                    </span>
                    <span className="text-slate-400 font-medium">x{item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Ödeme Durumu</span>
                  <span className={`font-semibold ${searchedOrder.paymentStatus === 'Onaylandı' ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {searchedOrder.paymentStatus === 'Onaylandı' ? 'Ödendi' : 'Ödeme Bekleniyor'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium">Toplam</span>
                  <span className="font-extrabold text-slate-800">₺{searchedOrder.totalAmount.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Account Portal & Dynamic Live Order Status */}
        <div className="md:col-span-7 bg-white border border-slate-100 p-6 md:p-8 rounded-3xl shadow-lg">
          {!currentUser ? (
            <div className="space-y-6">
              <div className="text-center max-w-sm mx-auto mb-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {isRegisterMode ? 'Yeni Profil Oluştur' : 'Üye Girişi'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isRegisterMode 
                    ? 'Kayıt olarak tüm siparişlerinizin baskı sürecini canlı ve detaylı takip edin.' 
                    : 'Giriş yaparak tüm geçmiş siparişlerinizi listeyebilirsiniz.'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4 max-w-md mx-auto">
                {isRegisterMode && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ad Soyad"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    E-posta veya Telefon Numarası *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Smartphone className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Örn: ornek@mail.com veya 05300000000"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Şifre / Parola *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all"
                  />
                </div>

                {authError && (
                  <p className="text-xs text-rose-500 bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    {authError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isRegisterMode ? (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Kayıt Ol ve Giriş Yap
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="h-4 w-4" />
                      Giriş Yap
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-2">
                <button
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setAuthError('');
                  }}
                  className="text-xs text-slate-800 hover:underline font-medium"
                >
                  {isRegisterMode ? 'Zaten hesabınız var mı? Giriş Yapın' : 'Hesabınız yok mu? Hemen Kayıt Olun'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hoş Geldiniz</span>
                  <h3 className="font-extrabold text-slate-800 text-lg">{currentUser.emailOrPhone}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={onLogout}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 border border-slate-200 hover:border-slate-300 rounded-xl bg-white shadow-sm transition-all cursor-pointer"
                  >
                    Çıkış Yap
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 border border-rose-100 hover:border-rose-200 hover:bg-rose-50/50 rounded-xl bg-white shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    title="Hesabımı Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Hesabımı Sil
                  </button>
                </div>
              </div>

              {/* Order List */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Package className="h-4.5 w-4.5 text-slate-900" />
                  Siparişleriniz ({userOrders.length})
                </h4>

                {ordersLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-800 mb-2" />
                    <p className="text-xs">Siparişleriniz yükleniyor...</p>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 font-medium text-xs">Henüz bir siparişiniz bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                    {userOrders.map((order) => (
                      <div key={order.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all duration-300">
                        {/* Status bar */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3 mb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-medium">Sipariş Kodu</span>
                            <span className="font-mono text-xs font-bold text-slate-850">{order.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg ${getStatusStyle(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 mb-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="text-slate-600 truncate max-w-[280px]">
                                {item.type === 'catalog' ? item.product?.name : item.customPrint?.fileName}
                              </span>
                              <span className="text-slate-400 font-semibold">x{item.quantity}</span>
                            </div>
                          ))}
                        </div>

                        {/* Summary & Price */}
                        <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-slate-400 block font-medium">Ödeme:</span>
                            <span className={`font-bold ${order.paymentStatus === 'Onaylandı' ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {order.paymentStatus === 'Onaylandı' ? 'Ödeme Alındı ✓' : 'Onay Bekliyor ⏳'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block font-medium">Ödenen / Ödenecek</span>
                            <span className="font-extrabold text-slate-900 text-sm">₺{order.totalAmount.toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
