'use client';

import { useUserContext } from '@/core/context';
import { Api } from '@/core/trpc';
import { PageLayout } from '@/designSystem/layouts/Page.layout';
import {
    DownloadOutlined,
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
    Modal,
    Row,
    Select,
    Table,
    Tag,
    Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
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
  const { enqueueSnackbar } = useSnackbar();

  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [filteredLogs, setFilteredLogs] = useState<InventoryLogItem[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<InventoryLogItem | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  const showDetailsModal = (log: InventoryLogItem) => {
    setSelectedLogForDetails(log);
    setIsDetailsModalVisible(true);
  };

  const closeDetailsModal = () => {
    setSelectedLogForDetails(null);
    setIsDetailsModalVisible(false);
  };

  // Helper function to extract readable details text for export
  const getDetailsTextForExport = (details: string) => {
    try {
      const parsedDetails = JSON.parse(details);

      if (parsedDetails.type === 'sale') {
        const parts = [
          `Sale Transaction`,
          `Qty Sold: ${parsedDetails.quantitySold || 'N/A'}`,
          `Price: KES ${Number(parsedDetails.sellPrice || 0).toLocaleString()}`
        ];
        if (parsedDetails.changes?.quantity) {
          parts.push(`Stock: ${parsedDetails.changes.quantity.from} → ${parsedDetails.changes.quantity.to}`);
        }
        return parts.join(' | ');
      }

      if (parsedDetails.changes) {
        const changes = Object.entries(parsedDetails.changes)
          .map(([field, change]: [string, any]) => {
            if (change.from !== undefined) {
              return `${field}: ${change.from} → ${change.to}`;
            }
            return `${field}: ${change}`;
          })
          .join(' | ');
        return `Updated: ${changes}`;
      }

      if (parsedDetails.type === 'create') {
        const parts = ['Item Created'];
        if (parsedDetails.initialQuantity) parts.push(`Initial Stock: ${parsedDetails.initialQuantity}`);
        if (parsedDetails.price) parts.push(`Price: KES ${Number(parsedDetails.price).toLocaleString()}`);
        if (parsedDetails.branchName) parts.push(`Branch: ${parsedDetails.branchName}`);
        return parts.join(' | ');
      }

      if (parsedDetails.type === 'delete') {
        const parts = ['Item Deleted'];
        if (parsedDetails.reason) parts.push(`Reason: ${parsedDetails.reason}`);
        if (parsedDetails.finalQuantity !== undefined) parts.push(`Final Stock: ${parsedDetails.finalQuantity}`);
        return parts.join(' | ');
      }

      if (parsedDetails.type === 'transfer') {
        return `Stock Transfer | Qty: ${parsedDetails.quantity || 'N/A'} | From: ${parsedDetails.fromBranch || 'N/A'} | To: ${parsedDetails.toBranch || 'N/A'}`;
      }

      // Default fallback
      const importantFields = ['type', 'quantity', 'price', 'branchName'];
      const displayFields = Object.entries(parsedDetails)
        .filter(([key]) => importantFields.includes(key))
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ');
      
      return displayFields || 'System Action';
    } catch (error) {
      return `Invalid Data: ${String(details).substring(0, 100)}`;
    }
  };

  // Prepare CSV data
  const prepareCSVData = () => {
    if (!filteredLogs?.length) return '';

    const headers = [
      'Date',
      'Action',
      'Item Name',
      'Category',
      'User',
      'User Email',
      'Details'
    ];

    const csvRows = filteredLogs.map(log => {
      return [
        `"${dayjs(log.dateCreated).format('YYYY-MM-DD HH:mm:ss')}"`,
        `"${log.action.toUpperCase()}"`,
        `"${log.itemName}"`,
        `"${log.item?.category || 'N/A'}"`,
        `"${log.userName || 'System'}"`,
        `"${log.user?.email || 'N/A'}"`,
        `"${getDetailsTextForExport(log.details)}"`
      ].join(',');
    });

    return [headers.join(','), ...csvRows].join('\n');
  };

  // Export to CSV
  const downloadCSV = async () => {
    try {
      setIsExporting(true);
      
      if (!filteredLogs || filteredLogs.length === 0) {
        enqueueSnackbar('No data to export', { variant: 'warning' });
        return;
      }

      const csvContent = prepareCSVData();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      // Generate filename with current filters
      let filename = 'inventory-log';
      if (dateRange && dateRange[0] && dateRange[1]) {
        filename += `-${dateRange[0].format('YYYY-MM-DD')}-to-${dateRange[1].format('YYYY-MM-DD')}`;
      }
      if (actionFilter) {
        filename += `-${actionFilter}`;
      }
      if (searchText) {
        filename += `-search-${searchText.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
      filename += '.csv';

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      enqueueSnackbar('Inventory log exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error exporting inventory log:', error);
      enqueueSnackbar('Failed to export inventory log', { variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const getActionTagColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'success';
      case 'update':
        return 'processing';
      case 'delete':
        return 'error';
      case 'sale':
        return 'blue';
      default:
        return 'default';
    }
  };

  const formatDetails = (details: string) => {
    try {
      const parsedDetails = JSON.parse(details);

      // Helper function to format field names to be more readable
      const formatFieldName = (field: string) => {
        const fieldMap: { [key: string]: string } = {
          'quantity': 'Stock Quantity',
          'price': 'Unit Price',
          'minimumStockLevel': 'Min Stock Level',
          'minimumSellPrice': 'Min Sell Price',
          'name': 'Item Name',
          'description': 'Description',
          'category': 'Category',
          'sku': 'SKU',
          'origin': 'Origin'
        };
        return fieldMap[field] || field.charAt(0).toUpperCase() + field.slice(1);
      };

      // Helper function to format values
      const formatValue = (value: any, field?: string) => {
        if (value === null || value === undefined) return 'N/A';
        if (field === 'price' || field === 'minimumSellPrice') {
          return `KES ${Number(value).toLocaleString()}`;
        }
        return String(value);
      };

      // Handle sale actions
      if (parsedDetails.type === 'sale') {
        const quantityChange = parsedDetails.changes?.quantity;
        return (
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <Tag color="blue" style={{ marginBottom: '4px' }}>Sale Transaction</Tag>
            <div>
              <Text strong>Quantity Sold:</Text> {parsedDetails.quantitySold || 'N/A'}
            </div>
            <div>
              <Text strong>Price:</Text> KES {Number(parsedDetails.sellPrice || 0).toLocaleString()}
            </div>
            {quantityChange && (
              <div>
                <Text strong>Stock:</Text> {quantityChange.from} → {quantityChange.to}
              </div>
            )}
          </div>
        );
      }

      // Handle update actions with changes
      if (parsedDetails.changes) {
        const changes = parsedDetails.changes;
        const changeCount = Object.keys(changes).length;
        
        return (
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <Tag color="orange" style={{ marginBottom: '4px' }}>
              {changeCount} Field{changeCount > 1 ? 's' : ''} Updated
            </Tag>
            {Object.entries(changes).slice(0, 3).map(([field, change]: [string, any]) => (
              <div key={field} style={{ marginBottom: '2px' }}>
                <Text strong>{formatFieldName(field)}:</Text>{' '}
                {change.from !== undefined ? (
                  <span>
                    <span style={{ textDecoration: 'line-through', color: '#ff4d4f' }}>
                      {formatValue(change.from, field)}
                    </span>
                    {' → '}
                    <span style={{ color: '#52c41a' }}>
                      {formatValue(change.to, field)}
                    </span>
                  </span>
                ) : (
                  formatValue(change, field)
                )}
              </div>
            ))}
            {Object.keys(changes).length > 3 && (
              <Text type="secondary" style={{ fontSize: '11px' }}>
                +{Object.keys(changes).length - 3} more changes...
              </Text>
            )}
          </div>
        );
      }

      // Handle create actions
      if (parsedDetails.type === 'create' || (!parsedDetails.changes && !parsedDetails.type)) {
        return (
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <Tag color="green" style={{ marginBottom: '4px' }}>Item Created</Tag>
            {parsedDetails.initialQuantity && (
              <div>
                <Text strong>Initial Stock:</Text> {parsedDetails.initialQuantity}
              </div>
            )}
            {parsedDetails.price && (
              <div>
                <Text strong>Price:</Text> KES {Number(parsedDetails.price).toLocaleString()}
              </div>
            )}
            {parsedDetails.branchName && (
              <div>
                <Text strong>Branch:</Text> {parsedDetails.branchName}
              </div>
            )}
          </div>
        );
      }

      // Handle delete actions
      if (parsedDetails.type === 'delete') {
        return (
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <Tag color="red" style={{ marginBottom: '4px' }}>Item Deleted</Tag>
            {parsedDetails.reason && (
              <div>
                <Text strong>Reason:</Text> {parsedDetails.reason}
              </div>
            )}
            {parsedDetails.finalQuantity !== undefined && (
              <div>
                <Text strong>Final Stock:</Text> {parsedDetails.finalQuantity}
              </div>
            )}
          </div>
        );
      }

      // Handle stock transfer actions
      if (parsedDetails.type === 'transfer') {
        return (
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <Tag color="purple" style={{ marginBottom: '4px' }}>Stock Transfer</Tag>
            <div>
              <Text strong>Quantity:</Text> {parsedDetails.quantity || 'N/A'}
            </div>
            <div>
              <Text strong>From:</Text> {parsedDetails.fromBranch || 'N/A'}
            </div>
            <div>
              <Text strong>To:</Text> {parsedDetails.toBranch || 'N/A'}
            </div>
          </div>
        );
      }

      // Default fallback for any other structured data
      const importantFields = ['type', 'quantity', 'price', 'branchName'];
      const displayFields = Object.entries(parsedDetails)
        .filter(([key]) => importantFields.includes(key) || parsedDetails[key] !== undefined)
        .slice(0, 3);

      if (displayFields.length > 0) {
        return (
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            <Tag color="default" style={{ marginBottom: '4px' }}>System Action</Tag>
            {displayFields.map(([key, value]) => (
              <div key={key}>
                <Text strong>{formatFieldName(key)}:</Text> {formatValue(value, key)}
              </div>
            ))}
          </div>
        );
      }

      // Final fallback
      return (
        <div style={{ fontSize: '12px' }}>
          <Tag color="default">Action Completed</Tag>
        </div>
      );

    } catch (error) {
      console.error('Error parsing details:', error);
      return (
        <div style={{ fontSize: '12px' }}>
          <Tag color="default">Invalid Data</Tag>
          <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
            {String(details).substring(0, 50)}...
          </Text>
        </div>
      );
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
        { text: 'Delete', value: 'delete' },
        { text: 'Sale', value: 'sale' }
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
      render: (text) => (
        <Text ellipsis style={{ maxWidth: '100px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      render: (_, record) => (
        <Button
          type="link"
          icon={<FileSearchOutlined />}
          onClick={() => showDetailsModal(record)}
          size="small"
        >
          View
        </Button>
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
          <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
            {isAdmin && (
              <Button
                type="default"
                onClick={downloadCSV}
                icon={<DownloadOutlined />}
                loading={isExporting}
                disabled={!filteredLogs || filteredLogs.length === 0 || isExporting}
                style={{ width: isMobile ? '100%' : 'auto' }}
              >
                {isExporting ? 'Exporting...' : isMobile ? 'Export' : 'Export CSV'}
              </Button>
            )}
            <Button
              type="primary"
              onClick={() => refetch()}
              icon={<ReloadOutlined />}
              loading={isLoading}
              style={{ width: isMobile ? '100%' : 'auto' }}
            >
              Refresh
            </Button>
          </div>
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
              <Option value="sale">Sale</Option>
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

      {/* Details Modal for Mobile */}
      <Modal
        title="Log Details"
        open={isDetailsModalVisible}
        onCancel={closeDetailsModal}
        footer={[
          <Button key="close" onClick={closeDetailsModal}>
            Close
          </Button>
        ]}
        width={isMobile ? '90%' : 600}
      >
        {selectedLogForDetails && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Date: </Text>
              <Text>{dayjs(selectedLogForDetails.dateCreated).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Action: </Text>
              <Tag color={getActionTagColor(selectedLogForDetails.action)}>
                {selectedLogForDetails.action.toUpperCase()}
              </Tag>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Item: </Text>
              <Text>{selectedLogForDetails.itemName}</Text>
              {selectedLogForDetails.item && (
                <div>
                  <Text type="secondary">Category: {selectedLogForDetails.item.category}</Text>
                </div>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>User: </Text>
              <Text>{selectedLogForDetails.userName || 'System'}</Text>
              {selectedLogForDetails.user?.email && (
                <div>
                  <Text type="secondary">{selectedLogForDetails.user.email}</Text>
                </div>
              )}
            </div>
            <div>
              <Text strong>Details:</Text>
              <div style={{ marginTop: '8px', padding: '12px', background: '#f5f5f5', borderRadius: '6px' }}>
                {formatDetails(selectedLogForDetails.details)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}
