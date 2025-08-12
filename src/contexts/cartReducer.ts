import { CartItem } from '@/types/common';

export type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'UPDATE_SELL_PRICE'; payload: { id: string; sellPrice: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CART'; payload: CartItem[] };

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  totalProfit: number;
}

export const initialCartState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  totalProfit: 0,
};

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(item => item.id === action.payload.id);
      
      let newItems: CartItem[];
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        const existingItem = state.items[existingItemIndex];
        const newQuantity = Math.min(existingItem.quantity + 1, existingItem.stock);
        
        newItems = state.items.map((item, index) =>
          index === existingItemIndex 
            ? { ...item, quantity: newQuantity }
            : item
        );
      } else {
        // Add new item
        newItems = [...state.items, action.payload];
      }
      
      return calculateCartTotals({ ...state, items: newItems });
    }

    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload);
      return calculateCartTotals({ ...state, items: newItems });
    }

    case 'UPDATE_QUANTITY': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: Math.max(1, Math.min(action.payload.quantity, item.stock)) }
          : item
      );
      return calculateCartTotals({ ...state, items: newItems });
    }

    case 'UPDATE_SELL_PRICE': {
      const newItems = state.items.map(item =>
        item.id === action.payload.id
          ? { 
              ...item, 
              sellPrice: Math.max(action.payload.sellPrice, item.minimumSellPrice) 
            }
          : item
      );
      return calculateCartTotals({ ...state, items: newItems });
    }

    case 'CLEAR_CART': {
      return initialCartState;
    }

    case 'SET_CART': {
      return calculateCartTotals({ ...state, items: action.payload });
    }

    default:
      return state;
  }
}

function calculateCartTotals(state: CartState): CartState {
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = state.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const totalProfit = state.items.reduce((sum, item) => 
    sum + ((item.sellPrice - item.price) * item.quantity), 0
  );

  return {
    ...state,
    totalItems,
    totalAmount,
    totalProfit,
  };
}
