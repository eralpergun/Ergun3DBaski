export interface Product {
  id: string;
  name: string;
  category: "Fidgets" | "Accessories" | "Toys" | "Keychains";
  price: number;
  description: string;
  imageUrl?: string;
  stlUrl?: string;
  stlFileName?: string;
  createdAt: number;
}

export interface OrderItem {
  product?: Product;
  customPrint?: {
    fileName: string;
    makerworldLink?: string;
    estimatedWeight: number; // in grams
    pricePerGram: number;
  };
  quantity: number;
  type: 'catalog' | 'custom';
  price: number; // Single item price
}

export type OrderStatus = "Sipariş Alındı" | "Ödeme Bekleniyor" | "Baskıda" | "Hazır" | "Kargolandı" | "İptal Edildi";

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerContact: string; // Email or phone
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: "Bekliyor" | "Onaylandı" | "Reddedildi";
  orderStatus: OrderStatus;
  senderName: string; // Havale/EFT sender name
  createdAt: number;
  notes?: string;
}

export interface BankDetails {
  bankName: string;
  iban: string;
  receiverName: string;
  details: string;
}

export interface UserProfile {
  id: string; // Cleaned key for Firebase (e.g., encoded email or phone)
  emailOrPhone: string;
  role: "admin" | "customer";
  passcodeHash: string; // Hashed password
  createdAt: number;
}

export interface CustomSettings {
  pricePerGram: number;
}
