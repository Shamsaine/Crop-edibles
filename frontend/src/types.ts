export type UserRole = 'buyer' | 'seller' | 'admin';
export interface User { id: string; name: string; email: string; phone: string; role: UserRole; accountType: 'buyer' | 'seller'; hasPassword: boolean; googleLinked: boolean }
export const CATEGORIES = ['Snacks', 'Oils', 'Spices', 'Grains'] as const;
export interface Product {
  id: string; sellerId: string; name: string; description: string; category: typeof CATEGORIES[number];
  featured: boolean; basePriceMinor: number; saleKind: 'promo' | 'flash' | null; salePriceMinor: number | null; saleStartsAt: string | null; saleEndsAt: string | null; onSale: boolean; unitsSold: number;
  origin: string; priceMinor: number; price: number; image: string; unit: string;
  rating: number; reviewsCount: number; tags: string[]; vendorName: string; stock: number; active: boolean; sellerActive: boolean; adminDelisted: boolean; flagged: boolean; moderationReason: string;
}
export interface CartItem { product: Product; quantity: number; selectedSize: string }
export interface Cart { items: CartItem[]; subtotalMinor: number }
export interface Address {
  id: string; label: string; recipientName: string; phone: string; line1: string; line2: string;
  city: string; state: string; postalCode: string; isDefault: boolean;
}
export type OrderStatus = 'Awaiting Payment' | 'Confirmed' | 'Processed' | 'In Transit' | 'Delivered' | 'Cancelled';
export interface OrderItem {
  id: string; productId: string; sellerId: string; productName: string; productImage: string;
  unit: string; quantity: number; unitPriceMinor: number; totalMinor: number; status: OrderStatus; reviewed: boolean;
}
export interface Order {
  id: string; createdAt: string; status: OrderStatus; paymentMethod: 'cod' | 'paystack'; paymentStatus: string;
  subtotalMinor: number; deliveryFeeMinor: number; totalMinor: number; address: Address; items: OrderItem[];
  paymentReference?: string;
}
export interface VendorApplication {
  id: string; businessName: string; legalEntityName: string; registrationNumber: string; category: string;
  location: string; phone?: string; description?: string; status: 'Pending' | 'Approved' | 'Rejected'; adminNotes?: string;
  contactPerson?: { name: string; email: string; phone: string }; createdAt?: string;
}
export interface Review { id: string; rating: number; comment: string; name: string; createdAt: string }
export interface Dispute {
  id: string; orderId: string; orderItemId: string; productName: string; vendorName: string; customerName: string;
  reason: string; status: 'Open' | 'Resolved'; resolution: string | null; createdAt: string;
  messages: { id: string; sender: string; senderName: string; message: string; createdAt: string }[];
}
export interface ShopConfig { googleClientId: string; currency: string; deliveryFeeMinor: number; payments: { cod: boolean; paystack: boolean } }
