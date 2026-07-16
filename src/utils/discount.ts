import { OrderItem } from '../types';

/**
 * Returns the multi-color custom print discount percentage based on quantity:
 * 2 items: 10%
 * 3 items: 15%
 * 4 items: 20%
 * 5 items: 25%
 * 6 items: 30%
 * 7 items: 35%
 * 8+ items: 40%
 */
export function getMultiColorDiscountPercentage(quantity: number): number {
  if (quantity >= 8) return 40;
  if (quantity === 7) return 35;
  if (quantity === 6) return 30;
  if (quantity === 5) return 25;
  if (quantity === 4) return 20;
  if (quantity === 3) return 15;
  if (quantity === 2) return 10;
  return 0;
}

/**
 * Calculates the total subtotal of a given OrderItem, taking into account
 * any multi-color custom print quantity discount.
 */
export function calculateItemSubtotal(item: OrderItem): number {
  const basePrice = item.price * item.quantity;
  if (item.type === 'custom' && item.customPrint?.printType === 'multi') {
    const discountPct = getMultiColorDiscountPercentage(item.quantity);
    if (discountPct > 0) {
      return basePrice * (1 - discountPct / 100);
    }
  }
  return basePrice;
}
