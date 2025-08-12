import { useUserContext } from '@/core/context';
import { Api } from '@/core/trpc';
import { logItemChange } from '@/utils/inventoryLogger';
import { Form } from 'antd';
import { useSnackbar } from 'notistack';

export const useItemForm = () => {
  const [form] = Form.useForm();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useUserContext();
  const { mutateAsync: createItem } = Api.item.create.useMutation();
  const { mutateAsync: updateItem } = Api.item.update.useMutation();
  const { mutateAsync: deleteItem } = Api.item.delete.useMutation();
  const { mutateAsync: createInventoryLog } = Api.inventoryLog.create.useMutation();

  const handleCreateItem = async (values: any, refetch: () => void) => {
    try {
      const itemData = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        sku: values.sku,
        quantity: values.quantity,
        origin: values.origin,
        branchId: values.branch,
        minimumStockLevel: values.minimumStockLevel || 10,
        minimumSellPrice: values.minimumSellPrice || 0,
      };

      const newItem = await createItem({ data: itemData });

      // Log creation
      await logItemChange({
        action: 'create',
        itemId: newItem.id,
        itemName: newItem.name,
        userId: user?.id,
        userName: user?.name || 'Unknown',
        details: { ...itemData, significant: true }
      }, createInventoryLog);

      enqueueSnackbar('Item added successfully', { variant: 'success' });
      refetch();
      form.resetFields();
      return newItem;
    } catch (error) {
      enqueueSnackbar('Failed to add item', { variant: 'error' });
      throw error;
    }
  };

  const handleUpdateItem = async (
    itemId: string, 
    values: any, 
    originalItem: any, 
    refetch: () => void,
    branches: any[]
  ) => {
    try {
      const updatedData = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        sku: values.sku,
        quantity: values.quantity,
        origin: values.origin,
        branchId: values.branch,
        minimumStockLevel: values.minimumStockLevel,
        minimumSellPrice: values.minimumSellPrice,
      };

      const updatedItem = await updateItem({
        where: { id: itemId },
        data: updatedData,
      });

      // Identify changes
      const changes: Record<string, { from: any, to: any }> = {};
      let hasSignificantChanges = false;

      Object.keys(updatedData).forEach(key => {
        if (originalItem[key] !== updatedData[key]) {
          changes[key] = {
            from: originalItem[key],
            to: updatedData[key]
          };
          // Consider price, quantity, and branch changes as significant
          if (['price', 'quantity', 'branchId'].includes(key)) {
            hasSignificantChanges = true;
          }
        }
      });

      // Only log if there are significant changes
      if (hasSignificantChanges) {
        await logItemChange({
          action: 'update',
          itemId,
          itemName: values.name,
          userId: user?.id,
          userName: user?.name || 'Unknown',
          details: {
            changes,
            branchName: branches?.find(b => b.id === values.branch)?.name || 'Unknown',
            significant: true
          }
        }, createInventoryLog);
      }

      enqueueSnackbar('Item updated successfully', { variant: 'success' });
      refetch();
      form.resetFields();
      return updatedItem;
    } catch (error) {
      enqueueSnackbar('Failed to update item', { variant: 'error' });
      throw error;
    }
  };

  const handleDeleteItem = async (itemId: string, itemToDelete: any, refetch: () => void) => {
    try {
      await deleteItem({ where: { id: itemId } });

      // Log deletion
      await logItemChange({
        action: 'delete',
        itemId: itemToDelete.id,
        itemName: itemToDelete.name,
        userId: user?.id,
        userName: user?.name || 'Unknown',
        details: {
          name: itemToDelete.name,
          category: itemToDelete.category,
          price: itemToDelete.price,
          quantity: itemToDelete.quantity,
          branchId: itemToDelete.branchId,
          branchName: itemToDelete.branch?.name || 'Unknown',
          significant: true
        }
      }, createInventoryLog);

      enqueueSnackbar('Item deleted successfully', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to delete item', { variant: 'error' });
      throw error;
    }
  };

  return {
    form,
    handleCreateItem,
    handleUpdateItem,
    handleDeleteItem
  };
};
