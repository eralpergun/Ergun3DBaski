import { useState, useEffect } from 'react';
import { database } from './lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';
import { 
  Printer, 
  ShoppingCart, 
  Search, 
  Check, 
  Lock, 
  ChevronRight, 
  Package, 
  HelpCircle, 
  Cpu, 
  Sliders, 
  Eye, 
  LogOut, 
  Home, 
  FileCode,
  Info,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AboutUs from './components/AboutUs';
import ContactDetails from './components/ContactDetails';
import ProductCard from './components/ProductCard';
import CustomPrintForm from './components/CustomPrintForm';
import Cart from './components/Cart';
import OrderTracker from './components/OrderTracker';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import { hashPasscodeSync } from './utils/hash';
import { Product, OrderItem, BankDetails, UserProfile } from './types';

export default function App() {
  const [view, setView] = useState<'home' | 'tracker' | 'admin' | 'login'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  
  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Users & Auth states
  const [adminUser, setAdminUser] = useState<{ emailOrPhone: string; role: string; id: string } | null>(null);
  const [customerUser, setCustomerUser] = useState<{ emailOrPhone: string; role: string; id: string } | null>(null);

  // Settings from DB
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: 'Ziraat Bankası',
    iban: 'TR56 0001 0009 1000 1234 5678 90',
    receiverName: 'Eralp Ergün',
    details: 'Lütfen Havale/EFT açıklama kısmına sadece sipariş kodunuzu yazınız.'
  });
  const [pricePerGram, setPricePerGram] = useState<number>(2.5);

  // Initialize and Seed Database if empty
  useEffect(() => {
    const seedDatabase = async () => {
      try {
        // Force-clear all existing seeded products exactly once
        const clearedRef = ref(database, 'productsCleared_v3');
        const clearedSnap = await get(clearedRef);
        if (!clearedSnap.exists()) {
          await set(ref(database, 'products'), null);
          await set(clearedRef, true);
        }

        // Seed default Admin eralpergun / eralp
        const adminRef = ref(database, 'users/eralpergun');
        const adminSnap = await get(adminRef);
        if (!adminSnap.exists()) {
          const defaultAdmin = {
            id: 'eralpergun',
            emailOrPhone: 'eralpergun',
            fullName: 'Eralp Ergün (Kurucu)',
            role: 'admin',
            passcodeHash: hashPasscodeSync('eralp'),
            createdAt: Date.now()
          };
          await set(adminRef, defaultAdmin);
        }

        // Seed new Admin eralp / eralp
        const newAdminRef = ref(database, 'users/eralp');
        const newAdminSnap = await get(newAdminRef);
        if (!newAdminSnap.exists()) {
          const defaultAdmin = {
            id: 'eralp',
            emailOrPhone: 'eralp',
            fullName: 'Eralp (Yönetici)',
            role: 'admin',
            passcodeHash: hashPasscodeSync('eralp'),
            createdAt: Date.now()
          };
          await set(newAdminRef, defaultAdmin);
        }

        // Seed bank details
        const bankRef = ref(database, 'bankDetails');
        const bankSnap = await get(bankRef);
        if (!bankSnap.exists()) {
          const defaultBank: BankDetails = {
            bankName: 'Ziraat Bankası',
            iban: 'TR56 0001 0009 1000 1234 5678 90',
            receiverName: 'Eralp Ergün',
            details: 'Lütfen Havale/EFT açıklama kısmına sadece size verilen sipariş kodunuzu yazınız.'
          };
          await set(bankRef, defaultBank);
        }

        // Seed custom settings
        const settingsRef = ref(database, 'customSettings');
        const settingsSnap = await get(settingsRef);
        if (!settingsSnap.exists()) {
          await set(settingsRef, { pricePerGram: 2.5 });
        }
      } catch (err) {
        console.error('Database seeding failed:', err);
      }
    };

    seedDatabase();

    // Listeners for live dynamic sync
    const unsubProducts = onValue(ref(database, 'products'), (snapshot) => {
      if (snapshot.exists()) {
        setProducts(Object.values(snapshot.val()));
      } else {
        setProducts([]);
      }
    });

    const unsubBank = onValue(ref(database, 'bankDetails'), (snapshot) => {
      if (snapshot.exists()) {
        setBankDetails(snapshot.val());
      }
    });

    const unsubGram = onValue(ref(database, 'customSettings/pricePerGram'), (snapshot) => {
      if (snapshot.exists()) {
        setPricePerGram(snapshot.val());
      }
    });

    return () => {
      unsubProducts();
      unsubBank();
      unsubGram();
    };
  }, []);

  // Sync Cart to localstorage for robustness
  useEffect(() => {
    const savedCart = localStorage.getItem('ergun3d_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCart = (newCart: OrderItem[]) => {
    setCart(newCart);
    localStorage.setItem('ergun3d_cart', JSON.stringify(newCart));
  };

  const handleAddToCart = (product: Product) => {
    const existingIndex = cart.findIndex(item => item.type === 'catalog' && item.product?.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      saveCart(updated);
    } else {
      const newItem: OrderItem = {
        product,
        type: 'catalog',
        quantity: 1,
        price: product.price
      };
      saveCart([...cart, newItem]);
    }
  };

  const handleAddCustomToCart = (item: OrderItem) => {
    saveCart([...cart, item]);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    const updated = [...cart];
    updated[index].quantity = newQty;
    saveCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    saveCart(updated);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  // Filter products by search & category
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (prod.description && prod.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'Tümü' || prod.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-slate-200 selection:text-slate-900 pb-12">
      {/* Top Ambient banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 text-center font-mono flex items-center justify-center gap-2 border-b border-slate-800">
        <Cpu className="h-3.5 w-3.5 text-slate-400 animate-pulse" />
        <span>Karabük Merkezli Profesyonel 3D Baskı Çözümleri</span>
        <span className="hidden sm:inline">• eSUN PLA+ Filament Kalitesi</span>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-4 py-3 sm:py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo Brand */}
          <div 
            onClick={() => setView('home')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-slate-300 shadow-md group-hover:bg-slate-800 group-hover:text-white transition-all duration-300">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 text-sm sm:text-base leading-none">Ergün 3D Baskı</h1>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5 tracking-wider uppercase">Siz Seçin Biz Basalım</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
            <button
              onClick={() => {
                setView('home');
                setSelectedCategory('Tümü');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                view === 'home' && selectedCategory !== 'Özel Sipariş' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Ana Sayfa</span>
            </button>

            <button
              onClick={() => {
                setView('home');
                setSelectedCategory('Özel Sipariş');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                view === 'home' && selectedCategory === 'Özel Sipariş' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Printer className="h-4 w-4" />
              <span>Özel 3D Baskı</span>
            </button>

            <button
              onClick={() => setView('tracker')}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                view === 'tracker' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Sipariş Takip & Hesap</span>
            </button>

            {adminUser && (
              <button
                onClick={() => setView('admin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  view === 'admin' ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="h-4 w-4 text-slate-500 animate-spin-slow" />
                <span>Yönetim Paneli</span>
              </button>
            )}

            {/* Cart trigger button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-xl border border-slate-200/60 bg-white hover:border-slate-400 hover:bg-slate-50 transition-all duration-300 shadow-sm cursor-pointer shrink-0"
            >
              <ShoppingCart className="h-4.5 w-4.5 text-slate-800" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-slate-900 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-bounce shadow-sm">
                  {cart.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              )}
            </button>

            {/* Admin Login Button */}
            {!adminUser ? (
              <button
                onClick={() => setView('login')}
                className="p-2.5 rounded-xl border border-slate-200/60 bg-white hover:border-slate-400 hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
                title="Yönetici Girişi"
              >
                <Lock className="h-4.5 w-4.5" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAdminUser(null);
                  setView('home');
                }}
                className="p-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 transition-all cursor-pointer shrink-0"
                title="Çıkış Yap"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 mt-6 sm:mt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            {/* VIEW 1: HOME */}
            {view === 'home' && (
              <div className="space-y-12">
                {/* Hero / About Us banner */}
                <AboutUs />

                {/* Login / Register Quick Banner */}
                {!customerUser ? (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_107%,rgba(241,245,249,0.06)_0%,transparent_50%)] pointer-events-none"></div>
                    <div className="relative z-10 space-y-1.5 text-center sm:text-left">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider border border-slate-700">
                        Müşteri Paneli
                      </span>
                      <h4 className="text-xl font-bold">Sipariş Takibi İçin Giriş Yapın</h4>
                      <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                        Profil oluşturarak veya üye girişi yaparak tüm siparişlerinizin aşamalarını anlık olarak canlı takip edebilir, geçmiş siparişlerinizi listeleyebilirsiniz.
                      </p>
                    </div>
                    <button
                      onClick={() => setView('tracker')}
                      className="relative z-10 px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-2xl shadow-lg shadow-slate-950/10 hover:scale-[1.02] transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <UserPlus className="h-4 w-4 text-slate-900" />
                      Giriş Yap veya Hesap Oluştur
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black uppercase tracking-wider border border-slate-700 mb-1">
                        Hoş Geldiniz
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">Aktif Giriş: {customerUser.emailOrPhone}</h4>
                      <p className="text-xs text-slate-400">Müşteri paneline giriş yapıldı. Sipariş takip sayfasından siparişlerinizi izleyebilirsiniz.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setView('tracker')}
                        className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Siparişlerimi Takip Et
                      </button>
                      <button
                        onClick={() => setCustomerUser(null)}
                        className="px-4 py-2.5 bg-transparent text-slate-400 hover:text-red-400 hover:bg-red-950/20 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}

                {/* Categories & Search block */}
                <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">3D Baskı Kataloğu</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Kategorilere göz atın, dilediğiniz modeli sepete ekleyin ve sipariş verin.
                      </p>
                    </div>

                    {/* Search bar */}
                    <div className="relative w-full sm:max-w-xs">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Model ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-800 transition-all"
                      />
                    </div>
                  </div>

                  {/* Category tabs */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {['Tümü', 'Fidgets', 'Accessories', 'Toys', 'Keychains', 'Özel Sipariş'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        {cat === 'Özel Sipariş' ? '★ Özel 3D Baskı' : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional views depending on category */}
                {selectedCategory === 'Özel Sipariş' ? (
                  <div className="max-w-3xl mx-auto">
                    <CustomPrintForm 
                      pricePerGram={pricePerGram} 
                      onAddCustomToCart={handleAddCustomToCart} 
                    />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Catalog models grid */}
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 font-semibold text-sm">Aradığınız kriterlere uygun model bulunamadı.</p>
                        <p className="text-xs text-slate-400 mt-1">Farklı bir kategori seçebilir veya arama kelimesini değiştirebilirsiniz.</p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {filteredProducts.map((prod) => (
                          <ProductCard 
                            key={prod.id} 
                            product={prod} 
                            onAddToCart={handleAddToCart} 
                          />
                        ))}
                      </div>
                    )}

                    {/* Show Custom Print block as an alternative banner */}
                    <div className="bg-slate-100/60 rounded-3xl p-6 md:p-8 border border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="space-y-2 text-center md:text-left">
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                          Hayal Gücünüzü Sınırlandırmayın
                        </span>
                        <h4 className="text-xl font-bold text-slate-900">Aradığınız Modeli Bulamadınız mı?</h4>
                        <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                          Kendi STL dosyanızı yükleyin veya Makerworld tasarım linkini paylaşın, sizin için eSUN PLA+ filamenti ile milimetrik doğrulukta üretelim!
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedCategory('Özel Sipariş')}
                        className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
                      >
                        Özel Baskı Formunu Aç
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom row: Contact & Info */}
                <div className="grid md:grid-cols-12 gap-8 pt-6">
                  <div className="md:col-span-4">
                    <ContactDetails />
                  </div>
                  <div className="md:col-span-8 bg-white border border-slate-100 p-8 rounded-3xl shadow-xl space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-900"></span>
                      Nasıl Sipariş Verilir?
                    </h3>

                    <div className="grid sm:grid-cols-3 gap-6 text-center sm:text-left">
                      <div className="space-y-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center mx-auto sm:mx-0 border border-slate-200">
                          1
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Modelini Seç</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Kataloğumuzdan dilediğin hazır modeli veya kendi yükleyeceğin özel tasarımı sepetine ekle.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center mx-auto sm:mx-0 border border-slate-200">
                          2
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Havale/EFT Yap</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Sepet ekranındaki IBAN adresine Havale/EFT ödemeni yap ve siparişi tamamla.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center mx-auto sm:mx-0 border border-slate-200">
                          3
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm">Baskıyı Canlı İzle</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Sipariş kodunu "Sipariş Takip" kısmına yazarak baskı durumunu real-time olarak takip et!
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-3.5 items-start">
                      <Info className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                      <div className="text-xs text-slate-500 leading-relaxed">
                        <span className="font-semibold text-slate-800">Kalite Güvencesi:</span> Karabük'teki merkezimizde kullandığımız eSUN PLA+ filamentler, standart PLA'ya göre çok daha dayanıklıdır ve darbelere karşı ekstra dirençlidir. Hassas baskı kalitemizle siparişleriniz sorunsuz olarak teslim edilir.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: ORDER TRACKER */}
            {view === 'tracker' && (
              <OrderTracker 
                onUserLogin={(user) => setCustomerUser(user)}
                currentUser={customerUser}
                onLogout={() => setCustomerUser(null)}
              />
            )}

            {/* VIEW 3: ADMIN Dash */}
            {view === 'admin' && adminUser && (
              <AdminPanel />
            )}

            {/* VIEW 4: ADMIN LOGIN */}
            {view === 'login' && (
              <AdminLogin 
                onLoginSuccess={(admin) => {
                  setAdminUser(admin);
                  setView('admin');
                }}
                onClose={() => setView('home')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Cart Sliding overlay */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <div className="absolute inset-x-4 bottom-4 md:inset-y-0 md:right-0 md:bottom-0 md:left-auto max-w-4xl w-full md:p-6 flex items-center justify-center">
              <motion.div 
                initial={{ y: '100%', md: { y: 0, x: '100%' } }}
                animate={{ y: 0, x: 0 }}
                exit={{ y: '100%', md: { y: 0, x: '100%' } }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full h-fit md:h-full overflow-y-auto"
              >
                <Cart 
                  cartItems={cart}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveCartItem}
                  onClearCart={handleClearCart}
                  bankDetails={bankDetails}
                  userId={customerUser?.id || 'anonymous'}
                  onCheckoutComplete={(orderId) => {
                    setIsCartOpen(false);
                    setView('tracker');
                  }}
                  onClose={() => setIsCartOpen(false)}
                />
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
