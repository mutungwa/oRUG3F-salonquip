'use client'

import { generatePDFReceipt } from '@/components/PDFReceipt'
import { useUserContext } from '@/core/context'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { Sale, SaleItem } from '@/types/common'
import { DownloadOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs

export default function StockManagementPage() {
  const { enqueueSnackbar } = useSnackbar()
  const router = useRouter()
  const { user, checkRole } = useUserContext()
  const isAdmin = checkRole('admin')

  const [isExporting, setIsExporting] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [searchText, setSearchText] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const receiptRef = useRef()

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

  const {
    data: items,
    isLoading,
    refetch,
  } = Api.item.findMany.useQuery({
    include: { branch: true },
  })

  const { data: customers } = Api.customer.findMany.useQuery({});
  const { data: sales } = Api.sale.findMany.useQuery({
    orderBy: { saleDate: 'desc' },
    take: 200,
    include: { saleItems: true }
  });

  // Create a map of items with their associated sales
  const itemsWithSalesData = useMemo(() => {
    if (!items || !sales) return [];

    // Create a map of items with their associated sales
    return items.map(item => {
      // Find all sales for this item
      const itemSales = sales.filter(sale => sale.itemId === item.id);

      return {
        ...item,
        sales: itemSales
      };
    }).filter(item => item.sales.length > 0); // Only include items with sales
  }, [items, sales]);

  // Filter sales data based on search and date range
  const filteredSales = useMemo(() => {
    if (!sales) return [];

    let filtered = sales;

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day').valueOf();
      const endDate = dateRange[1].endOf('day').valueOf();

      filtered = filtered.filter(sale => {
        const saleDate = dayjs(sale.saleDate).valueOf();
        return saleDate >= startDate && saleDate <= endDate;
      });
    }

    // Search text filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(sale => {
        // Search in sale properties
        const saleMatches = 
          sale.branchName.toLowerCase().includes(searchLower) ||
          (sale.customerName && sale.customerName.toLowerCase().includes(searchLower)) ||
          (sale.itemName && sale.itemName.toLowerCase().includes(searchLower)) ||
          (sale.userName && sale.userName.toLowerCase().includes(searchLower));

        // Search in sale items if they exist
        const saleItemsMatch = sale.saleItems?.some(item => 
          item.itemName.toLowerCase().includes(searchLower) ||
          item.itemCategory.toLowerCase().includes(searchLower)
        );

        return saleMatches || saleItemsMatch;
      });
    }

    return filtered;
  }, [sales, dateRange, searchText]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const prepareCSVData = () => {
    if (!filteredSales?.length) return '';

    const csvHeaders = [
      'Transaction Date',
      'Transaction ID',
      'Items',
      'Customer',
      'Branch',
      'Total Quantity',
      'Total Amount (KES)',
      'Total Profit (KES)',
      'Payment Method'
    ].join(',');

    const csvRows = filteredSales.map(sale => {
      // Get items list - handle both legacy and new format
      let itemsList = '';
      let totalQty = 0;
      
      if (sale.saleItems && sale.saleItems.length > 0) {
        itemsList = sale.saleItems.map(item => `${item.itemName} (${item.quantitySold})`).join('; ');
        totalQty = sale.saleItems.reduce((sum, item) => sum + item.quantitySold, 0);
      } else if (sale.itemName) {
        itemsList = `${sale.itemName} (${sale.quantitySold})`;
        totalQty = sale.quantitySold || 0;
      }

      const totalAmount = sale.totalAmount || (sale.sellPrice && sale.quantitySold ? sale.sellPrice * sale.quantitySold : 0);
      const totalProfit = sale.totalProfit || sale.profit || 0;

      return [
        `"${dayjs(sale.saleDate).format('DD-MM-YYYY HH:mm')}"`,
        `"${sale.id}"`,
        `"${itemsList}"`,
        `"${sale.customerName || 'Walk-in'}"`,
        `"${sale.branchName}"`,
        totalQty,
        totalAmount.toFixed(2),
        totalProfit.toFixed(2),
        `"${sale.paymentMethod || 'Cash'}"`
      ].join(',');
    });

    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = async () => {
    try {
      setIsExporting(true);
      const csvContent = prepareCSVData();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      let filename = 'stock-report';
      if (dateRange && dateRange[0] && dateRange[1]) {
        filename += `-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}`;
      }
      if (searchText) {
        filename += `-search-${searchText}`;
      }
      filename += '.csv';

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      enqueueSnackbar('Report downloaded successfully', { variant: 'success' });
    } catch (error) {
      setIsExporting(false);
      enqueueSnackbar('Failed to download report', { variant: 'error' });
    }
  };

  const handleReprintReceipt = async (saleRecord: any) => {
    try {
      // Determine if this is a legacy single-item sale or a multi-item sale
      const isLegacySale = saleRecord.itemName && !saleRecord.saleItems?.length;
      
      let saleItems: SaleItem[] = [];
      
      if (isLegacySale) {
        // Handle legacy sales with item data directly in the sale record
        saleItems = [{
          id: saleRecord.id,
          itemName: saleRecord.itemName,
          itemCategory: saleRecord.itemCategory || 'General',
          sellPrice: saleRecord.sellPrice,
          quantitySold: saleRecord.quantitySold,
          profit: saleRecord.profit
        }];
      } else if (saleRecord.saleItems?.length > 0) {
        // Handle new multi-item sales
        saleItems = saleRecord.saleItems.map((item: any) => ({
          id: item.id,
          itemName: item.itemName,
          itemCategory: item.itemCategory,
          sellPrice: item.sellPrice,
          quantitySold: item.quantitySold,
          profit: item.profit
        }));
      } else {
        // Fallback for sales without proper item data
        enqueueSnackbar('No item data found for this sale', { variant: 'warning' });
        return;
      }

      // Convert the sale record to the expected Sale format
      const sale: Sale = {
        id: saleRecord.id,
        saleDate: saleRecord.saleDate,
        branchName: saleRecord.branchName,
        userName: saleRecord.userName || 'System',
        customerName: saleRecord.customerName,
        customerPhone: saleRecord.customerPhone,
        totalAmount: saleRecord.totalAmount || (isLegacySale ? saleRecord.sellPrice * saleRecord.quantitySold : 0),
        totalProfit: saleRecord.totalProfit || (isLegacySale ? saleRecord.profit : 0),
        loyaltyPointsEarned: saleRecord.loyaltyPointsEarned || 0,
        loyaltyPointsRedeemed: saleRecord.loyaltyPointsRedeemed || 0,
        paymentMethod: saleRecord.paymentMethod || 'Cash',
        paymentReference: saleRecord.paymentReference,
        saleItems: saleItems
      };

      // Create customer object if customer data exists
      const customer = saleRecord.customerName ? {
        id: saleRecord.customerId || '',
        name: saleRecord.customerName,
        phoneNumber: saleRecord.customerPhone || '',
        loyaltyPoints: 0
      } : null;

      await generatePDFReceipt(sale, customer, { format: 'detailed', printInNewTab: true });
      enqueueSnackbar('Receipt generated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Failed to reprint receipt:', error);
      enqueueSnackbar('Failed to generate receipt', { variant: 'error' });
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: 'Transaction Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
      render: (date: string) => dayjs(date).format(isMobile ? 'DD/MM/YY' : 'DD-MM-YYYY HH:mm'),
      sorter: (a: any, b: any) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
      defaultSortOrder: 'descend' as const,
      width: isMobile ? 100 : 150,
    },
    {
      title: 'Items Sold',
      key: 'items',
      render: (_, record: any) => {
        // Handle both legacy single-item sales and new multi-item sales
        if (record.saleItems && record.saleItems.length > 0) {
          if (record.saleItems.length === 1) {
            const item = record.saleItems[0];
            return (
              <div>
                <div style={{ fontWeight: 'bold' }}>{item.itemName}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Qty: {item.quantitySold} @ KES {item.sellPrice.toLocaleString()}
                </div>
              </div>
            );
          } else {
            return (
              <div>
                <div style={{ fontWeight: 'bold' }}>{record.saleItems[0].itemName}</div>
                <div style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer' }}>
                  +{record.saleItems.length - 1} more item{record.saleItems.length > 2 ? 's' : ''} (Click to expand)
                </div>
              </div>
            );
          }
        } else if (record.itemName) {
          // Legacy sales format
          return (
            <div>
              <div style={{ fontWeight: 'bold' }}>{record.itemName}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Qty: {record.quantitySold} @ KES {record.sellPrice?.toLocaleString()}
              </div>
            </div>
          );
        }
        return 'No items';
      },
      ellipsis: isMobile,
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text: string) => text || 'Walk-in',
      responsive: ['md'],
      width: 120,
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      responsive: ['sm'],
      width: 100,
    },
    {
      title: 'Total Amount',
      key: 'totalAmount',
      render: (_, record: any) => {
        let total = 0;
        if (record.totalAmount) {
          total = record.totalAmount;
        } else if (record.saleItems && record.saleItems.length > 0) {
          total = record.saleItems.reduce((sum: number, item: any) => sum + (item.sellPrice * item.quantitySold), 0);
        } else if (record.sellPrice && record.quantitySold) {
          total = record.sellPrice * record.quantitySold;
        }
        return (
          <Tag color="blue" style={{ fontWeight: 'bold' }}>
            KES {total.toLocaleString()}
          </Tag>
        );
      },
      width: 120,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: any) => (
        <Tooltip title="Print Receipt">
          <Button
            type="primary"
            size="small"
            icon={<PrinterOutlined />}
            onClick={() => handleReprintReceipt(record)}
          >
            {isMobile ? '' : 'Print'}
          </Button>
        </Tooltip>
      ),
      width: isMobile ? 60 : 100,
      fixed: isMobile ? 'right' as const : undefined,
    },
  ];

  const salesTrendData = useMemo(() => {
    if (!filteredSales) return [];
    
    // Group sales by date
    const salesByDate = filteredSales.reduce((acc: any, sale: any) => {
      const dateKey = dayjs(sale.saleDate).format('YYYY-MM-DD');
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, totalSold: 0, totalProfit: 0, transactionCount: 0 };
      }
      
      let saleQty = 0;
      let saleProfit = 0;
      
      if (sale.saleItems && sale.saleItems.length > 0) {
        saleQty = sale.saleItems.reduce((sum: number, item: any) => sum + item.quantitySold, 0);
        saleProfit = sale.totalProfit || sale.saleItems.reduce((sum: number, item: any) => sum + item.profit, 0);
      } else {
        saleQty = sale.quantitySold || 0;
        saleProfit = sale.profit || 0;
      }
      
      acc[dateKey].totalSold += saleQty;
      acc[dateKey].totalProfit += saleProfit;
      acc[dateKey].transactionCount += 1;
      
      return acc;
    }, {});
    
    return Object.values(salesByDate).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  const branchPerformanceData = useMemo(() => {
    if (!filteredSales) return [];
    
    const branchStats = filteredSales.reduce((acc: any, sale: any) => {
      const branchName = sale.branchName;
      if (!acc[branchName]) {
        acc[branchName] = { branchName, totalSold: 0, totalProfit: 0, transactionCount: 0 };
      }
      
      let saleQty = 0;
      let saleProfit = 0;
      
      if (sale.saleItems && sale.saleItems.length > 0) {
        saleQty = sale.saleItems.reduce((sum: number, item: any) => sum + item.quantitySold, 0);
        saleProfit = sale.totalProfit || sale.saleItems.reduce((sum: number, item: any) => sum + item.profit, 0);
      } else {
        saleQty = sale.quantitySold || 0;
        saleProfit = sale.profit || 0;
      }
      
      acc[branchName].totalSold += saleQty;
      acc[branchName].totalProfit += saleProfit;
      acc[branchName].transactionCount += 1;
      
      return acc;
    }, {});
    
    return Object.values(branchStats);
  }, [filteredSales]);

  // Calculate total profit from filtered data
  const totalProfit = useMemo(() => {
    if (!filteredSales) return 0;
    return filteredSales.reduce((acc, sale) => {
      let saleProfit = 0;
      if (sale.totalProfit) {
        saleProfit = sale.totalProfit;
      } else if (sale.saleItems && sale.saleItems.length > 0) {
        saleProfit = sale.saleItems.reduce((sum: number, item: any) => sum + item.profit, 0);
      } else {
        saleProfit = sale.profit || 0;
      }
      return acc + saleProfit;
    }, 0);
  }, [filteredSales]);

  // Calculate branch-wise profits
  const branchProfits = useMemo(() => {
    if (!filteredSales) return [];

    const branchProfitMap = new Map<string, number>();

    filteredSales.forEach(sale => {
      let saleProfit = 0;
      if (sale.totalProfit) {
        saleProfit = sale.totalProfit;
      } else if (sale.saleItems && sale.saleItems.length > 0) {
        saleProfit = sale.saleItems.reduce((sum: number, item: any) => sum + item.profit, 0);
      } else {
        saleProfit = sale.profit || 0;
      }
      
      const currentProfit = branchProfitMap.get(sale.branchName) || 0;
      branchProfitMap.set(sale.branchName, currentProfit + saleProfit);
    });

    return Array.from(branchProfitMap.entries())
      .map(([branchName, profit]) => ({
        branchName,
        profit
      }))
      .sort((a, b) => b.profit - a.profit); // Sort by profit in descending order
  }, [filteredSales]);

  return (
    <PageLayout layout="full-width">
      <Row justify="center">
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Sales Trend" key="1">
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <LineChart
                    width={isMobile ? window.innerWidth - 50 : 500}
                    height={300}
                    data={salesTrendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    style={{ minWidth: '300px' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="totalSold" stroke="#8884d8" />
                    <Line type="monotone" dataKey="totalProfit" stroke="#82ca9d" />
                  </LineChart>
                </div>
              </TabPane>
              <TabPane tab="Branch Performance" key="2">
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <BarChart
                    width={isMobile ? window.innerWidth - 50 : 500}
                    height={300}
                    data={branchPerformanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    style={{ minWidth: '300px' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="branchName" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="totalSold" fill="#8884d8" />
                    <Bar dataKey="totalProfit" fill="#82ca9d" />
                  </BarChart>
                </div>
              </TabPane>
              <TabPane tab="Profit Summary" key="3">
                <div style={{
                  padding: isMobile ? '20px' : '40px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px',
                  width: '100%',
                  overflowX: 'hidden'
                }}>
                  <Title level={3}>Overall Profit Summary</Title>

                  {/* Overall Total Profit Card */}
                  <Card style={{ width: '100%', marginBottom: '20px' }}>
                    <Statistic
                      title={<Title level={4} style={{ fontSize: isMobile ? '18px' : '24px' }}>Total Profit (All Branches)</Title>}
                      value={totalProfit}
                      precision={2}
                      prefix="KES"
                      valueStyle={{
                        color: '#3f8600',
                        fontSize: isMobile ? '20px' : '24px',
                        wordBreak: 'break-word'
                      }}
                    />
                    {dateRange && dateRange[0] && dateRange[1] && (
                      <Text type="secondary" style={{ marginTop: '10px', display: 'block' }}>
                        From {dateRange[0].format('DD-MM-YYYY')} to {dateRange[1].format('DD-MM-YYYY')}
                      </Text>
                    )}
                  </Card>

                  {/* Branch-wise Profit Cards */}
                  <div style={{ width: '100%' }}>
                    <Title level={4} style={{ marginBottom: '20px', textAlign: 'left', fontSize: isMobile ? '16px' : '20px' }}>
                      Profit by Branch
                    </Title>
                    <Row gutter={[16, 16]}>
                      {branchProfits.map((branch) => (
                        <Col xs={24} sm={12} md={8} key={branch.branchName}>
                          <Card>
                            <Statistic
                              title={<div style={{ wordBreak: 'break-word' }}>{branch.branchName}</div>}
                              value={branch.profit}
                              precision={2}
                              prefix="KES"
                              valueStyle={{
                                color: '#3f8600',
                                fontSize: isMobile ? '16px' : '20px',
                                wordBreak: 'break-word'
                              }}
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  <div style={{ marginTop: '20px', width: '100%', padding: '0 10px' }}>
                    <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
                      * This summary reflects the total profit from all sales
                      {searchText && ' (filtered by current search)'}
                    </Text>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Title level={2}>Sales Transactions</Title>
          <Text>View all sales transactions with detailed item information and print receipts.</Text>
        </Col>
      </Row>
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              placeholder={isMobile ? "Search..." : "Search by customer, item, branch, or user..."}
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              value={searchText}
              allowClear
              style={{ fontSize: isMobile ? '14px' : '16px' }}
            />
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <RangePicker
                onChange={handleDateRangeChange}
                style={{ width: '100%' }}
                format="DD-MM-YYYY"
                value={dateRange}
                allowClear

              />
            </div>
            {isAdmin && (
              <Button
                type="primary"
                onClick={downloadCSV}
                icon={<DownloadOutlined />}
                loading={isExporting}
                disabled={!filteredSales?.length || isExporting}
                style={{ width: isMobile ? '100%' : 'auto' }}
              >
                {isExporting ? 'Preparing...' : isMobile ? 'Download' : 'Download Report'}
              </Button>
            )}
          </Space>
        </Col>
      </Row>
      <Row justify="center">
        <Col span={24}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <Table
              columns={columns}
              dataSource={filteredSales}
              loading={isLoading}
              rowKey="id"
              expandable={{
                expandedRowRender: (record: any) => {
                  // Only show expanded row for multi-item sales
                  if (!record.saleItems || record.saleItems.length <= 1) {
                    return null;
                  }

                  return (
                    <div style={{ padding: '10px', backgroundColor: '#fafafa' }}>
                      <Title level={5} style={{ marginBottom: '10px' }}>Transaction Items:</Title>
                      <Table
                        dataSource={record.saleItems}
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Item Name',
                            dataIndex: 'itemName',
                            key: 'itemName',
                          },
                          {
                            title: 'Category',
                            dataIndex: 'itemCategory',
                            key: 'itemCategory',
                            responsive: ['md'],
                          },
                          {
                            title: 'Quantity',
                            dataIndex: 'quantitySold',
                            key: 'quantitySold',
                            width: 80,
                          },
                          {
                            title: 'Unit Price',
                            dataIndex: 'sellPrice',
                            key: 'sellPrice',
                            render: (price: number) => `KES ${price.toLocaleString()}`,
                            width: 100,
                          },
                          {
                            title: 'Subtotal',
                            key: 'subtotal',
                            render: (_, item: any) => `KES ${(item.sellPrice * item.quantitySold).toLocaleString()}`,
                            width: 100,
                          },
                          {
                            title: 'Profit',
                            dataIndex: 'profit',
                            key: 'profit',
                            render: (profit: number) => (
                              <Tag color="green">KES {profit.toLocaleString()}</Tag>
                            ),
                            width: 100,
                          },
                        ]}
                        rowKey="id"
                      />
                      <div style={{ marginTop: '10px', textAlign: 'right' }}>
                        <Text strong>
                          Total: KES {(record.totalAmount || record.saleItems.reduce((sum: number, item: any) => sum + (item.sellPrice * item.quantitySold), 0)).toLocaleString()}
                        </Text>
                      </div>
                    </div>
                  );
                },
                rowExpandable: (record: any) => {
                  // Only allow expansion for multi-item sales
                  return record.saleItems && record.saleItems.length > 1;
                },
                expandIcon: ({ expanded, onExpand, record }) => {
                  // Only show expand icon for multi-item sales
                  if (!record.saleItems || record.saleItems.length <= 1) {
                    return null;
                  }
                  return (
                    <span
                      onClick={e => onExpand(record, e)}
                      style={{ cursor: 'pointer', color: '#1890ff' }}
                    >
                      {expanded ? '▼' : '▶'} 
                    </span>
                  );
                },
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} transactions`,
                responsive: true,
                size: isMobile ? 'small' : undefined
              }}
              scroll={{ x: isMobile ? 900 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </Col>
      </Row>
    </PageLayout>
  )
}