'use client';

import { useUserContext } from '@/core/context';
import { Api } from '@/core/trpc';
import { PageLayout } from '@/designSystem/layouts/Page.layout';
import {
    CalendarOutlined,
    FileSearchOutlined,
    ReloadOutlined,
    SearchOutlined
} from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    DatePicker,
    Input,
    Row,
    Select,
    Table,
    Tag,
    Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface InventoryLogItem {
  id: string;
  action: string;
  itemId: string;
  itemName: string;
  userId: string | null;
  userName: string | null;
  details: string;
  dateCreated: Date;
  dateUpdated: Date;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  item?: {
    id: string;
    name: string;
    category: string;
  } | null;
}

export default function InventoryLogPage() {
  const router = useRouter();
  const { checkRole } = useUserContext();
  const isAdmin = checkRole('admin');

  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [filteredLogs, setFilteredLogs] = useState<InventoryLogItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Fetch inventory logs with user and item details
  const { data: inventoryLogs, isLoading, refetch } = Api.inventoryLog.findMany.useQuery({
    include: {
      user: true,
      item: true
    },
    orderBy: {
      dateCreated: 'desc'
    }
  }, {
    // Refetch on window focus to get the latest data
    refetchOnWindowFocus: true
  });

  // Refetch data when the page is loaded
  useEffect(() => {
    // Refetch data to ensure we have the latest
    refetch();
  }, [refetch]);

  // Handle mobile view
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

  // Apply filters when data or filter criteria change
  useEffect(() => {
    if (!inventoryLogs) return;

    let filtered = [...inventoryLogs];

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(log =>
        log.itemName.toLowerCase().includes(searchLower) ||
        log.userName?.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower)
      );
    }

    // Apply date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');

      filtered = filtered.filter(log => {
        const logDate = dayjs(log.dateCreated);
        return logDate.isAfter(startDate) && logDate.isBefore(endDate);
      });
    }

    // Apply action type filter
    if (actionFilter) {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    setFilteredLogs(filtered);
  }, [inventoryLogs, searchText, dateRange, actionFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleActionFilterChange = (value: string | null) => {
    setActionFilter(value);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setDateRange(null);
    setActionFilter(null);
  };

  const getActionTagColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'processing';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDetails = (details: string) => {
    try {
      const parsedDetails = JSON.parse(details);

      // Handle the special case of 'changes' object in update actions
      if (parsedDetails.changes) {
        return (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              <strong>Changes:</strong>
              <ul style={{ paddingLeft: 20 }}>
                {Object.entries(parsedDetails.changes).map(([field, change]: [string, any]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {change.from !== undefined ?
                      <span>from <b>{String(change.from)}</b> to <b>{String(change.to)}</b></span> :
                      String(change)
                    }
                  </li>
                ))}
              </ul>
            </li>
            {parsedDetails.branchName && (
              <li>
                <strong>Branch:</strong> {parsedDetails.branchName}
              </li>
            )}
            {parsedDetails.type && (
              <li>
                <strong>Type:</strong> {parsedDetails.type}
              </li>
            )}
          </ul>
        );
      }

      // Handle sale details
      if (parsedDetails.type === 'sale') {
        return (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li><strong>Type:</strong> Sale</li>
            <li><strong>Quantity Change:</strong> from {parsedDetails.changes.quantity.from} to {parsedDetails.changes.quantity.to}</li>
            <li><strong>Quantity Sold:</strong> {parsedDetails.quantitySold}</li>
            <li><strong>Sell Price:</strong> KES {parsedDetails.sellPrice}</li>
            <li><strong>Sale Date:</strong> {dayjs(parsedDetails.saleDate).format('YYYY-MM-DD HH:mm')}</li>
          </ul>
        );
      }

      // Default rendering for other types of details
      return (
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {Object.entries(parsedDetails).map(([key, value]) => {
            // Skip rendering complex objects directly
            if (typeof value === 'object' && value !== null) {
              return (
                <li key={key}>
                  <strong>{key}:</strong> {JSON.stringify(value).substring(0, 50)}
                  {JSON.stringify(value).length > 50 ? '...' : ''}
                </li>
              );
            }
            return (
              <li key={key}>
                <strong>{key}:</strong> {String(value)}
              </li>
            );
          })}
        </ul>
      );
    } catch (error) {
      console.error('Error parsing details:', error);
      return <span>Error parsing details: {String(details).substring(0, 100)}</span>;
    }
  };

  const columns: ColumnsType<InventoryLogItem> = [
    {
      title: 'Date',
      dataIndex: 'dateCreated',
      key: 'dateCreated',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime(),
      responsive: ['md']
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={getActionTagColor(action)}>
          {action.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Create', value: 'create' },
        { text: 'Update', value: 'update' },
        { text: 'Delete', value: 'delete' }
      ],
      onFilter: (value, record) => record.action === value
    },
    {
      title: 'Item',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text, record) => (
        <div>
          <div>{text}</div>
          {record.item && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.item.category}
            </Text>
          )}
        </div>
      )
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      render: (text, record) => (
        <div>
          <div>{text || 'System'}</div>
          {record.user && record.user.email && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.user.email}
            </Text>
          )}
        </div>
      ),
      responsive: ['md']
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      render: (details) => formatDetails(details),
      responsive: ['lg']
    }
  ];

  // Mobile columns (simplified for small screens)
  const mobileColumns: ColumnsType<InventoryLogItem> = [
    {
      title: 'Date',
      dataIndex: 'dateCreated',
      key: 'dateCreated',
      render: (date: Date) => dayjs(date).format('MM/DD/YY'),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={getActionTagColor(action)}>
          {action.charAt(0).toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Item',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <Button
          type="link"
          icon={<FileSearchOutlined />}
          onClick={() => {
            // Show details in a modal or expand the row
            console.log(record.details);
          }}
        />
      ),
    }
  ];

  return (
    <PageLayout layout="full-width">
      <Row justify="space-between" style={{ marginBottom: '20px' }}>
        <Col>
          <Title level={2}>Inventory Log</Title>
          <Text>Track all changes to your inventory items.</Text>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={() => refetch()}
            icon={<ReloadOutlined />}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: '20px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Search by item name, user, or action..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
              value={dateRange}
              placeholder={['Start Date', 'End Date']}
              prefix={<CalendarOutlined />}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Action"
              onChange={handleActionFilterChange}
              value={actionFilter}
              allowClear
            >
              <Option value="create">Create</Option>
              <Option value="update">Update</Option>
              <Option value="delete">Delete</Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Button
              type="default"
              onClick={handleClearFilters}
              style={{ width: '100%' }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={isMobile ? mobileColumns : columns}
        dataSource={filteredLogs}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: isMobile ? 500 : 1000 }}
        size={isMobile ? 'small' : 'middle'}
      />
    </PageLayout>
  );
}
