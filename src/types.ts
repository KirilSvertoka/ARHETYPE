export interface Note {
  name: string;
  name_be?: string;
  value: number;
  icon?: string;
}

export interface Accord {
  name: string;
  name_be?: string;
  color: string;
  value: number; // 0-100 Width representation
}

export function getConcentrationLabel(concentration: string | undefined, language: string): string {
  if (!concentration) return language === 'be' ? 'Парфумаваная вада' : 'Парфюмерная вода';
  
  const c = concentration.toUpperCase();
  if (c === 'PARFUM') return language === 'be' ? 'Парфумы' : 'Духи';
  if (c === 'EDP' || c === 'PERFUME') return language === 'be' ? 'Парфумаваная вада' : 'Парфюмерная вода';
  if (c === 'EDT' || c === 'EAU DE TOILETTE') return language === 'be' ? 'Туалетная вада' : 'Туалетная вода';
  if (c === 'EDC' || c === 'COLOGNE') return language === 'be' ? 'Адэкалон' : 'Одеколон';
  
  return concentration;
}

export interface ProductVariant {
  id?: number;
  productId: number;
  size: string; // e.g., '30ml', '50ml', '100ml', 'Tester'
  price: string | number;
  stock: number;
  sku: string;
  variant_type?: 'decant' | 'splitting' | 'full' | 'tester' | 'remainder';
}

export function getVariantType(variant: ProductVariant, language: string): string {
  const type = variant.variant_type || 'decant';
  
  switch (type) {
    case 'splitting':
      return language === 'be' ? 'Расьпіў' : 'Распив';
    case 'decant':
      return language === 'be' ? 'Адлівант' : 'Отливант';
    case 'tester':
      return language === 'be' ? 'Тэстар' : 'Тестер';
    case 'remainder':
      return language === 'be' ? 'Астатак ва флаконе' : 'Остаток во флаконе';
    case 'full':
    default:
      return language === 'be' ? 'Флакон' : 'Флакон';
  }
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
  price: string | number; // Base price or starting price
  topNotes: Note[];
  heartNotes: Note[];
  baseNotes: Note[];
  accords?: Accord[];
  longevity?: number;
  sillage?: number;
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
  updated_at: string;
  created_at?: string;
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
  viber?: string;
  whatsapp?: string;
  email: string;
  phone: string;
  workingHours: string;
  workingHours_be?: string;
  address: string;
  address_be?: string;
  unp?: string;
  bankDetails?: string;
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
