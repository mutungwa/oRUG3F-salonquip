// Centralized type definitions
export interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  sellPrice: number;
  quantity: number;
  branchId: string;
  branchName: string;
  minimumSellPrice: number;
  stock: number;
}

export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  loyaltyPoints: number;
  referredBy?: string;
}

export interface SaleItem {
  id: string;
  itemName: string;
  itemCategory: string;
  sellPrice: number;
  quantitySold: number;
  profit: number;
}

export interface Sale {
  id: string;
  saleDate: string;
  branchName: string;
  userName: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  totalProfit: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  paymentMethod: string;
  paymentReference?: string;
  saleItems: SaleItem[];
}

export interface ItemWithBranch {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  sku: string;
  quantity: number;
  origin: string;
  imageUrl: string | null;
  branchId: string;
  deleted: boolean;
  minimumStockLevel: number;
  minimumSellPrice: number;
  dateCreated: Date;
  dateUpdated: Date;
  branch: {
    id: string;
    name: string;
    location: string;
    phoneNumber: string;
    dateCreated: Date;
    dateUpdated: Date;
  };
}

export interface ReportData {
  name: string;
  sku: string;
  category: string;
  currentQuantity: number;
  buyingPrice: number;
  minimumSellPrice: number;
  currentStockValue: number;
  totalQuantitySold: number;
  totalSales: number;
  totalProfit: number;
  profitMargin: string;
  branch: string;
  minimumStockLevel: number;
  stockStatus: string;
  isSummary?: boolean;
  totalItems?: number;
  totalStockValue?: number;
  outOfStock?: number;
  lowStock?: number;
  averageProfitMargin?: number;
  totalSalesProfit?: number;
}
