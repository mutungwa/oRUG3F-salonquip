'use client'

import { useUserContext } from '@/core/context'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { DownloadOutlined, PrinterOutlined, SearchOutlined } from '@ant-design/icons'
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Modal,
    Row,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography
} from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

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

  return function PDFReceiptComponent({ sale, customer, item }: any) {
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
}), {
  ssr: false,
})

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
  const [isReceiptModalVisible, setIsReceiptModalVisible] = useState(false)
  const [currentSale, setCurrentSale] = useState<any>(null)
  const [currentCustomer, setCurrentCustomer] = useState<any>(null)
  const [currentItem, setCurrentItem] = useState<any>(null)
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
    take: 200
    // Note: saleItems relation will be available after migration
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

  const filteredData = useMemo(() => {
    if (!itemsWithSalesData) return [];

    let filtered = itemsWithSalesData;

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day').valueOf();
      const endDate = dateRange[1].endOf('day').valueOf();

      filtered = filtered.filter(item => {
        const filteredSales = item.sales.filter(sale => {
          const saleDate = dayjs(sale.saleDate).valueOf();
          return saleDate >= startDate && saleDate <= endDate;
        });
        return filteredSales.length > 0;
      }).map(item => ({
        ...item,
        sales: item.sales.filter(sale => {
          const saleDate = dayjs(sale.saleDate).valueOf();
          return saleDate >= startDate && saleDate <= endDate;
        })
      }));
    }

    // Search text filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(item => {
        return (
          item.name.toLowerCase().includes(searchLower) ||
          item.sku.toLowerCase().includes(searchLower) ||
          (item.description && item.description.toLowerCase().includes(searchLower)) ||
          item.sales.some(sale =>
            sale.branchName.toLowerCase().includes(searchLower)
          )
        );
      });
    }

    return filtered;
  }, [itemsWithSalesData, dateRange, searchText]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const prepareCSVData = () => {
    if (!filteredData?.length) return '';

    const csvHeaders = [
      'Item Name',
      'Branch',
      'Total Sold Quantity',
      'Profit (KES)',
      'Last Sold Date'
    ].join(',');

    const csvRows = filteredData.map(item => {
      const branchNames = [...new Set(item.sales.map((sale) => sale.branchName))]
      const totalSold = item.sales.reduce((acc, sale) => acc + sale.quantitySold, 0);
      const totalProfit = item.sales.reduce((acc, sale) => acc + sale.profit, 0);
      const lastSaleDate = item.sales.reduce((latest, sale) =>
        new Date(sale.saleDate) > new Date(latest.saleDate) ? sale : latest
      );

      return [
        `"${item.name}"`,
        `"${branchNames.join(', ')}"`,
        totalSold,
        totalProfit.toFixed(2),
        `"${dayjs(lastSaleDate.saleDate).format('DD-MM-YYYY')}"`
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

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: string, record: any) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Branch',
      dataIndex: 'sales',
      key: 'branch',
      render: (sales: any[]) => {
        const branchNames = [...new Set(sales.map((sale) => sale.branchName))]
        return branchNames.join(', ')
      },
    },
    {
      title: 'Total Sold Quantity',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: any[]) =>
        sales.reduce((acc, sale) => acc + sale.quantitySold, 0).toString(),
    },
    {
      title: 'Profit (KES)',
      dataIndex: 'sales',
      key: 'profit',
      render: (sales: any[]) => {
        const totalProfit = sales.reduce((acc, sale) => acc + sale.profit, 0);
        // Format number with commas and 2 decimal places
        const formattedProfit = totalProfit.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        return <Tag color="green">{`KES ${formattedProfit}`}</Tag>;
      },
    },
    {
      title: 'Last Sold Date',
      dataIndex: 'sales',
      key: 'lastSoldDate',
      render: (sales: any[]) => {
        const lastSale = sales.reduce((latest, sale) =>
          new Date(sale.saleDate) > new Date(latest.saleDate) ? sale : latest
        )
        return dayjs(lastSale.saleDate).format('DD-MM-YYYY')
      },
    },
  ]

  const salesTrendData = filteredData.map(item => ({
    date: dayjs(item.sales[0].saleDate).format('YYYY-MM-DD'),
    totalSold: item.sales.reduce((acc, sale) => acc + sale.quantitySold, 0),
    totalProfit: item.sales.reduce((acc, sale) => acc + sale.profit, 0),
  }));

  const branchPerformanceData = itemsWithSalesData?.reduce((acc, item) => {
    item.sales.forEach(sale => {
      const branch = acc.find(b => b.branchName === sale.branchName);
      if (branch) {
        branch.totalSold += sale.quantitySold;
        branch.totalProfit += sale.profit;
      } else {
        acc.push({
          branchName: sale.branchName,
          totalSold: sale.quantitySold,
          totalProfit: sale.profit,
        });
      }
    });
    return acc;
  }, [] as { branchName: string; totalSold: number; totalProfit: number; }[]);

  // Calculate total profit from filtered data
  const totalProfit = useMemo(() => {
    if (!filteredData) return 0;
    return filteredData.reduce((acc, item) => {
      const itemProfit = item.sales.reduce((saleAcc, sale) => saleAcc + sale.profit, 0);
      return acc + itemProfit;
    }, 0);
  }, [filteredData]);

  // Calculate branch-wise profits
  const branchProfits = useMemo(() => {
    if (!filteredData) return [];

    const branchProfitMap = new Map<string, number>();

    filteredData.forEach(item => {
      item.sales.forEach(sale => {
        const currentProfit = branchProfitMap.get(sale.branchName) || 0;
        branchProfitMap.set(sale.branchName, currentProfit + sale.profit);
      });
    });

    return Array.from(branchProfitMap.entries())
      .map(([branchName, profit]) => ({
        branchName,
        profit
      }))
      .sort((a, b) => b.profit - a.profit); // Sort by profit in descending order
  }, [filteredData]);

  const handleViewReceipt = (sale: any) => {
    const item = items?.find(i => i.id === sale.itemId);
    setCurrentSale(sale);
    setCurrentCustomer(customers?.find(c => c.id === sale.customerId) || null);
    setCurrentItem(item);
    setIsReceiptModalVisible(true);
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
                    <Tooltip />
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
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalSold" fill="#8884d8" />
                    <Bar dataKey="totalProfit" fill="#82ca9d" />
                  </BarChart>
                </div>
              </TabPane>
              <TabPane tab="Total Profit Summary" key="3">
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
              <TabPane tab="Sales History" key="4">
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <Table
                    dataSource={[...(sales || [])].sort((a, b) =>
                      new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
                    )}
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'saleDate',
                        key: 'saleDate',
                        render: (date: string) => dayjs(date).format(isMobile ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm'),
                        sorter: (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
                        defaultSortOrder: 'descend'
                      },
                      {
                        title: 'Item',
                        dataIndex: 'itemName',
                        key: 'itemName',
                        ellipsis: isMobile
                      },
                      {
                        title: 'Customer',
                        dataIndex: 'customerName',
                        key: 'customerName',
                        render: (text: string) => text || 'Walk-in',
                        ellipsis: isMobile,
                        responsive: ['md']
                      },
                      {
                        title: 'Qty',
                        dataIndex: 'quantitySold',
                        key: 'quantitySold'
                      },
                      {
                        title: 'Price',
                        dataIndex: 'sellPrice',
                        key: 'sellPrice',
                        render: (price: number) => `KES ${price.toLocaleString()}`,
                        responsive: ['sm']
                      },
                      {
                        title: 'Total',
                        key: 'total',
                        render: (_, record: any) => `KES ${(record.sellPrice * record.quantitySold).toLocaleString()}`
                      },
                      {
                        title: 'Actions',
                        key: 'actions',
                        render: (_, record: any) => (
                          <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            onClick={() => handleViewReceipt(record)}
                            size={isMobile ? 'small' : 'middle'}
                          >
                            {isMobile ? '' : 'View Receipt'}
                          </Button>
                        )
                      }
                    ]}
                    rowKey="id"
                    pagination={{
                      pageSize: 10,
                      size: isMobile ? 'small' : undefined
                    }}
                    scroll={{ x: isMobile ? 800 : undefined }}
                    size={isMobile ? 'small' : 'middle'}
                  />
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Title level={2}>Sales Management</Title>
          <Text>View and manage all sales records.</Text>
        </Col>
      </Row>
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              placeholder={isMobile ? "Search..." : "Search by name, SKU, description, or branch name..."}
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
                disabled={!filteredData?.length || isExporting}
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
              dataSource={filteredData}
              loading={isLoading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`,
                responsive: true,
                size: isMobile ? 'small' : undefined
              }}
              scroll={{ x: isMobile ? 800 : undefined }}
              size={isMobile ? 'small' : 'middle'}
            />
          </div>
        </Col>
      </Row>
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
            size={isMobile ? 'small' : 'middle'}
          >
            {isMobile ? 'Print' : 'Print Receipt'}
          </Button>,
          <Button
            key="close"
            onClick={() => setIsReceiptModalVisible(false)}
            size={isMobile ? 'small' : 'middle'}
          >
            Close
          </Button>
        ]}
        width={isMobile ? '95%' : 800}
        style={{
          top: isMobile ? 20 : 100,
          maxWidth: isMobile ? '95vw' : '800px'
        }}
        styles={{
          body: {
            maxHeight: isMobile ? '70vh' : '80vh',
            overflowY: 'auto'
          }
        }}
      >
        <div ref={receiptRef}>
          {currentSale && (
            <PDFReceipt
              sale={currentSale}
              customer={currentCustomer}
              item={currentItem}
            />
          )}
        </div>
      </Modal>
    </PageLayout>
  )
}