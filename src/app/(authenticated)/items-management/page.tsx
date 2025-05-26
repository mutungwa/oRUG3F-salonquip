'use client';

// Import the ShoppingCart component
// We'll need to create a simple version of this component since it doesn't exist yet
interface CartItem {
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

// Simple ShoppingCart component
const ShoppingCart = ({
  cartItems,
  onUpdateQuantity,
  onUpdateSellPrice,
  onRemoveItem,
  onClearCart
}: {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateSellPrice: (itemId: string, sellPrice: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}) => {
  return (
    <Button type="primary" shape="circle" icon={<ShoppingCartOutlined />} />
  );
};
// Import the proper MultiItemCheckout component
import MultiItemCheckout from '@/components/MultiItemCheckout';
import { useUserContext } from '@/core/context';
import { useUploadPublic } from '@/core/hooks/upload';
import { Api } from '@/core/trpc';
import { PageLayout } from '@/designSystem/layouts/Page.layout';
import { logItemChange } from '@/utils/inventoryLogger';
import {
  DeleteOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  notification,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

// Import the proper MultiItemPDFReceipt component
import { MultiItemReceipt as MultiItemPDFReceipt } from '@/components/MultiItemReceipt';
import { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

// Define the Item type with branch
type ItemWithBranch = {
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
};

interface ReceiptProps {
  sale: any;
  customer: any;
  item: any;
}

// Dynamically import the PDF components with no SSR
const PDFReceipt = dynamic(() => import('@react-pdf/renderer').then(mod => {
  const { Document, Page, Text, View, StyleSheet } = mod;

  const styles = StyleSheet.create({
    page: {
      padding: 20,
      fontSize: 10,
      width: '80mm',
    },
    header: {
      marginBottom: 10,
      textAlign: 'center',
    },
    title: {
      fontSize: 14,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 12,
      marginBottom: 5,
    },
    divider: {
      borderBottom: 1,
      marginVertical: 5,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 2,
    },
    footer: {
      marginTop: 20,
      textAlign: 'center',
    },
    text: {
      fontSize: 10,
    },
    bold: {
      fontWeight: 'bold',
    },
  });

  const PDFReceiptComponent = ({ sale, customer, item }: ReceiptProps) => {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.title}>SALON QUIP</Text>
            <Text style={styles.subtitle}>Sales Receipt</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.text}>Date:</Text>
            <Text style={styles.text}>{dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm')}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.text}>Receipt #:</Text>
            <Text style={styles.text}>{sale.id}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.text}>Customer:</Text>
            <Text style={styles.text}>{customer?.name || 'Walk-in Customer'}</Text>
          </View>

          {customer?.phoneNumber && (
            <View style={styles.row}>
              <Text style={styles.text}>Phone:</Text>
              <Text style={styles.text}>{customer.phoneNumber}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.text}>Item:</Text>
            <Text style={styles.text}>{item.name}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.text}>Quantity:</Text>
            <Text style={styles.text}>{sale.quantitySold}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.text}>Unit Price:</Text>
            <Text style={styles.text}>KES {sale.sellPrice.toLocaleString()}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.bold}>Total Amount:</Text>
            <Text style={styles.bold}>KES {(sale.sellPrice * sale.quantitySold).toLocaleString()}</Text>
          </View>

          {customer && (
            <>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.text}>Points Earned:</Text>
                <Text style={styles.text}>KES {sale.loyaltyPointsEarned.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.text}>Points Redeemed:</Text>
                <Text style={styles.text}>KES {sale.loyaltyPointsRedeemed.toFixed(2)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.bold}>Remaining Points:</Text>
                <Text style={styles.bold}>KES {(customer.loyaltyPoints).toFixed(2)}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.footer}>
            <Text style={styles.text}>Thank you for your business!</Text>
          </View>
        </Page>
      </Document>
    );
  };

  return PDFReceiptComponent;
}), {
  ssr: false,
});

