'use client'

import { useState, useEffect } from 'react'
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
} from 'antd'
import { SwapOutlined, SearchOutlined } from '@ant-design/icons'
const { Title, Text } = Typography
const { Option } = Select
import { useUserContext } from '@/core/context'
import { useRouter, useParams } from 'next/navigation'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'

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
          { name: selectedItem?.name || '' },
          { branchId: transferDetails.toBranchId || '' }
        ]
      },
    },
    {
      enabled: !!selectedItem && !!transferDetails.toBranchId,
    }
  )

  const { mutateAsync: transferStock } = Api.stockTransfer.create.useMutation()
  const { mutateAsync: updateItem } = Api.item.update.useMutation()
  const { mutateAsync: createItem } = Api.item.create.useMutation()

  const handleBranchChange = (value: string) => {
    setSelectedBranch(value)
    refetchItems()
  }

  const handleSearch = () => {
    refetchItems()
  }

  const openTransferModal = (item: any) => {
    setSelectedItem(item)
    setTransferDetails({
      itemId: item.id,
      quantity: 0,
      toBranchId: '',
    })
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

      // Update source item quantity first
      await updateItem({
        where: { id: selectedItem.id },
        data: {
          quantity: selectedItem.quantity - transferDetails.quantity,
        },
      })

      if (existingItemInBranch) {
        // Update existing item in destination branch
        await updateItem({
          where: { id: existingItemInBranch.id },
          data: {
            quantity: existingItemInBranch.quantity + transferDetails.quantity,
          },
        })
      } else {
        // Create new item in destination branch
        await createItem({
          data: {
            name: selectedItem.name,
            description: selectedItem.description,
            category: selectedItem.category,
            price: selectedItem.price,
            sku: selectedItem.sku,
            quantity: transferDetails.quantity,
            origin: selectedItem.origin,
            imageUrl: selectedItem.imageUrl,
            branchId: transferDetails.toBranchId,
          },
        })
      }

      // Create transfer record
      await transferStock({
        data: {
          itemId: transferDetails.itemId,
          quantity: transferDetails.quantity,
          fromBranchId: selectedBranch!,
          toBranchId: transferDetails.toBranchId,
          transferDate: new Date().toISOString(),
        },
      })

      enqueueSnackbar('Stock transferred successfully', { variant: 'success' })
      closeTransferModal()
      refetchItems()
    } catch (error) {
      console.error('Transfer error:', error)
      enqueueSnackbar('Failed to transfer stock', { variant: 'error' })
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

  return (
    <PageLayout layout="full-width">
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
            transferDetails.quantity > (selectedItem?.quantity || 0),
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
                ?.filter(branch => branch.id !== selectedBranch)
                .map(branch => (
                  <Option key={branch.id} value={branch.id}>
                    {branch.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  )
}