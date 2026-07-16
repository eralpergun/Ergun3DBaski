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
  Send,
  Tag,
  Bell,
  AlertTriangle,
  ClipboardList,
  Printer
} from 'lucide-react';
import { Product, Order, BankDetails, UserProfile, OrderStatus, SupportChat, SupportMessage, InventoryItem, GalleryItem } from '../types';
import { getMultiColorDiscountPercentage } from '../utils/discount';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'custom_settings' | 'users' | 'chats' | 'coupons' | 'inventory' | 'gallery'>('orders');

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
  const [ordersEnabled, setOrdersEnabled] = useState<boolean>(true);
  
  // Coupon/Gift Card states
  const [coupons, setCoupons] = useState<any[]>([]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState<number>(10);
  const [newCouponDescription, setNewCouponDescription] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState<number>(0);
  const [newCouponMaxUsage, setNewCouponMaxUsage] = useState<number>(50);
  
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
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState<number | ''>('');
  const [newProdTagType, setNewProdTagType] = useState<'none' | 'sale' | 'special'>('none');
  const [newProdTagLabel, setNewProdTagLabel] = useState('');
  const [newProdStockCount, setNewProdStockCount] = useState<number | ''>('');
  const [newProdPrintDuration, setNewProdPrintDuration] = useState<number | ''>('');
  const [newProdMaterial, setNewProdMaterial] = useState<string>('PLA');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImgUrl, setNewProdImgUrl] = useState('');
  const [newProdStlName, setNewProdStlName] = useState('');

  // Add/Edit Gallery Item states
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('Fidgets');
  const [galleryDesc, setGalleryDesc] = useState('');
  const [galleryImage, setGalleryImage] = useState('');
  const [galleryLayerHeight, setGalleryLayerHeight] = useState('0.16mm (Hassas)');
  const [galleryInfill, setGalleryInfill] = useState('%15 Gyroid');
  const [galleryFilament, setGalleryFilament] = useState('Bambu Lab PLA Basic');
  const [galleryDuration, setGalleryDuration] = useState('3 Saat');
  const [galleryPrinter, setGalleryPrinter] = useState('Bambu Lab X1-Carbon');
  const [galleryQualityBadge, setGalleryQualityBadge] = useState('Hassas Katman Kalitesi');

  // Add User Form state
  const [newUserEmailOrPhone, setNewUserEmailOrPhone] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserPasscode, setNewUserPasscode] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'customer'>('customer');

  // Fast edit price states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<number>(0);
  const [editingOriginalPriceValue, setEditingOriginalPriceValue] = useState<number | ''>('');
  const [editingTagType, setEditingTagType] = useState<'none' | 'sale' | 'special'>('none');
  const [editingTagLabel, setEditingTagLabel] = useState('');
  const [editingStockCountValue, setEditingStockCountValue] = useState<number | ''>('');
  const [editingPrintDurationValue, setEditingPrintDurationValue] = useState<number | ''>('');
  const [editingMaterialValue, setEditingMaterialValue] = useState<string>('PLA');

  // Inventory state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Add Inventory Form state
  const [newInvName, setNewInvName] = useState('');
  const [newInvType, setNewInvType] = useState<'filament' | 'hammadde'>('filament');
  const [newInvColor, setNewInvColor] = useState('');
  const [newInvQty, setNewInvQty] = useState<number>(1000);
  const [newInvUnit, setNewInvUnit] = useState<'g' | 'kg' | 'adet'>('g');
  const [newInvCritical, setNewInvCritical] = useState<number>(300);
  const [newInvNotes, setNewInvNotes] = useState('');

  // Fast edit stock states
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);
  const [editingInventoryQty, setEditingInventoryQty] = useState<number>(0);

  // Collapsible text states
  const [expandedProdIds, setExpandedProdIds] = useState<Record<string, boolean>>({});
  const [expandedInvIds, setExpandedInvIds] = useState<Record<string, boolean>>({});
  const [expandedOrderNotes, setExpandedOrderNotes] = useState<Record<string, boolean>>({});

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

    const ordersEnabledRef = ref(database, 'customSettings/ordersEnabled');
    const unsubscribeOrdersEnabled = onValue(ordersEnabledRef, (snapshot) => {
      if (snapshot.exists()) {
        setOrdersEnabled(snapshot.val() !== false);
      } else {
        setOrdersEnabled(true);
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

    const couponsRef = ref(database, 'coupons');
    const unsubscribeCoupons = onValue(couponsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const couponsList = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          ...val
        }));
        setCoupons(couponsList);
      } else {
        setCoupons([]);
      }
    });

    const inventoryRef = ref(database, 'inventory');
    const unsubscribeInventory = onValue(inventoryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          ...val
        })) as InventoryItem[];
        setInventory(list);
      } else {
        setInventory([]);
      }
    });

    const galleryRef = ref(database, 'gallery');
    const unsubscribeGallery = onValue(galleryRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setGallery(Object.values(data) as GalleryItem[]);
      } else {
        setGallery([]);
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
      unsubscribeOrdersEnabled();
      unsubscribeChats();
      unsubscribeCoupons();
      unsubscribeInventory();
      unsubscribeGallery();
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
        originalPrice: newProdOriginalPrice ? Number(newProdOriginalPrice) : undefined,
        tagType: newProdTagType !== 'none' ? newProdTagType : undefined,
        tagLabel: newProdTagLabel.trim() || undefined,
        stockCount: newProdStockCount !== '' ? Number(newProdStockCount) : undefined,
        printDuration: newProdPrintDuration !== '' ? Number(newProdPrintDuration) : undefined,
        material: newProdMaterial.trim() || 'PLA',
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
      setNewProdOriginalPrice('');
      setNewProdTagType('none');
      setNewProdTagLabel('');
      setNewProdStockCount('');
      setNewProdPrintDuration('');
      setNewProdMaterial('PLA');
      setNewProdDesc('');
      setNewProdImgUrl('');
      setNewProdStlName('');
    } catch (err) {
      console.error(err);
      alert('Ürün eklenirken hata oluştu.');
    }
  };

  // Handle adding gallery item
  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryTitle || !galleryImage) {
      alert('Lütfen geçerli bir başlık ve görsel URL\'i girin.');
      return;
    }

    try {
      const gRef = ref(database, 'gallery');
      const newGRef = push(gRef);
      const generatedId = newGRef.key || Math.random().toString(36).substring(2, 9).toUpperCase();

      const item: GalleryItem = {
        id: generatedId,
        title: galleryTitle,
        category: galleryCategory,
        description: galleryDesc,
        image: galleryImage,
        layerHeight: galleryLayerHeight,
        infill: galleryInfill,
        filament: galleryFilament,
        duration: galleryDuration,
        printer: galleryPrinter,
        qualityBadge: galleryQualityBadge
      };

      await set(newGRef, item);
      alert('Geçmiş baskı başarıyla eklendi!');
      
      // Reset form
      setGalleryTitle('');
      setGalleryDesc('');
      setGalleryImage('');
      setGalleryLayerHeight('0.16mm (Hassas)');
      setGalleryInfill('%15 Gyroid');
      setGalleryFilament('Bambu Lab PLA Basic');
      setGalleryDuration('3 Saat');
      setGalleryPrinter('Bambu Lab X1-Carbon');
      setGalleryQualityBadge('Hassas Katman Kalitesi');
    } catch (err) {
      console.error(err);
      alert('Geçmiş baskı eklenirken hata oluştu.');
    }
  };

  // Handle deleting gallery item
  const handleDeleteGalleryItem = async (id: string) => {
    if (!window.confirm('Bu geçmiş baskıyı silmek istediğinize emin misiniz?')) {
      return;
    }
    try {
      const itemRef = ref(database, `gallery/${id}`);
      await remove(itemRef);
      alert('Geçmiş baskı silindi.');
    } catch (err) {
      console.error(err);
      alert('Silme işlemi başarısız.');
    }
  };

  // Handle updating gallery item
  const handleUpdateGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGalleryItem) return;
    if (!galleryTitle || !galleryImage) {
      alert('Lütfen başlık ve görsel URL\'i girin.');
      return;
    }

    try {
      const itemRef = ref(database, `gallery/${editingGalleryItem.id}`);
      const updatedItem: GalleryItem = {
        id: editingGalleryItem.id,
        title: galleryTitle,
        category: galleryCategory,
        description: galleryDesc,
        image: galleryImage,
        layerHeight: galleryLayerHeight,
        infill: galleryInfill,
        filament: galleryFilament,
        duration: galleryDuration,
        printer: galleryPrinter,
        qualityBadge: galleryQualityBadge
      };

      await set(itemRef, updatedItem);
      alert('Geçmiş baskı güncellendi!');
      setEditingGalleryItem(null);
      
      // Reset form
      setGalleryTitle('');
      setGalleryDesc('');
      setGalleryImage('');
      setGalleryLayerHeight('0.16mm (Hassas)');
      setGalleryInfill('%15 Gyroid');
      setGalleryFilament('Bambu Lab PLA Basic');
      setGalleryDuration('3 Saat');
      setGalleryPrinter('Bambu Lab X1-Carbon');
      setGalleryQualityBadge('Hassas Katman Kalitesi');
    } catch (err) {
      console.error(err);
      alert('Güncelleme sırasında hata oluştu.');
    }
  };

  // Start editing gallery item
  const startEditingGalleryItem = (item: GalleryItem) => {
    setEditingGalleryItem(item);
    setGalleryTitle(item.title);
    setGalleryCategory(item.category);
    setGalleryDesc(item.description);
    setGalleryImage(item.image);
    setGalleryLayerHeight(item.layerHeight);
    setGalleryInfill(item.infill);
    setGalleryFilament(item.filament);
    setGalleryDuration(item.duration);
    setGalleryPrinter(item.printer);
    setGalleryQualityBadge(item.qualityBadge);
  };

  // Clear all gallery items
  const handleClearAllGalleryItems = async () => {
    if (!window.confirm('TÜM geçmiş baskıları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      return;
    }
    try {
      const galleryRef = ref(database, 'gallery');
      await set(galleryRef, null);
      alert('Tüm geçmiş baskılar silindi.');
    } catch (err) {
      console.error(err);
      alert('Sıfırlama işlemi başarısız.');
    }
  };

  // Handle adding coupon
  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = newCouponCode.trim().toUpperCase();
    if (!formattedCode) {
      alert('Lütfen geçerli bir kupon kodu girin.');
      return;
    }
    if (newCouponValue <= 0) {
      alert('Lütfen geçerli bir indirim/hediye değeri girin.');
      return;
    }
    if (newCouponType === 'percentage' && newCouponValue > 100) {
      alert('Yüzde indirimi %100\'den fazla olamaz.');
      return;
    }

    // Check if code already exists
    const codeExists = coupons.some(c => c.code === formattedCode);
    if (codeExists) {
      alert('Bu kupon kodu zaten mevcut. Lütfen farklı bir kod belirleyin.');
      return;
    }

    try {
      const couponRef = ref(database, 'coupons');
      const newRef = push(couponRef);
      const generatedId = newRef.key || Math.random().toString(36).substring(2, 9).toUpperCase();

      const item = {
        id: generatedId,
        code: formattedCode,
        type: newCouponType,
        value: Number(newCouponValue),
        description: newCouponDescription.trim() || `${formattedCode} İndirim Kodu`,
        minOrderValue: Number(newCouponMinOrder) || 0,
        maxUsage: Number(newCouponMaxUsage) || 50,
        usageCount: 0,
        active: true,
        createdAt: Date.now()
      };

      await set(newRef, item);
      alert('Kupon/Hediye kartı başarıyla oluşturuldu!');
      
      // Reset form
      setNewCouponCode('');
      setNewCouponValue(10);
      setNewCouponDescription('');
      setNewCouponMinOrder(0);
      setNewCouponMaxUsage(50);
    } catch (err) {
      console.error('Coupon creation failed:', err);
      alert('Kupon oluşturulurken bir hata oluştu.');
    }
  };

  // Handle toggling coupon active status
  const handleToggleCouponActive = async (couponId: string, currentStatus: boolean) => {
    try {
      await update(ref(database, `coupons/${couponId}`), {
        active: !currentStatus
      });
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
      alert('Durum güncellenirken hata oluştu.');
    }
  };

  // Handle deleting coupon
  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm('Bu kuponu silmek istediğinize emin misiniz?')) return;
    try {
      await remove(ref(database, `coupons/${couponId}`));
      alert('Kupon silindi.');
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      alert('Kupon silinirken hata oluştu.');
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
            await update(ref(database, `products/${dbKey}`), { 
              price: Number(editingPriceValue),
              originalPrice: editingOriginalPriceValue ? Number(editingOriginalPriceValue) : null,
              tagType: editingTagType !== 'none' ? editingTagType : null,
              tagLabel: editingTagLabel.trim() || null,
              stockCount: editingStockCountValue !== '' ? Number(editingStockCountValue) : null,
              printDuration: editingPrintDurationValue !== '' ? Number(editingPrintDurationValue) : null,
              material: editingMaterialValue.trim() || 'PLA'
            });
            setEditingProductId(null);
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      alert('Ürün güncellenemedi.');
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

  // Add inventory item
  const handleAddInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName.trim()) {
      alert('Lütfen geçerli bir malzeme adı girin.');
      return;
    }
    if (newInvQty < 0 || newInvCritical < 0) {
      alert('Miktar ve kritik seviye negatif olamaz.');
      return;
    }

    try {
      const inventoryRef = ref(database, 'inventory');
      const newItemRef = push(inventoryRef);
      const generatedId = newItemRef.key || Math.random().toString(36).substring(2, 9).toUpperCase();

      const item: InventoryItem = {
        id: generatedId,
        name: newInvName.trim(),
        type: newInvType,
        color: newInvColor.trim() || undefined,
        quantity: Number(newInvQty),
        unit: newInvUnit,
        criticalLevel: Number(newInvCritical),
        notes: newInvNotes.trim() || undefined,
        updatedAt: Date.now()
      };

      await set(newItemRef, item);
      alert('Malzeme başarıyla envantere eklendi!');
      
      // Reset form
      setNewInvName('');
      setNewInvColor('');
      setNewInvQty(1000);
      setNewInvCritical(300);
      setNewInvNotes('');
    } catch (err) {
      console.error(err);
      alert('Malzeme eklenirken hata oluştu.');
    }
  };

  // Delete inventory item
  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!window.confirm('Bu malzemeyi envanterden silmek istediğinize emin misiniz?')) return;
    try {
      const inventoryRef = ref(database, 'inventory');
      onValue(inventoryRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === itemId);
          if (dbKey) {
            await remove(ref(database, `inventory/${dbKey}`));
            alert('Malzeme silindi.');
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      alert('Malzeme silinemedi.');
    }
  };

  // Update Stock level
  const handleUpdateStockQty = async (itemId: string, newQty: number) => {
    if (newQty < 0) {
      alert('Stok miktarı 0 dan küçük olamaz.');
      return;
    }
    try {
      const inventoryRef = ref(database, 'inventory');
      onValue(inventoryRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === itemId);
          if (dbKey) {
            await update(ref(database, `inventory/${dbKey}`), { 
              quantity: Number(newQty),
              updatedAt: Date.now()
            });
            setEditingInventoryId(null);
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
      alert('Stok güncellenemedi.');
    }
  };

  // Adjust stock (add/subtract) quick action
  const handleAdjustStock = async (itemId: string, currentQty: number, change: number) => {
    const updated = currentQty + change;
    if (updated < 0) {
      alert('Stok miktarı sıfırın altına düşemez!');
      return;
    }
    try {
      const inventoryRef = ref(database, 'inventory');
      onValue(inventoryRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const dbKey = Object.keys(data).find(key => data[key].id === itemId);
          if (dbKey) {
            await update(ref(database, `inventory/${dbKey}`), { 
              quantity: Number(updated),
              updatedAt: Date.now()
            });
          }
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error(err);
    }
  };

  // Dashboard Stats Calculations
  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'Onaylandı')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingPaymentsCount = orders.filter(o => o.paymentStatus === 'Bekliyor').length;
  const activePrintersCount = orders.filter(o => o.orderStatus === 'Baskıda').length;

  const lowStockItems = inventory.filter(item => item.quantity <= item.criticalLevel);
  const lowStockCount = lowStockItems.length;

  return (
    <div className="space-y-8">
      {/* Low Stock Notification System (Bildirim Sistemi) */}
      {lowStockCount > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-md animate-pulse-slow">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl flex-shrink-0">
              <AlertTriangle className="h-6 w-6 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight">Kritik Stok Seviyesi Uyarısı!</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Şu anda envanterinizde <strong>{lowStockCount}</strong> adet malzeme/filament kritik seviyenin altına düşmüştür. Baskı işlemlerinin durmaması için lütfen stok tazeleyin.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('inventory')}
            className="self-start sm:self-auto bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            Uyarılara Git & Stok Güncelle
          </button>
        </div>
      )}

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

          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'coupons' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Tag className="h-4 w-4" />
            Kupon & Hediye Kartları ({coupons.length})
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Stok & Envanter ({inventory.length})
            {lowStockCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'gallery' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <Printer className="h-4 w-4" />
            Geçmiş Baskılar ({gallery.length})
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
                                  {item.type === 'catalog' ? item.product?.category : `Özel Sipariş (${item.customPrint?.estimatedWeight}g - ${item.customPrint?.printType === 'multi' ? '🌈 Çok Renkli' : 'Tek Renk'})`}
                                </p>
                                {item.type === 'custom' && item.customPrint?.estimatedDuration && (
                                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                                      ⏱️ {item.customPrint.estimatedDuration} (Bambulab A1)
                                    </span>
                                  </div>
                                )}
                                {item.type === 'custom' && item.customPrint?.selectedColors && item.customPrint.selectedColors.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1 items-center">
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">Seçilen Renkler:</span>
                                    {item.customPrint.selectedColors.map((color, cIdx) => (
                                      <span key={cIdx} className="inline-flex text-[9px] font-extrabold bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded border border-slate-300">
                                        {color}
                                      </span>
                                    ))}
                                  </div>
                                )}
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
                                {item.type === 'custom' && item.customPrint?.printType === 'multi' && getMultiColorDiscountPercentage(item.quantity) > 0 && (
                                  <span className="block text-[8px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 mt-1 uppercase tracking-widest">
                                    %{getMultiColorDiscountPercentage(item.quantity)} İnd.
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address & Cargo breakdown inside Admin Order card */}
                      {(order.city || order.shippingFee !== undefined) && (
                        <div className="mt-3 bg-white border border-slate-100 p-3 rounded-2xl grid sm:grid-cols-2 gap-4 text-xs">
                          {order.city && order.district && (
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Teslimat Adresi</span>
                              <p className="font-semibold text-slate-800">{order.city} / {order.district}</p>
                              <p className="text-slate-500 text-[11px] leading-relaxed break-words">{order.address}</p>
                            </div>
                          )}
                          {order.shippingFee !== undefined && (
                            <div className="flex flex-col justify-center sm:text-right">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Kargo Ücreti</span>
                              <p className="font-extrabold text-slate-800">
                                {order.shippingFee === 0 ? (
                                  <span className="text-emerald-600 font-bold">Ücretsiz (₺1000 ve Üzeri)</span>
                                ) : (
                                  `₺${order.shippingFee}`
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer EFT matching details */}
                      <div className="mt-4 pt-4 border-t border-slate-100/80 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 p-3 rounded-2xl">
                        <div className="text-xs">
                           <span className="text-slate-400 font-medium">Havale Gönderen:</span>{' '}
                          <span className="font-bold text-slate-800 underline decoration-slate-400 decoration-1">
                            {order.senderName}
                          </span>
                        </div>
                        {order.notes && (
                          <div className="text-xs max-w-xs text-slate-500 italic">
                            💬 <strong>Not:</strong>{" "}
                            <span className={expandedOrderNotes[order.id] ? '' : 'line-clamp-2 block'}>
                              "{order.notes}"
                            </span>
                            {order.notes.length > 50 && (
                              <button
                                type="button"
                                onClick={() => setExpandedOrderNotes(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-500 cursor-pointer block mt-1 animate-fade-in"
                              >
                                {expandedOrderNotes[order.id] ? 'Daha Az Gör ▲' : 'Devamını Gör ▼'}
                              </button>
                            )}
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

                  <div className="grid grid-cols-4 gap-4">
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

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Stok Miktarı
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newProdStockCount}
                        onChange={(e) => setNewProdStockCount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Sınırsız"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Baskı Süresi (Dk)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newProdPrintDuration}
                        onChange={(e) => setNewProdPrintDuration(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Otomatik"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                      />
                    </div>
                  </div>

                  {/* Promosyon Ayarları */}
                  <div className="bg-slate-100/60 p-3.5 rounded-2xl border border-slate-200/50 space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">🏷️ Kampanya, Etiket & Malzeme Ayarları</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Eski/Orijinal Fiyat (₺)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newProdOriginalPrice}
                          onChange={(e) => setNewProdOriginalPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          placeholder="Örn: 75 (Üstü çizilir)"
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Etiket Türü
                        </label>
                        <select
                          value={newProdTagType}
                          onChange={(e) => setNewProdTagType(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                        >
                          <option value="none">Yok</option>
                          <option value="sale">İndirim (Sale)</option>
                          <option value="special">Özel (Special)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Özel Etiket Yazısı (Opsiyonel)
                        </label>
                        <input
                          type="text"
                          value={newProdTagLabel}
                          onChange={(e) => setNewProdTagLabel(e.target.value)}
                          placeholder="Örn: YENİ, %20 İNDİRİM, ÇOK SATAN"
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Filament Malzemesi
                        </label>
                        <select
                          value={newProdMaterial}
                          onChange={(e) => setNewProdMaterial(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                        >
                          <option value="PLA">PLA</option>
                          <option value="PETG">PETG</option>
                          <option value="ABS">ABS</option>
                          <option value="ASA">ASA</option>
                          <option value="TPU">TPU (Esnek)</option>
                          <option value="Carbon Fiber">Carbon Fiber</option>
                        </select>
                      </div>
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
                    <div key={prod.id} className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 shadow-sm transition-all duration-300">
                      {editingProductId === prod.id ? (
                        <div className="space-y-3">
                          <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-100 pb-2">
                            <span>Model Düzenle: <span className="text-slate-600 font-extrabold">{prod.name}</span></span>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase font-black">{prod.category}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Satış Fiyatı (₺) *</label>
                              <input
                                type="number"
                                value={editingPriceValue}
                                onChange={(e) => setEditingPriceValue(Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-extrabold"
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Eski/Orijinal Fiyat (₺)</label>
                              <input
                                type="number"
                                value={editingOriginalPriceValue}
                                onChange={(e) => setEditingOriginalPriceValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="Üstü çizilecek"
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Malzeme</label>
                              <select
                                value={editingMaterialValue}
                                onChange={(e) => setEditingMaterialValue(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-600"
                              >
                                <option value="PLA">PLA</option>
                                <option value="PETG">PETG</option>
                                <option value="ABS">ABS</option>
                                <option value="ASA">ASA</option>
                                <option value="TPU">TPU (Esnek)</option>
                                <option value="Carbon Fiber">Carbon Fiber</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Etiket Türü</label>
                              <select
                                value={editingTagType}
                                onChange={(e) => setEditingTagType(e.target.value as any)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                              >
                                <option value="none">Yok</option>
                                <option value="sale">İndirim (Sale)</option>
                                <option value="special">Özel (Special)</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Özel Etiket Yazısı</label>
                              <input
                                type="text"
                                value={editingTagLabel}
                                onChange={(e) => setEditingTagLabel(e.target.value)}
                                placeholder="Örn: YENİ, %25 İNDİRİM"
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Stok Miktarı</label>
                              <input
                                type="number"
                                value={editingStockCountValue}
                                onChange={(e) => setEditingStockCountValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="Sınırsız"
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Baskı Süresi (Dk)</label>
                              <input
                                type="number"
                                value={editingPrintDurationValue}
                                onChange={(e) => setEditingPrintDurationValue(e.target.value === '' ? '' : Number(e.target.value))}
                                placeholder="Otomatik"
                                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                                min="1"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setEditingProductId(null)}
                              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-[11px] transition-all cursor-pointer"
                            >
                              İptal
                            </button>
                            <button
                              onClick={() => handleSaveProductPrice(prod.id)}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-[11px] transition-all cursor-pointer shadow-md shadow-slate-900/10"
                            >
                              Kaydet
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
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
                              {/* Show tags in Admin too for easy verification */}
                              {(prod.tagType === 'sale' || (prod.originalPrice && prod.originalPrice > prod.price)) && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-wide">
                                  İNDİRİM
                                </span>
                              )}
                              {prod.tagType === 'special' && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-wide">
                                  ÖZEL
                                </span>
                              )}
                              {prod.tagLabel && !(prod.tagType === 'sale' || (prod.originalPrice && prod.originalPrice > prod.price)) && prod.tagType !== 'special' && (
                                <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide">
                                  {prod.tagLabel}
                                </span>
                              )}
                            </div>
                            <p className={`text-[10px] text-slate-400 mt-0.5 ${expandedProdIds[prod.id] ? '' : 'line-clamp-1'}`}>
                              {prod.description || 'Açıklama bulunmuyor.'}
                            </p>
                            {prod.description && prod.description.length > 50 && (
                              <button
                                type="button"
                                onClick={() => setExpandedProdIds(prev => ({ ...prev, [prod.id]: !prev[prod.id] }))}
                                className="text-[9px] font-bold text-indigo-600 hover:text-indigo-500 cursor-pointer block mt-0.5 animate-fade-in"
                              >
                                {expandedProdIds[prod.id] ? 'Daha Az Gör ▲' : 'Devamını Gör ▼'}
                              </button>
                            )}
                            {prod.stlFileName && (
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">📄 {prod.stlFileName}</p>
                            )}
                          </div>

                          {/* Interactive Price edit */}
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                {prod.originalPrice && prod.originalPrice > prod.price && (
                                  <span className="text-[10px] text-slate-400 line-through block font-bold leading-none">
                                    ₺{prod.originalPrice}
                                  </span>
                                )}
                                <span className="font-extrabold text-slate-900 text-sm">₺{prod.price}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingProductId(prod.id);
                                  setEditingPriceValue(prod.price);
                                  setEditingOriginalPriceValue(prod.originalPrice || '');
                                  setEditingTagType(prod.tagType || 'none');
                                  setEditingTagLabel(prod.tagLabel || '');
                                  setEditingStockCountValue(prod.stockCount !== undefined && prod.stockCount !== null ? prod.stockCount : '');
                                  setEditingPrintDurationValue(prod.printDuration !== undefined && prod.printDuration !== null ? prod.printDuration : '');
                                  setEditingMaterialValue(prod.material || 'PLA');
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all"
                                title="Düzenle"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </div>

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
                      )}
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

                <div className="border-t border-slate-200/60 pt-5 mt-2 space-y-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs mb-1 flex items-center gap-1.5">
                      🔒 Sipariş Alımı Durumu (Geçici Kapatma)
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Sipariş alımını kısa bir süreliğine durdurabilirsiniz. Kapalıyken müşteriler yeni sipariş oluşturamaz ve bilgilendirici bir uyarı görür.
                    </p>
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
                    <span className="text-xs font-bold text-slate-700">
                      {ordersEnabled ? '🟢 Sipariş Alımı Aktif' : '🔴 Sipariş Alımı Kapalı'}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const newStatus = !ordersEnabled;
                        await set(ref(database, 'customSettings/ordersEnabled'), newStatus);
                        alert(`Sipariş alımı ${newStatus ? 'AKTİF hale getirildi' : 'GEÇİCİ OLARAK DURDURULDU'}!`);
                      }}
                      className={`px-4 py-2 text-xs font-extrabold rounded-xl cursor-pointer transition-all ${
                        ordersEnabled 
                          ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200' 
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200'
                      }`}
                    >
                      {ordersEnabled ? 'Siparişleri Kapat' : 'Siparişleri Aç'}
                    </button>
                  </div>
                </div>
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
                              chat.status === 'closed'
                                ? isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'
                                : chat.liveMode
                                ? isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                                : isSelected ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {chat.status === 'closed' ? 'Kapalı' : chat.liveMode ? 'Canlı' : 'Bot'}
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
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 text-sm">{selectedChat?.customerName || 'Ziyaretçi'}</h4>
                                {selectedChat?.status === 'closed' && (
                                  <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded-md border border-slate-200">
                                    KAPATILDI
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400">ID: {selectedChatId}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedChat?.status !== 'closed' && (
                                <button
                                  onClick={async () => {
                                    if (confirm('Bu sohbet oturumunu sonlandırmak/kapatmak istediğinize emin misiniz?')) {
                                      await update(ref(database, `support_chats/${selectedChatId}`), {
                                        status: 'closed',
                                        updatedAt: Date.now()
                                      });
                                      await push(ref(database, `support_chats/${selectedChatId}/messages`), {
                                        id: 'sys_closed_' + Date.now(),
                                        sender: 'admin',
                                        text: 'Sohbet admin tarafından sonlandırıldı. Sorularınız için yeni bir sohbet başlatabilirsiniz. 🔒',
                                        timestamp: Date.now()
                                      });
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 rounded-xl border border-amber-150 transition-all flex items-center gap-1 font-bold text-xs cursor-pointer shadow-sm animate-pulse"
                                  title="Sohbeti Kapat"
                                >
                                  🔒 Sohbeti Kapat
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (confirm('Bu sohbeti tamamen SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
                                    await remove(ref(database, `support_chats/${selectedChatId}`));
                                    setSelectedChatId(null);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
                                title="Sohbeti Tamamen Sil"
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

                          {/* Chat Input or Closed Message */}
                          {selectedChat?.status === 'closed' ? (
                            <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-2xl text-center text-xs text-slate-500 font-bold flex items-center justify-center gap-2">
                              🔒 Bu destek sohbeti sonlandırılmıştır. Kullanıcı yeni bir sohbet başlatabilir.
                            </div>
                          ) : (
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
                          )}
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

          {activeTab === 'coupons' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Kupon ve Hediye Kartı Yönetimi</h3>
                  <p className="text-xs text-slate-400">Müşterilerinize özel yüzde indirim kuponları ve sabit bakiye hediye kartları oluşturup yönetin.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form: Create new coupon */}
                <div className="xl:col-span-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-indigo-600" />
                    Yeni Kupon / Hediye Kartı
                  </h4>

                  <form onSubmit={handleAddCoupon} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Kupon Kodu *
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: YENIYIL15, HEDIYE100"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold outline-none text-slate-800 transition-all uppercase"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        İndirim Türü *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewCouponType('percentage');
                            if (newCouponValue > 100) setNewCouponValue(10);
                          }}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            newCouponType === 'percentage'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          % Yüzde İndirimi
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewCouponType('fixed')}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            newCouponType === 'fixed'
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          ₺ Sabit Tutar (Hediye)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        {newCouponType === 'percentage' ? 'İndirim Oranı (%)' : 'Hediye Miktarı (₺)'} *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={newCouponType === 'percentage' ? 100 : undefined}
                        value={newCouponValue}
                        onChange={(e) => setNewCouponValue(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs font-bold outline-none text-slate-800 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Minimum Sepet Tutarı (₺)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newCouponMinOrder}
                        onChange={(e) => setNewCouponMinOrder(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Kuponun geçerli olması için minimum alışveriş tutarı.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Maksimum Kullanım Sınırı (Adet)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newCouponMaxUsage}
                        onChange={(e) => setNewCouponMaxUsage(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Açıklama / Not
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Sadık Müşteri Hediyesi, Hoş geldin İndirimi"
                        value={newCouponDescription}
                        onChange={(e) => setNewCouponDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Kupon Oluştur
                    </button>
                  </form>
                </div>

                {/* List: Existing coupons */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Tag className="h-4.5 w-4.5 text-indigo-600" />
                    Mevcut Kupon & Hediye Kodları ({coupons.length})
                  </h4>

                  {coupons.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                      <Tag className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm font-medium">Henüz hiçbir aktif kupon veya hediye kodu oluşturulmadı.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {coupons.map((coupon) => {
                        const usagePercent = Math.min(100, (coupon.usageCount / (coupon.maxUsage || 1)) * 100);
                        return (
                          <div
                            key={coupon.id}
                            className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                              coupon.active 
                                ? 'bg-white border-slate-100 shadow-sm hover:shadow-md' 
                                : 'bg-slate-50/55 border-slate-200/50 opacity-75'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-extrabold uppercase border border-indigo-100">
                                  🏷️ {coupon.code}
                                </span>
                                <h5 className="font-bold text-slate-800 text-xs mt-2">{coupon.description}</h5>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleCouponActive(coupon.id, coupon.active)}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border cursor-pointer transition-all ${
                                    coupon.active
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                                  }`}
                                >
                                  {coupon.active ? '● Aktif' : '○ Pasif'}
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-3 py-2 text-[11px] border-t border-slate-100/70 border-b border-slate-100/70 mb-3">
                              <div>
                                <span className="text-slate-400 font-semibold block uppercase text-[8px] tracking-wider">İndirim Miktarı</span>
                                <span className="font-extrabold text-slate-900 text-sm">
                                  {coupon.type === 'percentage' ? `%${coupon.value}` : `₺${coupon.value}`}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold block uppercase text-[8px] tracking-wider">Min. Sipariş</span>
                                <span className="font-bold text-slate-700">
                                  {coupon.minOrderValue > 0 ? `₺${coupon.minOrderValue}` : 'Yok'}
                                </span>
                              </div>
                            </div>

                            {/* Usage Progress */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-bold text-slate-400">
                                <span>KULLANIM: {coupon.usageCount} / {coupon.maxUsage}</span>
                                <span>%{Math.round(usagePercent)}</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 50 ? 'bg-amber-500' : 'bg-indigo-600'
                                  }`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Stok ve Hammadde / Filament Envanteri</h3>
                  <p className="text-xs text-slate-400">Yazıcılarda kullanılan filament miktarını ve diğer hammaddelerinizi yönetin, kritik seviye alarmlarını takip edin.</p>
                </div>
              </div>

              {/* Düşük Stok Alarmları / Uyarı Paneli */}
              {lowStockItems.length > 0 && (
                <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 animate-bounce" />
                    <h4 className="font-black text-sm tracking-tight">Kritik Seviye Altındaki Malzemeler ({lowStockCount})</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="p-4 rounded-2xl bg-white border border-rose-100 shadow-sm flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Kritik Stok</span>
                          <h5 className="font-bold text-slate-800 text-xs mt-1.5">{item.name} {item.color ? `(${item.color})` : ''}</h5>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Mevcut: <strong className="text-rose-600">{item.quantity}{item.unit}</strong> / Kritik: {item.criticalLevel}{item.unit}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(item.id, item.quantity, 1000)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-extrabold rounded-lg shadow-sm transition-all text-center"
                          >
                            +1kg Ekle
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form: Yeni Malzeme Ekle */}
                <div className="xl:col-span-1 bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-indigo-600" />
                    Yeni Malzeme / Filament Ekle
                  </h4>

                  <form onSubmit={handleAddInventoryItem} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Malzeme / Filament Adı *
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Esun PLA+, Yerli ABS"
                        value={newInvName}
                        onChange={(e) => setNewInvName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Tür *
                        </label>
                        <select
                          value={newInvType}
                          onChange={(e) => setNewInvType(e.target.value as any)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                        >
                          <option value="filament">Filament</option>
                          <option value="hammadde">Hammadde / Diğer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Renk / Detay
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Kırmızı, Siyah"
                          value={newInvColor}
                          onChange={(e) => setNewInvColor(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Mevcut Stok *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newInvQty}
                          onChange={(e) => setNewInvQty(Number(e.target.value))}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Birim
                        </label>
                        <select
                          value={newInvUnit}
                          onChange={(e) => setNewInvUnit(e.target.value as any)}
                          className="w-full px-2 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-bold"
                        >
                          <option value="g">gram (g)</option>
                          <option value="kg">kg</option>
                          <option value="adet">adet</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Kritik Stok Seviyesi *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newInvCritical}
                        onChange={(e) => setNewInvCritical(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                        required
                      />
                      <p className="text-[9px] text-slate-400 mt-1">Stok bu değerin altına düştüğünde sistem alarm vererek uyarır.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Notlar / Açıklama
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Nozzle sıcaklığı: 210C, Tabla: 60C"
                        value={newInvNotes}
                        onChange={(e) => setNewInvNotes(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Envantere Ekle
                    </button>
                  </form>
                </div>

                {/* Mevcut Stok Listesi */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <ClipboardList className="h-4.5 w-4.5 text-indigo-600" />
                    Mevcut Stok Kartları ({inventory.length})
                  </h4>

                  {inventory.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                      <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm font-medium">Henüz hiçbir stok kalemi eklenmedi.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {inventory.map((item) => {
                        const isLow = item.quantity <= item.criticalLevel;
                        return (
                          <div
                            key={item.id}
                            className={`p-5 rounded-2xl border transition-all duration-300 relative ${
                              isLow 
                                ? 'bg-rose-50/30 border-rose-200 shadow-sm' 
                                : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase border ${
                                  item.type === 'filament' 
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  📦 {item.type === 'filament' ? 'Filament' : 'Hammadde'}
                                </span>
                                <h5 className="font-extrabold text-slate-800 text-xs mt-2.5">
                                  {item.name} {item.color ? `(${item.color})` : ''}
                                </h5>
                                {item.notes && (
                                  <div>
                                    <p className={`text-[10px] text-slate-400 mt-1 italic ${expandedInvIds[item.id] ? '' : 'line-clamp-1'}`}>
                                      📝 {item.notes}
                                    </p>
                                    {item.notes.length > 30 && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedInvIds(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-500 cursor-pointer block mt-0.5 animate-fade-in"
                                      >
                                        {expandedInvIds[item.id] ? 'Daha Az Gör ▲' : 'Devamını Gör ▼'}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleDeleteInventoryItem(item.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                                title="Malzemeyi Sil"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {/* Stok Miktar & Düzenleme */}
                            <div className="pt-3 border-t border-slate-100/70 space-y-3">
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Mevcut Miktar</span>
                                <div className="flex items-center gap-1">
                                  {editingInventoryId === item.id ? (
                                    <div className="flex items-center gap-1 animate-fade-in">
                                      <input
                                        type="number"
                                        value={editingInventoryQty}
                                        onChange={(e) => setEditingInventoryQty(Number(e.target.value))}
                                        className="w-16 px-1.5 py-1 text-xs font-bold border border-slate-300 rounded focus:outline-none"
                                      />
                                      <span className="text-slate-500 font-bold text-xs">{item.unit}</span>
                                      <button
                                        onClick={() => handleUpdateStockQty(item.id, editingInventoryQty)}
                                        className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-all"
                                      >
                                        <Check className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => setEditingInventoryId(null)}
                                        className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-all"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className={`font-extrabold text-sm ${isLow ? 'text-rose-600' : 'text-indigo-600'}`}>
                                        {item.quantity.toLocaleString('tr-TR')} {item.unit}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setEditingInventoryId(item.id);
                                          setEditingInventoryQty(item.quantity);
                                        }}
                                        className="p-1 text-slate-400 hover:text-indigo-600 transition-all"
                                        title="Stok Miktarını El ile Düzenle"
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Hızlı Ekle/Çıkar Aksiyonları */}
                              <div className="flex items-center justify-between gap-1.5 text-[10px] bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <span className="text-slate-400 font-bold pl-1 uppercase text-[8px]">Hızlı Düzenle:</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleAdjustStock(item.id, item.quantity, -100)}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-lg border border-slate-200 transition-all text-center"
                                  >
                                    -100g
                                  </button>
                                  <button
                                    onClick={() => handleAdjustStock(item.id, item.quantity, -250)}
                                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-lg border border-slate-200 transition-all text-center"
                                  >
                                    -250g
                                  </button>
                                  <button
                                    onClick={() => handleAdjustStock(item.id, item.quantity, 500)}
                                    className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-indigo-700 font-bold rounded-lg border border-slate-200 transition-all text-center"
                                  >
                                    +500g
                                  </button>
                                  <button
                                    onClick={() => handleAdjustStock(item.id, item.quantity, 1000)}
                                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all text-center"
                                  >
                                    +1kg
                                  </button>
                                </div>
                              </div>

                              {/* Kritik Sınır Bilgisi */}
                              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                                <span>Kritik Seviye Sınırı:</span>
                                <span className="font-bold text-slate-600">{item.criticalLevel} {item.unit}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Geçmiş Baskılar Galerisi ({gallery.length})</h3>
                  <p className="text-xs text-slate-500">Ana sayfadaki fotoğraf galerisini buradan dinamik olarak yönetebilir, yeni modeller ekleyebilirsiniz.</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllGalleryItems}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  Şimdilik Hepsini Sil (Sıfırla)
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Sol Taraf: Ekle / Düzenle Formu */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 h-fit space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Plus className="h-4.5 w-4.5 text-indigo-600" />
                    {editingGalleryItem ? 'Geçmiş Baskıyı Düzenle' : 'Yeni Geçmiş Baskı Ekle'}
                  </h4>

                  <form onSubmit={editingGalleryItem ? handleUpdateGalleryItem : handleAddGalleryItem} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Baskı Başlığı *
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Katlanabilir Ejderha"
                        value={galleryTitle}
                        onChange={(e) => setGalleryTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Kategori *
                      </label>
                      <select
                        value={galleryCategory}
                        onChange={(e) => setGalleryCategory(e.target.value)}
                        className="w-full px-2 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-bold"
                      >
                        <option value="Fidgets">Fidgets</option>
                        <option value="Dekorasyon & Sanat">Dekorasyon & Sanat</option>
                        <option value="Kullanışlı Araçlar">Kullanışlı Araçlar</option>
                        <option value="Hediyelik & Aksesuar">Hediyelik & Aksesuar</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Görsel URL *
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={galleryImage}
                        onChange={(e) => setGalleryImage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all"
                        required
                      />
                      <p className="text-[9px] text-slate-450 mt-1">İnternette barındırılan doğrudan resim linki.</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Açıklama / Model Detayı
                      </label>
                      <textarea
                        placeholder="Örn: Mafsallı yapısı sayesinde tamamen hareketlidir."
                        value={galleryDesc}
                        onChange={(e) => setGalleryDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all h-20 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Katman Yüksekliği
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: 0.16mm (Hassas)"
                          value={galleryLayerHeight}
                          onChange={(e) => setGalleryLayerHeight(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Doluluk (Infill)
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: %15 Gyroid"
                          value={galleryInfill}
                          onChange={(e) => setGalleryInfill(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Kullanılan Filament
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: PLA Basic"
                          value={galleryFilament}
                          onChange={(e) => setGalleryFilament(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Baskı Süresi
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: 3 Saat"
                          value={galleryDuration}
                          onChange={(e) => setGalleryDuration(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Yazıcı Modeli
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: X1-Carbon"
                          value={galleryPrinter}
                          onChange={(e) => setGalleryPrinter(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Kalite Rozeti
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Hassas Katman Kalitesi"
                          value={galleryQualityBadge}
                          onChange={(e) => setGalleryQualityBadge(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-xs outline-none text-slate-800 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {editingGalleryItem && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingGalleryItem(null);
                            setGalleryTitle('');
                            setGalleryDesc('');
                            setGalleryImage('');
                          }}
                          className="w-1/3 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                        >
                          İptal
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`py-3 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          editingGalleryItem ? 'w-2/3 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100' : 'w-full bg-slate-900 hover:bg-slate-850'
                        }`}
                      >
                        {editingGalleryItem ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {editingGalleryItem ? 'Güncelle' : 'Geçmiş Baskı Ekle'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Sağ Taraf: Mevcut Galeriyi Listele */}
                <div className="xl:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Printer className="h-4.5 w-4.5 text-slate-800" />
                    Mevcut Geçmiş Baskılar ({gallery.length})
                  </h4>

                  {gallery.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                      <Printer className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm font-medium">Kayıtlı geçmiş baskı bulunmuyor.</p>
                      <p className="text-xs text-slate-400 mt-1">Sol taraftaki formu kullanarak yeni bir model ekleyebilirsiniz.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {gallery.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col"
                        >
                          <div className="relative aspect-video bg-slate-50 overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="object-cover w-full h-full"
                            />
                            <span className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-xs text-white text-[9px] font-extrabold px-2 py-0.5 rounded-lg border border-slate-800">
                              {item.category}
                            </span>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h5 className="font-extrabold text-slate-800 text-xs leading-tight">{item.title}</h5>
                              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                              
                              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
                                <span className="truncate">🎯 {item.layerHeight}</span>
                                <span className="truncate">🌀 {item.infill}</span>
                                <span className="truncate">🧵 {item.filament}</span>
                                <span className="truncate">⏱️ {item.duration}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100/70">
                              <button
                                onClick={() => startEditingGalleryItem(item)}
                                className="flex-1 py-2 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-bold text-xs rounded-xl border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                Düzenle
                              </button>
                              <button
                                onClick={() => handleDeleteGalleryItem(item.id)}
                                className="px-3.5 py-2 hover:bg-rose-50 text-slate-350 hover:text-rose-500 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100 animate-fade-in"
                                title="Sil"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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
