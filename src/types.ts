export interface Note {
  name: string;
  name_be?: string;
  value: number;
}

export interface ProductVariant {
  id?: number;
  productId: number;
  size: string; // e.g., '30ml', '50ml', '100ml', 'Tester'
  price: number;
  stock: number;
  sku: string;
}

export function getVariantType(size: string, language: string): string {
  const lowerSize = size.toLowerCase();
  if (lowerSize.includes('тестер') || lowerSize.includes('tester')) {
    return language === 'be' ? 'Тэстар' : 'Тестер';
  }
  if (lowerSize.includes('отливант') || lowerSize.includes('decant')) {
    return language === 'be' ? 'Адлівант' : 'Отливант';
  }
  
  // Extract ml
  const mlMatch = lowerSize.match(/(\d+)\s*(ml|мл)/);
  if (mlMatch) {
    const ml = parseInt(mlMatch[1], 10);
    if (ml <= 20) {
      return language === 'be' ? 'Адлівант' : 'Отливант';
    } else {
      return language === 'be' ? 'Флакон' : 'Флакон';
    }
  }
  
  return language === 'be' ? 'Флакон' : 'Флакон';
}

export interface Product {
  id: number;
  name: string;
  brand: string;
  description: string;
  description_be?: string;
  imageUrl: string;
  images?: string[];
  slug: string;
  price: number; // Base price or starting price
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  gender: 'Male' | 'Female' | 'Unisex';
  scentFamilies: string[];
  scentFamilies_be?: string[];
  concentration: 'EDP' | 'EDT' | 'Parfum' | 'Cologne';
  stockThreshold: number;
  tags: string[];
  tags_be?: string[];
  season?: string[];
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariant[];
  popularity?: number;
  longevity?: number; // 0-100
  sillage?: number; // 0-100
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  region?: string;
  createdAt: string;
  ltv: number;
  orderCount: number;
  avgOrderValue: number;
  segment?: string;
  loyaltyStatus?: string;
  notes?: string;
}

export interface Order {
  id: number;
  userId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerRegion: string;
  total: number;
  status: 'New' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  trackingNumber?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number;
  productName: string;
  variantSize?: string;
  quantity: number;
  price: number;
}

export interface Review {
  id: number;
  productId: number;
  userName: string;
  rating: number;
  comment: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  adminReply?: string;
  createdAt: string;
}

export interface PromoCode {
  id: number;
  code: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit: number;
  usedCount: number;
  status: 'Active' | 'Inactive';
  applicableBrands: string[];
  excludedBrands: string[];
}

export interface CMSPage {
  id: string;
  title: string;
  title_be?: string;
  content: string;
  content_be?: string;
  updatedAt: string;
}

export interface HomeConfig {
  announcement: { text: string; text_be?: string; active: boolean };
  hero: { 
    slides: { image: string; title: string; title_be?: string; subtitle: string; subtitle_be?: string; link?: string; timerEnd?: string }[] 
  };
  featuredProductsTitle: string;
  featuredProductsTitle_be?: string;
  featuredProductIds: number[];
  promoImages: string[];
  dynamicBlocks: { type: 'New' | 'BestSellers' | 'Recommended'; title: string; title_be?: string; active: boolean }[];
}

export interface GeneralSettings {
  aboutPhoto: string;
  instagram: string;
  telegram: string;
  email: string;
  phone: string;
  address: string;
  address_be?: string;
  aboutTitle: string;
  aboutTitle_be?: string;
  aboutDescription: string;
  aboutDescription_be?: string;
  aboutArtTitle: string;
  aboutArtTitle_be?: string;
  aboutArtText1: string;
  aboutArtText1_be?: string;
  aboutArtText2: string;
  aboutArtText2_be?: string;
  stat1Value: string;
  stat1Label: string;
  stat1Label_be?: string;
  stat2Value: string;
  stat2Label: string;
  stat2Label_be?: string;
  stat3Value: string;
  stat3Label: string;
  stat3Label_be?: string;
}
