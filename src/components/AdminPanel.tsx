import React, { useState, useEffect } from 'react';
import { database } from '../lib/firebase';
import { ref, onValue, set, push, remove, update } from 'firebase/database';
import { hashPasscodeSync } from '../utils/hash';
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw, 
  CreditCard, 
  Layers, 
  Sliders, 
  Phone, 
  ShieldAlert, 
  Edit3, 
  UserPlus, 
  X,
  Eye,
  Settings,
  FileCode,
  MessageSquare,
  Send
} from 'lucide-react';
import { Product, Order, BankDetails, UserProfile, OrderStatus, SupportChat, SupportMessage } from '../types';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'custom_settings' | 'users' | 'chats'>('orders');

  // Firebase states
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    iban: '',
    receiverName: '',
    details: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [pricePerGram, setPricePerGram] = useState<number>(2.5);
  const [pricePerGramMultiColor, setPricePerGramMultiColor] = useState<number>(4.5);
  
  // Support Chats states
  const [supportChats, setSupportChats] = useState<SupportChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Loading states
  const [loading, setLoading] = useState(true);

  // Add Product Form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<"Fidgets" | "Accessories" | "Toys" | "Keychains">('Fidgets');
  const [newProdPrice, setNewProdPrice] = useState<number>(50);
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImgUrl, setNewProdImgUrl] = useState('');
  const [newProdStlName, setNewProdStlName] = useState('');

  // Add User Form state
  const [newUserEmailOrPhone, setNewUserEmailOrPhone] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPasscode, setNewUserPasscode] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'customer'>('customer');

  // Fast edit price states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0);

  // Load Realtime Database
  useEffect(() => {
    setLoading(true);

    const ordersRef = ref(database, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.values(data) as Order[];
        // Sort descending by date
        list.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(list);
      } else {
        setOrders([]);
      }
    });

    const productsRef = ref(database, 'products');
    const unsubscribeProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setProducts(Object.values(data) as Product[]);
      } else {
        setProducts([]);
      }
    });

    const bankRef = ref(database, 'bankDetails');
    const unsubscribeBank = onValue(bankRef, (snapshot) => {
      if (snapshot.exists()) {
        setBankDetails(snapshot.val());
      }
    });

    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList = Object.entries(data).map(([key, val]: [string, any]) => ({
          ...val,
          id: key
        }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
    });

    const priceGramRef = ref(database, 'customSettings/pricePerGram');
    const unsubscribePriceGram = onValue(priceGramRef, (snapshot) => {
      if (snapshot.exists()) {
        setPricePerGram(snapshot.val());
      }
    });

    const priceGramMultiRef = ref(database, 'customSettings/pricePerGramMultiColor');
    const unsubscribePriceGramMulti = onValue(priceGramMultiRef, (snapshot) => {
      if (snapshot.exists()) {
        setPricePerGramMultiColor(snapshot.val());
      }
    });

    const chatsRef = ref(database, 'support_chats');
    const unsubscribeChats = onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const chatsList = Object.values(data) as SupportChat[];
        chatsList.sort((a, b) => b.updatedAt - a.updatedAt);
        setSupportChats(chatsList);
      } else {
        setSupportChats([]);
      }
    });

    setLoading(false);
    return () => {
      unsubscribeOrders();
      unsubscribeProducts();
      unsubscribeBank();
      unsubscribeUsers();
      unsubscribePriceGram();
      unsubscribePriceGramMulti();
      unsubscribeChats();
    };
  }, []);

  // Handle adding product
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || newProdPrice <= 0) {
      alert('Lütfen geçerli ürün adı ve fiyatı girin.');
      return;
    }

    try {
      const prodRef = ref(database, 'products');
      const newProdRef = push(prodRef);
      const generatedId = newProdRef.key || Math.random().toString(36).substring(2, 9).toUpperCase();

      const item: Product = {
        id: generatedId,
        name: newProdName,
        category: newProdCategory,
        price: Number(newProdPrice),
        description: newProdDesc,
        imageUrl: newProdImgUrl || undefined,
        stlFileName: newProdStlName || undefined,
        createdAt: Date.now()
      };

      await set(newProdRef, item);
      alert('Ürün başarıyla eklendi!');
      
      // Reset form
      setNewProdName('');
      setNewProdPrice(50);
      setNewProdDesc('');
      setNewProdImgUrl('');
      setNewProdStlName('');
    } catch (err) {
      console.error(err);
      alert('Ürün eklenirken hata oluştu.');
    }
  };

  // Handle fast price updates
  const handleSaveProductPrice = async (productId: string) => {
    if (editingPriceValue <= 0) {
      alert('Fiyat 0 dan büyük olmalıdır.');
      return;
    }

    try {
      // Find firebase key of product
      const productsRef = ref(database, 'products');
      onValue(productsRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === productId);
          if (dbKey) {
            await update(ref(database, `products/${dbKey}`), { price: Number(editingPriceValue) });
            setEditingProductId(null);
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      alert('Fiyat güncellenemedi.');
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    try {
      const productsRef = ref(database, 'products');
      onValue(productsRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === productId);
          if (dbKey) {
            await remove(ref(database, `products/${dbKey}`));
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const ordersRef = ref(database, 'orders');
      onValue(ordersRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === orderId);
          if (dbKey) {
            await update(ref(database, `orders/${dbKey}`), { orderStatus: newStatus });
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Update Payment Status
  const handleUpdatePaymentStatus = async (orderId: string, newStatus: 'Bekliyor' | 'Onaylandı' | 'Reddedildi') => {
    try {
      const ordersRef = ref(database, 'orders');
      onValue(ordersRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === orderId);
          if (dbKey) {
            await update(ref(database, `orders/${dbKey}`), { paymentStatus: newStatus });
            // If payment is approved, automatically progress order state to processing
            if (newStatus === 'Onaylandı') {
              await update(ref(database, `orders/${dbKey}`), { orderStatus: 'Baskıda' });
            }
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Order completely (Admin override)
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Bu siparişi tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      const ordersRef = ref(database, 'orders');
      onValue(ordersRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === orderId);
          if (dbKey) {
            await remove(ref(database, `orders/${dbKey}`));
            alert('Sipariş başarıyla silindi.');
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      alert('Sipariş silinirken bir hata oluştu.');
    }
  };

  // Update Bank details
  const handleUpdateBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await set(ref(database, 'bankDetails'), bankDetails);
      alert('Banka bilgileri güncellendi!');
    } catch (err) {
      console.error(err);
      alert('Hata oluştu.');
    }
  };

  // Update Price Per Gram
  const handleUpdatePricePerGram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await set(ref(database, 'customSettings/pricePerGram'), Number(pricePerGram));
      await set(ref(database, 'customSettings/pricePerGramMultiColor'), Number(pricePerGramMultiColor));
      alert('Baskı gram fiyatları başarıyla güncellendi!');
    } catch (err) {
      console.error(err);
      alert('Hata oluştu.');
    }
  };

  // Handle adding a new user profile
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmailOrPhone || !newUserPasscode) {
      alert('Email/Telefon ve Şifre zorunludur.');
      return;
    }

    try {
      const formattedKey = newUserEmailOrPhone.replace(/[.#$[\]]/g, '_');
      const userRef = ref(database, `users/${formattedKey}`);
      
      const passcodeHash = hashPasscodeSync(newUserPasscode);

      const newUser = {
        id: formattedKey,
        emailOrPhone: newUserEmailOrPhone,
        fullName: newUserFullName || newUserEmailOrPhone,
        role: newUserRole,
        passcodeHash,
        createdAt: Date.now()
      };

      await set(userRef, newUser);
      alert('Yeni profil başarıyla oluşturuldu!');
      
      // Reset
      setNewUserEmailOrPhone('');
      setNewUserFullName('');
      setNewUserPasscode('');
    } catch (err) {
      console.error(err);
      alert('Kullanıcı eklenirken hata oluştu.');
    }
  };

  // Reset password to "sifre"
  const handleResetPassword = async (userKey: string) => {
    if (!window.confirm("Bu kullanıcının şifresini 'sifre' olarak sıfırlamak istediğinize emin misiniz?")) return;
    try {
      const targetUserRef = ref(database, `users/${userKey}`);
      const hashedSifre = hashPasscodeSync('sifre');
      await update(targetUserRef, { passcodeHash: hashedSifre });
      alert("Şifre başarıyla 'sifre' olarak sıfırlandı!");
    } catch (err) {
      console.error(err);
      alert('Şifre sıfırlanamadı.');
    }
  };

  // Send admin reply in live support chat
  const handleSendAdminReply = async () => {
    if (!selectedChatId || !replyText.trim()) return;
    try {
      const chatRef = ref(database, `support_chats/${selectedChatId}`);
      const messagesRef = ref(database, `support_chats/${selectedChatId}/messages`);
      const adminMsg = {
        sender: 'admin',
        text: replyText,
        timestamp: Date.now()
      };
      await push(messagesRef, adminMsg);
      await update(chatRef, {
        lastMessage: replyText,
        updatedAt: Date.now()
      });
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert('Mesaj gönderilemedi.');
    }
  };

  // Delete user profile
  const handleDeleteUser = async (userKey: string) => {
    if (!window.confirm('Bu kullanıcı hesabını tamamen silmek istediğinize emin misiniz?')) return;
    try {
      await remove(ref(database, `users/${userKey}`));
      alert('Hesap başarıyla silindi.');
    } catch (err) {
      console.error(err);
      alert('Hesap silinemedi.');
    }
  };

  // Dashboard Stats Calculations
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'Onaylandı')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingPaymentsCount = orders.filter(o => o.paymentStatus === 'Bekliyor').length;
  const activePrintersCount = orders.filter(o => o.orderStatus === 'Baskıda').length;

  return (
    <div className="space-y-8">
      {/* Header block with stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-500 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ciro (Onaylı)</span>
            <p className="text-xl font-black text-slate-900">₺{totalRevenue.toLocaleString('tr-TR')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-slate-100 text-slate-800 rounded-xl">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Toplam Sipariş</span>
            <p className="text-xl font-black text-slate-900">{orders.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-500 rounded-xl">
            <RefreshCw className="h-5 w-5 animate-spin-slow" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Onay Bekleyen</span>
            <p className="text-xl font-black text-slate-900">{pendingPaymentsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-500 rounded-xl animate-pulse">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Baskıda Olanlar</span>
            <p className="text-xl font-black text-slate-900">{activePrintersCount}</p>
          </div>
        </div>
      </div>

      {/* Main layout with tabs navigation */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xl">
        <div className="border-b border-slate-100 bg-slate-50/50 p-2 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'orders' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Package className="h-4 w-4" />
            Sipariş Yönetimi ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'products' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Model & Fiyat Yönetimi ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('custom_settings')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'custom_settings' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            Banka & Özel Baskı Ayarları
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            Kullanıcı & Profil Yönetimi ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'chats' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Destek Sohbetleri ({supportChats.length})
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* TAB 1: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-slate-900 text-lg">Müşteri Siparişleri (Real-time)</h3>
              
              {orders.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl">
                  <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-medium">Henüz hiçbir sipariş bulunmamaktadır.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className={`p-6 rounded-3xl border transition-all duration-300 ${
                        order.paymentStatus === 'Onaylandı' 
                          ? 'bg-emerald-50/20 border-emerald-100' 
                          : order.paymentStatus === 'Reddedildi' 
                          ? 'bg-rose-50/10 border-rose-100' 
                          : 'bg-white border-slate-100 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {/* Top Header info */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-extrabold text-slate-800">KOD: {order.id}</span>
                            <span className="text-xs text-slate-400">
                              {new Date(order.createdAt).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 mt-1">
                            {order.customerName} <span className="text-slate-400 font-medium">({order.customerContact})</span>
                          </p>
                        </div>

                        {/* Interactive Status Selectors */}
                        <div className="flex flex-wrap items-center gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                              Ödeme Onayı
                            </label>
                            <select
                              value={order.paymentStatus}
                              onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value as any)}
                              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                            >
                              <option value="Bekliyor">⏳ Onay Bekliyor</option>
                              <option value="Onaylandı">✓ Ödeme Alındı</option>
                              <option value="Reddedildi">✕ Reddedildi</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                              Baskı Durumu
                            </label>
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                            >
                              <option value="Sipariş Alındı">📦 Sipariş Alındı</option>
                              <option value="Ödeme Bekleniyor">⏳ Ödeme Bekleniyor</option>
                              <option value="Baskıda">⚙️ Baskıda (Yazıcıda)</option>
                              <option value="Hazır">✓ Baskı Bitti (Hazır)</option>
                              <option value="Kargolandı">🚚 Kargolandı / Teslim Edildi</option>
                              <option value="İptal Edildi">✕ İptal Edildi</option>
                              <option value="Kapatıldı">🔒 Sipariş Kapatıldı (Arşiv)</option>
                            </select>
                          </div>

                          <div className="flex flex-col justify-end">
                            <span className="block text-[10px] font-bold text-slate-400 mb-1">
                              İşlemler
                            </span>
                            <div className="flex items-center gap-1.5">
                              {order.orderStatus !== 'Kapatıldı' && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, 'Kapatıldı')}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all flex items-center gap-1 font-bold text-xs cursor-pointer shadow-sm"
                                  title="Siparişi Kapat"
                                >
                                  🔒 Kapat
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl border border-rose-150 hover:border-rose-200 transition-all flex items-center gap-1 font-bold text-xs cursor-pointer shadow-sm"
                                title="Siparişi Tamamen Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items details */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Baskı İçerikleri:</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-3">
                              <div className="p-2 bg-white rounded-xl text-slate-500 border border-slate-100">
                                {item.type === 'custom' ? <FileCode className="h-5 w-5 text-slate-800" /> : <Package className="h-5 w-5 text-slate-600" />}
                              </div>
                              <div className="min-w-0 flex-grow">
                                <h5 className="text-xs font-bold text-slate-800 truncate">
                                  {item.type === 'catalog' ? item.product?.name : item.customPrint?.fileName}
                                </h5>
                                <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">
                                  {item.type === 'catalog' ? item.product?.category : 'Özel Sipariş'}
                                </p>
                                {item.type === 'custom' && item.customPrint?.makerworldLink && (
                                  <a 
                                    href={item.customPrint.makerworldLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-slate-500 underline block mt-1 truncate"
                                  >
                                    Makerworld Linkini Aç
                                  </a>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-bold text-slate-700 block">x{item.quantity}</span>
                                <span className="text-[10px] text-slate-400">₺{item.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer EFT matching details */}
                      <div className="mt-5 pt-4 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-2xl">
                        <div className="text-xs">
                           <span className="text-slate-400 font-medium">Havale Gönderen:</span>{' '}
                          <span className="font-bold text-slate-800 underline decoration-slate-400 decoration-1">
                            {order.senderName}
                          </span>
                        </div>
                        {order.notes && (
                          <div className="text-xs max-w-xs text-slate-500 italic">
                            💬 <strong>Not:</strong> "{order.notes}"
                          </div>
                        )}
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">Toplam Tutar</span>
                          <span className="text-base font-extrabold text-slate-900">₺{order.totalAmount.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="grid md:grid-cols-12 gap-8">
              {/* Product Add Form */}
              <div className="md:col-span-5 bg-slate-50/50 border border-slate-200/60 p-6 rounded-3xl h-fit">
                <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-slate-850" />
                  Yeni Model Ekle
                </h3>

                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Model Adı *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      placeholder="Örn: Flexi Ejderha"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Kategori *
                      </label>
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="Fidgets">Fidgets</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Toys">Toys</option>
                        <option value="Keychains">Keychains</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Satış Fiyatı (₺) *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Model Açıklaması
                    </label>
                    <textarea
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      placeholder="Malzeme, boyut vb. detaylar..."
                      rows={2}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Görsel Bağlantısı (URL)
                    </label>
                    <input
                      type="url"
                      value={newProdImgUrl}
                      onChange={(e) => setNewProdImgUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      STL Dosya İsmi (Kolay Takip İçin)
                    </label>
                    <input
                      type="text"
                      value={newProdStlName}
                      onChange={(e) => setNewProdStlName(e.target.value)}
                      placeholder="Örn: FlexiDragon_V2.stl"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-xs hover:bg-slate-850 hover:shadow-slate-200/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  >
                    Ürünü Kataloğa Ekle
                  </button>
                </form>
              </div>

              {/* Product List */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Mevcut Ürün Kataloğu ({products.length})</h3>
                <p className="text-xs text-slate-400">Ürün fiyatını değiştirmek için doğrudan fiyatın üzerindeki düzenle butonunu kullanabilirsiniz.</p>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {products.map((prod) => (
                    <div key={prod.id} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm flex items-center gap-4 transition-all duration-300">
                      {/* Image Thumbnail */}
                      <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="h-5 w-5 text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2">
                           <h4 className="font-bold text-slate-800 text-sm truncate">{prod.name}</h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wider">
                            {prod.category}
                          </span>
                        </div>
                        {prod.stlFileName && (
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">📄 {prod.stlFileName}</p>
                        )}
                      </div>

                      {/* Interactive Price edit */}
                      <div className="flex items-center gap-4 shrink-0">
                        {editingProductId === prod.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editingPriceValue}
                              onChange={(e) => setEditingPriceValue(Number(e.target.value))}
                              className="w-16 border rounded px-1.5 py-1 text-xs"
                              min="1"
                            />
                            <button
                              onClick={() => handleSaveProductPrice(prod.id)}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="p-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">₺{prod.price}</span>
                            <button
                              onClick={() => {
                                  setEditingProductId(prod.id);
                                setEditingPriceValue(prod.price);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all"
                              title="Fiyatı Değiştir"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM SETTINGS */}
          {activeTab === 'custom_settings' && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Bank accounts setup */}
              <div className="bg-slate-50/50 border border-slate-200/60 p-6 rounded-3xl">
                <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-slate-800" />
                  Havale / EFT Banka Bilgileri
                </h3>

                <form onSubmit={handleUpdateBankDetails} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Banka Adı *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      placeholder="Örn: Ziraat Bankası, Garanti BBVA..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      IBAN Numarası *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.iban}
                      onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                      placeholder="TR00 0000 0000 0000 0000 0000 00"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Hesap Sahibi Alıcı Adı *
                    </label>
                    <input
                      type="text"
                      required
                      value={bankDetails.receiverName}
                      onChange={(e) => setBankDetails({ ...bankDetails, receiverName: e.target.value })}
                      placeholder="Örn: Ergün 3D Baskı - Eralp Ergün"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Açıklama / Havale Talimatları
                    </label>
                    <textarea
                      value={bankDetails.details}
                      onChange={(e) => setBankDetails({ ...bankDetails, details: e.target.value })}
                      placeholder="Örn: Açıklama kısmına sadece sipariş kodunu yazınız..."
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-xs hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Banka Bilgilerini Güncelle
                  </button>
                </form>
              </div>

              {/* Custom printing gram price details */}
              <div className="bg-slate-50/50 border border-slate-200/60 p-6 rounded-3xl h-fit space-y-6">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base mb-2 flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-slate-800" />
                    Özel 3D Baskı Gram Fiyatı
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Müşterilerin yüklediği özel STL dosyaları veya tasarım linkleri için tahmini ağırlık üzerinden otomatik fiyatlandırılacak gram birim fiyatı.
                  </p>
                </div>

                <form onSubmit={handleUpdatePricePerGram} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Tek Renk Gram Ücreti (₺)
                      </label>
                      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0.1"
                          value={pricePerGram}
                          onChange={(e) => setPricePerGram(Number(e.target.value))}
                          className="w-full text-base font-extrabold text-slate-900 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-400 shrink-0">₺ / g</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        🌈 Çok Renkli Gram Ücreti (₺)
                      </label>
                      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0.1"
                          value={pricePerGramMultiColor}
                          onChange={(e) => setPricePerGramMultiColor(Number(e.target.value))}
                          className="w-full text-base font-extrabold text-slate-900 focus:outline-none"
                        />
                        <span className="text-xs font-semibold text-slate-400 shrink-0">₺ / g</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-xs hover:bg-slate-850 hover:shadow-slate-200/50 hover:shadow-lg transition-all cursor-pointer"
                  >
                    Baskı Fiyatlarını Kaydet
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: USERS & ADMIN ACCOUNTS */}
          {activeTab === 'users' && (
            <div className="grid md:grid-cols-12 gap-8">
              {/* Add user form */}
              <div className="md:col-span-5 bg-slate-50/50 border border-slate-200/60 p-6 rounded-3xl h-fit">
                <h3 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-slate-800" />
                  Yeni Kullanıcı / Admin Ekle
                </h3>

                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      E-posta veya Telefon Numarası *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUserEmailOrPhone}
                      onChange={(e) => setNewUserEmailOrPhone(e.target.value)}
                      placeholder="Örn: deneme@mail.com veya 0530..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Kullanıcı Adı / Tam Ad
                    </label>
                    <input
                      type="text"
                      value={newUserFullName}
                      onChange={(e) => setNewUserFullName(e.target.value)}
                      placeholder="Ad Soyad"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Yetki Rolü *
                      </label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      >
                        <option value="customer">Müşteri (Customer)</option>
                        <option value="admin">Yönetici (Admin)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Şifre / Parola *
                      </label>
                      <input
                        type="password"
                        required
                        value={newUserPasscode}
                        onChange={(e) => setNewUserPasscode(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-xs hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Profil Oluştur (Şifre Hash'lenir)
                  </button>
                </form>
              </div>

              {/* User management list */}
              <div className="md:col-span-7 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base">Kullanıcı Hesapları ({users.length})</h3>
                <p className="text-xs text-slate-400">Tüm kullanıcı profilleri şifre korumalı (Hash) olarak saklanır. Admin dilediğinde şifreyi sıfırlayabilir.</p>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {users.map((usr) => (
                    <div key={usr.id} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800 text-sm">{usr.fullName || usr.emailOrPhone}</h4>
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${usr.role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-800'} uppercase tracking-wider`}>
                            {usr.role || 'customer'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{usr.emailOrPhone}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-1 select-all bg-slate-50 p-1 rounded border border-slate-100 truncate max-w-[280px]">
                          Parola Hash: {usr.passcodeHash}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Reset password button */}
                        <button
                          onClick={() => handleResetPassword(usr.id)}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white rounded-lg transition-all"
                        >
                          Şifreyi Sıfırla ('sifre')
                        </button>

                        {/* Delete user */}
                        <button
                          onClick={() => handleDeleteUser(usr.id)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Canlı Destek Sohbetleri (Real-time)</h3>
                  <p className="text-xs text-slate-400">Müşterilerden gelen canlı destek ve bot taleplerini anlık olarak yanıtlayın.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-3xl border border-slate-100 min-h-[500px]">
                {/* Chat Sessions list */}
                <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-100 space-y-3 overflow-y-auto max-h-[500px]">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Aktif Sohbetler ({supportChats.length})</h4>
                  {supportChats.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8">Henüz başlatılmış bir sohbet yok.</p>
                  ) : (
                    supportChats.map((chat) => {
                      const isSelected = selectedChatId === chat.id;
                      return (
                        <button
                          key={chat.id}
                          onClick={() => {
                            setSelectedChatId(chat.id);
                          }}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-slate-50 hover:bg-slate-100/70 border-slate-150 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-xs truncate max-w-[120px]">
                              {chat.customerName || 'Ziyaretçi'}
                            </span>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                              chat.liveMode
                                ? isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                                : isSelected ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {chat.liveMode ? 'Canlı' : 'Bot'}
                            </span>
                          </div>
                          <p className={`text-xs truncate w-full ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                            {chat.lastMessage || 'Mesaj yok'}
                          </p>
                          <span className={`text-[9px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(chat.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Message display & input area */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-4 border border-slate-100 flex flex-col h-[500px]">
                  {selectedChatId ? (
                    (() => {
                      const selectedChat = supportChats.find(c => c.id === selectedChatId);
                      const messagesList = selectedChat?.messages 
                        ? Object.entries(selectedChat.messages).map(([id, msg]) => ({ id, ...msg as any })).sort((a, b) => a.timestamp - b.timestamp)
                        : [];

                      return (
                        <>
                          {/* Chat Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{selectedChat?.customerName || 'Ziyaretçi'}</h4>
                              <p className="text-[10px] text-slate-400">ID: {selectedChatId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Close chat button */}
                              <button
                                onClick={async () => {
                                  if (confirm('Bu sohbeti kapatmak istediğinize emin misiniz?')) {
                                    await remove(ref(database, `support_chats/${selectedChatId}`));
                                    setSelectedChatId(null);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                title="Sohbeti Sil/Kapat"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Chat History */}
                          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4 flex flex-col">
                            {messagesList.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center my-auto">Henüz mesaj yok.</p>
                            ) : (
                              messagesList.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex gap-2.5 max-w-[85%] ${
                                    msg.sender === 'admin' ? 'ml-auto flex-row-reverse' : ''
                                  }`}
                                >
                                  <div
                                    className={`p-2.5 rounded-2xl text-xs leading-relaxed ${
                                      msg.sender === 'admin'
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : msg.sender === 'user'
                                        ? 'bg-indigo-50 text-indigo-900 rounded-tl-none border border-indigo-100'
                                        : 'bg-slate-50 text-slate-600 rounded-tl-none border border-slate-100'
                                    }`}
                                  >
                                    <div className="font-bold text-[9px] opacity-70 mb-0.5 uppercase tracking-wide">
                                      {msg.sender === 'admin' ? 'Siz' : msg.sender === 'user' ? 'Kullanıcı' : 'Sistem/Bot'}
                                    </div>
                                    <p>{msg.text}</p>
                                    <span className="text-[8px] opacity-50 block text-right mt-1">
                                      {new Date(msg.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Chat Input */}
                          <div className="flex gap-2 pt-3 border-t border-slate-100">
                            <input
                              type="text"
                              placeholder="Cevabınızı buraya yazın..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  await handleSendAdminReply();
                                }
                              }}
                              className="flex-1 px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-300 rounded-xl text-xs outline-none text-slate-800 transition-all"
                            />
                            <button
                              onClick={handleSendAdminReply}
                              disabled={!replyText.trim()}
                              className="p-3 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-700 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      );
                    })()
                  ) : (
                    <div className="h-full flex flex-col justify-center items-center text-center p-6 text-slate-400">
                      <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
                      <h5 className="font-bold text-slate-600 text-sm">Sohbet Seçilmedi</h5>
                      <p className="text-xs max-w-[200px] mt-1">Sol taraftaki listeden aktif bir sohbet seçerek müşteriye yanıt yazın.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
