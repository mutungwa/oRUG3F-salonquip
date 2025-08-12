import { CartItem, Customer, SaleItem } from '@/types/common';

export class SalesService {
  /**
   * Calculate profit for a single item
   */
  static calculateItemProfit(sellPrice: number, buyPrice: number, quantity: number): number {
    return (sellPrice - buyPrice) * quantity;
  }

  /**
   * Calculate total profit for multiple items
   */
  static calculateTotalProfit(items: CartItem[]): number {
    return items.reduce((sum, item) => 
      sum + this.calculateItemProfit(item.sellPrice, item.price, item.quantity), 0
    );
  }

  /**
   * Calculate total amount for cart items
   */
  static calculateTotalAmount(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  }

  /**
   * Calculate loyalty points earned (5% of profit)
   */
  static calculateLoyaltyPointsEarned(profit: number): number {
    return profit * 0.05;
  }

  /**
   * Calculate referrer points (2% of profit)
   */
  static calculateReferrerPoints(profit: number): number {
    return profit * 0.02;
  }

  /**
   * Process loyalty points for customer and referrer
   */
  static processLoyaltyPoints(
    customer: Customer | null,
    totalProfit: number,
    isNewCustomer: boolean,
    customers: Customer[] = []
  ): {
    loyaltyPointsEarned: number;
    referrerPoints: number;
    referrer: Customer | null;
  } {
    let loyaltyPointsEarned = 0;
    let referrerPoints = 0;
    let referrer = null;

    if (customer && !isNewCustomer) {
      loyaltyPointsEarned = this.calculateLoyaltyPointsEarned(totalProfit);

      // Handle referrer points
      if (customer.referredBy) {
        referrer = customers.find(c => c.id === customer.referredBy) || null;
        if (referrer) {
          referrerPoints = this.calculateReferrerPoints(totalProfit);
        }
      }
    }

    return {
      loyaltyPointsEarned,
      referrerPoints,
      referrer
    };
  }

  /**
   * Validate cart items before sale
   */
  static validateCartItems(items: CartItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push('Cart is empty');
    }

    items.forEach(item => {
      if (item.quantity <= 0) {
        errors.push(`Invalid quantity for ${item.name}`);
      }
      if (item.quantity > item.stock) {
        errors.push(`Not enough stock for ${item.name}`);
      }
      if (item.sellPrice < item.minimumSellPrice) {
        errors.push(`Sell price below minimum for ${item.name}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Prepare sale data for creation
   */
  static prepareSaleData(
    items: CartItem[],
    customer: Customer | null,
    formValues: any,
    user: any,
    loyaltyPointsEarned: number,
    loyaltyPointsRedeemed: number = 0
  ): any {
    const totalAmount = this.calculateTotalAmount(items);
    const totalProfit = this.calculateTotalProfit(items);

    return {
      totalAmount,
      totalProfit,
      branchId: items[0].branchId,
      branchName: items[0].branchName,
      userId: user?.id || '',
      userName: user?.name || '',
      customerId: customer?.id || undefined,
      customerName: customer?.name || undefined,
      customerPhone: customer?.phoneNumber || undefined,
      loyaltyPointsEarned,
      loyaltyPointsRedeemed,
      paymentMethod: formValues.paymentMethod || 'cash',
      paymentReference: formValues.paymentReference,
      // Legacy fields for backward compatibility
      sellPrice: totalAmount,
      quantitySold: items.reduce((sum, item) => sum + item.quantity, 0),
      itemId: items[0].id,
      itemName: items.length > 1 ? `${items[0].name} +${items.length - 1} more` : items[0].name,
      itemCategory: items.length > 1 ? "Various" : items[0].category,
      itemPrice: items[0].price,
      profit: totalProfit
    };
  }

  /**
   * Convert cart items to sale items
   */
  static convertCartToSaleItems(items: CartItem[]): SaleItem[] {
    return items.map(item => ({
      id: item.id,
      itemName: item.name,
      itemCategory: item.category,
      sellPrice: item.sellPrice,
      quantitySold: item.quantity,
      profit: this.calculateItemProfit(item.sellPrice, item.price, item.quantity)
    }));
  }
}
