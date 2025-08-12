'use client';

import { useUserContext } from '@/core/context';
import { Api } from '@/core/trpc';
import { PageLayout } from '@/designSystem/layouts/Page.layout';
import {
    DeleteOutlined,
    DownloadOutlined,
    EditOutlined,
    FileTextOutlined,
    PlusOutlined,
    PrinterOutlined,
    SearchOutlined,
    ShoppingCartOutlined,
    UploadOutlined
} from '@ant-design/icons';
import {
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
    Typography,
    Upload
} from 'antd';
import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

// Import our unified components and services
import MultiItemCheckout from '@/components/MultiItemCheckout';
import { downloadPDFReceipt, generatePDFReceipt, printPDFReceipt } from '@/components/PDFReceipt';
import { CartProvider, useCart } from '@/contexts/CartContext';
import { useItemForm } from '@/hooks/useItemForm';
import { useReporting } from '@/hooks/useReporting';
import { useSalesForm } from '@/hooks/useSalesForm';
import { ItemWithBranch, Sale } from '@/types/common';
import { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Option } = Select;

// Create wrapper component to provide cart context
function ItemsManagementPageWrapper() {
  return (
    <CartProvider>
      <ItemsManagementPage />
    </CartProvider>
  );
}

function ItemsManagementPage() {
  const { user, checkRole } = useUserContext();
  const isAdmin = checkRole('admin');
  const { enqueueSnackbar } = useSnackbar();
  
  // Use our custom hooks
  const { form, handleCreateItem, handleUpdateItem, handleDeleteItem } = useItemForm();
  const {
    form: salesForm,
    isNewCustomer,
    currentCustomer,
    handleCustomerPhoneChange,
    processSale,
    resetForm: resetSalesForm
  } = useSalesForm();
  const {
    reportData,
    salesReportData,
    isReportModalVisible,
    reportDateRange,
    reportBranch,
    setReportDateRange,
    setReportBranch,
    generateInventoryReport,
    exportInventoryReport,
    openReportModal,
    closeReportModal
  } = useReporting();
  
  // Use cart context
  const {
    state: cartState,
    addItem: addToCart,
    removeItem,
    updateQuantity,
    updateSellPrice,
    clearCart
  } = useCart();

  // Local state
  const [editForm] = Form.useForm();
  const [items, setItems] = useState<ItemWithBranch[] | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<ItemWithBranch | null>(null);
  const [stockFilter, setStockFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportActiveTab, setReportActiveTab] = useState<string>('items');
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [isCartModalVisible, setIsCartModalVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Data queries
  const { data: branches } = Api.branch.findMany.useQuery({});
  const { data: fetchedItems, refetch } = Api.item.findMany.useQuery({ 
    include: { branch: true } 
  });
  const { data: customers } = Api.customer.findMany.useQuery({});
  const { data: sales } = Api.sale.findMany.useQuery({
    orderBy: { saleDate: 'desc' },
    take: 200
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setItems(fetchedItems);
  }, [fetchedItems]);

  // Item management handlers
  const handleAddItemSubmit = async (values: any) => {
    if (!isAdmin) {
      enqueueSnackbar('You do not have permission to add items', { variant: 'error' });
      return;
    }

    // Check for existing item
    const existingItem = items?.find(
      item =>
        item.name.toLowerCase() === values.name.toLowerCase() &&
        item.branchId === values.branch
    );

    if (existingItem) {
      enqueueSnackbar('An item with this name already exists in this branch', {
        variant: 'error'
      });
      return;
    }

    await handleCreateItem(values, refetch);
    setIsModalVisible(false);
  };

  const handleEditItemSubmit = async (values: any) => {
    if (!currentItem || !isAdmin) {
      enqueueSnackbar('You do not have permission to edit items', { variant: 'error' });
      return;
    }

    await handleUpdateItem(
      currentItem.id,
      values,
      currentItem,
      refetch,
      branches || []
    );
    setIsEditModalVisible(false);
    setCurrentItem(null);
  };

  const handleDeleteItemClick = async (itemId: string) => {
    if (!isAdmin) {
      enqueueSnackbar('You do not have permission to delete items', { variant: 'error' });
      return;
    }
    
    const itemToDelete = items?.find(item => item.id === itemId);
    if (!itemToDelete) {
      enqueueSnackbar('Item not found', { variant: 'error' });
      return;
    }

    await handleDeleteItem(itemId, itemToDelete, refetch);
  };

  // Sales handlers
  const handleCheckout = () => {
    if (cartState.items.length === 0) {
      notification.error({
        message: 'Empty cart',
        description: 'Please add items to cart before checkout',
        placement: 'bottomRight'
      });
      return;
    }
    setIsCheckoutVisible(true);
  };

  const handleSaleComplete = async (formValues: any) => {
    // Show immediate loading feedback
    const loadingNotification = notification.open({
      message: 'Processing Sale...',
      description: 'Completing your transaction...',
      placement: 'bottomRight',
      duration: 0, // Don't auto-close
      key: 'sale-processing'
    });

    try {
      console.log('Starting sale completion with cart items:', cartState.items);
      console.log('Form values:', formValues);
      
      const sale = await processSale(
        cartState.items,
        formValues,
        customers || [],
        fetchedItems || [],
        refetch
      );

      if (sale) {
        console.log('Sale completed successfully:', sale);
        
        // Immediately close loading and show success
        notification.destroy('sale-processing');
        
        // Clear UI state immediately for better UX
        clearCart();
        setIsCheckoutVisible(false);
        
        // Show success notification
        notification.success({
          message: 'Sale Completed!',
          description: `Transaction successful. Total: KES ${((sale.totalAmount || 0) - (sale.loyaltyPointsRedeemed || 0)).toLocaleString()}`,
          placement: 'bottomRight',
          duration: 4
        });

        // Ensure saleDate is a string for our Sale type
        const normalizedSale: Sale = {
          ...sale,
          saleDate: typeof sale.saleDate === 'string' ? sale.saleDate : sale.saleDate.toISOString()
        };
        setCurrentSale(normalizedSale);

        // Handle receipt printing/downloading asynchronously (non-blocking)
        if (formValues.printReceipt) {
          // Generate receipt in background - don't wait for it
          setTimeout(() => {
            const customer = customers?.find(c => c.id === normalizedSale.customerName) || null;
            generatePDFReceipt(normalizedSale, customer, { printInNewTab: true });
          }, 100); // Small delay to ensure UI updates first
        } else {
          // Show receipt modal for manual download option
          setTimeout(() => {
            setIsReceiptModalVisible(true);
          }, 200);
        }
      } else {
        notification.destroy('sale-processing');
        console.error('Sale completion returned null');
        notification.error({
          message: 'Sale Failed',
          description: 'Sale could not be completed. Please try again.',
          placement: 'bottomRight',
          duration: 4
        });
      }
    } catch (error) {
      notification.destroy('sale-processing');
      console.error('Sale processing failed:', error);
      notification.error({
        message: 'Sale Failed',
        description: 'An error occurred while processing the sale. Please try again.',
        placement: 'bottomRight',
        duration: 4
      });
    }
  };

  const handleCustomerPhoneChangeWrapper = (phone: string) => {
    handleCustomerPhoneChange(phone, customers || []);
  };

  // Cart handlers
  const handleAddToCartClick = (item: ItemWithBranch) => {
    addToCart(item);
    enqueueSnackbar(`${item.name} added to cart`, { variant: 'success' });
  };

  // Filtering logic
  const filteredItems = items?.filter(item => {
    const branchMatch = selectedBranch ? item.branchId === selectedBranch : true;
    
    let stockMatch = true;
    if (stockFilter === 'outOfStock') {
      stockMatch = item.quantity === 0;
    } else if (stockFilter === 'low') {
      stockMatch = item.quantity > 0 && item.quantity < item.minimumStockLevel;
    } else if (stockFilter === 'normal') {
      stockMatch = item.quantity >= item.minimumStockLevel;
    }

    const searchMatch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return branchMatch && stockMatch && searchMatch;
  }) || [];

  // Receipt handlers
  const handleViewReceipt = (sale: any) => {
    // For legacy single-item sales or new sales
    if (sale.itemId && !sale.saleItems) {
      const item = items?.find(i => i.id === sale.itemId);
      const saleWithItems: Sale = {
        ...sale,
        saleDate: typeof sale.saleDate === 'string' ? sale.saleDate : sale.saleDate.toISOString(),
        saleItems: [{
          id: sale.itemId,
          itemName: sale.itemName || item?.name || 'Unknown',
          itemCategory: sale.itemCategory || item?.category || 'Unknown',
          sellPrice: sale.sellPrice || 0,
          quantitySold: sale.quantitySold || 1,
          profit: sale.profit || 0
        }]
      };
      setCurrentSale(saleWithItems);
    } else {
      // Multi-item sales
      setCurrentSale({
        ...sale,
        saleDate: typeof sale.saleDate === 'string' ? sale.saleDate : sale.saleDate.toISOString(),
        saleItems: sale.saleItems || []
      });
    }
    setIsReceiptModalVisible(true);
  };

  const handlePrintReceipt = () => {
    if (currentSale) {
      const customer = customers?.find(c => c.id === currentSale.customerName) || null;
      // Non-blocking call
      printPDFReceipt(currentSale, customer);
    }
  };

  const handleDownloadReceipt = () => {
    if (currentSale) {
      const customer = customers?.find(c => c.id === currentSale.customerName) || null;
      // Non-blocking call
      downloadPDFReceipt(currentSale, customer);
    }
  };

  // Report handlers
  const handleOpenReport = () => {
    openReportModal();
    if (items && sales) {
      generateInventoryReport(items, sales);
    }
  };

  const handleGenerateReport = () => {
    if (items && sales) {
      generateInventoryReport(items, sales);
    }
  };

  // Table columns
  const columns: ColumnsType<ItemWithBranch> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description', responsive: ['md'] as any },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Branch', dataIndex: ['branch', 'name'], key: 'branch', responsive: ['lg'] as any },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price: number) => price ? `KES ${price.toLocaleString()}` : 'KES 0' },
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
            onClick={() => handleAddToCartClick(record)}
          >
            {isMobile ? 'Cart' : 'Add to Cart'}
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
                onClick={() => handleDeleteItemClick(record.id)}
              >
                {isMobile ? 'Del' : 'Delete'}
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageLayout>
      <div style={{ padding: isMobile ? '10px' : '24px' }}>
        <Typography.Title level={2} style={{ marginBottom: '24px' }}>
          Items Management
        </Typography.Title>
        {/* Header Controls */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '10px'
        }}>
          <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle">
            {isAdmin && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Add Item
              </Button>
            )}
            <Button
              type="default"
              icon={<FileTextOutlined />}
              onClick={handleOpenReport}
            >
              Generate Report
            </Button>
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => setIsCheckoutVisible(true)}
              disabled={cartState.items.length === 0}
              style={{ backgroundColor: cartState.items.length > 0 ? '#52c41a' : undefined }}
            >
              Cart ({cartState.items.length})
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Input
            placeholder="Search items..."
            prefix={<SearchOutlined />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, maxWidth: isMobile ? '100%' : '300px' }}
          />
          
          <Select
            placeholder="Filter by branch"
            allowClear
            value={selectedBranch}
            onChange={setSelectedBranch}
            style={{ width: isMobile ? '100%' : '200px' }}
          >
            {branches?.map(branch => (
              <Option key={branch.id} value={branch.id}>
                {branch.name}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="Stock level"
            allowClear
            value={stockFilter}
            onChange={setStockFilter}
            style={{ width: isMobile ? '100%' : '150px' }}
          >
            <Option value="outOfStock">Out of Stock</Option>
            <Option value="low">Low Stock</Option>
            <Option value="normal">Normal Stock</Option>
          </Select>
        </div>

        {/* Items Table */}
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} items`
          }}
          scroll={{ x: 'max-content' }}
          size={isMobile ? 'small' : 'middle'}
        />

        {/* Add Item Modal */}
        <Modal
          title="Add New Item"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddItemSubmit}
          >
            <Form.Item
              name="name"
              label="Item Name"
              rules={[{ required: true, message: 'Please enter item name' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please enter category' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="branch"
              label="Branch"
              rules={[{ required: true, message: 'Please select branch' }]}
            >
              <Select placeholder="Select branch">
                {branches?.map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    {branch.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="price"
              label="Price (KES)"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="minimumSellPrice"
              label="Minimum Sell Price (KES)"
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: 'Please enter SKU' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="quantity"
              label="Initial Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="minimumStockLevel"
              label="Minimum Stock Level"
              rules={[{ required: true, message: 'Please enter minimum stock level' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="origin"
              label="Origin"
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="image"
              label="Image"
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit">
                  Add Item
                </Button>
                <Button onClick={() => setIsModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Item Modal */}
        <Modal
          title="Edit Item"
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditItemSubmit}
          >
            <Form.Item
              name="name"
              label="Item Name"
              rules={[{ required: true, message: 'Please enter item name' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="Description"
            >
              <Input.TextArea rows={3} />
            </Form.Item>
            
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please enter category' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="branch"
              label="Branch"
              rules={[{ required: true, message: 'Please select branch' }]}
            >
              <Select placeholder="Select branch">
                {branches?.map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    {branch.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="price"
              label="Price (KES)"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="minimumSellPrice"
              label="Minimum Sell Price (KES)"
            >
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: 'Please enter SKU' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="minimumStockLevel"
              label="Minimum Stock Level"
              rules={[{ required: true, message: 'Please enter minimum stock level' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="origin"
              label="Origin"
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="image"
              label="Image"
            >
              <Upload
                beforeUpload={() => false}
                maxCount={1}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Form.Item>
            
            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit">
                  Update Item
                </Button>
                <Button onClick={() => setIsEditModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Checkout Modal */}
        <Modal
          title="Checkout"
          open={isCheckoutVisible}
          onCancel={() => setIsCheckoutVisible(false)}
          footer={null}
          width={isMobile ? '100%' : 800}
          style={isMobile ? { top: 0, paddingBottom: 0 } : {}}
        >
          <MultiItemCheckout
            cartItems={cartState.items}
            customers={customers || []}
            onCustomerPhoneChange={handleCustomerPhoneChangeWrapper}
            onCheckout={handleSaleComplete}
            onCancel={() => setIsCheckoutVisible(false)}
            isNewCustomer={isNewCustomer}
            currentCustomer={currentCustomer}
            onUpdateCartItemSellPrice={(itemId: string, sellPrice: number) => updateSellPrice(itemId, sellPrice)}
            onUpdateCartItemQuantity={(itemId: string, quantity: number) => updateQuantity(itemId, quantity)}
            onRemoveItem={removeItem}
          />
        </Modal>

        {/* Receipt Modal */}
        <Modal
          title="Sales Receipt"
          open={isReceiptModalVisible}
          onCancel={() => setIsReceiptModalVisible(false)}
          footer={[
            <Button
              key="download"
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleDownloadReceipt}
            >
              Download PDF
            </Button>,
            <Button
              key="print"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrintReceipt}
            >
              Print PDF
            </Button>,
            <Button key="close" onClick={() => setIsReceiptModalVisible(false)}>
              Close
            </Button>
          ]}
          width={800}
        >
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Receipt has been generated as PDF.</p>
            <p>Use the buttons below to download or print the receipt.</p>
          </div>
        </Modal>

        {/* Reports Modal */}
        <Modal
          title="Inventory Reports"
          open={isReportModalVisible}
          onCancel={closeReportModal}
          footer={[
            <Button key="close" onClick={closeReportModal}>
              Close
            </Button>,
            <Button
              key="export"
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => exportInventoryReport()}
            >
              Export to Excel
            </Button>
          ]}
          width={1000}
        >
          <Tabs activeKey={reportActiveTab} onChange={setReportActiveTab}>
            <Tabs.TabPane tab="Inventory Report" key="items">
              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <DatePicker.RangePicker
                    value={reportDateRange}
                    onChange={setReportDateRange}
                  />
                  <Select
                    placeholder="Select Branch"
                    value={reportBranch}
                    onChange={setReportBranch}
                    allowClear
                    style={{ width: 200 }}
                  >
                    {branches?.map(branch => (
                      <Option key={branch.id} value={branch.id}>
                        {branch.name}
                      </Option>
                    ))}
                  </Select>
                  <Button type="primary" onClick={handleGenerateReport}>
                    Generate Report
                  </Button>
                </Space>
              </div>
              
              <Table
                dataSource={reportData}
                columns={[
                  { title: 'Item Name', dataIndex: 'name', key: 'name' },
                  { title: 'Category', dataIndex: 'category', key: 'category' },
                  { title: 'Branch', dataIndex: 'branchName', key: 'branchName' },
                  { title: 'Current Stock', dataIndex: 'quantity', key: 'quantity' },
                  { 
                    title: 'Price', 
                    dataIndex: 'price', 
                    key: 'price', 
                    render: (price: number) => price ? `KES ${price.toLocaleString()}` : 'KES 0' 
                  },
                  { 
                    title: 'Total Value', 
                    dataIndex: 'totalValue', 
                    key: 'totalValue', 
                    render: (value: number) => value ? `KES ${value.toLocaleString()}` : 'KES 0' 
                  }
                ]}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Tabs.TabPane>
            
            <Tabs.TabPane tab="Sales Report" key="sales">
              <Table
                dataSource={salesReportData}
                columns={[
                  { title: 'Date', dataIndex: 'saleDate', key: 'saleDate' },
                  { title: 'Item', dataIndex: 'itemName', key: 'itemName' },
                  { title: 'Customer', dataIndex: 'customerName', key: 'customerName' },
                  { title: 'Quantity', dataIndex: 'quantitySold', key: 'quantitySold' },
                  { 
                    title: 'Amount', 
                    dataIndex: 'totalAmount', 
                    key: 'totalAmount', 
                    render: (amount: number) => amount ? `KES ${amount.toLocaleString()}` : 'KES 0' 
                  },
                  { 
                    title: 'Profit', 
                    dataIndex: 'profit', 
                    key: 'profit', 
                    render: (profit: number) => profit ? `KES ${profit.toLocaleString()}` : 'KES 0' 
                  },
                  { title: 'Branch', dataIndex: 'branchName', key: 'branchName' }
                ]}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            </Tabs.TabPane>
          </Tabs>
        </Modal>
      </div>
    </PageLayout>
  );
}

export default ItemsManagementPageWrapper;
