import { useUserContext } from '@/core/context';
import { Api } from '@/core/trpc';
import { SalesService } from '@/services/salesService';
import { CartItem, Customer } from '@/types/common';
import { batchLogChanges } from '@/utils/inventoryLogger';
import { Form } from 'antd';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

export const useSalesForm = () => {
  const [form] = Form.useForm();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUserContext();
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  const { mutateAsync: createSale } = Api.sale.create.useMutation();
  const { mutateAsync: createSaleItem } = Api.saleItem.create.useMutation();
  const { mutateAsync: updateItem } = Api.item.update.useMutation();
  const { mutateAsync: createCustomer } = Api.customer.create.useMutation();
  const { mutateAsync: updateCustomer } = Api.customer.update.useMutation();
  const { mutateAsync: createInventoryLog } = Api.inventoryLog.create.useMutation();

  const handleCustomerPhoneChange = (phone: string, customers: Customer[] = []) => {
    if (!phone) {
      setCurrentCustomer(null);
      setIsNewCustomer(false);
      return;
    }

    const existingCustomer = customers.find(c => c.phoneNumber === phone);
    if (existingCustomer) {
      setCurrentCustomer(existingCustomer);
      setIsNewCustomer(false);
      form.setFieldsValue({
        customerName: existingCustomer.name,
        customerPhone: existingCustomer.phoneNumber
      });
    } else {
      setCurrentCustomer(null);
      setIsNewCustomer(true);
      form.setFieldsValue({
        customerName: '',
        customerPhone: phone
      });
    }
  };

  const processSale = async (
    cartItems: CartItem[],
    formValues: any,
    customers: Customer[] = [],
    fetchedItems: any[] = [],
    refetch: () => void
  ) => {
    try {
      // Validate cart
      const validation = SalesService.validateCartItems(cartItems);
      if (!validation.isValid) {
        validation.errors.forEach(error => 
          enqueueSnackbar(error, { variant: 'error' })
        );
        return null;
      }

      // Handle customer creation/update
      let saleCustomer = currentCustomer;
      if (isNewCustomer && formValues.customerName && formValues.customerPhone) {
        try {
          saleCustomer = await createCustomer({
            data: {
              name: formValues.customerName,
              phoneNumber: formValues.customerPhone,
              loyaltyPoints: 0,
              referredBy: formValues.referredBy || undefined
            }
          });
        } catch (error) {
          // Handle duplicate phone number case
          const existingCustomer = customers.find(c => c.phoneNumber === formValues.customerPhone);
          if (existingCustomer) {
            saleCustomer = existingCustomer;
            enqueueSnackbar('Using existing customer with this phone number', { variant: 'info' });
          }
        }
      }

      // Calculate totals and loyalty points
      const totalProfit = SalesService.calculateTotalProfit(cartItems);
      const loyaltyPointsData = SalesService.processLoyaltyPoints(
        saleCustomer,
        totalProfit,
        isNewCustomer,
        customers
      );

      // Handle loyalty points redemption
      const pointsToRedeem = Math.min(
        formValues.redeemPoints || 0,
        saleCustomer?.loyaltyPoints || 0,
        SalesService.calculateTotalAmount(cartItems)
      );

      // Prepare sale data
      const saleData = SalesService.prepareSaleData(
        cartItems,
        saleCustomer,
        formValues,
        user,
        loyaltyPointsData.loyaltyPointsEarned,
        pointsToRedeem
      );

      // Create sale
      const sale = await createSale({ data: saleData });

      // Create sale items
      const saleItems = SalesService.convertCartToSaleItems(cartItems);
      for (const saleItem of saleItems) {
        await createSaleItem({
          data: {
            saleId: sale.id,
            itemId: saleItem.id,
            itemName: saleItem.itemName,
            itemCategory: saleItem.itemCategory,
            itemPrice: cartItems.find(item => item.id === saleItem.id)?.price || 0,
            sellPrice: saleItem.sellPrice,
            quantitySold: saleItem.quantitySold,
            profit: saleItem.profit
          }
        });
      }

      // Update inventory and log changes
      const inventoryChanges = [];
      for (const item of cartItems) {
        const fetchedItem = fetchedItems.find(i => i.id === item.id);
        if (fetchedItem) {
          const newQuantity = fetchedItem.quantity - item.quantity;
          
          // Update item stock
          await updateItem({
            where: { id: item.id },
            data: { quantity: newQuantity }
          });

          // Prepare log entry
          inventoryChanges.push({
            action: 'sale' as const,
            itemId: item.id,
            itemName: item.name,
            userId: user?.id,
            userName: user?.name || 'Unknown',
            details: {
              type: 'sale',
              quantityChange: {
                from: fetchedItem.quantity,
                to: newQuantity
              },
              quantitySold: item.quantity,
              sellPrice: item.sellPrice,
              saleId: sale.id,
              significant: true
            }
          });
        }
      }

      // Batch log inventory changes
      await batchLogChanges(inventoryChanges, createInventoryLog);

      // Update customer loyalty points
      if (saleCustomer) {
        const newLoyaltyPoints = Math.max(
          0,
          saleCustomer.loyaltyPoints + loyaltyPointsData.loyaltyPointsEarned - pointsToRedeem
        );

        await updateCustomer({
          where: { id: saleCustomer.id },
          data: { loyaltyPoints: newLoyaltyPoints }
        });

        // Update referrer points if applicable
        if (loyaltyPointsData.referrer) {
          await updateCustomer({
            where: { id: loyaltyPointsData.referrer.id },
            data: {
              loyaltyPoints: loyaltyPointsData.referrer.loyaltyPoints + loyaltyPointsData.referrerPoints
            }
          });
        }
      }

      enqueueSnackbar('Sale completed successfully', { variant: 'success' });
      refetch();

      // Return sale with items for receipt
      return {
        ...sale,
        saleItems: saleItems.map(item => ({
          ...item,
          id: item.id,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          sellPrice: item.sellPrice,
          quantitySold: item.quantitySold
        }))
      };

    } catch (error) {
      console.error('Error processing sale:', error);
      enqueueSnackbar('Failed to complete sale', { variant: 'error' });
      throw error;
    }
  };

  const resetForm = () => {
    form.resetFields();
    setCurrentCustomer(null);
    setIsNewCustomer(false);
  };

  return {
    form,
    isNewCustomer,
    currentCustomer,
    handleCustomerPhoneChange,
    processSale,
    resetForm
  };
};
