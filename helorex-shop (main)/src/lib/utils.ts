import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace('BDT', '৳');
}

export function getDiscountedPrice(product: { price: number, discount?: number, isHotOffer?: boolean, hotOfferDiscount?: number }, isHotOfferExpired: boolean = false) {
  const discount = (product.isHotOffer && !isHotOfferExpired) ? (product.hotOfferDiscount || 0) : (product.discount || 0);
  if (discount > 0) {
    return product.price * (1 - discount / 100);
  }
  return product.price;
}

export function getEffectiveDiscount(product: { discount?: number, isHotOffer?: boolean, hotOfferDiscount?: number }, isHotOfferExpired: boolean = false) {
  return (product.isHotOffer && !isHotOfferExpired) ? (product.hotOfferDiscount || 0) : (product.discount || 0);
}
