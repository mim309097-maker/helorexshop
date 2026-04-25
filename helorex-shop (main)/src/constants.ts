import { Product, Category } from './types';

export const ADMIN_EMAILS = [
  'mim309097@gmail.com',
  'md.helalahmed5010@gmail.com',
  'md.helalahamed1512@gmail.com'
];

export const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.some(e => e.toLowerCase() === email.toLowerCase());
};

export const CATEGORIES: Category[] = [
  { id: 'electronics', name: 'Electronics', image: 'https://picsum.photos/seed/elec/400/400' },
  { id: 'wearables', name: 'Wearables', image: 'https://picsum.photos/seed/wear/400/400' },
  { id: 'accessories', name: 'Accessories', image: 'https://picsum.photos/seed/acc/400/400' },
  { id: 'smart-home', name: 'Smart Home', image: 'https://picsum.photos/seed/home/400/400' },
  { id: 'audio', name: 'Audio', image: 'https://picsum.photos/seed/audio/400/400' }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'HELOREX Pro Buds',
    price: 3490,
    description: 'High-fidelity audio with active noise cancellation. Experience sound like never before with crystal clear high and deep bass.',
    category: 'audio',
    image: 'https://picsum.photos/seed/buds/800/800',
    rating: 4.8,
    reviews: 124,
    featured: true,
    isHotOffer: true,
    hotOfferDiscount: 40
  },
  {
    id: '2',
    name: 'Smart Lite Watch',
    price: 4990,
    description: 'Track your health and stay connected. Features heart rate monitoring, sleep tracking, and 7-day battery life.',
    category: 'wearables',
    image: 'https://picsum.photos/seed/watch/800/800',
    rating: 4.6,
    reviews: 89,
    featured: true,
    isHotOffer: true,
    hotOfferDiscount: 25
  },
  {
    id: '3',
    name: 'Power Cube 20W',
    price: 1290,
    description: 'Fast charging for all your devices. Compact design with multiple safety protections.',
    category: 'accessories',
    image: 'https://picsum.photos/seed/charger/800/800',
    rating: 4.9,
    reviews: 210,
    featured: true
  },
  {
    id: '4',
    name: 'Smart Home Hub',
    price: 7990,
    description: 'Control your entire home from one place. Compatible with over 1000+ smart devices.',
    category: 'smart-home',
    image: 'https://picsum.photos/seed/hub/800/800',
    rating: 4.7,
    reviews: 56,
    featured: true
  },
  {
    id: '5',
    name: 'Sonic Boom Speaker',
    price: 5490,
    description: 'Portable waterproof speaker with 360-degree sound. Perfect for outdoor adventures.',
    category: 'audio',
    image: 'https://picsum.photos/seed/speaker/800/800',
    rating: 4.5,
    reviews: 78
  },
  {
    id: '6',
    name: 'Precision Stylus',
    price: 2490,
    description: 'Write and draw with pixel-perfect precision. Compatible with all major tablets.',
    category: 'accessories',
    image: 'https://picsum.photos/seed/stylus/800/800',
    rating: 4.3,
    reviews: 45
  },
  {
    id: '7',
    name: 'Vision VR Headset',
    price: 15990,
    description: 'Immerse yourself in virtual worlds. Ergonomic design for long gaming sessions.',
    category: 'electronics',
    image: 'https://picsum.photos/seed/vr/800/800',
    rating: 4.8,
    reviews: 32
  },
  {
    id: '8',
    name: 'Eco Charge Pad',
    price: 1890,
    description: 'Wireless charging made sustainable. Made from recycled oceanic plastics.',
    category: 'accessories',
    image: 'https://picsum.photos/seed/wireless/800/800',
    rating: 4.4,
    reviews: 67
  }
];
