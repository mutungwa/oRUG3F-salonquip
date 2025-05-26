'use client'

import { useUserContext } from '@/core/context'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import {
    FileTextOutlined,
    SearchOutlined,
    SwapOutlined
} from '@ant-design/icons'
import { Prisma } from '@prisma/client'
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Typography
} from 'antd'
import dayjs from 'dayjs'
import { useParams, useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts'
import * as XLSX from 'xlsx'

const { Title, Text } = Typography
const { Option } = Select

const { TabPane } = Tabs

const { RangePicker } = DatePicker

// Define colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

// Update the type definition at the top of the file
type StockTransfer = {
  id: string;
  quantity: number;
  transferDate: string;
  itemId: string;
  fromBranchId: string;
  toBranchId: string;
  dateCreated: Date;
  dateUpdated: Date;
  item: {
    id: string;
    name: string;
    sku: string;
  } | null;
  fromBranch: {
    id: string;
    name: string;
  } | null;
  toBranch: {
    id: string;
    name: string;
  } | null;
};

export default function HomePage() {
  const router = useRouter()
  const params = useParams<any>()
  const { user, checkRole } = useUserContext()
  const { enqueueSnackbar } = useSnackbar()

  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [searchText, setSearchText] = useState<string>('')
  const [isTransferModalVisible, setIsTransferModalVisible] = useState(false)
  const [transferDetails, setTransferDetails] = useState({
    itemId: '',
    quantity: 0,
    toBranchId: '',
  })
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [transferCategoryId, setTransferCategoryId] = useState<string>('')
  const [transferSourceBranch, setTransferSourceBranch] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isReportModalVisible, setIsReportModalVisible] = useState(false)
  const [reportData, setReportData] = useState<any[]>([])
  const [reportBranch, setReportBranch] = useState<string | null>(null)
  const [reportDateRange, setReportDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [stockFilter, setStockFilter] = useState<string | null>(null)

  const isAdmin = checkRole('admin')

  // Handle window resize for responsive design
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const { data: branches, isLoading: branchesLoading } =
    Api.branch.findMany.useQuery({})
  const {
    data: items,
    isLoading: itemsLoading,
    refetch: refetchItems,
  } = Api.item.findMany.useQuery({
    where: {
      ...(selectedBranch ? { branchId: selectedBranch } : {}),
      ...(searchText ? { name: { contains: searchText } } : {}),
    },
    include: { branch: true },
  })

  const { data: existingItemInBranch } = Api.item.findFirst.useQuery(
    {
      where: {
        AND: [
          // Check by name and branch
          {
            name: selectedItem?.name || '',
            branchId: transferDetails.toBranchId,
          }
        ]
      },
    },
    {
      enabled: Boolean(selectedItem?.name && transferDetails.toBranchId),
    }
  )

  const { data: existingCategoryItems } = Api.item.findMany.useQuery(
    {
      where: {
        branchId: transferDetails.toBranchId,
        sku: {
          startsWith: transferCategoryId
        }
      },
      orderBy: {
        sku: 'desc'
      },
      take: 1
    },
    {
      enabled: Boolean(transferCategoryId && transferDetails.toBranchId),
    }
  )

  const { mutateAsync: transferStock } = Api.stockTransfer.create.useMutation()
  const { mutateAsync: updateItem } = Api.item.update.useMutation()
  const { mutateAsync: createItem } = Api.item.create.useMutation()

  const { data: salesData, isLoading: salesLoading, error: salesError } = Api.sale.findMany.useQuery({}, {
    onError: (error) => {
      console.error('Error fetching sales data:', error);
      enqueueSnackbar('Failed to fetch sales data. Please try again later.', { variant: 'error' });
    }
  });

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const aggregatedSalesData = useMemo(() => {
    if (!salesData) return [];

    const salesMap = new Map();

    salesData.forEach(sale => {
      if (salesMap.has(sale.itemName)) {
        salesMap.set(sale.itemName, salesMap.get(sale.itemName) + sale.quantitySold);
      } else {
        salesMap.set(sale.itemName, sale.quantitySold);
      }
    });

    return Array.from(salesMap.entries()).map(([name, totalSold]) => ({
      name,
      totalSold,
    }));
  }, [salesData]);

  const filteredSalesData = useMemo(() => {
    if (!salesData || !dateRange || !dateRange[0] || !dateRange[1]) return aggregatedSalesData;

    const startDate = dateRange[0].startOf('day').toISOString();
    const endDate = dateRange[1].endOf('day').toISOString();

    const filteredSalesMap = new Map();

    salesData.forEach(sale => {
      const saleDate = dayjs(sale.saleDate).toISOString();
      if (saleDate >= startDate && saleDate <= endDate) {
        if (filteredSalesMap.has(sale.itemName)) {
          filteredSalesMap.set(sale.itemName, filteredSalesMap.get(sale.itemName) + sale.quantitySold);
        } else {
          filteredSalesMap.set(sale.itemName, sale.quantitySold);
        }
      }
    });

    return Array.from(filteredSalesMap.entries()).map(([name, totalSold]) => ({
      name,
      totalSold,
    }));
  }, [salesData, dateRange]);

  const {
    data: recentTransfers,
    isLoading: transfersLoading,
    refetch: refetchTransfers
  } = Api.stockTransfer.findMany.useQuery({}, {
    onSuccess: (data) => {
      console.log('Transfers loaded in component:', data)
    }
  });

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value)
    refetchItems()
  }

  const handleSearch = () => {
    refetchItems()
  }

  const openTransferModal = (item: any) => {
    // Check if user has admin rights before allowing transfer
    if (!isAdmin) {
      enqueueSnackbar('Access Denied: Only administrators can transfer items', { variant: 'error' });
      return;
    }

    // Store the source branch separately for the transfer
    setTransferSourceBranch(item.branchId)
    setSelectedItem(item)
    setTransferDetails({
      itemId: item.id,
      quantity: 0,
      toBranchId: '',
    })
    setTransferCategoryId(item.sku.substring(0, 3))
    setIsTransferModalVisible(true)
  }

  const closeTransferModal = () => {
    setIsTransferModalVisible(false)
    setTransferDetails({
      itemId: '',
      quantity: 0,
      toBranchId: '',
    })
    setSelectedItem(null)
    setTransferCategoryId('')
    setTransferSourceBranch(null)
  }

  const handleTransfer = async () => {
    try {
      // Validations
      if (!selectedItem) {
        enqueueSnackbar('Source item not found', { variant: 'error' })
        return
      }

      if (transferDetails.quantity <= 0) {
        enqueueSnackbar('Transfer quantity must be greater than 0', {
          variant: 'error',
        })
        return
      }

      if (transferDetails.quantity > selectedItem.quantity) {
        enqueueSnackbar('Not enough stock in source branch', { variant: 'error' })
        return
      }

      if (!transferDetails.toBranchId) {
        enqueueSnackbar('Please select a destination branch', { variant: 'error' })
        return
      }

      if (selectedItem.branchId === transferDetails.toBranchId) {
        enqueueSnackbar('Cannot transfer to the same branch', { variant: 'error' })
        return
      }

      try {
        // Start a transaction-like sequence
        // 1. Update source item
        await updateItem({
          where: { id: selectedItem.id },
          data: {
            quantity: selectedItem.quantity - transferDetails.quantity,
          },
        })

        let destinationItemId: string;

        // 2. Handle destination item
        if (existingItemInBranch) {
          // Update existing item
          await updateItem({
            where: { id: existingItemInBranch.id },
            data: {
              quantity: existingItemInBranch.quantity + transferDetails.quantity,
              // Update other fields to ensure they're in sync
              price: selectedItem.price,
              description: selectedItem.description || '',
              category: selectedItem.category,
              minimumStockLevel: selectedItem.minimumStockLevel,
              origin: selectedItem.origin,
              imageUrl: selectedItem.imageUrl || ''
            },
          })
          destinationItemId = existingItemInBranch.id;
        } else {
          // Create new item in destination branch
          // Extract the category identifier (first 3 digits)
          const categoryId = selectedItem.sku.substring(0, 3);

          let newSku: string;
          if (existingCategoryItems && existingCategoryItems.length > 0) {
            // Get the last number and increment it
            const lastSku = existingCategoryItems[0].sku;
            const lastNumber = parseInt(lastSku.substring(3));
            newSku = `${categoryId}${(lastNumber + 1).toString().padStart(3, '0')}`;
          } else {
            // First item in this category for this branch
            newSku = `${categoryId}001`;
          }

          const newItem = await createItem({
            data: {
              name: selectedItem.name,
              description: selectedItem.description || '',
              category: selectedItem.category,
              price: selectedItem.price,
              sku: newSku,
              quantity: transferDetails.quantity,
              origin: selectedItem.origin,
              imageUrl: selectedItem.imageUrl || '',
              branchId: transferDetails.toBranchId,
              minimumStockLevel: selectedItem.minimumStockLevel,
            },
          })
          destinationItemId = newItem.id;
        }

        // 3. Create stock transfer record
        await transferStock({
          data: {
            quantity: transferDetails.quantity,
            transferDate: new Date().toISOString(),
            itemId: selectedItem.id,
            fromBranchId: transferSourceBranch || selectedItem.branchId,
            toBranchId: transferDetails.toBranchId
          }
        })

        enqueueSnackbar('Stock transferred successfully', { variant: 'success' })
        closeTransferModal()
        refetchItems()
        refetchTransfers()
      } catch (innerError: any) {
        console.error('Transfer operation failed:', innerError)
        enqueueSnackbar('Transfer failed: ' + (innerError.message || 'Unknown error'), { variant: 'error' })
      }
    } catch (error: any) {
      console.error('Transfer error:', error)
      enqueueSnackbar(error.message || 'Failed to transfer stock', { variant: 'error' })
    }
  }

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `KES ${price.toFixed(2)}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toString(),
    },
    {
      title: 'Branch',
      dataIndex: ['branch', 'name'],
      key: 'branch',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (
        text: any,
        record: Prisma.ItemGetPayload<{ include: { branch: true } }>,
      ) => (
        <Button
          icon={<SwapOutlined style={{ color: isAdmin ? 'black' : 'gray' }} />}
          onClick={() => openTransferModal(record)}
          disabled={record.quantity <= 0 || !isAdmin}
          title={!isAdmin ? 'Only administrators can transfer items' : record.quantity <= 0 ? 'No stock available to transfer' : 'Transfer item'}
        >
          Transfer
        </Button>
      ),
    },
  ]

  const totalItemsInBranches = branches?.map(branch => ({
    branchName: branch.name,
    totalItems: items?.filter(item => item.branchId === branch.id).reduce((acc, item) => acc + item.quantity, 0) || 0,
  }));

  const lowStockItems = items?.filter(item => item.quantity < item.minimumStockLevel);

  // Calculate inventory stats for dashboard
  const calculateInventoryStats = () => {
    if (!items) return { totalItems: 0, totalValue: 0, outOfStock: 0, lowStock: 0 };

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const outOfStock = items.filter(item => item.quantity === 0).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity < item.minimumStockLevel).length;

    return { totalItems, totalValue, outOfStock, lowStock };
  };

  // Calculate category distribution for dashboard
  const calculateCategoryDistribution = () => {
    if (!items) return [];

    const categories = new Map();
    items.forEach(item => {
      if (categories.has(item.category)) {
        categories.set(item.category, categories.get(item.category) + 1);
      } else {
        categories.set(item.category, 1);
      }
    });

    return Array.from(categories.entries()).map(([name, value], index) => ({
      name,
      value,
      fill: COLORS[index % COLORS.length]
    }));
  };

  // Calculate branch distribution for dashboard
  const calculateBranchDistribution = () => {
    if (!items || !branches) return [];

    const branchCounts = new Map();
    branches.forEach(branch => {
      branchCounts.set(branch.id, 0);
    });

    items.forEach(item => {
      if (branchCounts.has(item.branchId)) {
        branchCounts.set(item.branchId, branchCounts.get(item.branchId) + 1);
      }
    });

    return Array.from(branchCounts.entries()).map(([branchId, count], index) => {
      const branch = branches.find(b => b.id === branchId);
      return {
        name: branch?.name || 'Unknown',
        value: count,
        fill: COLORS[index % COLORS.length]
      };
    });
  };

  // Calculate stock level data for dashboard
  const calculateStockLevelData = () => {
    if (!items) return [];

    const outOfStock = items.filter(item => item.quantity === 0).length;
    const lowStock = items.filter(item => item.quantity > 0 && item.quantity < item.minimumStockLevel).length;
    const normalStock = items.filter(item => item.quantity >= item.minimumStockLevel).length;

    return [
      { name: 'Out of Stock', value: outOfStock, fill: '#FF8042' },
      { name: 'Low Stock', value: lowStock, fill: '#FFBB28' },
      { name: 'Normal', value: normalStock, fill: '#00C49F' }
    ];
  };

  // Get top selling items for dashboard
  const getTopSellingItems = () => {
    if (!salesData) return [];

    const itemSales = new Map();

    salesData.forEach(sale => {
      if (itemSales.has(sale.itemName)) {
        itemSales.set(sale.itemName, itemSales.get(sale.itemName) + sale.quantitySold);
      } else {
        itemSales.set(sale.itemName, sale.quantitySold);
      }
    });

    return Array.from(itemSales.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Generate initial report
  const generateInitialReport = () => {
    if (!items || !salesData) return;

    // Calculate total profit from all sales
    const totalSalesProfit = salesData.reduce((sum, sale) => sum + sale.profit, 0);

    const report = items.map(item => {
      // Calculate total sales for this item
      const itemSales = salesData.filter(sale => sale.itemId === item.id);
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
        minimumSellPrice: item.minimumSellPrice || 0,
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

  // Handle report modal open
  const handleReportModalOpen = () => {
    setIsReportModalVisible(true);
    generateInitialReport();
  };

  // Generate report with filters
  const generateReport = () => {
    if (!items || !salesData) return;

    // Filter sales based on date range if selected
    let filteredSales = salesData;
    if (reportDateRange) {
      const [startDate, endDate] = reportDateRange;
      filteredSales = salesData.filter(sale => {
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
        minimumSellPrice: item.minimumSellPrice || 0,
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

  // Handle Excel download
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

  // Handle stock filter
  const handleStockFilter = (value: string | null) => {
    setStockFilter(value);
  };

  // Log the error if it exists
  useEffect(() => {
    if (salesError) {
      console.error('Sales data error:', salesError);
    }
  }, [salesError]);

  // Get inventory stats
  const inventoryStats = calculateInventoryStats();
  const categoryData = calculateCategoryDistribution();
  const branchData = calculateBranchDistribution();
  const stockLevelData = calculateStockLevelData();
  const topSellingItems = getTopSellingItems();

  return (
    <PageLayout layout="full-width">
      {/* Dashboard Section */}
      <Title level={2}>Dashboard</Title>
      <Text>Overview of your inventory and sales performance</Text>

      {/* Alerts Section */}
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

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px', marginTop: '16px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={inventoryStats.totalItems}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Inventory Value"
              value={inventoryStats.totalValue}
              precision={2}
              prefix="KES "
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Out of Stock Items"
              value={inventoryStats.outOfStock}
              valueStyle={{ color: '#cf1322' }}
              suffix={`/ ${inventoryStats.totalItems}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={inventoryStats.lowStock}
              valueStyle={{ color: '#faad14' }}
              suffix={`/ ${inventoryStats.totalItems}`}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {/* Stock Level Distribution */}
        <Col xs={24} md={12}>
          <Card title="Stock Level Distribution">
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <PieChart width={isMobile ? 250 : 300} height={300}>
                <Pie
                  data={stockLevelData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                <Legend />
              </PieChart>
            </div>
          </Card>
        </Col>

        {/* Category Distribution */}
        <Col xs={24} md={12}>
          <Card title="Category Distribution">
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <PieChart width={isMobile ? 250 : 300} height={300}>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                <Legend />
              </PieChart>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Report Button */}
      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={handleReportModalOpen}
        >
          Generate Inventory Report
        </Button>
      </div>

      {/* Original Home Page Content */}
      <Card style={{ marginBottom: '20px' }}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Total Items in Branches" key="1">
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <BarChart
                width={isMobile ? window.innerWidth - 50 : 500}
                height={300}
                data={totalItemsInBranches}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                style={{ minWidth: '300px' }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="branchName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalItems" fill="#8884d8" />
              </BarChart>
            </div>
          </TabPane>
          <TabPane tab="Recent Transfers" key="2">
            {transfersLoading ? (
              <div>Loading transfers...</div>
            ) : !recentTransfers || recentTransfers.length === 0 ? (
              <div>No transfers found</div>
            ) : (
              <>
                <Button
                  onClick={() => refetchTransfers()}
                  style={{ marginBottom: '16px' }}
                >
                  Refresh Transfers
                </Button>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <Table
                    dataSource={recentTransfers}
                    columns={[
                      {
                        title: 'Item Name',
                        key: 'itemName',
                        render: (_, record: StockTransfer) => {
                          return record.item?.name || 'N/A';
                        },
                        ellipsis: isMobile
                      },
                      {
                        title: 'Quantity',
                        dataIndex: 'quantity',
                        key: 'quantity'
                      },
                      {
                        title: 'From Branch',
                        key: 'fromBranch',
                        render: (_, record: StockTransfer) => {
                          return record.fromBranch?.name || 'N/A';
                        },
                        responsive: ['md']
                      },
                      {
                        title: 'To Branch',
                        key: 'toBranch',
                        render: (_, record: StockTransfer) => {
                          return record.toBranch?.name || 'N/A';
                        },
                        responsive: ['md']
                      },
                      {
                        title: 'Date',
                        dataIndex: 'transferDate',
                        key: 'transferDate',
                        render: (date: string) => dayjs(date).format(isMobile ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm')
                      },
                    ]}
                    rowKey="id"
                    pagination={{
                      pageSize: 5,
                      size: isMobile ? 'small' : undefined
                    }}
                    scroll={{ x: isMobile ? 600 : undefined }}
                    size={isMobile ? 'small' : 'middle'}
                  />
                </div>
              </>
            )}
          </TabPane>
          <TabPane tab="Low Stock Levels" key="3">
            <div style={{ width: '100%', overflowX: 'auto' }}>
              {isMobile ? (
                <ul style={{ paddingLeft: '20px' }}>
                  {lowStockItems?.map(item => (
                    <li key={item.id} style={{ marginBottom: '10px', wordBreak: 'break-word' }}>
                      <strong>{item.name}</strong> - {item.quantity} in stock
                      <br />
                      <small>{item.category} - {item.description}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul>
                  {lowStockItems?.map(item => (
                    <li key={item.id}>
                      {item.name} - {item.description} - {item.category} - {item.quantity} in stock
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabPane>
          <TabPane tab="Sales Comparison" key="4">
            <div style={{ width: '100%', overflowX: 'auto', marginBottom: '20px' }}>
              <RangePicker
                onChange={setDateRange}
                style={{ marginBottom: '20px', width: isMobile ? '100%' : 'auto' }}
              />
            </div>
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <BarChart
                width={isMobile ? window.innerWidth - 50 : 600}
                height={300}
                data={filteredSalesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                style={{ minWidth: '300px' }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalSold" fill="#8884d8" />
              </BarChart>
            </div>
            <div style={{ marginTop: '20px' }}>
              <Title level={4}>Sales Summary</Title>
              <Text>
                Most Sold Item: {filteredSalesData.length > 0 ? filteredSalesData.reduce((max, item) => item.totalSold > max.totalSold ? item : max, filteredSalesData[0]).name : 'N/A'}
              </Text>
              <br />
              <Text>
                Least Sold Item: {filteredSalesData.length > 0 ? filteredSalesData.reduce((min, item) => item.totalSold < min.totalSold ? item : min, filteredSalesData[0]).name : 'N/A'}
              </Text>
            </div>
          </TabPane>
        </Tabs>
      </Card>
      <Title level={2} style={{ textAlign: 'center' }}>
        Inventory Management
      </Title>
      <Text
        style={{ textAlign: 'center', display: 'block', marginBottom: '20px' }}
      >
        View and manage your stock across different branches
      </Text>

      {/* Search and Filter Section */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Select
          placeholder="Select Branch"
          onChange={handleBranchChange}
          loading={branchesLoading}
          style={{ width: isMobile ? '100%' : 200 }}
          allowClear
        >
          {branches?.map(branch => (
            <Option key={branch.id} value={branch.id}>
              {branch.name}
            </Option>
          ))}
        </Select>
        <Input
          placeholder={isMobile ? "Search..." : "Search by item name"}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: isMobile ? '100%' : 200 }}
          prefix={<SearchOutlined />}
        />
        <Button
          type="primary"
          onClick={handleSearch}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          Search
        </Button>
      </div>

      {/* Items Table */}
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <Table
          dataSource={items}
          columns={columns}
          loading={itemsLoading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            size: isMobile ? 'small' : undefined
          }}
          scroll={{ x: isMobile ? 800 : undefined }}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      {/* Transfer Modal */}
      <Modal
        title="Transfer Stock"
        open={isTransferModalVisible}
        onCancel={closeTransferModal}
        onOk={handleTransfer}
        okButtonProps={{
          disabled:
            !transferDetails.quantity ||
            !transferDetails.toBranchId ||
            transferDetails.quantity > (selectedItem?.quantity || 0) ||
            selectedBranch === transferDetails.toBranchId,
        }}
        width={isMobile ? '95%' : 520}
        style={{
          top: isMobile ? 20 : 100,
          maxWidth: isMobile ? '95vw' : '520px'
        }}
        styles={{
          body: {
            maxHeight: isMobile ? '70vh' : '80vh',
            overflowY: 'auto'
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item
            label="Item"
            help={`Available quantity: ${selectedItem?.quantity || 0}`}
          >
            <Input value={selectedItem?.name} disabled />
          </Form.Item>

          <Form.Item label="Quantity">
            <InputNumber
              min={1}
              max={selectedItem?.quantity || 0}
              value={transferDetails.quantity}
              onChange={value =>
                setTransferDetails({ ...transferDetails, quantity: value || 0 })
              }
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Destination Branch">
            <Select
              placeholder="Select destination branch"
              value={transferDetails.toBranchId || undefined}
              onChange={value =>
                setTransferDetails({ ...transferDetails, toBranchId: value })
              }
              style={{ width: '100%' }}
            >
              {branches
                ?.filter(branch => branch.id !== transferSourceBranch)
                .map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    {branch.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          {existingItemInBranch && (
            <Form.Item>
              <div style={{ color: '#1890ff' }}>
                This item already exists in the destination branch with quantity: {existingItemInBranch.quantity}
              </div>
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Report Modal */}
      <Modal
        title="Inventory Report"
        open={isReportModalVisible}
        onCancel={() => setIsReportModalVisible(false)}
        width={isMobile ? '95%' : 800}
        footer={[
          <Button key="close" onClick={() => setIsReportModalVisible(false)}>
            Close
          </Button>,
          <Button key="download" type="primary" onClick={handleDownloadExcel}>
            Download Excel
          </Button>
        ]}
      >
        <div style={{ marginBottom: '20px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Branch">
                <Select
                  placeholder="Filter by Branch"
                  allowClear
                  style={{ width: '100%' }}
                  value={reportBranch}
                  onChange={(value) => {
                    setReportBranch(value);
                    generateReport();
                  }}
                >
                  {branches?.map(branch => (
                    <Option key={branch.id} value={branch.id}>{branch.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Date Range">
                <RangePicker
                  style={{ width: '100%' }}
                  value={reportDateRange}
                  onChange={(dates) => {
                    setReportDateRange(dates);
                    generateReport();
                  }}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        <Table
          dataSource={reportData.filter(item => !item.isSummary)}
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              key: 'name',
              ellipsis: true
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'category',
              ellipsis: true
            },
            {
              title: 'Branch',
              dataIndex: 'branch',
              key: 'branch',
              ellipsis: true
            },
            {
              title: 'Stock',
              dataIndex: 'currentQuantity',
              key: 'currentQuantity',
              render: (text, record) => (
                <span style={{
                  color: record.stockStatus === 'Out of Stock' ? 'red' :
                    record.stockStatus === 'Low Stock' ? 'orange' : 'inherit'
                }}>
                  {text}
                </span>
              )
            },
            {
              title: 'Value',
              dataIndex: 'currentStockValue',
              key: 'currentStockValue',
              render: (value) => `KES ${value.toLocaleString()}`
            },
            {
              title: 'Sales',
              dataIndex: 'totalSales',
              key: 'totalSales',
              render: (value) => `KES ${value.toLocaleString()}`
            },
            {
              title: 'Profit',
              dataIndex: 'totalProfit',
              key: 'totalProfit',
              render: (value) => `KES ${value.toLocaleString()}`
            }
          ]}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
          summary={() => {
            const summary = reportData.find(item => item.isSummary);
            return summary ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <strong>Summary</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong>{summary.totalItems}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <strong>KES {summary.totalStockValue.toLocaleString()}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <strong>KES {summary.totalSales.toLocaleString()}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6}>
                    <strong>KES {summary.totalProfit.toLocaleString()}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : null;
          }}
        />
      </Modal>
    </PageLayout>
  )
}