export default function ItemsManagementPage() {
  // We're not using router and params, but keeping them for future use
  const _router = useRouter();
  const _params = useParams<any>();
  const { user, checkRole } = useUserContext();
  const isAdmin = checkRole('admin');
  const { enqueueSnackbar } = useSnackbar();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [sellForm] = Form.useForm();
  const [items, setItems] = useState<ItemWithBranch[] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSellModalVisible, setIsSellModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<ItemWithBranch | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [salesReportData, setSalesReportData] = useState<any[]>([]);
  const [reportBranch, setReportBranch] = useState<string | null>(null);
  const [reportDateRange, setReportDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [reportActiveTab, setReportActiveTab] = useState<string>('items');
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const receiptRef = useRef<any>();
  // We'll use this in the future for print functionality
  const [_shouldPrintReceipt, _setShouldPrintReceipt] = useState(true);

  // Multi-item sales state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isMultiItemCheckoutVisible, setIsMultiItemCheckoutVisible] = useState(false);
  const [isMultiItemReceiptVisible, setIsMultiItemReceiptVisible] = useState(false);
  const [multiItemSale, setMultiItemSale] = useState<any>(null);
  const multiItemReceiptRef = useRef<any>();

  // We'll use the sales data from the API query below

  const { data: branches } = Api.branch.findMany.useQuery({});
  const { data: fetchedItems, refetch } = Api.item.findMany.useQuery({ include: { branch: true } });
  const { mutateAsync: createItem } = Api.item.create.useMutation();
  const { mutateAsync: updateItem } = Api.item.update.useMutation();
  const { mutateAsync: deleteItem } = Api.item.delete.useMutation();
  const { mutateAsync: createSale } = Api.sale.create.useMutation();
  const { mutateAsync: createInventoryLog } = Api.inventoryLog.create.useMutation();
  const { mutateAsync: upload } = useUploadPublic();
  const { data: customers } = Api.customer.findMany.useQuery({});
  const { mutateAsync: createCustomer } = Api.customer.create.useMutation();
  const { mutateAsync: updateCustomer } = Api.customer.update.useMutation();
  const { data: sales } = Api.sale.findMany.useQuery({
    orderBy: { saleDate: 'desc' },
    take: 200 // Increased limit to show more individual sales
    // Note: saleItems relation will be available after migration
  });

  useEffect(() => {
    setItems(fetchedItems);
  }, [fetchedItems]);

  const handleAddItem = async (values: any) => {
    if (!isAdmin) {
      enqueueSnackbar('You do not have permission to add items', { variant: 'error' });
      return;
    }
    try {
      // First check if an item with same name exists in the same branch
      const existingItem = items?.find(
        item =>
          item.name.toLowerCase() === values.name.toLowerCase() &&
          item.branchId === values.branch
      );

      if (existingItem) {
        enqueueSnackbar('An item with this name already exists in this branch', {
          variant: 'error'
        });
        return; // Stop the function here if item exists
      }

      // If no existing item found, proceed with creating new item
      const imageUrl = values.image ? await upload({ file: values.image.file }) : null;
      const itemData = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        sku: values.sku,
        quantity: values.quantity,
        origin: values.origin,
        imageUrl: imageUrl?.url || '',
        branchId: values.branch,
        minimumStockLevel: values.minimumStockLevel,
        minimumSellPrice: values.minimumSellPrice || 0,
      };

      const newItem = await createItem({
        data: itemData,
      });

      try {
        // Log the item creation
        const logResult = await logItemChange({
          action: 'create',
          itemId: newItem.id,
          itemName: newItem.name,
          userId: user?.id,
          userName: user?.name || 'Unknown',
          details: itemData
        }, createInventoryLog);

        if (!logResult) {
          console.warn('Item was created but logging failed');
        }
      } catch (logError) {
        console.error('Error logging item creation:', logError);
        // Continue with the process even if logging fails
      }

      enqueueSnackbar('Item added successfully', { variant: 'success' });
      refetch();
      form.resetFields();
      setIsModalVisible(false);
    } catch (error) {
      enqueueSnackbar('Failed to add item', { variant: 'error' });
    }
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && receiptRef.current) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Sales Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .receipt { width: 80mm; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 10px; }
              .title { font-size: 14px; margin-bottom: 5px; }
              .subtitle { font-size: 12px; margin-bottom: 5px; }
              .divider { border-bottom: 1px solid #000; margin: 5px 0; }
              .row { display: flex; justify-content: space-between; margin: 2px 0; }
              .footer { text-align: center; margin-top: 20px; }
              .text { font-size: 10px; }
              .bold { font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="title">SALON QUIP</div>
                <div class="subtitle">Sales Receipt</div>
              </div>

              <div class="divider"></div>

              <div class="row">
                <span class="text">Date:</span>
                <span class="text">${dayjs(currentSale.saleDate).format('YYYY-MM-DD HH:mm')}</span>
              </div>

              <div class="row">
                <span class="text">Receipt #:</span>
                <span class="text">${currentSale.id}</span>
              </div>

              <div class="divider"></div>

              <div class="row">
                <span class="text">Customer:</span>
                <span class="text">${currentCustomer?.name || 'Walk-in Customer'}</span>
              </div>

              ${currentCustomer?.phoneNumber ? `
              <div class="row">
                <span class="text">Phone:</span>
                <span class="text">${currentCustomer.phoneNumber}</span>
              </div>
              ` : ''}

              <div class="divider"></div>

              <div class="row">
                <span class="text">Item:</span>
                <span class="text">${currentItem?.name}</span>
              </div>

              <div class="row">
                <span class="text">Quantity:</span>
                <span class="text">${currentSale.quantitySold}</span>
              </div>

              <div class="row">
                <span class="text">Unit Price:</span>
                <span class="text">KES ${currentSale.sellPrice.toLocaleString()}</span>
              </div>

              <div class="row">
                <span class="text bold">Total Amount:</span>
                <span class="text bold">KES ${(currentSale.sellPrice * currentSale.quantitySold).toLocaleString()}</span>
              </div>

              ${currentCustomer ? `
              <div class="divider"></div>
              <div class="row">
                <span class="text">Points Earned:</span>
                <span class="text">KES ${currentSale.loyaltyPointsEarned.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="text">Points Redeemed:</span>
                <span class="text">KES ${currentSale.loyaltyPointsRedeemed.toFixed(2)}</span>
              </div>
              <div class="row">
                <span class="text bold">Remaining Points:</span>
                <span class="text bold">KES ${currentCustomer.loyaltyPoints.toFixed(2)}</span>
              </div>
              ` : ''}

              <div class="divider"></div>

              <div class="footer">
                <span class="text">Thank you for your business!</span>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleSellItem = async (item: ItemWithBranch, values: any) => {
    try {
      // Find the item in the already fetched data
      const fetchedItem = fetchedItems?.find(i => i.id === item.id);

      if (!fetchedItem) {
        enqueueSnackbar('Item not found', { variant: 'error' });
        return;
      }

      // Check if sell price is below minimum sell price
      if (values.sellPrice < fetchedItem.minimumSellPrice) {
        enqueueSnackbar(`Cannot sell below minimum price of KES ${fetchedItem.minimumSellPrice}`, { variant: 'error' });
        return;
      }

      // Ensure we have enough stock
      if (fetchedItem.quantity < values.quantitySold) {
        enqueueSnackbar('Not enough stock available', { variant: 'error' });
        return;
      }

      // Calculate profit
      const calculatedProfit = (values.sellPrice - fetchedItem.price) * values.quantitySold;

      // Handle customer and loyalty points
      let saleCustomerId = null;
      let saleCustomerName = null;
      let saleCustomerPhone = null;
      let calculatedLoyaltyPointsEarned = 0;
      let calculatedLoyaltyPointsRedeemed = 0;

      if (values.customerPhone) {
        // Try to find existing customer
        let customer = customers?.find(c => c.phoneNumber === values.customerPhone);
        let isNewCustomer = false;

        if (!customer && values.customerName) {
          try {
            // Check if customer exists before creating
            const existingCustomer = customers?.find(c => c.phoneNumber === values.customerPhone);

            if (existingCustomer) {
              // If customer exists, use it
              customer = existingCustomer;
            } else {
              // Create new customer if not found
              customer = await createCustomer({
                data: {
                  name: values.customerName,
                  phoneNumber: values.customerPhone,
                  loyaltyPoints: 0, // Set initial loyalty points to 0
                  referredBy: values.referredByPhone ?
                    customers?.find(c => c.phoneNumber === values.referredByPhone)?.id :
                    undefined
                }
              });
              isNewCustomer = true;
            }
          } catch (error) {
            console.error('Error creating customer:', error);
            // If error is due to duplicate phone number, try to find the customer again
            const existingCustomer = customers?.find(c => c.phoneNumber === values.customerPhone);
            if (existingCustomer) {
              customer = existingCustomer;
              enqueueSnackbar('Using existing customer with this phone number', { variant: 'info' });
            } else {
              enqueueSnackbar('Error creating customer, but proceeding with sale', { variant: 'warning' });
            }
          }
        }

        if (customer) {
          saleCustomerId = customer.id;
          saleCustomerName = customer.name;
          saleCustomerPhone = customer.phoneNumber;

          // Only validate and handle redeem points for existing customers
          if (!isNewCustomer) {
            calculatedLoyaltyPointsRedeemed = values.redeemPoints || 0;

            // Validate redeem points only for existing customers
            if (calculatedLoyaltyPointsRedeemed > customer.loyaltyPoints) {
              enqueueSnackbar('Cannot redeem more points than available', { variant: 'error' });
              return;
            }
          }

          // Calculate loyalty points (5% of profit for customer)
          calculatedLoyaltyPointsEarned = calculatedProfit * 0.05;

          // Update customer's loyalty points
          await updateCustomer({
            where: { id: customer.id },
            data: {
              loyaltyPoints: isNewCustomer ?
                calculatedLoyaltyPointsEarned : // For new customers, just add earned points
                customer.loyaltyPoints - calculatedLoyaltyPointsRedeemed + calculatedLoyaltyPointsEarned // For existing customers, handle both redeem and earn
            }
          });

          // If this customer was referred, give points to referrer (2% of profit)
          if (customer.referredBy) {
            const referrer = customers?.find(c => c.id === customer.referredBy);
            if (referrer) {
              const referrerPoints = calculatedProfit * 0.02; // 2% of profit for referrer
              await updateCustomer({
                where: { id: referrer.id },
                data: {
                  loyaltyPoints: referrer.loyaltyPoints + referrerPoints
                }
              });
            }
          }
        }
      }

      // Compute new quantity after selling
      const newQuantity = fetchedItem.quantity - values.quantitySold;

      // Update item stock
      await updateItem({
        where: { id: item.id },
        data: { quantity: newQuantity },
      });

      try {
        // Log the inventory change due to sale
        const logResult = await logItemChange({
          action: 'update',
          itemId: item.id,
          itemName: item.name,
          userId: user?.id,
          userName: user?.name || 'Unknown',
          details: {
            type: 'sale',
            changes: {
              quantity: {
                from: fetchedItem.quantity,
                to: newQuantity
              }
            },
            quantitySold: values.quantitySold,
            sellPrice: values.sellPrice,
            saleDate: new Date().toISOString()
          }
        }, createInventoryLog);

        if (!logResult) {
          console.warn('Item was sold but logging failed');
        }
      } catch (logError) {
        console.error('Error logging item sale:', logError);
        // Continue with the process even if logging fails
      }

      // Create sale record with the required fields based on the updated schema
      const sale = await createSale({
        data: {
          // Required fields from the updated schema
          totalAmount: values.sellPrice * values.quantitySold,
          totalProfit: calculatedProfit,
          branchId: item.branchId,
          branchName: item.branch?.name || '',
          userId: user?.id || '',
          userName: user?.name || '',

          // Optional fields
          customerId: saleCustomerId,
          customerName: saleCustomerName,
          customerPhone: saleCustomerPhone,
          loyaltyPointsEarned: calculatedLoyaltyPointsEarned,
          loyaltyPointsRedeemed: calculatedLoyaltyPointsRedeemed,
          paymentMethod: values.paymentMethod || 'cash',
          paymentReference: values.paymentReference,

          // Legacy fields for backward compatibility
          sellPrice: values.sellPrice,
          quantitySold: values.quantitySold,
          saleDate: new Date().toISOString(),
          itemId: item.id,
          itemName: item.name,
          itemCategory: item.category,
          itemPrice: item.price,
          profit: calculatedProfit
        },
      });

      // Create SaleItem record for individual transaction tracking
      try {
        // Try to use the API if it exists
        if (Api.saleItem && Api.saleItem.create) {
          await Api.saleItem.create.useMutation().mutateAsync({
            data: {
              saleId: sale.id,
              itemId: item.id,
              itemName: item.name,
              itemCategory: item.category,
              itemPrice: item.price,
              sellPrice: values.sellPrice,
              quantitySold: values.quantitySold,
              profit: calculatedProfit
            }
          });
        } else {
          // Log that we need to implement this API
          console.log('SaleItem API not available yet - would create:', {
            saleId: sale.id,
            itemId: item.id,
            itemName: item.name,
            itemCategory: item.category,
            itemPrice: item.price,
            sellPrice: values.sellPrice,
            quantitySold: values.quantitySold,
            profit: calculatedProfit
          });
        }
      } catch (error) {
        console.error('Error creating sale item:', error);
        // Continue with the process even if this fails
      }

      enqueueSnackbar('Item sold successfully', { variant: 'success' });
      setIsSellModalVisible(false);
      sellForm.resetFields();
      setCurrentCustomer(null);

      // Refetch items to update UI
      refetch();
    } catch (error) {
      console.error('Error in handleSellItem:', error);
      enqueueSnackbar('Failed to sell item', { variant: 'error' });
    }
  };

  const handleFilterByBranch = (branchId: string) => {
    setSelectedBranch(branchId);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!isAdmin) {
      enqueueSnackbar('You do not have permission to delete items', { variant: 'error' });
      return;
    }
    try {
      // Get the item details before deleting
      const itemToDelete = items?.find(item => item.id === itemId);

      if (!itemToDelete) {
        enqueueSnackbar('Item not found', { variant: 'error' });
        return;
      }

      await deleteItem({ where: { id: itemId } });

      try {
        // Log the item deletion
        const logResult = await logItemChange({
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
            branchName: itemToDelete.branch?.name || 'Unknown'
          }
        }, createInventoryLog);

        if (!logResult) {
          console.warn('Item was deleted but logging failed');
        }
      } catch (logError) {
        console.error('Error logging item deletion:', logError);
        // Continue with the process even if logging fails
      }

      enqueueSnackbar('Item deleted successfully', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to delete item', { variant: 'error' });
    }
  };

  const handleEditItem = async (values: any) => {
    if (!isAdmin) {
      enqueueSnackbar('You do not have permission to edit items', { variant: 'error' });
      return;
    }
    try {
      // Store the original item data for comparison
      const originalItem = { ...currentItem };

      const imageUrl = values.image ? await upload({ file: values.image.file }) : null;

      // Prepare the updated data
      const updatedData = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        sku: values.sku,
        quantity: values.quantity,
        origin: values.origin,
        imageUrl: imageUrl?.url || currentItem.imageUrl,
        branchId: values.branch,
        minimumStockLevel: values.minimumStockLevel,
        minimumSellPrice: values.minimumSellPrice || 0,
      };

      // Update the item
      console.log('Updating item:', currentItem.id, updatedData);
      const updatedItem = await updateItem({
        where: { id: currentItem.id },
        data: updatedData,
      });
      console.log('Item updated successfully:', updatedItem);

      // Identify what changed
      const changes: Record<string, { from: any, to: any }> = {};

      Object.keys(updatedData).forEach(key => {
        if (originalItem[key] !== updatedData[key]) {
          changes[key] = {
            from: originalItem[key],
            to: updatedData[key]
          };
        }
      });

      try {
        // Log the item update
        const logResult = await logItemChange({
          action: 'update',
          itemId: currentItem.id,
          itemName: values.name,
          userId: user?.id,
          userName: user?.name || 'Unknown',
          details: {
            changes,
            branchName: branches?.find(b => b.id === values.branch)?.name || 'Unknown'
          }
        }, createInventoryLog);

        if (!logResult) {
          console.warn('Item was updated but logging failed');
        }
      } catch (logError) {
        console.error('Error logging item update:', logError);
        // Continue with the process even if logging fails
      }

      enqueueSnackbar('Item updated successfully', { variant: 'success' });
      refetch();
      editForm.resetFields();
      setIsEditModalVisible(false);
    } catch (error) {
      console.error('Error updating item:', error);
      enqueueSnackbar('Failed to update item', { variant: 'error' });
    }
  };

  const filteredItems = items
  ?.filter(item => {
    // Branch filter
    const branchMatch = selectedBranch ? item.branchId === selectedBranch : true;

    // Stock level filter
    let stockMatch = true;
    if (stockFilter === 'outOfStock') {
      stockMatch = item.quantity === 0;
    } else if (stockFilter === 'low') {
      stockMatch = item.quantity > 0 && item.quantity < item.minimumStockLevel;
    } else if (stockFilter === 'normal') {
      stockMatch = item.quantity >= item.minimumStockLevel;
    }

    // Search filter
    const searchMatch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    return branchMatch && stockMatch && searchMatch;
  });

// Add this handler function
const handleStockFilter = (value: string | null) => {
  setStockFilter(value);
};

  // Desktop columns
  const columns: ColumnsType<ItemWithBranch> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', responsive: ['md'] as any },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Branch', dataIndex: ['branch', 'name'], key: 'branch', responsive: ['lg'] as any },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price: number) => `KES ${price.toLocaleString()}` },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', responsive: ['md'] as any },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: any) => (
        <Space>
          {quantity === 0 ? (
            <Tag color="red">Out of Stock</Tag>
          ) : quantity < record.minimumStockLevel ? (
            <Space>
              {quantity}
              <Tag color="orange">Low Stock</Tag>
            </Space>
          ) : (
            quantity
          )}
        </Space>
      ),
    },
    { title: 'Origin', dataIndex: 'origin', key: 'origin', responsive: ['lg'] as any },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ItemWithBranch) => (
        <Space size="small" direction={isMobile ? 'vertical' : 'horizontal'}>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            size={isMobile ? 'small' : 'middle'}
            onClick={() => handleAddToCart(record)}
          >
            {isMobile ? 'Cart' : 'Add to Cart'}
          </Button>
          <Button
            type="default"
            icon={<DollarOutlined />}
            size={isMobile ? 'small' : 'middle'}
            onClick={() => {
              setCurrentItem(record);
              setIsSellModalVisible(true);
              sellForm.setFieldsValue({
                itemName: record.name,
                category: record.category,
                branch: record.branch.name,
                price: record.price,
              });
            }}
          >
            {isMobile ? 'Sell' : 'Quick Sell'}
          </Button>
          {isAdmin && (
            <>
          <Button
            type="default"
            icon={<EditOutlined />}
            size={isMobile ? 'small' : 'middle'}
            onClick={() => {
              setCurrentItem(record);
              setIsEditModalVisible(true);
                  editForm.setFieldsValue({
                    name: record.name,
                    description: record.description,
                    category: record.category,
                    branch: record.branchId,
                    price: record.price,
                    sku: record.sku,
                    quantity: record.quantity,
                    origin: record.origin,
                    minimumStockLevel: record.minimumStockLevel,
                    minimumSellPrice: record.minimumSellPrice || 0,
                  });
            }}
          >
            {isMobile ? 'Edit' : 'Edit'}
          </Button>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            size={isMobile ? 'small' : 'middle'}
            onClick={() => handleDeleteItem(record.id)}
          >
            {isMobile ? 'Del' : 'Delete'}
          </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // Mobile-specific columns (simplified)
  const mobileColumns: ColumnsType<ItemWithBranch> = [
    {
      title: 'Item',
      key: 'item',
      render: (_: any, record: ItemWithBranch) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.category}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>KES {record.price.toLocaleString()}</div>
        </div>
      ),
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: any) => (
        <div style={{ textAlign: 'center' }}>
          {quantity === 0 ? (
            <Tag color="red" style={{ fontSize: '10px' }}>Out</Tag>
          ) : quantity < record.minimumStockLevel ? (
            <div>
              <div>{quantity}</div>
              <Tag color="orange" style={{ fontSize: '10px' }}>Low</Tag>
            </div>
          ) : (
            <div style={{ fontWeight: 'bold' }}>{quantity}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ItemWithBranch) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            size="small"
            block
            onClick={() => handleAddToCart(record)}
          >
            Cart
          </Button>
          <Button
            type="default"
            icon={<DollarOutlined />}
            size="small"
            block
            onClick={() => {
              setCurrentItem(record);
              setIsSellModalVisible(true);
              sellForm.setFieldsValue({
                itemName: record.name,
                category: record.category,
                branch: record.branch.name,
                price: record.price,
              });
            }}
          >
            Sell
          </Button>
          {isAdmin && (
            <Space size="small" style={{ width: '100%' }}>
              <Button
                type="default"
                icon={<EditOutlined />}
                size="small"
                style={{ flex: 1 }}
                onClick={() => {
                  setCurrentItem(record);
                  setIsEditModalVisible(true);
                  editForm.setFieldsValue({
                    name: record.name,
                    description: record.description,
                    category: record.category,
                    branch: record.branchId,
                    price: record.price,
                    sku: record.sku,
                    quantity: record.quantity,
                    origin: record.origin,
                    minimumStockLevel: record.minimumStockLevel,
                    minimumSellPrice: record.minimumSellPrice || 0,
                  });
                }}
              >
                Edit
              </Button>
              <Button
                type="default"
                danger
                icon={<DeleteOutlined />}
                size="small"
                style={{ flex: 1 }}
                onClick={() => handleDeleteItem(record.id)}
              >
                Del
              </Button>
            </Space>
          )}
        </Space>
      ),
    },
  ];

  // Add this function to handle customer phone number changes
  const handleCustomerPhoneChange = (phoneNumber: string) => {
  if (!phoneNumber) {
    sellForm.setFieldsValue({ customerName: '', redeemPoints: 0 });
    setIsNewCustomer(false);
    setCurrentCustomer(null);
    return;
  }

  const existingCustomer = customers?.find(c => c.phoneNumber === phoneNumber);
  if (existingCustomer) {
    sellForm.setFieldsValue({
      customerName: existingCustomer.name,
      referredByPhone: existingCustomer.referredBy ?
        customers?.find(c => c.id === existingCustomer.referredBy)?.phoneNumber :
        undefined,
      redeemPoints: 0 // Reset redeem points when customer changes
    });
    setCurrentCustomer(existingCustomer); // Set the current customer
    setIsNewCustomer(false);
  } else {
    sellForm.setFieldsValue({ customerName: '', redeemPoints: 0 });
    setCurrentCustomer(null);
    setIsNewCustomer(true);
  }
};

  // Update the generateInitialReport function to work with individual sales
  const generateInitialReport = () => {
    if (!items || !sales) return;

    // Calculate total profit from all sales
    const totalSalesProfit = sales.reduce((sum, sale) => sum + (sale.totalProfit || sale.profit || 0), 0);

    // Create a detailed sales report that shows each sale individually
    const salesReport = sales.map(sale => {
      const item = items.find(i => i.id === sale.itemId);
      return {
        saleId: sale.id,
        saleDate: sale.saleDate,
        itemId: sale.itemId,
        itemName: sale.itemName || (item ? item.name : 'Unknown'),
        itemCategory: sale.itemCategory || (item ? item.category : 'Unknown'),
        quantitySold: sale.quantitySold,
        sellPrice: sale.sellPrice,
        totalAmount: sale.totalAmount || (sale.sellPrice * sale.quantitySold),
        profit: sale.profit || sale.totalProfit || 0,
        customerName: sale.customerName || 'Walk-in Customer',
        branchName: sale.branchName || (item && item.branch ? item.branch.name : 'Unknown')
      };
    });

    // Store the individual sales report
    setSalesReportData(salesReport);

    // For the item-based report, we still need to calculate totals
    const report = items.map(item => {
      // Calculate total sales for this item from individual sales
      const itemSales = sales.filter(sale => sale.itemId === item.id);

      // Calculate totals from individual sales
      const totalSales = itemSales.reduce((sum, sale) => sum + (sale.sellPrice * sale.quantitySold), 0);
      const totalQuantitySold = itemSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const totalProfit = itemSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

      // Calculate total value of current stock
      const currentStockValue = item.quantity * item.price;

      return {
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentQuantity: item.quantity,
        buyingPrice: item.price,
        minimumSellPrice: item.minimumSellPrice,
        currentStockValue,
        totalQuantitySold,
        totalSales,
        totalProfit,
        profitMargin: totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : '0',
        branch: item.branch?.name,
        minimumStockLevel: item.minimumStockLevel,
        stockStatus: item.quantity === 0
          ? 'Out of Stock'
          : item.quantity < item.minimumStockLevel
            ? 'Low Stock'
            : 'Normal'
      };
    });

    // Calculate summary statistics
    const summary = {
      totalItems: report.length,
      totalStockValue: report.reduce((sum, item) => sum + item.currentStockValue, 0),
      totalSales: report.reduce((sum, item) => sum + item.totalSales, 0),
      totalProfit: report.reduce((sum, item) => sum + item.totalProfit, 0),
      totalSalesProfit, // Add the total profit from all sales
      outOfStock: report.filter(item => item.currentQuantity === 0).length,
      lowStock: report.filter(item => item.currentQuantity > 0 && item.currentQuantity < item.minimumStockLevel).length,
      averageProfitMargin: report.reduce((sum, item) => sum + parseFloat(item.profitMargin), 0) / report.length
    };

    setReportData([...report, { isSummary: true, ...summary }]);
  };

  // Update the report modal open handler
  const handleReportModalOpen = () => {
    setIsReportModalVisible(true);
    generateInitialReport();
  };

  // Update the generateReport function to work with individual sales
  const generateReport = () => {
    if (!items || !sales) return;

    // Filter sales based on date range if selected
    let filteredSales = sales;
    if (reportDateRange) {
      const [startDate, endDate] = reportDateRange;
      filteredSales = sales.filter(sale => {
        const saleDate = dayjs(sale.saleDate);
        return saleDate.isAfter(startDate, 'day') && saleDate.isBefore(endDate, 'day');
      });
    }

    // Filter items based on branch if selected
    let filteredItems = items;
    if (reportBranch) {
      filteredItems = items.filter(item => item.branchId === reportBranch);
    }

    // Create a detailed sales report that shows each sale individually
    const salesReport = filteredSales.map(sale => {
      const item = items.find(i => i.id === sale.itemId);
      return {
        saleId: sale.id,
        saleDate: sale.saleDate,
        itemId: sale.itemId,
        itemName: sale.itemName || (item ? item.name : 'Unknown'),
        itemCategory: sale.itemCategory || (item ? item.category : 'Unknown'),
        quantitySold: sale.quantitySold,
        sellPrice: sale.sellPrice,
        totalAmount: sale.totalAmount || (sale.sellPrice * sale.quantitySold),
        profit: sale.profit || sale.totalProfit || 0,
        customerName: sale.customerName || 'Walk-in Customer',
        branchName: sale.branchName || (item && item.branch ? item.branch.name : 'Unknown')
      };
    });

    // Store the individual sales report
    setSalesReportData(salesReport);

    // Calculate total profit from all sales in the filtered period
    const totalSalesProfit = filteredSales.reduce((sum, sale) => sum + (sale.totalProfit || sale.profit || 0), 0);

    const report = filteredItems.map(item => {
      // Calculate total sales for this item from individual sales
      const itemSales = filteredSales.filter(sale => sale.itemId === item.id);

      // Calculate totals from individual sales
      const totalSales = itemSales.reduce((sum, sale) => sum + (sale.sellPrice * sale.quantitySold), 0);
      const totalQuantitySold = itemSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const totalProfit = itemSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);

      // Calculate total value of current stock
      const currentStockValue = item.quantity * item.price;

      return {
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentQuantity: item.quantity,
        buyingPrice: item.price,
        minimumSellPrice: item.minimumSellPrice,
        currentStockValue,
        totalQuantitySold,
        totalSales,
        totalProfit,
        profitMargin: totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : '0',
        branch: item.branch?.name,
        minimumStockLevel: item.minimumStockLevel,
        stockStatus: item.quantity === 0
          ? 'Out of Stock'
          : item.quantity < item.minimumStockLevel
            ? 'Low Stock'
            : 'Normal'
      };
    });

    // Calculate summary statistics
    const summary = {
      totalItems: report.length,
      totalStockValue: report.reduce((sum, item) => sum + item.currentStockValue, 0),
      totalSales: report.reduce((sum, item) => sum + item.totalSales, 0),
      totalProfit: report.reduce((sum, item) => sum + item.totalProfit, 0),
      totalSalesProfit, // Add the total profit from all sales
      outOfStock: report.filter(item => item.currentQuantity === 0).length,
      lowStock: report.filter(item => item.currentQuantity > 0 && item.currentQuantity < item.minimumStockLevel).length,
      averageProfitMargin: report.reduce((sum, item) => sum + parseFloat(item.profitMargin), 0) / report.length
    };

    setReportData([...report, { isSummary: true, ...summary }]);
    setIsReportModalVisible(true);
  };

  // Add this function to handle Excel download
  const handleDownloadExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Prepare the individual sales data for Excel
      const salesExcelData = salesReportData.map(sale => {
        return {
          'Date': dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm'),
          'Receipt #': sale.saleId,
          'Customer': sale.customerName,
          'Item': sale.itemName,
          'Category': sale.itemCategory,
          'Quantity': sale.quantitySold,
          'Unit Price': `KES ${sale.sellPrice.toLocaleString()}`,
          'Total Amount': `KES ${sale.totalAmount.toLocaleString()}`,
          'Profit': `KES ${sale.profit.toLocaleString()}`,
          'Branch': sale.branchName
        };
      });

      // Create a worksheet for individual sales
      const salesWs = XLSX.utils.json_to_sheet(salesExcelData);

      // Set column widths for sales worksheet
      const salesColWidths = [
        { wch: 20 }, // Date
        { wch: 15 }, // Receipt #
        { wch: 25 }, // Customer
        { wch: 30 }, // Item
        { wch: 20 }, // Category
        { wch: 10 }, // Quantity
        { wch: 15 }, // Unit Price
        { wch: 15 }, // Total Amount
        { wch: 15 }, // Profit
        { wch: 20 }  // Branch
      ];
      salesWs['!cols'] = salesColWidths;

      // Add the sales worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, salesWs, 'Individual Sales');

      // Prepare the item summary data for Excel
      const itemsExcelData = reportData.map(item => {
        if (item.isSummary) {
          return {
            'Name': 'SUMMARY',
            'Total Items': item.totalItems,
            'Out of Stock': item.outOfStock,
            'Low Stock': item.lowStock,
            'Total Stock Value': `KES ${item.totalStockValue.toLocaleString()}`,
            'Total Sales': `KES ${item.totalSales.toLocaleString()}`,
            'Total Profit': `KES ${item.totalProfit.toLocaleString()}`,
            'Average Profit Margin': `${item.averageProfitMargin.toFixed(2)}%`
          };
        }
        return {
          'Name': item.name,
          'SKU': item.sku,
          'Category': item.category,
          'Branch': item.branch,
          'Current Stock': item.currentQuantity,
          'Buying Price': `KES ${item.buyingPrice.toLocaleString()}`,
          'Min. Sell Price': `KES ${item.minimumSellPrice.toLocaleString()}`,
          'Current Stock Value': `KES ${item.currentStockValue.toLocaleString()}`,
          'Total Quantity Sold': item.totalQuantitySold,
          'Total Sales': `KES ${item.totalSales.toLocaleString()}`,
          'Total Profit': `KES ${item.totalProfit.toLocaleString()}`,
          'Profit Margin': `${item.profitMargin}%`,
          'Stock Status': item.stockStatus
        };
      });

      // Create a worksheet for item summary
      const itemsWs = XLSX.utils.json_to_sheet(itemsExcelData);

      // Set column widths for items worksheet
      const itemsColWidths = [
        { wch: 30 }, // Name
        { wch: 15 }, // SKU
        { wch: 20 }, // Category
        { wch: 20 }, // Branch
        { wch: 15 }, // Current Stock
        { wch: 15 }, // Buying Price
        { wch: 15 }, // Min. Sell Price
        { wch: 15 }, // Current Stock Value
        { wch: 15 }, // Total Quantity Sold
        { wch: 15 }, // Total Sales
        { wch: 15 }, // Total Profit
        { wch: 15 }, // Profit Margin
        { wch: 15 }  // Stock Status
      ];
      itemsWs['!cols'] = itemsColWidths;

      // Add the items worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, itemsWs, 'Items Summary');

      // Generate the Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with date
      const date = new Date().toISOString().split('T')[0];
      const filename = `inventory_report_${date}.xlsx`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      enqueueSnackbar('Report downloaded successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error downloading report:', error);
      enqueueSnackbar('Failed to download report', { variant: 'error' });
    }
  };

  // Updated function to handle viewing past receipts with multiple items
  const handleViewReceipt = (sale: any) => {
    // For legacy single-item sales
    if (sale.itemId && !sale.saleItems) {
      const item = items?.find(i => i.id === sale.itemId);
      setCurrentSale(sale);
      setCurrentCustomer(customers?.find(c => c.id === sale.customerId) || null);
      setCurrentItem(item);
      setIsReceiptModalVisible(true);
      return;
    }

    // For multi-item sales
    setMultiItemSale({
      ...sale,
      saleItems: sale.saleItems || []
    });
    setCurrentCustomer(customers?.find(c => c.id === sale.customerId) || null);
    setIsMultiItemReceiptVisible(true);
  };

  // Cart management functions
  const handleAddToCart = (item: ItemWithBranch) => {
    // Check if item is already in cart
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
      // If already in cart, increment quantity if stock allows
      if (existingItem.quantity < item.quantity) {
        handleUpdateCartItemQuantity(item.id, existingItem.quantity + 1);
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
      // Add new item to cart
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

      setCartItems(prev => [...prev, newCartItem]);
      notification.success({
        message: 'Item added to cart',
        description: `${item.name} added to cart`,
        placement: 'bottomRight'
      });
    }
  };

  const handleUpdateCartItemQuantity = (itemId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const handleUpdateCartItemSellPrice = (itemId: string, sellPrice: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, sellPrice }
          : item
      )
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
    notification.info({
      message: 'Item removed',
      description: 'Item removed from cart',
      placement: 'bottomRight'
    });
  };

  const handleClearCart = () => {
    setCartItems([]);
    notification.info({
      message: 'Cart cleared',
      description: 'All items removed from cart',
      placement: 'bottomRight'
    });
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      notification.error({
        message: 'Empty cart',
        description: 'Please add items to cart before checkout',
        placement: 'bottomRight'
      });
      return;
    }

    setIsMultiItemCheckoutVisible(true);
  };

  const handleMultiItemSale = async (values: any) => {
    try {
      if (cartItems.length === 0) {
        enqueueSnackbar('No items in cart', { variant: 'error' });
        return;
      }

      // Handle customer and loyalty points
      let saleCustomerId = null;
      let saleCustomerName = null;
      let saleCustomerPhone = null;
      let calculatedLoyaltyPointsEarned = 0;
      let calculatedLoyaltyPointsRedeemed = values.pointsRedeemed || 0;

      if (values.customerPhone) {
        // Try to find existing customer
        let customer = customers?.find(c => c.phoneNumber === values.customerPhone);
        let isNewCustomer = false;

        if (!customer && values.customerName) {
          try {
            // Check if customer exists before creating
            const existingCustomer = customers?.find(c => c.phoneNumber === values.customerPhone);

            if (existingCustomer) {
              // If customer exists, use it
              customer = existingCustomer;
            } else {
              // Create new customer if not found
              customer = await createCustomer({
                data: {
                  name: values.customerName,
                  phoneNumber: values.customerPhone,
                  loyaltyPoints: 0, // Set initial loyalty points to 0
                  referredBy: values.referredBy || undefined
                }
              });
              isNewCustomer = true;
            }
          } catch (error) {
            console.error('Error creating customer:', error);
            // If error is due to duplicate phone number, try to find the customer again
            const existingCustomer = customers?.find(c => c.phoneNumber === values.customerPhone);
            if (existingCustomer) {
              customer = existingCustomer;
              enqueueSnackbar('Using existing customer with this phone number', { variant: 'info' });
            } else {
              enqueueSnackbar('Error creating customer, but proceeding with sale', { variant: 'warning' });
            }
          }
        }

        if (customer) {
          saleCustomerId = customer.id;
          saleCustomerName = customer.name;
          saleCustomerPhone = customer.phoneNumber;

          // Calculate total profit for loyalty points
          const totalProfit = cartItems.reduce((sum, item) => {
            return sum + ((item.sellPrice - item.price) * item.quantity);
          }, 0);

          // Calculate loyalty points (5% of profit for customer)
          calculatedLoyaltyPointsEarned = totalProfit * 0.05;

          // Update customer's loyalty points
          await updateCustomer({
            where: { id: customer.id },
            data: {
              loyaltyPoints: isNewCustomer ?
                calculatedLoyaltyPointsEarned : // For new customers, just add earned points
                customer.loyaltyPoints - calculatedLoyaltyPointsRedeemed + calculatedLoyaltyPointsEarned // For existing customers, handle both redeem and earn
            }
          });

          // If this customer was referred, give points to referrer (2% of profit)
          if (customer.referredBy) {
            const referrer = customers?.find(c => c.id === customer.referredBy);
            if (referrer) {
              const referrerPoints = totalProfit * 0.02; // 2% of profit for referrer
              await updateCustomer({
                where: { id: referrer.id },
                data: {
                  loyaltyPoints: referrer.loyaltyPoints + referrerPoints
                }
              });
            }
          }
        }
      }

      // Calculate totals
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
      const totalProfit = cartItems.reduce((sum, item) => sum + ((item.sellPrice - item.price) * item.quantity), 0);

      // Create the sale record with the required fields based on the updated schema
      const sale = await createSale({
        data: {
          // Required fields from the updated schema
          totalAmount: totalAmount,
          totalProfit: totalProfit,
          branchId: cartItems[0].branchId,
          branchName: cartItems[0].branchName,
          userId: user?.id || '',
          userName: user?.name || '',

          // Optional fields
          customerId: saleCustomerId || undefined,
          customerName: saleCustomerName || undefined,
          customerPhone: saleCustomerPhone || undefined,
          loyaltyPointsEarned: calculatedLoyaltyPointsEarned,
          loyaltyPointsRedeemed: calculatedLoyaltyPointsRedeemed,
          paymentMethod: values.paymentMethod || 'cash',
          paymentReference: values.paymentReference,

          // Legacy fields for backward compatibility
          sellPrice: totalAmount,
          quantitySold: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          itemId: cartItems[0].id,
          // Use the first item's name with a count indicator instead of "Multiple Items"
          itemName: cartItems.length > 1 ? `${cartItems[0].name} +${cartItems.length - 1} more` : cartItems[0].name,
          itemCategory: cartItems.length > 1 ? "Various" : cartItems[0].category,
          itemPrice: cartItems[0].price,
          profit: totalProfit
        }
      });

      // Set the multi-item sale with additional data for the receipt
      setMultiItemSale({
        ...sale,
        totalAmount,
        totalProfit,
        paymentMethod: values.paymentMethod || 'cash',
        paymentReference: values.paymentReference,
        saleItems: cartItems.map(item => ({
          id: item.id,
          itemName: item.name,
          itemCategory: item.category,
          sellPrice: item.sellPrice,
          quantitySold: item.quantity
        }))
      });

      // Create sale items and update inventory
      for (const item of cartItems) {
        // Find the item in the already fetched data
        const fetchedItem = fetchedItems?.find(i => i.id === item.id);

        if (!fetchedItem) {
          enqueueSnackbar(`Item ${item.name} not found`, { variant: 'error' });
          continue;
        }

        // Ensure we have enough stock
        if (fetchedItem.quantity < item.quantity) {
          enqueueSnackbar(`Not enough stock for ${item.name}`, { variant: 'error' });
          continue;
        }

        // Calculate profit for this item
        const itemProfit = (item.sellPrice - item.price) * item.quantity;

        // Create sale item record
        try {
          // Create the sale item using the API
          const { mutateAsync: createSaleItem } = Api.saleItem.create.useMutation();

          await createSaleItem({
            data: {
              saleId: sale.id,
              itemId: item.id,
              itemName: item.name,
              itemCategory: item.category,
              itemPrice: item.price,
              sellPrice: item.sellPrice,
              quantitySold: item.quantity,
              profit: itemProfit
            }
          });

          console.log(`Created sale item for ${item.name}`);
        } catch (error) {
          console.error('Error creating sale item:', error);
          enqueueSnackbar(`Failed to create sale item for ${item.name}, but continuing with sale`, { variant: 'warning' });
          // Continue with the process even if this fails
        }

        // Update item stock
        const newQuantity = fetchedItem.quantity - item.quantity;
        await updateItem({
          where: { id: item.id },
          data: { quantity: newQuantity }
        });

        // Log the inventory change due to multi-item sale
        try {
          const logResult = await logItemChange({
            action: 'update',
            itemId: item.id,
            itemName: item.name,
            userId: user?.id,
            userName: user?.name || 'Unknown',
            details: {
              type: 'multi-item-sale',
              changes: {
                quantity: {
                  from: fetchedItem.quantity,
                  to: newQuantity
                }
              },
              quantitySold: item.quantity,
              sellPrice: item.sellPrice,
              saleDate: new Date().toISOString(),
              saleId: sale.id
            }
          }, createInventoryLog);

          if (!logResult) {
            console.warn(`Item ${item.name} was sold but logging failed`);
          }
        } catch (logError) {
          console.error(`Error logging multi-item sale for ${item.name}:`, logError);
          // Continue with the process even if logging fails
        }
      }

      // Set the sale for receipt
      setMultiItemSale({
        ...sale,
        saleItems: cartItems.map(item => ({
          id: item.id,
          itemName: item.name,
          itemCategory: item.category,
          sellPrice: item.sellPrice,
          quantitySold: item.quantity
        }))
      });

      // Show receipt
      setIsMultiItemCheckoutVisible(false);
      setIsMultiItemReceiptVisible(true);

      // Clear cart
      setCartItems([]);

      enqueueSnackbar('Sale completed successfully', { variant: 'success' });

      // Refetch items to update UI
      refetch();
    } catch (error) {
      console.error('Error in handleMultiItemSale:', error);
      enqueueSnackbar('Failed to complete sale', { variant: 'error' });
    }
  };

  const handlePrintMultiItemReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && multiItemReceiptRef.current) {
      // Similar to handlePrintReceipt but for multi-item receipt
      // This would be implemented with the multi-item receipt format
      printWindow.document.write(`
        <html>
          <head>
            <title>Sales Receipt</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .receipt { width: 80mm; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 10px; }
              .title { font-size: 14px; margin-bottom: 5px; }
              .subtitle { font-size: 12px; margin-bottom: 5px; }
              .divider { border-bottom: 1px solid #000; margin: 5px 0; }
              .row { display: flex; justify-content: space-between; margin: 2px 0; }
              .footer { text-align: center; margin-top: 20px; }
              .text { font-size: 10px; }
              .bold { font-weight: bold; }
              .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              .items-table th, .items-table td { text-align: left; padding: 2px; font-size: 10px; }
              .items-table th { border-bottom: 1px solid #000; }
              .total-row { border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="title">SALON QUIP</div>
                <div class="subtitle">Sales Receipt</div>
              </div>

              <div class="divider"></div>

              <div class="row">
                <span class="text">Date:</span>
                <span class="text">${dayjs(multiItemSale.saleDate).format('YYYY-MM-DD HH:mm')}</span>
              </div>

              <div class="row">
                <span class="text">Receipt #:</span>
                <span class="text">${multiItemSale.id}</span>
              </div>

              <div class="divider"></div>

              <div class="row">
                <span class="text">Customer:</span>
                <span class="text">${multiItemSale.customerName || 'Walk-in Customer'}</span>
              </div>

              ${multiItemSale.customerPhone ? `
              <div class="row">
                <span class="text">Phone:</span>
                <span class="text">${multiItemSale.customerPhone}</span>
              </div>
              ` : ''}

              <div class="divider"></div>

              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${multiItemSale.saleItems.map((item: any) => `
                    <tr>
                      <td>${item.itemName}</td>
                      <td>${item.quantitySold}</td>
                      <td>KES ${item.sellPrice.toLocaleString()}</td>
                      <td>KES ${(item.sellPrice * item.quantitySold).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="divider"></div>

              <div class="row">
                <span class="text">Subtotal:</span>
                <span class="text">KES ${multiItemSale.totalAmount.toLocaleString()}</span>
              </div>

              ${multiItemSale.loyaltyPointsRedeemed > 0 ? `
              <div class="row">
                <span class="text">Points Redeemed:</span>
                <span class="text">- KES ${multiItemSale.loyaltyPointsRedeemed.toLocaleString()}</span>
              </div>
              ` : ''}

              <div class="row total-row">
                <span class="text bold">Total Amount:</span>
                <span class="text bold">KES ${(multiItemSale.totalAmount - multiItemSale.loyaltyPointsRedeemed).toLocaleString()}</span>
              </div>

              <div class="row">
                <span class="text">Payment Method:</span>
                <span class="text">${multiItemSale.paymentMethod.charAt(0).toUpperCase() + multiItemSale.paymentMethod.slice(1)}
                  ${multiItemSale.paymentReference ? ` (Ref: ${multiItemSale.paymentReference})` : ''}
                </span>
              </div>

              ${multiItemSale.loyaltyPointsEarned > 0 ? `
              <div class="row">
                <span class="text">Points Earned:</span>
                <span class="text">KES ${multiItemSale.loyaltyPointsEarned.toLocaleString()}</span>
              </div>
              ` : ''}

              <div class="footer">
                <span class="text">Thank you for your business!</span>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  // Tab state for items management
  const [activeTab, setActiveTab] = useState('items');

  // Calculate inventory statistics
  const calculateInventoryStats = () => {
    if (!items) return { totalItems: 0, totalValue: 0, outOfStock: 0, lowStock: 0, normalStock: 0 };

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity < item.minimumStockLevel).length;
    const normalStock = items.filter(item => item.quantity >= item.minimumStockLevel).length;

    return { totalItems, totalValue, outOfStock, lowStock, normalStock };
  };

  // Calculate category distribution
  const calculateCategoryDistribution = () => {
    if (!items) return [];

    const categoryMap = new Map();
    items.forEach(item => {
      const category = item.category;
      if (categoryMap.has(category)) {
        categoryMap.set(category, categoryMap.get(category) + 1);
      } else {
        categoryMap.set(category, 1);
      }
    });

    return Array.from(categoryMap).map(([name, value]) => ({ name, value }));
  };

  // Calculate branch distribution
  const calculateBranchDistribution = () => {
    if (!items) return [];

    const branchMap = new Map();
    items.forEach(item => {
      const branchName = item.branch?.name || 'Unknown';
      if (branchMap.has(branchName)) {
        branchMap.set(branchName, branchMap.get(branchName) + 1);
      } else {
        branchMap.set(branchName, 1);
      }
    });

    return Array.from(branchMap).map(([name, value]) => ({ name, value }));
  };

  // Calculate stock level distribution for visualization
  const calculateStockLevelData = () => {
    const stats = calculateInventoryStats();
    return [
      { name: 'Normal Stock', value: stats.normalStock, fill: '#52c41a' },
      { name: 'Low Stock', value: stats.lowStock, fill: '#faad14' },
      { name: 'Out of Stock', value: stats.outOfStock, fill: '#f5222d' }
    ];
  };

  // Get top selling items
  const getTopSellingItems = () => {
    if (!items || !sales) return [];

    const itemSalesMap = new Map();

    // Count sales for each item
    sales.forEach(sale => {
      if (sale.itemId) {
        if (itemSalesMap.has(sale.itemId)) {
          itemSalesMap.set(sale.itemId, {
            count: itemSalesMap.get(sale.itemId).count + sale.quantitySold,
            name: sale.itemName || 'Unknown'
          });
        } else {
          itemSalesMap.set(sale.itemId, {
            count: sale.quantitySold,
            name: sale.itemName || 'Unknown'
          });
        }
      }
    });

    // Convert to array and sort
    return Array.from(itemSalesMap)
      .map(([id, { count, name }]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Get top 5
  };

  // Get inventory stats
  const inventoryStats = calculateInventoryStats();
  const categoryData = calculateCategoryDistribution();
  const branchData = calculateBranchDistribution();
  const stockLevelData = calculateStockLevelData();
  const topSellingItems = getTopSellingItems();

  // Determine if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <PageLayout layout="full-width">
      <Title level={2}>Items Management</Title>
      <Text>Manage your inventory by adding, viewing, and selling items.</Text>

      {/* Items Tab */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <Tabs.TabPane tab="Items" key="items">
          {items && (items.some(item => item.quantity < item.minimumStockLevel && item.quantity > 0) || items.some(item => item.quantity === 0)) && (
            <Space direction="vertical" style={{ width: '100%', margin: '16px 0' }}>
              {items.some(item => item.quantity === 0) && (
                <Alert
                  message="Out of Stock Alert"
                  description="Some items are out of stock. Please restock these items."
                  type="error"
                  showIcon
                />
              )}
              {items.some(item => item.quantity < item.minimumStockLevel && item.quantity > 0) && (
                <Alert
                  message="Low Stock Alert"
                  description="Some items are running low on stock (below minimum level). Please check the inventory."
                  type="warning"
                  showIcon
                />
              )}
            </Space>
          )}
          <div style={{ marginBottom: 16 }}>
            <Space
              direction={isMobile ? 'vertical' : 'horizontal'}
              size="middle"
              style={{
                width: '100%',
                justifyContent: isMobile ? 'center' : 'space-between',
                display: isMobile ? 'flex' : 'flex'
              }}
            >
              <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small" style={{ width: isMobile ? '100%' : 'auto' }}>
                {isAdmin && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsModalVisible(true)}
                    size={isMobile ? 'large' : 'middle'}
                    block={isMobile}
                  >
                    {isMobile ? 'Add New Item' : 'Add Item'}
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={handleReportModalOpen}
                  size={isMobile ? 'large' : 'middle'}
                  block={isMobile}
                >
                  {isMobile ? 'Reports' : 'Generate Report'}
                </Button>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  size={isMobile ? 'large' : 'middle'}
                  block={isMobile}
                >
                  {isMobile ? `Cart (${cartItems.length})` : `Checkout (${cartItems.length})`}
                </Button>
              </Space>
              {!isMobile && (
                <ShoppingCart
                  cartItems={cartItems}
                  onUpdateQuantity={handleUpdateCartItemQuantity}
                  onUpdateSellPrice={handleUpdateCartItemSellPrice}
                  onRemoveItem={handleRemoveFromCart}
                  onClearCart={handleClearCart}
                />
              )}
            </Space>
            {/* Mobile Cart Summary */}
            {isMobile && cartItems.length > 0 && (
              <div style={{
                marginTop: 16,
                padding: 12,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                border: '1px solid #d9d9d9'
              }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Cart Summary ({cartItems.length} items)</Text>
                  {cartItems.slice(0, 2).map(item => (
                    <div key={item.id} style={{ fontSize: '12px' }}>
                      {item.name} x {item.quantity} = KES {(item.sellPrice * item.quantity).toLocaleString()}
                    </div>
                  ))}
                  {cartItems.length > 2 && (
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      +{cartItems.length - 2} more items...
                    </Text>
                  )}
                  <Text strong style={{ fontSize: '14px' }}>
                    Total: KES {cartItems.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0).toLocaleString()}
                  </Text>
                </Space>
              </div>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle" style={{ width: '100%' }}>
              <Select
                placeholder="Filter by Branch"
                onChange={handleFilterByBranch}
                style={{ width: isMobile ? '100%' : 200 }}
                allowClear
              >
                {branches?.map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    {branch.name}
                  </Option>
                ))}
              </Select>
              <Select
                placeholder="Filter by Stock Level"
                onChange={handleStockFilter}
                style={{ width: isMobile ? '100%' : 200 }}
                allowClear
              >
                <Option value="outOfStock">Out of Stock (0)</Option>
                <Option value="low">Low Stock (Below minimum)</Option>
                <Option value="normal">Normal Stock (Above minimum)</Option>
              </Select>
              <Input
                placeholder="Search by name, SKU, or description"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: isMobile ? '100%' : 300 }}
                prefix={<SearchOutlined />}
              />
            </Space>
          </div>
          <Table
            columns={isMobile ? mobileColumns : columns}
            dataSource={filteredItems}
            rowKey="id"
            scroll={{ x: isMobile ? 400 : 1200 }}
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              pageSize: isMobile ? 5 : 10,
              size: isMobile ? 'small' : 'default',
              showSizeChanger: !isMobile,
              showQuickJumper: !isMobile,
              showTotal: (total, range) =>
                isMobile
                  ? `${range[0]}-${range[1]} of ${total}`
                  : `${range[0]}-${range[1]} of ${total} items`
            }}
            onRow={(record) => ({
              style: record.quantity === 0
                ? { backgroundColor: '#ffccc7' }
                : record.quantity < record.minimumStockLevel
                  ? { backgroundColor: '#fff7e6' }
                  : {}
            })}
            summary={(pageData) => {
              const lowStockItems = pageData.filter(item => item.quantity > 0 && item.quantity < item.minimumStockLevel).length;
              const outOfStockItems = pageData.filter(item => item.quantity === 0).length;

              return (lowStockItems > 0 || outOfStockItems > 0) ? (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={isMobile ? 3 : 9}>
                    <Space direction="vertical">
                      {outOfStockItems > 0 && (
                        <Text type="danger">
                          {outOfStockItems} item(s) out of stock
                        </Text>
                      )}
                      {lowStockItems > 0 && (
                        <Text type="warning">
                          {lowStockItems} item(s) with low stock (below minimum level)
                        </Text>
                      )}
                    </Space>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              ) : null;
            }}
          />
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Add New Item"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 600}
        style={isMobile ? { top: 0, paddingBottom: 0 } : {}}
        bodyStyle={isMobile ? { height: 'calc(100vh - 110px)', overflowY: 'auto' } : {}}
      >
        <Form form={form} onFinish={handleAddItem} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please input the category!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="branch" label="Branch" rules={[{ required: true, message: 'Please select a branch!' }]}>
            <Select>
              {branches?.map(branch => (
                <Option key={branch.id} value={branch.id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please input the price!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Please input the SKU!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Please input the quantity!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="origin" label="Origin" rules={[{ required: true, message: 'Please input the origin!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="image" label="Image">
            <Input type="file" />
          </Form.Item>
          <Form.Item name="minimumStockLevel" label="Minimum Stock Level" rules={[{ required: true, message: 'Please input the minimum stock level!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="minimumSellPrice" label="Minimum Sell Price" rules={[{ required: true, message: 'Please input the minimum sell price!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Item
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Edit Item"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 600}
        style={isMobile ? { top: 0, paddingBottom: 0 } : {}}
        bodyStyle={isMobile ? { height: 'calc(100vh - 110px)', overflowY: 'auto' } : {}}
      >
        <Form form={editForm} onFinish={handleEditItem} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Please input the category!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="branch" label="Branch" rules={[{ required: true, message: 'Please select a branch!' }]}>
            <Select>
              {branches?.map(branch => (
                <Option key={branch.id} value={branch.id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please input the price!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'Please input the SKU!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: 'Please input the quantity!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="origin" label="Origin" rules={[{ required: true, message: 'Please input the origin!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="image" label="Image">
            <Input type="file" />
          </Form.Item>
          <Form.Item name="minimumStockLevel" label="Minimum Stock Level" rules={[{ required: true, message: 'Please input the minimum stock level!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="minimumSellPrice" label="Minimum Sell Price" rules={[{ required: true, message: 'Please input the minimum sell price!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Item
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Sell Item"
        open={isSellModalVisible}
        onCancel={() => {
          setIsSellModalVisible(false)
          sellForm.resetFields()
          setIsNewCustomer(false)
          setCurrentCustomer(null)
        }}
        footer={null}
        width={isMobile ? '100%' : 600}
        style={isMobile ? { top: 0, paddingBottom: 0 } : {}}
        bodyStyle={isMobile ? { height: 'calc(100vh - 110px)', overflowY: 'auto' } : {}}
      >
        <Form
          form={sellForm}
          onFinish={values => handleSellItem(currentItem, values)}
          layout="vertical"
          initialValues={{
            itemName: currentItem?.name,
            category: currentItem?.category,
            branch: currentItem?.branch?.name,
            price: currentItem?.price,
          }}
        >
          {/* Customer Details Section */}
          <Form.Item
            name="customerPhone"
            label="Customer Phone"
            rules={[
              { required: true, message: 'Please enter customer phone number!' },
              { pattern: /^[0-9+\-\s]+$/, message: 'Please enter a valid phone number!' }
            ]}
          >
            <Input
              placeholder="Enter customer phone number"
              onChange={(e) => handleCustomerPhoneChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[
              { required: true, message: 'Please enter customer name!' }
            ]}
          >
            <Input
              placeholder="Enter customer name"
              disabled={!isNewCustomer}
            />
          </Form.Item>

          <Form.Item
            name="referredByPhone"
            label="Referred By (Phone)"
            rules={[
              { pattern: /^[0-9+\-\s]+$/, message: 'Please enter a valid phone number!' }
            ]}
          >
            <Input
              placeholder="Enter referrer's phone number"
              disabled={!isNewCustomer}
            />
          </Form.Item>

          {currentCustomer && (
            <Alert
              message={`Available loyalty points: KES ${currentCustomer.loyaltyPoints.toFixed(2)}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Item Details Section */}
          <Alert
            message={`Minimum sell price: KES ${currentItem?.minimumSellPrice || 0}`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Form.Item name="itemName" label="Item Name">
            <Input disabled />
          </Form.Item>

          <Form.Item name="category" label="Category">
            <Input disabled />
          </Form.Item>

          <Form.Item name="branch" label="Branch">
            <Input disabled />
          </Form.Item>

          <Form.Item name="price" label="Price">
            <InputNumber
              disabled
              style={{ width: '100%' }}
              formatter={value => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/KES\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="quantitySold"
            label="Quantity Sold"
            rules={[
              { required: true, message: 'Please input the quantity sold!' },
              {
                validator: (_, value) => {
                  if (value > currentItem?.quantity) {
                    return Promise.reject(`Maximum available quantity is ${currentItem?.quantity}`)
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <InputNumber
              min={1}
              max={currentItem?.quantity}
              style={{ width: '100%' }}
              placeholder="Enter quantity to sell"
            />
          </Form.Item>

          <Form.Item
            name="sellPrice"
            label="Sell Price"
            rules={[
              { required: true, message: 'Please input the sell price!' },
              {
                validator: async (_, value) => {
                  if (!value) return Promise.reject('Please input the sell price!')
                  if (value < currentItem?.minimumSellPrice) {
                    return Promise.reject(`Cannot sell below minimum price of KES ${currentItem?.minimumSellPrice}`)
                  }
                  return Promise.resolve()
                },
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/KES\s?|(,*)/g, '')}
              placeholder={`Minimum sell price: KES ${currentItem?.minimumSellPrice}`}
            />
          </Form.Item>

          {/* Redeem Points Section */}
          <Form.Item
            name="redeemPoints"
            label="Redeem Loyalty Points"
            rules={[
              {
                validator: (_, value) => {
                  // Only validate if there's a customer and they're not a new customer
                  if (!currentCustomer || isNewCustomer) {
                    return Promise.resolve();
                  }
                  if (value && value > currentCustomer.loyaltyPoints) {
                    return Promise.reject(`Cannot redeem more than available points (KES ${currentCustomer.loyaltyPoints.toFixed(2)})`);
                  }
                  if (value < 0) {
                    return Promise.reject('Points cannot be negative');
                  }
                  return Promise.resolve();
                }
              }
            ]}
            help={currentCustomer && !isNewCustomer ? `Remaining points after redemption: KES ${(currentCustomer.loyaltyPoints - (sellForm.getFieldValue('redeemPoints') || 0)).toFixed(2)}` : null}
          >
            <InputNumber
              min={0}
              max={currentCustomer?.loyaltyPoints}
              style={{ width: '100%' }}
              placeholder={`Available points: KES ${currentCustomer?.loyaltyPoints.toFixed(2) || 0}`}
              formatter={value => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/KES\s?|(,*)/g, '')}
              onChange={(value) => {
                // Trigger validation as the user types
                sellForm.validateFields(['redeemPoints']);
              }}
            />
          </Form.Item>

          {/* Actions Section */}
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setIsSellModalVisible(false)
                  sellForm.resetFields()
                  setIsNewCustomer(false)
                  setCurrentCustomer(null)
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Sell Item
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      {/* Update the Report Modal */}
      <Modal
        title="Inventory and Sales Report"
        open={isReportModalVisible}
        onCancel={() => {
          setIsReportModalVisible(false);
          setReportBranch(null);
          setReportDateRange(null);
        }}
        width={1200}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="Filter by Branch"
              onChange={setReportBranch}
              style={{ width: 200 }}
              allowClear
            >
              {branches?.map(branch => (
                <Option key={branch.id} value={branch.id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
            <DatePicker.RangePicker
              onChange={(dates) => setReportDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              allowClear
            />
            <Button type="primary" onClick={generateReport}>
              Apply Filters
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadExcel}
              style={{ marginLeft: 8 }}
            >
              Download Excel
            </Button>
          </Space>
          {reportDateRange && (
            <Text type="secondary">
              Showing data from {reportDateRange[0].format('MMMM D, YYYY')} to {reportDateRange[1].format('MMMM D, YYYY')}
            </Text>
          )}
          {reportBranch && (
            <Text type="secondary">
              Showing data for branch: {branches?.find(b => b.id === reportBranch)?.name}
            </Text>
          )}
          {!reportDateRange && !reportBranch && (
            <Text type="secondary">
              Showing all data
            </Text>
          )}
        </Space>

        <Tabs activeKey={reportActiveTab} onChange={setReportActiveTab}>
          <Tabs.TabPane tab="Items Summary" key="items">
            <Table
              dataSource={reportData}
              columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              key: 'name',
              render: (text, record) => record.isSummary ? <strong>Summary</strong> : text
            },
            {
              title: 'SKU',
              dataIndex: 'sku',
              key: 'sku',
              render: (text, record) => record.isSummary ? '-' : text
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'category',
              render: (text, record) => record.isSummary ? '-' : text
            },
            {
              title: 'Branch',
              dataIndex: 'branch',
              key: 'branch',
              render: (text, record) => record.isSummary ? '-' : text
            },
            {
              title: 'Current Stock',
              dataIndex: 'currentQuantity',
              key: 'currentQuantity',
              render: (text, record) => record.isSummary ? '-' : text
            },
            {
              title: 'Buying Price',
              dataIndex: 'buyingPrice',
              key: 'buyingPrice',
              render: (text, record) => record.isSummary ? '-' : `KES ${text.toLocaleString()}`
            },
            {
              title: 'Min. Sell Price',
              dataIndex: 'minimumSellPrice',
              key: 'minimumSellPrice',
              render: (text, record) => record.isSummary ? '-' : `KES ${text.toLocaleString()}`
            },
            {
              title: 'Current Stock Value',
              dataIndex: 'currentStockValue',
              key: 'currentStockValue',
              render: (text, record) => record.isSummary ? '-' : `KES ${(text || 0).toLocaleString()}`
            },
            {
              title: 'Total Quantity Sold',
              dataIndex: 'totalQuantitySold',
              key: 'totalQuantitySold',
              render: (text, record) => record.isSummary ? '-' : (text || 0)
            },
            {
              title: 'Total Sales',
              dataIndex: 'totalSales',
              key: 'totalSales',
              render: (text, record) => `KES ${(text || 0).toLocaleString()}`
            },
            {
              title: 'Total Profit',
              dataIndex: 'totalProfit',
              key: 'totalProfit',
              render: (text, record) => `KES ${(text || 0).toLocaleString()}`
            },
            {
              title: 'Profit Margin',
              dataIndex: 'profitMargin',
              key: 'profitMargin',
              render: (text, record) => record.isSummary ? `${text || 0}%` : `${text || 0}%`
            },
            {
              title: 'Stock Status',
              dataIndex: 'stockStatus',
              key: 'stockStatus',
              render: (text, record) => {
                if (record.isSummary) return '-';
                const color = text === 'Out of Stock' ? 'red' : text === 'Low Stock' ? 'orange' : 'green';
                return <Tag color={color}>{text}</Tag>;
              }
            }
          ]}
          rowKey={(record) => record.isSummary ? 'summary' : record.sku}
          pagination={false}
          summary={(pageData) => {
            if (!pageData.length) return null;
            const summary = pageData.find(item => item.isSummary);
            if (!summary) return null;

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <strong>Total Items: {summary.totalItems}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>Out of Stock: {summary.outOfStock}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>Low Stock: {summary.lowStock}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>Total Stock Value: KES {summary.totalStockValue.toLocaleString()}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <strong>Total Sales: KES {summary.totalSales.toLocaleString()}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <strong>Total Profit from Sales: KES {summary.totalSalesProfit.toLocaleString()}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <strong>Average Profit Margin: {summary.averageProfitMargin.toFixed(2)}%</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane tab="Individual Sales" key="sales">
            <Table
              dataSource={salesReportData}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'saleDate',
                  key: 'saleDate',
                  render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
                },
                {
                  title: 'Receipt #',
                  dataIndex: 'saleId',
                  key: 'saleId',
                  render: (id: string) => id.substring(0, 8) + '...'
                },
                {
                  title: 'Customer',
                  dataIndex: 'customerName',
                  key: 'customerName'
                },
                {
                  title: 'Item',
                  dataIndex: 'itemName',
                  key: 'itemName'
                },
                {
                  title: 'Category',
                  dataIndex: 'itemCategory',
                  key: 'itemCategory'
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantitySold',
                  key: 'quantitySold'
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'sellPrice',
                  key: 'sellPrice',
                  render: (price: number) => `KES ${price.toLocaleString()}`
                },
                {
                  title: 'Total Amount',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  render: (amount: number) => `KES ${amount.toLocaleString()}`
                },
                {
                  title: 'Profit',
                  dataIndex: 'profit',
                  key: 'profit',
                  render: (profit: number) => `KES ${profit.toLocaleString()}`
                },
                {
                  title: 'Branch',
                  dataIndex: 'branchName',
                  key: 'branchName'
                }
              ]}
              rowKey="saleId"
              pagination={{ pageSize: 10 }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Modal>
      <Modal
        title="Sales Receipt"
        open={isReceiptModalVisible}
        onCancel={() => setIsReceiptModalVisible(false)}
        footer={[
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintReceipt}
          >
            Print Receipt
          </Button>,
          <Button key="close" onClick={() => setIsReceiptModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div ref={receiptRef}>
          <PDFReceipt
            sale={currentSale}
            customer={currentCustomer}
            item={currentItem}
          />
        </div>
      </Modal>

      {/* Multi-Item Checkout Modal */}
      <Modal
        title="Checkout"
        open={isMultiItemCheckoutVisible}
        onCancel={() => setIsMultiItemCheckoutVisible(false)}
        footer={null}
        width={isMobile ? '100%' : 800}
        style={isMobile ? { top: 0, paddingBottom: 0 } : {}}
      >
        <MultiItemCheckout
          cartItems={cartItems}
          customers={customers || []}
          onCustomerPhoneChange={handleCustomerPhoneChange}
          onCheckout={handleMultiItemSale}
          onCancel={() => setIsMultiItemCheckoutVisible(false)}
          isNewCustomer={isNewCustomer}
          currentCustomer={currentCustomer}
          onUpdateCartItemSellPrice={handleUpdateCartItemSellPrice}
        />
      </Modal>

      {/* Multi-Item Receipt Modal */}
      <Modal
        title="Sales Receipt"
        open={isMultiItemReceiptVisible}
        onCancel={() => setIsMultiItemReceiptVisible(false)}
        footer={[
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintMultiItemReceipt}
          >
            Print Receipt
          </Button>,
          <Button key="close" onClick={() => setIsMultiItemReceiptVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        <div ref={multiItemReceiptRef}>
          <MultiItemPDFReceipt
            sale={multiItemSale}
            customer={currentCustomer}
          />
        </div>
      </Modal>
    </PageLayout>
  );
}
