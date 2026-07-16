import React, { useState, useEffect } from 'react';
import { Search, Loader2, Package, Clock, ShieldAlert, BadgeCheck, FileText, Smartphone, KeyRound, UserPlus, Trash2, Calendar, FileDown, User, Check, ClipboardList, CreditCard, Printer, Sparkles, Truck, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { database } from '../lib/firebase';
import { ref, get, child, onValue, query, orderByChild, equalTo, remove, update } from 'firebase/database';
import { hashPasscodeSync } from '../utils/hash';
import { Order, OrderStatus } from '../types';

const getOrderProgressInfo = (status: OrderStatus, paymentStatus?: string) => {
  const isPaid = paymentStatus === 'Onaylandı';
  
  if (status === 'İptal Edildi') {
    return { activeIndex: -1, isCancelled: true };
  }

  let activeIndex = 0;
  if (status === 'Sipariş Alındı') {
    activeIndex = isPaid ? 2 : 0;
  } else if (status === 'Ödeme Bekleniyor') {
    activeIndex = isPaid ? 2 : 1;
  } else if (status === 'Baskıda') {
    activeIndex = 2;
  } else if (status === 'Hazır') {
    activeIndex = 3;
  } else if (status === 'Kargolandı' || status === 'Kapatıldı') {
    activeIndex = 4;
  }

  return { activeIndex, isCancelled: false };
};

const OrderProgressBar = ({ status, paymentStatus }: { status: OrderStatus; paymentStatus?: string }) => {
  const { activeIndex, isCancelled } = getOrderProgressInfo(status, paymentStatus);

  const steps = [
    { label: 'Alındı', icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500' },
    { label: 'Ödeme', icon: CreditCard, color: 'text-amber-500', bg: 'bg-amber-500' },
    { label: 'Baskıda', icon: Printer, color: 'text-indigo-500', bg: 'bg-indigo-500' },
    { label: 'Hazır', icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { label: 'Kargoda', icon: Truck, color: 'text-teal-500', bg: 'bg-teal-500' },
  ];

  if (isCancelled) {
    return (
      <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-fade-in">
        <span className="p-2 bg-rose-100 text-rose-600 rounded-xl">
          <XCircle className="h-5 w-5" />
        </span>
        <div>
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Sipariş Durumu</span>
          <span className="text-[11px] font-bold text-rose-600">Bu sipariş iptal edilmiştir.</span>
        </div>
      </div>
    );
  }

  const progressPercent = (activeIndex / (steps.length - 1)) * 100;

  return (
    <div className="w-full py-4 px-1 select-none">
      <div className="relative flex items-center justify-between w-full">
        {/* Background line */}
        <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0" />
        
        {/* Animated Fill Line */}
        <motion.div 
          className="absolute left-1 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 rounded-full z-0 origin-left"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />

        {/* Step bubbles */}
        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const StepIcon = step.icon;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isActive ? 1.15 : 1, 
                  opacity: 1,
                  backgroundColor: isCompleted 
                    ? '#10b981' // emerald-500 bg for completed
                    : isActive 
                      ? '#4f46e5' // indigo-600 bg for active
                      : '#ffffff',
                  borderColor: isCompleted 
                    ? '#10b981' 
                    : isActive 
                      ? '#4f46e5' 
                      : '#e2e8f0', 
                }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center shadow-xs cursor-help relative group`}
              >
                {isActive && (
                  <motion.span 
                    className="absolute -inset-1 rounded-full bg-indigo-500/25 animate-ping z-[-1]"
                    layoutId={`ping-${idx}`}
                  />
                )}

                {isCompleted ? (
                  <Check className="h-4 w-4 text-white stroke-[3]" />
                ) : (
                  <StepIcon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                )}

                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap shadow-md">
                  {step.label}
                </div>
              </motion.div>

              {/* Label below */}
              <span className={`text-[10px] font-bold mt-2 tracking-tight ${
                isActive 
                  ? 'text-indigo-600 font-extrabold' 
                  : isCompleted 
                    ? 'text-emerald-600' 
                    : 'text-slate-400 font-semibold'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface OrderTrackerProps {
  onUserLogin: (user: { emailOrPhone: string; role: string; id: string }) => void;
  currentUser: { emailOrPhone: string; role: string; id: string } | null;
  onLogout: () => void;
}

export default function OrderTracker({ onUserLogin, currentUser, onLogout }: OrderTrackerProps) {
  // Ortalama teslimat/üretim süresi tahmini hesaplama
  const calculateOrderWeightAndEst = (items: any[]) => {
    let totalWeightGrams = 0;
    if (!items) return { totalWeight: 0, text: '' };
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
      estimationText = `~${hours} Saat (Hızlı Hazırlık)`;
    } else {
      const days = Math.ceil(hours / 24);
      estimationText = `~${days} Gün (${hours} Saat)`;
    }

    return {
      totalWeight: totalWeightGrams,
      text: estimationText
    };
  };

  // Aktif siparişler için bugünün tarihine +3 gün ekleyerek Tahmini Teslimat hesaplama
  const getEstimatedDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isActiveOrder = (status: OrderStatus) => {
    return status === 'Sipariş Alındı' || 
           status === 'Ödeme Bekleniyor' || 
           status === 'Baskıda' || 
           status === 'Hazır' || 
           status === 'Kargolandı';
  };

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

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPasscode, setCurrentPasscode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [newPasscodeConfirm, setNewPasscodeConfirm] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Profile settings state
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [profileFullName, setProfileFullName] = useState('');
  const [profileEmailOrPhone, setProfileEmailOrPhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const handleOpenProfileSettings = async () => {
    if (!currentUser) return;

    if (showProfileSettings) {
      setShowProfileSettings(false);
      return;
    }

    setShowProfileSettings(true);
    setShowChangePassword(false);
    setProfileError('');
    setProfileSuccess('');

    try {
      setProfileLoading(true);
      const userRef = ref(database, `users/${currentUser.id}`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        setProfileFullName(data.fullName || '');
        setProfileEmailOrPhone(data.emailOrPhone || '');
      } else {
        setProfileFullName('');
        setProfileEmailOrPhone(currentUser.emailOrPhone);
      }
    } catch (err) {
      console.error(err);
      setProfileError('Profil bilgileri yüklenirken bir hata oluştu.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profileFullName.trim() || !profileEmailOrPhone.trim()) {
      setProfileError('Lütfen tüm alanları doldurun.');
      setProfileSuccess('');
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const userRef = ref(database, `users/${currentUser.id}`);
      
      // Update Realtime Database user node
      await update(userRef, {
        fullName: profileFullName.trim(),
        emailOrPhone: profileEmailOrPhone.trim()
      });

      // Notify parent about the updated contact info to refresh standard filters
      onUserLogin({
        emailOrPhone: profileEmailOrPhone.trim(),
        role: currentUser.role,
        id: currentUser.id
      });

      setProfileSuccess('Profil bilgileriniz başarıyla güncellendi! ✓');
      setTimeout(() => {
        setShowProfileSettings(false);
        setProfileSuccess('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setProfileError('Profil güncellenirken bir hata oluştu.');
    } finally {
      setProfileLoading(false);
    }
  };

  // User orders state
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Collapsible notes states
  const [expandedOrderNotes, setExpandedOrderNotes] = useState<Record<string, boolean>>({});
  const [expandedSearchOrderNote, setExpandedSearchOrderNote] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!currentPasscode || !newPasscode || !newPasscodeConfirm) {
      setChangePasswordError('Lütfen tüm alanları doldurun.');
      setChangePasswordSuccess('');
      return;
    }

    if (newPasscode !== newPasscodeConfirm) {
      setChangePasswordError('Yeni şifreler eşleşmiyor.');
      setChangePasswordSuccess('');
      return;
    }

    if (newPasscode.length < 4) {
      setChangePasswordError('Yeni şifre en az 4 karakter olmalıdır.');
      setChangePasswordSuccess('');
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError('');
    setChangePasswordSuccess('');

    try {
      const userRef = ref(database, `users/${currentUser.id}`);
      const userSnapshot = await get(userRef);

      if (!userSnapshot.exists()) {
        setChangePasswordError('Kullanıcı hesabı bulunamadı.');
        return;
      }

      const userData = userSnapshot.val();
      const currentHash = hashPasscodeSync(currentPasscode);

      if (userData.passcodeHash !== currentHash) {
        setChangePasswordError('Mevcut şifreniz yanlış.');
        return;
      }

      const newHash = hashPasscodeSync(newPasscode);
      await update(userRef, { passcodeHash: newHash });

      setChangePasswordSuccess('Şifreniz başarıyla güncellendi! ✓');
      setCurrentPasscode('');
      setNewPasscode('');
      setNewPasscodeConfirm('');
      setTimeout(() => {
        setShowChangePassword(false);
        setChangePasswordSuccess('');
      }, 2000);
    } catch (err) {
      console.error(err);
      setChangePasswordError('Şifre güncellenirken bir hata oluştu.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // Cancel/Delete customer order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Bu siparişi iptal etmek ve silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const ordersRef = ref(database, 'orders');
      onValue(ordersRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === orderId);
          if (dbKey) {
            await remove(ref(database, `orders/${dbKey}`));
            alert('Siparişiniz başarıyla iptal edildi ve silindi.');
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      alert('Sipariş iptal edilirken bir hata oluştu.');
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
      case 'Kapatıldı':
        return 'bg-slate-100 text-slate-500 border border-slate-300';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  const safeText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/ç/g, 'c').replace(/Ç/g, 'C')
      .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
      .replace(/ı/g, 'i').replace(/İ/g, 'I')
      .replace(/ö/g, 'o').replace(/Ö/g, 'O')
      .replace(/ş/g, 's').replace(/Ş/g, 'S')
      .replace(/ü/g, 'u').replace(/Ü/g, 'U');
  };

  const handleDownloadSingleOrderPDF = (order: Order) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Dark slate top banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(safeText('3D PRINTER KARABUK'), 15, 18);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(safeText('Genc ve Yenilikci 3D Baski Hizmetleri'), 15, 24);
    doc.text(safeText('Karabuk / Turkiye'), 15, 29);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(safeText('SIPARIS DETAYI / INVOICE'), 130, 22);

    // Default dark for general text
    doc.setTextColor(15, 23, 42);

    let y = 50;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(safeText('Musteri Bilgileri'), 15, y);
    doc.text(safeText('Siparis Bilgileri'), 115, y);

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 200, y + 2);

    y += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Ad Soyad:'), 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(safeText(order.customerName), 40, y);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Siparis Kodu:'), 115, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(79, 70, 229); // Indigo Accent
    doc.text(safeText(order.id), 145, y);

    y += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Iletisim:'), 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(safeText(order.customerContact), 40, y);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Tarih:'), 115, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(safeText(new Date(order.createdAt).toLocaleDateString('tr-TR')), 145, y);

    y += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Adres:'), 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const cityDist = `${order.district || ''} / ${order.city || ''}`;
    doc.text(safeText(cityDist), 40, y);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Siparis Durumu:'), 115, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(safeText(order.orderStatus), 145, y);

    y += 6;
    if (order.address) {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(safeText('Detayli Adres:'), 15, y);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitAddress = doc.splitTextToSize(safeText(order.address), 65);
      doc.text(splitAddress, 40, y);
      y += (splitAddress.length * 4) + 2;
    } else {
      y += 6;
    }

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 185, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(safeText('Urun / Dosya Adi'), 18, y + 5);
    doc.text(safeText('Tip'), 95, y + 5);
    doc.text(safeText('Baski Detayi'), 120, y + 5);
    doc.text(safeText('Adet'), 160, y + 5);
    doc.text(safeText('Tutar'), 182, y + 5);

    y += 8;

    // Render items
    doc.setFont('Helvetica', 'normal');
    order.items.forEach((item, index) => {
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 185, 10, 'F');
      }
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      let itemName = '';
      let itemType = '';
      let itemDetail = '';

      if (item.type === 'custom') {
        itemName = item.customPrint?.fileName || 'Ozel Model';
        itemType = 'Ozel Baski';
        const weight = item.customPrint?.estimatedWeight ? `${item.customPrint.estimatedWeight}g` : '';
        const colors = item.customPrint?.selectedColors?.join(', ') || '';
        itemDetail = `${weight} ${colors ? '| ' + colors : ''}`;
      } else {
        itemName = item.product?.name || 'Katalog Urunu';
        itemType = 'Katalog';
        itemDetail = safeText(item.product?.material || 'PLA');
      }

      const splitName = doc.splitTextToSize(safeText(itemName), 75);
      doc.text(splitName, 18, y + 6);
      doc.text(safeText(itemType), 95, y + 6);
      doc.text(safeText(itemDetail), 120, y + 6);
      doc.text(item.quantity.toString(), 162, y + 6);
      doc.text(`TL ${item.price * item.quantity}`, 182, y + 6);

      y += 10;
    });

    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 200, y);

    y += 6;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Odeme Durumu:'), 15, y);
    doc.setFont('Helvetica', 'bold');
    if (order.paymentStatus === 'Onaylandı') {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(245, 158, 11);
    }
    doc.text(safeText(order.paymentStatus === 'Onaylandı' ? 'Odeme Alindi' : 'Onay Bekliyor'), 45, y);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Kargo Ucreti:'), 125, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const shipFeeText = order.shippingFee === undefined || order.shippingFee === 0 ? 'Ucretsiz' : `TL ${order.shippingFee}`;
    doc.text(safeText(shipFeeText), 170, y);

    y += 6;
    const estDetails = calculateOrderWeightAndEst(order.items);
    if (estDetails.totalWeight > 0) {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(safeText('Toplam Agirlik:'), 15, y);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(safeText(`${estDetails.totalWeight}g`), 45, y);
    }

    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text(safeText('TOPLAM TUTAR:'), 125, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`TL ${order.totalAmount.toLocaleString('tr-TR')}`, 170, y);

    if (isActiveOrder(order.orderStatus)) {
      y += 6;
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(safeText('Tahmini Teslimat:'), 15, y);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(245, 158, 11);
      doc.text(safeText(getEstimatedDeliveryDate()), 45, y);
    }

    if (order.notes) {
      y += 10;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(safeText('Musteri Notu:'), 15, y);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitNotes = doc.splitTextToSize(safeText(order.notes), 170);
      doc.text(splitNotes, 15, y + 4.5);
      y += (splitNotes.length * 4) + 6;
    }

    const footerY = 275;
    doc.setDrawColor(226, 232, 240);
    doc.line(15, footerY - 5, 200, footerY - 5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(safeText('Bu belge 3D Printer Karabuk uzerinden otomatik olarak olusturulmustur.'), 15, footerY);
    doc.text(safeText('Karabuk 3D Yazici Cozumleri - eralpergun06@gmail.com'), 15, footerY + 4);

    doc.save(`siparis-${order.id}.pdf`);
  };

  const handleDownloadAllOrdersPDF = () => {
    if (userOrders.length === 0) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(safeText('3D PRINTER KARABUK'), 15, 18);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(safeText('Genc ve Yenilikci 3D Baski Hizmetleri'), 15, 24);
    doc.text(safeText('Gecmis Siparislerim Ozeti'), 15, 29);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    const countText = `TOPLAM ${userOrders.length} SIPARIS`;
    doc.text(safeText(countText), 145, 22);

    doc.setTextColor(15, 23, 42);

    let y = 50;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(safeText('Musteri Bilgileri'), 15, y);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 200, y + 2);

    y += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Musteri:'), 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(safeText(currentUser?.emailOrPhone || ''), 35, y);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(safeText('Rapor Tarihi:'), 115, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(safeText(new Date().toLocaleDateString('tr-TR')), 145, y);

    y += 12;

    // Table header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 185, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(safeText('Siparis Kodu'), 18, y + 5);
    doc.text(safeText('Tarih'), 50, y + 5);
    doc.text(safeText('Icerik'), 80, y + 5);
    doc.text(safeText('Durum'), 145, y + 5);
    doc.text(safeText('Tutar'), 182, y + 5);

    y += 8;

    let grandTotal = 0;

    userOrders.forEach((order, index) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
        doc.setFillColor(241, 245, 249);
        doc.rect(15, y, 185, 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(safeText('Siparis Kodu'), 18, y + 5);
        doc.text(safeText('Tarih'), 50, y + 5);
        doc.text(safeText('Icerik'), 80, y + 5);
        doc.text(safeText('Durum'), 145, y + 5);
        doc.text(safeText('Tutar'), 182, y + 5);
        y += 8;
      }

      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 185, 12, 'F');
      }

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      doc.setFont('Helvetica', 'bold');
      doc.text(safeText(order.id), 18, y + 7);
      doc.setFont('Helvetica', 'normal');

      doc.text(safeText(new Date(order.createdAt).toLocaleDateString('tr-TR')), 50, y + 7);

      const itemsSummary = order.items.map(item => {
        const name = item.type === 'custom' ? (item.customPrint?.fileName || 'Ozel Baski') : (item.product?.name || 'Katalog');
        return `${name} (x${item.quantity})`;
      }).join(', ');
      const splitSummary = doc.splitTextToSize(safeText(itemsSummary), 60);
      doc.text(splitSummary, 80, y + 5.5);

      doc.text(safeText(order.orderStatus), 145, y + 7);

      doc.text(`TL ${order.totalAmount}`, 182, y + 7);

      grandTotal += order.totalAmount;
      y += 12;
    });

    y += 5;
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(15, y, 200, y);

    y += 8;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(79, 70, 229);
    doc.text(safeText('GENEL TOPLAM HARCAMA:'), 115, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`TL ${grandTotal.toLocaleString('tr-TR')}`, 175, y);

    const footerY = 275;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(safeText('Bu belge 3D Printer Karabuk uzerinden otomatik olarak olusturulmustur.'), 15, footerY);
    doc.text(safeText('Gecmis Siparisler Raporu - eralpergun06@gmail.com'), 15, footerY + 4);

    doc.save(`gecmis-siparislerim.pdf`);
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

              {/* Dynamic Animated Progress Bar */}
              <div className="bg-white border border-slate-100 p-4 rounded-2xl shadow-xs">
                <OrderProgressBar status={searchedOrder.orderStatus} paymentStatus={searchedOrder.paymentStatus} />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sipariş İçeriği</span>
                {searchedOrder.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-600 truncate max-w-[180px] font-medium">
                        {item.type === 'catalog' ? item.product?.name : item.customPrint?.fileName}
                      </span>
                      <span className="text-slate-400 font-medium">x{item.quantity}</span>
                    </div>
                    {item.type === 'custom' && item.customPrint?.estimatedDuration && (
                      <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                        ⏱️ Baskı Süresi: {item.customPrint.estimatedDuration} (Bambulab A1)
                      </div>
                    )}
                    {item.type === 'custom' && item.customPrint?.selectedColors && item.customPrint.selectedColors.length > 0 && (
                      <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 flex-wrap">
                        <span>🎨 Renkler:</span>
                        <div className="flex gap-1 flex-wrap">
                          {item.customPrint.selectedColors.map((color, cIdx) => (
                            <span key={cIdx} className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded text-[9px] font-bold border border-slate-200">
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {(() => {
                const estDetails = calculateOrderWeightAndEst(searchedOrder.items);
                if (estDetails.totalWeight === 0) return null;
                return (
                  <div className="pt-3 border-t border-slate-200/60 text-xs space-y-1 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/50">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">⚖️ Üretim & Teslimat Tahmini</span>
                    <div className="flex justify-between items-center text-[11px] text-slate-600 mt-1">
                      <span>Toplam Ağırlık:</span>
                      <span className="font-bold text-slate-800">{estDetails.totalWeight} gram</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-600">
                      <span>Tahmini Hazırlanma:</span>
                      <span className="font-extrabold text-indigo-700">{estDetails.text}</span>
                    </div>
                  </div>
                );
              })()}

              {isActiveOrder(searchedOrder.orderStatus) && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div>
                      <span className="text-[10px] font-bold text-amber-800/80 uppercase tracking-wider block">Tahmini Teslimat</span>
                      <span className="text-xs font-black text-amber-950">Karabük ve Tüm Şehirler</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-700 bg-white px-2.5 py-1 rounded-xl border border-amber-200/40 shadow-xs">
                    {getEstimatedDeliveryDate()}
                  </span>
                </div>
              )}

              {searchedOrder.city && searchedOrder.district && (
                <div className="pt-3 border-t border-slate-200/60 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Teslimat Adresi</span>
                  <p className="text-slate-800 font-semibold text-[11px]">{searchedOrder.city} / {searchedOrder.district}</p>
                  <p className="text-slate-500 text-[10px] leading-relaxed break-words">{searchedOrder.address}</p>
                </div>
              )}

              {searchedOrder.notes && (
                <div className="pt-3 border-t border-slate-200/60 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Sipariş Notu</span>
                  <p className={`text-slate-600 italic text-[11px] mt-0.5 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100 ${expandedSearchOrderNote ? '' : 'line-clamp-2'}`}>
                    "{searchedOrder.notes}"
                  </p>
                  {searchedOrder.notes.length > 50 && (
                    <button
                      type="button"
                      onClick={() => setExpandedSearchOrderNote(!expandedSearchOrderNote)}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 mt-1 cursor-pointer block"
                    >
                      {expandedSearchOrderNote ? 'Daha Az Gör ▲' : 'Devamını Gör ▼'}
                    </button>
                  )}
                </div>
              )}

              <div className="pt-3 border-t border-slate-200/60 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Ödeme Durumu</span>
                  <span className={`font-semibold ${searchedOrder.paymentStatus === 'Onaylandı' ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {searchedOrder.paymentStatus === 'Onaylandı' ? 'Ödendi' : 'Ödeme Bekleniyor'}
                  </span>
                  {searchedOrder.shippingFee !== undefined && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Kargo: {searchedOrder.shippingFee === 0 ? 'Ücretsiz' : `₺${searchedOrder.shippingFee}`}
                    </span>
                  )}
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
                    onClick={handleOpenProfileSettings}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl bg-white shadow-sm transition-all flex items-center gap-1 cursor-pointer border ${
                      showProfileSettings
                        ? 'text-indigo-600 border-indigo-200 bg-indigo-50/10'
                        : 'text-slate-600 hover:text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    Profil Ayarları
                  </button>
                  <button
                    onClick={() => {
                      setShowChangePassword(!showChangePassword);
                      setChangePasswordError('');
                      setChangePasswordSuccess('');
                      setShowProfileSettings(false); // Close profile settings
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl bg-white shadow-sm transition-all flex items-center gap-1 cursor-pointer border ${
                      showChangePassword
                        ? 'text-indigo-600 border-indigo-200 bg-indigo-50/10'
                        : 'text-slate-600 hover:text-slate-800 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Şifre Değiştir
                  </button>
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

              {showProfileSettings && (
                <form onSubmit={handleUpdateProfile} className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/60">
                    <User className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Profil Ayarları</h4>
                  </div>
                  
                  {profileLoading && !profileFullName && !profileEmailOrPhone ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Ad Soyad</label>
                        <input
                          type="text"
                          required
                          value={profileFullName}
                          onChange={(e) => setProfileFullName(e.target.value)}
                          placeholder="Ad Soyad"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">E-posta veya Telefon Numarası</label>
                        <input
                          type="text"
                          required
                          value={profileEmailOrPhone}
                          onChange={(e) => setProfileEmailOrPhone(e.target.value)}
                          placeholder="E-posta veya Telefon Numarası"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {profileError && (
                    <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 flex items-center gap-1.5 font-medium">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      {profileError}
                    </p>
                  )}

                  {profileSuccess && (
                    <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 font-semibold">
                      {profileSuccess}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileSettings(false);
                        setProfileError('');
                        setProfileSuccess('');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {profileLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Kaydet'}
                    </button>
                  </div>
                </form>
              )}

              {showChangePassword && (
                <form onSubmit={handleChangePassword} className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/60">
                    <KeyRound className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Şifre Değiştirme Formu</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Mevcut Şifre</label>
                      <input
                        type="password"
                        required
                        value={currentPasscode}
                        onChange={(e) => setCurrentPasscode(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Yeni Şifre</label>
                      <input
                        type="password"
                        required
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Yeni Şifre Tekrar</label>
                      <input
                        type="password"
                        required
                        value={newPasscodeConfirm}
                        onChange={(e) => setNewPasscodeConfirm(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 outline-none text-slate-800"
                      />
                    </div>
                  </div>

                  {changePasswordError && (
                    <p className="text-xs text-rose-500 bg-rose-50 px-3 py-2 rounded-xl border border-rose-100 flex items-center gap-1.5 font-medium">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      {changePasswordError}
                    </p>
                  )}

                  {changePasswordSuccess && (
                    <p className="text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 font-semibold">
                      {changePasswordSuccess}
                    </p>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePassword(false);
                        setChangePasswordError('');
                        setChangePasswordSuccess('');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={changePasswordLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {changePasswordLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Güncelle'}
                    </button>
                  </div>
                </form>
              )}

              {/* Order List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-slate-900" />
                    Siparişleriniz ({userOrders.length})
                  </h4>
                  {userOrders.length > 0 && (
                    <button
                      onClick={handleDownloadAllOrdersPDF}
                      className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
                      title="Tüm sipariş geçmişinizi tek bir PDF olarak indirin"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Tüm Geçmişi İndir
                    </button>
                  )}
                </div>

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
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg ${getStatusStyle(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/60 flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(order.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => handleDownloadSingleOrderPDF(order)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer ml-1"
                              title="Sipariş Detaylarını PDF Olarak İndir"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                            </button>
                            {(order.orderStatus === 'Sipariş Alındı' || order.orderStatus === 'Ödeme Bekleniyor') && (
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                                title="Siparişi İptal Et ve Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dynamic Animated Progress Bar */}
                        <div className="bg-white border border-slate-100 p-3.5 rounded-2xl shadow-xs mb-3">
                          <OrderProgressBar status={order.orderStatus} paymentStatus={order.paymentStatus} />
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 mb-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="space-y-0.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-600 truncate max-w-[280px] font-medium">
                                  {item.type === 'catalog' ? item.product?.name : item.customPrint?.fileName}
                                </span>
                                <span className="text-slate-400 font-semibold">x{item.quantity}</span>
                              </div>
                              {item.type === 'custom' && item.customPrint?.estimatedDuration && (
                                <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1">
                                  ⏱️ Baskı Süresi: {item.customPrint.estimatedDuration} (Bambulab A1)
                                </div>
                              )}
                              {item.type === 'custom' && item.customPrint?.selectedColors && item.customPrint.selectedColors.length > 0 && (
                                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span>🎨 Renkler:</span>
                                  <div className="flex gap-1 flex-wrap">
                                    {item.customPrint.selectedColors.map((color, cIdx) => (
                                      <span key={cIdx} className="bg-slate-100 text-slate-700 px-1 py-0.2 rounded text-[9px] font-bold border border-slate-200">
                                        {color}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Summary & Price */}
                        <div className="bg-white/80 border border-slate-100 rounded-xl p-2.5 my-3 text-[11px] text-slate-600 space-y-1.5">
                          {(() => {
                            const estDetails = calculateOrderWeightAndEst(order.items);
                            if (estDetails.totalWeight === 0) return null;
                            return (
                              <div className="pb-1.5 border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                                <span className="flex items-center gap-1">⚖️ <strong className="text-slate-600">Sipariş Ağırlığı:</strong> {estDetails.totalWeight}g</span>
                                <span className="font-bold text-indigo-650">⏱️ Hazırlanma: {estDetails.text}</span>
                              </div>
                            );
                          })()}
                          {order.city && order.district && (
                            <div>
                              <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">Teslimat Adresi</span>
                              <span className="font-semibold text-slate-800">{order.city} / {order.district}</span>
                              <span className="block text-[10px] text-slate-500 mt-0.5 leading-relaxed break-words">{order.address}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div className="pt-2 border-t border-slate-100 mt-1">
                              <span className="font-bold text-slate-400 text-[9px] uppercase tracking-wider block">Sipariş Notu</span>
                              <p className={`text-[10px] text-slate-500 mt-0.5 leading-relaxed italic ${expandedOrderNotes[order.id] ? '' : 'line-clamp-2'}`}>
                                "{order.notes}"
                              </p>
                              {order.notes.length > 50 && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedOrderNotes(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                  className="text-[9px] font-bold text-indigo-600 hover:text-indigo-500 mt-0.5 cursor-pointer block"
                                >
                                  {expandedOrderNotes[order.id] ? 'Daha Az Gör ▲' : 'Devamını Gör ▼'}
                                </button>
                              )}
                            </div>
                          )}
                          {order.shippingFee !== undefined && (
                            <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-1.5 mt-1 text-slate-500">
                              <span>Kargo Ücreti:</span>
                              <span className="font-bold text-slate-700">
                                {order.shippingFee === 0 ? 'Ücretsiz' : `₺${order.shippingFee}`}
                              </span>
                            </div>
                          )}
                          {isActiveOrder(order.orderStatus) && (
                            <div className="flex justify-between items-center text-[10px] border-t border-slate-100 pt-1.5 mt-1 bg-amber-50/50 hover:bg-amber-100/50 p-2 rounded-lg border border-amber-200/40 transition-colors">
                              <span className="font-bold text-amber-850 flex items-center gap-1">🚚 Tahmini Teslimat:</span>
                              <span className="font-extrabold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200/30 shadow-xs">{getEstimatedDeliveryDate()}</span>
                            </div>
                          )}
                        </div>

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
