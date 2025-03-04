'use client'

import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Row,
  Space,
  Table,
  Typography,
  Tag,
  Input,
  Card,
  Tabs,
  Statistic,
  Divider,
} from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { useSnackbar } from 'notistack'
import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

dayjs.extend(isBetween)

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { TabPane } = Tabs

export default function StockManagementPage() {
  const { enqueueSnackbar } = useSnackbar()
  const [isExporting, setIsExporting] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [searchText, setSearchText] = useState('')

  const {
    data: itemsWithSales,
    isLoading,
    refetch,
  } = Api.item.findMany.useQuery({
    where: { sales: { some: {} } },
    include: { sales: true },
  })

  const filteredData = useMemo(() => {
    if (!itemsWithSales) return [];
    
    let filtered = itemsWithSales;

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
          item.sales.some(sale => 
            sale.branchName.toLowerCase().includes(searchLower)
          )
        );
      });
    }

    return filtered;
  }, [itemsWithSales, dateRange, searchText]);

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

  const branchPerformanceData = itemsWithSales?.reduce((acc, item) => {
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

  return (
    <PageLayout layout="full-width">
      <Row justify="center">
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="1">
              <TabPane tab="Sales Trend" key="1">
                <LineChart
                  width={500}
                  height={300}
                  data={salesTrendData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="totalSold" stroke="#8884d8" />
                  <Line type="monotone" dataKey="totalProfit" stroke="#82ca9d" />
                </LineChart>
              </TabPane>
              <TabPane tab="Branch Performance" key="2">
                <BarChart
                  width={500}
                  height={300}
                  data={branchPerformanceData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branchName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalSold" fill="#8884d8" />
                  <Bar dataKey="totalProfit" fill="#82ca9d" />
                </BarChart>
              </TabPane>
              <TabPane tab="Total Profit Summary" key="3">
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <Title level={3}>Overall Profit Summary</Title>
                  
                  {/* Overall Total Profit Card */}
                  <Card style={{ width: '100%', marginBottom: '20px' }}>
                    <Statistic
                      title={<Title level={4}>Total Profit (All Branches)</Title>}
                      value={totalProfit}
                      precision={2}
                      prefix="KES"
                      valueStyle={{ color: '#3f8600', fontSize: '24px' }}
                    />
                    {dateRange && dateRange[0] && dateRange[1] && (
                      <Text type="secondary" style={{ marginTop: '10px', display: 'block' }}>
                        From {dateRange[0].format('DD-MM-YYYY')} to {dateRange[1].format('DD-MM-YYYY')}
                      </Text>
                    )}
                  </Card>

                  {/* Branch-wise Profit Cards */}
                  <div style={{ width: '100%' }}>
                    <Title level={4} style={{ marginBottom: '20px', textAlign: 'left' }}>
                      Profit by Branch
                    </Title>
                    <Row gutter={[16, 16]}>
                      {branchProfits.map((branch) => (
                        <Col xs={24} sm={12} md={8} key={branch.branchName}>
                          <Card>
                            <Statistic
                              title={branch.branchName}
                              value={branch.profit}
                              precision={2}
                              prefix="KES"
                              valueStyle={{ color: '#3f8600' }}
                            />
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <Text type="secondary">
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
          <Title level={2}>Sales Management</Title>
          <Text>View and manage all sales records.</Text>
        </Col>
      </Row>
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              placeholder="Search items or branches..."
              prefix={<SearchOutlined />}
              onChange={handleSearch}
              value={searchText}
              allowClear
            />
            <RangePicker
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
              format="DD-MM-YYYY"
              value={dateRange}
              allowClear
            />
            <Button 
              type="primary"
              onClick={downloadCSV}
              icon={<DownloadOutlined />}
              loading={isExporting}
              disabled={!filteredData?.length || isExporting}
            >
              {isExporting ? 'Preparing Download...' : 'Download Report'}
            </Button>
          </Space>
        </Col>
      </Row>
      <Row justify="center">
        <Col span={24}>
          <Table 
            columns={columns} 
            dataSource={filteredData} 
            loading={isLoading} 
            rowKey="id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`
            }}
          />
        </Col>
      </Row>
    </PageLayout>
  )
}