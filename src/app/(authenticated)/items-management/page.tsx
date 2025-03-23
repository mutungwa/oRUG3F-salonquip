'use client';

import { useUserContext } from '@/core/context';
import { useUploadPublic } from '@/core/hooks/upload';
import { Api } from '@/core/trpc';
import { PageLayout } from '@/designSystem/layouts/Page.layout';
import { DeleteOutlined, DollarOutlined, EditOutlined, PlusOutlined, SearchOutlined, FileTextOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { Prisma } from '@prisma/client';
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, DatePicker, Tabs, Checkbox, Card } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';
import { Document, Page, Text as PDFText, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';

const { Title, Text } = Typography;
const { Option } = Select;
const styles = {
  lowStockRow: {
    backgroundColor: '#fff2f0',
  }
};

// Add receipt styles
const receiptStyles = StyleSheet.create({
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

// Add Receipt component
const Receipt = ({ sale, customer, item }) => {
  return (
    <Document>
      <Page size="A4" style={receiptStyles.page}>
        <View style={receiptStyles.header}>
          <PDFText style={receiptStyles.title}>SALON QUIP</PDFText>
          <PDFText style={receiptStyles.subtitle}>Sales Receipt</PDFText>
        </View>
        
        <View style={receiptStyles.divider} />
        
        <View style={receiptStyles.row}>
          <PDFText style={receiptStyles.text}>Date:</PDFText>
          <PDFText style={receiptStyles.text}>{dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm')}</PDFText>
        </View>
        
        <View style={receiptStyles.row}>
          <PDFText style={receiptStyles.text}>Receipt #:</PDFText>
          <PDFText style={receiptStyles.text}>{sale.id}</PDFText>
        </View>
        
        <View style={receiptStyles.divider} />
        
        <View style={receiptStyles.row}>
          <PDFText style={receiptStyles.text}>Customer:</PDFText>
          <PDFText style={receiptStyles.text}>{customer?.name || 'Walk-in Customer'}</PDFText>
        </View>
        
        {customer?.phoneNumber && (
          <View style={receiptStyles.row}>
            <PDFText style={receiptStyles.text}>Phone:</PDFText>
            <PDFText style={receiptStyles.text}>{customer.phoneNumber}</PDFText>
          </View>
        )}
        
        <View style={receiptStyles.divider} />
        
        <View style={receiptStyles.row}>
          <PDFText style={receiptStyles.text}>Item:</PDFText>
          <PDFText style={receiptStyles.text}>{item.name}</PDFText>
        </View>
        
        <View style={receiptStyles.row}>
          <PDFText style={receiptStyles.text}>Quantity:</PDFText>
          <PDFText style={receiptStyles.text}>{sale.quantitySold}</PDFText>
        </View>
        
        <View style={receiptStyles.row}>
          <PDFText style={receiptStyles.text}>Unit Price:</PDFText>
          <PDFText style={receiptStyles.text}>KES {sale.sellPrice.toLocaleString()}</PDFText>
        </View>
        
        <View style={receiptStyles.row}>
          <PDFText style={receiptStyles.bold}>Total Amount:</PDFText>
          <PDFText style={receiptStyles.bold}>KES {(sale.sellPrice * sale.quantitySold).toLocaleString()}</PDFText>
        </View>
        
        {customer && (
          <>
            <View style={receiptStyles.divider} />
            <View style={receiptStyles.row}>
              <PDFText style={receiptStyles.text}>Points Earned:</PDFText>
              <PDFText style={receiptStyles.text}>KES {sale.loyaltyPointsEarned.toFixed(2)}</PDFText>
            </View>
            <View style={receiptStyles.row}>
              <PDFText style={receiptStyles.text}>Points Redeemed:</PDFText>
              <PDFText style={receiptStyles.text}>KES {sale.loyaltyPointsRedeemed.toFixed(2)}</PDFText>
            </View>
            <View style={receiptStyles.row}>
              <PDFText style={receiptStyles.bold}>Remaining Points:</PDFText>
              <PDFText style={receiptStyles.bold}>KES {(customer.loyaltyPoints).toFixed(2)}</PDFText>
            </View>
          </>
        )}
        
        <View style={receiptStyles.divider} />
        
        <View style={receiptStyles.footer}>
          <PDFText style={receiptStyles.text}>Thank you for your business!</PDFText>
        </View>
      </Page>
    </Document>
  );
};

export default function ItemsManagementPage() {
  const router = useRouter();
  const params = useParams<any>();
  const { user, checkRole } = useUserContext();
  const isAdmin = checkRole('admin');
  const { enqueueSnackbar } = useSnackbar();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [sellForm] = Form.useForm();
  const [items, setItems] = useState<Prisma.ItemGetPayload<{ include: { branch: true } }>[] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isSellModalVisible, setIsSellModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportBranch, setReportBranch] = useState<string | null>(null);
  const [reportDateRange, setReportDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const receiptRef = useRef();
  const [shouldPrintReceipt, setShouldPrintReceipt] = useState(true);

  const { data: branches } = Api.branch.findMany.useQuery({});
  const { data: fetchedItems, refetch } = Api.item.findMany.useQuery({ include: { branch: true } });
  const { mutateAsync: createItem } = Api.item.create.useMutation();
  const { mutateAsync: updateItem } = Api.item.update.useMutation();
  const { mutateAsync: deleteItem } = Api.item.delete.useMutation();
  const { mutateAsync: createSale } = Api.sale.create.useMutation();
  const { mutateAsync: upload } = useUploadPublic();
  const { data: customers } = Api.customer.findMany.useQuery({});
  const { mutateAsync: createCustomer } = Api.customer.create.useMutation();
  const { mutateAsync: updateCustomer } = Api.customer.update.useMutation();
  const { data: sales } = Api.sale.findMany.useQuery({});

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
      await createItem({
        data: {
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
        },
      });
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
                <span class="text">${currentItem.name}</span>
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

  const handleSellItem = async (item: Prisma.ItemGetPayload<{ include: { branch: true } }>, values: any) => {
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
        const profit = (values.sellPrice - fetchedItem.price) * values.quantitySold;

        // Handle customer and loyalty points
        let customerId = null;
        let customerName = null;
        let customerPhone = null;
        let loyaltyPointsEarned = 0;
        let loyaltyPointsRedeemed = 0;

        if (values.customerPhone) {
            // Try to find existing customer
            let customer = customers?.find(c => c.phoneNumber === values.customerPhone);
            let isNewCustomer = false;

            if (!customer && values.customerName) {
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

            if (customer) {
                customerId = customer.id;
                customerName = customer.name;
                customerPhone = customer.phoneNumber;

                // Only validate and handle redeem points for existing customers
                if (!isNewCustomer) {
                    loyaltyPointsRedeemed = values.redeemPoints || 0;
                    
                    // Validate redeem points only for existing customers
                    if (loyaltyPointsRedeemed > customer.loyaltyPoints) {
                        enqueueSnackbar('Cannot redeem more points than available', { variant: 'error' });
                        return;
                    }
                }

                // Calculate loyalty points (5% of profit for customer)
                loyaltyPointsEarned = profit * 0.05;

                // Update customer's loyalty points
                await updateCustomer({
                    where: { id: customer.id },
                    data: { 
                        loyaltyPoints: isNewCustomer ? 
                            loyaltyPointsEarned : // For new customers, just add earned points
                            customer.loyaltyPoints - loyaltyPointsRedeemed + loyaltyPointsEarned // For existing customers, handle both redeem and earn
                    }
                });

                // If this customer was referred, give points to referrer (2% of profit)
                if (customer.referredBy) {
                    const referrer = customers?.find(c => c.id === customer.referredBy);
                    if (referrer) {
                        const referrerPoints = profit * 0.02; // 2% of profit for referrer
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

        // Create sale record
        await createSale({
            data: {
                sellPrice: values.sellPrice,
                quantitySold: values.quantitySold,
                saleDate: new Date().toISOString(),
                itemId: item.id,
                branchId: item.branchId,
                userId: user?.id || '',
                itemName: item.name,
                branchName: item.branch?.name || '',
                userName: user?.name || '',
                itemCategory: item.category,
                itemPrice: item.price,
                profit: profit,
                customerId,
                customerName,
                customerPhone,
                loyaltyPointsEarned,
                loyaltyPointsRedeemed
            },
        });

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
      await deleteItem({ where: { id: itemId } });
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
      const imageUrl = values.image ? await upload({ file: values.image.file }) : null;
      await updateItem({
        where: { id: currentItem.id },
        data: {
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
        },
      });
      enqueueSnackbar('Item updated successfully', { variant: 'success' });
      refetch();
      editForm.resetFields();
      setIsEditModalVisible(false);
    } catch (error) {
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

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Branch', dataIndex: ['branch', 'name'], key: 'branch' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price: number) => price.toString() },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
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
    { title: 'Origin', dataIndex: 'origin', key: 'origin' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: any, record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<DollarOutlined />}
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
            <>
          <Button
            type="default"
            icon={<EditOutlined />}
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
          <Button type="default" danger icon={<DeleteOutlined />} onClick={() => handleDeleteItem(record.id)}>
            Delete
          </Button>
            </>
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

  // Update the generateInitialReport function
  const generateInitialReport = () => {
    if (!items || !sales) return;

    // Calculate total profit from all sales
    const totalSalesProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

    const report = items.map(item => {
      // Calculate total sales for this item
      const itemSales = sales.filter(sale => sale.itemId === item.id);
      const totalSales = itemSales.reduce((sum, sale) => sum + (sale.sellPrice * sale.quantitySold), 0);
      const totalQuantitySold = itemSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const totalProfit = itemSales.reduce((sum, sale) => sum + sale.profit, 0);

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

  // Update the generateReport function
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

    // Calculate total profit from all sales in the filtered period
    const totalSalesProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);

    const report = filteredItems.map(item => {
      // Calculate total sales for this item
      const itemSales = filteredSales.filter(sale => sale.itemId === item.id);
      const totalSales = itemSales.reduce((sum, sale) => sum + (sale.sellPrice * sale.quantitySold), 0);
      const totalQuantitySold = itemSales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const totalProfit = itemSales.reduce((sum, sale) => sum + sale.profit, 0);

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
      
      // Prepare the data for Excel
      const excelData = reportData.map(item => {
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

      // Create a worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // Set column widths
      const colWidths = [
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
      ws['!cols'] = colWidths;

      // Add the worksheet to the workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory Report');

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

  // Add this function to handle viewing past receipts
  const handleViewReceipt = (sale: any) => {
    const item = items?.find(i => i.id === sale.itemId);
    setCurrentSale(sale);
    setCurrentCustomer(customers?.find(c => c.id === sale.customerId) || null);
    setCurrentItem(item);
    setIsReceiptModalVisible(true);
  };

  // Add a new tab for Sales History
  const [activeTab, setActiveTab] = useState('items');

  return (
    <PageLayout layout="full-width">
      <Title level={2}>Items Management</Title>
      <Text>Manage your inventory by adding, viewing, and selling items.</Text>
      
      {/* Add Tabs */}
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
          <Space style={{ marginBottom: 16 }}>
            {isAdmin && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                Add Item
              </Button>
            )}
            <Button 
              type="primary" 
              icon={<FileTextOutlined />} 
              onClick={handleReportModalOpen}
              style={{ marginLeft: 8 }}
            >
              Generate Report
            </Button>
          </Space>
          <Select placeholder="Filter by Branch" onChange={handleFilterByBranch} style={{ width: 200, marginBottom: 20 }} allowClear>
            {branches?.map(branch => (
              <Option key={branch.id} value={branch.id}>
                {branch.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by Stock Level"
            onChange={handleStockFilter}
            style={{ width: 200 }}
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
            style={{ width: 300, marginLeft: 8, marginBottom: 20 }}
            prefix={<SearchOutlined />}
          />
          <Table 
            columns={columns} 
            dataSource={filteredItems} 
            rowKey="id"
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
                  <Table.Summary.Cell index={0} colSpan={9}> {/* Added index prop */}
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

      <Modal title="Add New Item" visible={isModalVisible} onCancel={() => setIsModalVisible(false)} footer={null}>
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
      <Modal title="Edit Item" visible={isEditModalVisible} onCancel={() => setIsEditModalVisible(false)} footer={null}>
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
        title="Inventory Report"
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
          {currentSale && (
            <Receipt
              sale={currentSale}
              customer={currentCustomer}
              item={currentItem}
            />
          )}
        </div>
      </Modal>
    </PageLayout>
  );
}
