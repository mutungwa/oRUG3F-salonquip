import { CartItem, ItemWithBranch } from '@/types/common';
import { notification } from 'antd';
import React, { createContext, ReactNode, useContext, useReducer } from 'react';
import { CartAction, cartReducer, CartState, initialCartState } from './cartReducer';

interface CartContextType {
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
  addItem: (item: ItemWithBranch) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateSellPrice: (itemId: string, sellPrice: number) => void;
  clearCart: () => void;
  isItemInCart: (itemId: string) => boolean;
  getCartItem: (itemId: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  const addItem = (item: ItemWithBranch) => {
    const existingItem = state.items.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity < item.quantity) {
        dispatch({
          type: 'UPDATE_QUANTITY',
          payload: { id: item.id, quantity: existingItem.quantity + 1 }
        });
        notification.success({
          message: 'Item quantity updated',
          description: `${item.name} quantity increased to ${existingItem.quantity + 1}`,
          placement: 'bottomRight'
        });
      } else {
        notification.warning({
          message: 'Maximum stock reached',
          description: `Cannot add more of ${item.name}. Maximum stock reached.`,
          placement: 'bottomRight'
        });
      }
    } else {
      const newCartItem: CartItem = {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        sellPrice: Math.max(item.price, item.minimumSellPrice),
        quantity: 1,
        branchId: item.branchId,
        branchName: item.branch.name,
        minimumSellPrice: item.minimumSellPrice,
        stock: item.quantity
      };

      dispatch({ type: 'ADD_ITEM', payload: newCartItem });
      notification.success({
        message: 'Item added to cart',
        description: `${item.name} added to cart`,
        placement: 'bottomRight'
      });
    }
  };

  const removeItem = (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    notification.info({
      message: 'Item removed',
      description: 'Item removed from cart',
      placement: 'bottomRight'
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
  };

  const updateSellPrice = (itemId: string, sellPrice: number) => {
    const item = state.items.find(item => item.id === itemId);
    if (item && sellPrice < item.minimumSellPrice) {
      notification.warning({
        message: 'Minimum Sell Price',
        description: `The minimum sell price for ${item.name} is KES ${item.minimumSellPrice}`,
        placement: 'bottomRight'
      });
      dispatch({ 
        type: 'UPDATE_SELL_PRICE', 
        payload: { id: itemId, sellPrice: item.minimumSellPrice } 
      });
    } else {
      dispatch({ type: 'UPDATE_SELL_PRICE', payload: { id: itemId, sellPrice } });
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    notification.info({
      message: 'Cart cleared',
      description: 'All items removed from cart',
      placement: 'bottomRight'
    });
  };

  const isItemInCart = (itemId: string): boolean => {
    return state.items.some(item => item.id === itemId);
  };

  const getCartItem = (itemId: string): CartItem | undefined => {
    return state.items.find(item => item.id === itemId);
  };

  return (
    <CartContext.Provider value={{
      state,
      dispatch,
      addItem,
      removeItem,
      updateQuantity,
      updateSellPrice,
      clearCart,
      isItemInCart,
      getCartItem
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
