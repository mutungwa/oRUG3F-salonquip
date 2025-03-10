'use client'

import { useState, useEffect, useMemo } from 'react'
import { Prisma } from '@prisma/client'
import {
  Typography,
  Select,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Card,
  Tabs,
  DatePicker,
} from 'antd'
import { SwapOutlined, SearchOutlined } from '@ant-design/icons'
import { useUserContext } from '@/core/context'
import { useRouter, useParams } from 'next/navigation'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

const { Title, Text } = Typography
const { Option } = Select

const { TabPane } = Tabs

const { RangePicker } = DatePicker

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
  const { user } = useUserContext()
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

  const { data: salesData, isLoading: salesLoading } = Api.sale.findMany.useQuery({});

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
          icon={<SwapOutlined style={{ color: 'black' }} />}
          onClick={() => openTransferModal(record)}
          disabled={record.quantity <= 0}
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

  return (
    <PageLayout layout="full-width">
      <Card style={{ marginBottom: '20px' }}>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Total Items in Branches" key="1">
            <BarChart
              width={500}
              height={300}
              data={totalItemsInBranches}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="branchName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalItems" fill="#8884d8" />
            </BarChart>
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
                <Table
                  dataSource={recentTransfers}
                  columns={[
                    {
                      title: 'Item Name',
                      key: 'itemName',
                      render: (_, record: StockTransfer) => {
                        return record.item?.name || 'N/A';
                      }
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
                      }
                    },
                    {
                      title: 'To Branch',
                      key: 'toBranch',
                      render: (_, record: StockTransfer) => {
                        return record.toBranch?.name || 'N/A';
                      }
                    },
                    {
                      title: 'Date',
                      dataIndex: 'transferDate',
                      key: 'transferDate',
                      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
                    },
                  ]}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                />
              </>
            )}
          </TabPane>
          <TabPane tab="Low Stock Levels" key="3">
            <ul>
              {lowStockItems?.map(item => (
                <li key={item.id}>
                  {item.name} - {item.description} - {item.category} - {item.quantity} in stock
                </li>
              ))}
            </ul>
          </TabPane>
          <TabPane tab="Sales Comparison" key="4">
            <RangePicker onChange={setDateRange} style={{ marginBottom: '20px' }} />
            <BarChart width={600} height={300} data={filteredSalesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalSold" fill="#8884d8" />
            </BarChart>
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
          justifyContent: 'center',
          gap: '10px',
        }}
      >
        <Select
          placeholder="Select Branch"
          onChange={handleBranchChange}
          loading={branchesLoading}
          style={{ width: 200 }}
          allowClear
        >
          {branches?.map(branch => (
            <Option key={branch.id} value={branch.id}>
              {branch.name}
            </Option>
          ))}
        </Select>
        <Input
          placeholder="Search by item name"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 200 }}
          prefix={<SearchOutlined />}
        />
        <Button type="primary" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Items Table */}
      <Table
        dataSource={items}
        columns={columns}
        loading={itemsLoading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

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
    </PageLayout>
  )
}