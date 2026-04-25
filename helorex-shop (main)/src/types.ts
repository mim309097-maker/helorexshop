export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  subCategory?: string;
  subCategory2?: string;
  image: string;
  rating: number;
  reviews: number;
  featured?: boolean;
  reviewList?: Review[];
  sizes?: string[];
  colors?: string[];
  discount?: number;
  stock?: number;
  shortDescription?: string;
  images?: string[]; // Multiple images for gallery
  originalPrice?: number;
  isHotOffer?: boolean;
  hotOfferDiscount?: number;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  ram?: string;
  storage?: string;
  price: number;
  stock?: number;
}

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedVariant?: ProductVariant;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description?: string;
  parentId?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  totalAmount: number;
  deliveryArea: string;
  deliveryCharge: number;
  paymentMethod: string;
  accountNumber?: string;
  transactionId?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: any;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: any;
}
