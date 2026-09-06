export type UserRole = 'buyer' | 'seller' | 'admin';

export interface Product {
  id: string;
  name: string;
  category: 'Snacks' | 'Oils' | 'Spices' | 'Grains';
  categoryLabel: string;
  origin: string;
  price: number;
  priceFormatted: string;
  originalPrice?: number;
  originalPriceFormatted?: string;
  rating: number;
  reviewsCount?: number;
  image: string;
  badge?: 'Bestseller' | 'Best Seller' | 'Limited Stock' | 'Curated Selection' | 'Organic' | 'Honey-Glazed' | 'Spicy';
  tags: string[];
  vendorName: string;
  vendorOrders?: number;
  vendorRating?: string;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface Order {
  id: string;
  productName: string;
  productImage: string;
  status: 'Confirmed' | 'Processed' | 'In Transit' | 'Delivered';
  priceFormatted: string;
  date: string;
  location?: string;
  arrivalEstimate?: string;
  reviewQuote?: string;
}

export interface VendorApplication {
  id: string;
  businessName: string;
  legalEntityName: string;
  registrationNumber: string;
  category: string;
  location: string;
  logo: string;
  submittedDaysAgo: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  contactPerson: {
    name: string;
    role: string;
    email: string;
    phone: string;
    avatar: string;
  };
  documents: {
    name: string;
    type: string;
    size?: string;
  }[];
  sampleInventory: {
    name: string;
    volume: string;
    price: string;
    shelfLife: string;
  }[];
}

export interface DisputeMessage {
  id: string;
  sender: 'customer' | 'vendor' | 'system';
  senderName: string;
  senderInitials?: string;
  message: string;
  time: string;
  images?: string[];
}

export interface Dispute {
  id: string;
  productName: string;
  productImage: string;
  orderId: string;
  vendorName: string;
  customerName: string;
  status: 'Damaged' | 'Not Delivered' | 'Wrong Item' | 'Resolved';
  timeAgo: string;
  urgency: 'Urgent Action Required' | 'Pending Mediation' | 'Resolved';
  messages: DisputeMessage[];
}
