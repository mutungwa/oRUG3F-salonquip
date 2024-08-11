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

  const handleTransfer = async () => {
    try {
      const existingItem = await Api.item.findFirst.useQuery({
        where: {
          id: transferDetails.itemId,
          branchId: transferDetails.toBranchId,
        },
      })

      if (existingItem.data) {
        await updateItem({
          where: { id: existingItem.data.id },
          data: {
            quantity: existingItem.data.quantity + transferDetails.quantity,
          },
        })
      } else {
        const itemToTransfer = items?.find(
          item => item.id === transferDetails.itemId
        )
        if (itemToTransfer) {
          await createItem({
            data: {
              name: itemToTransfer.name,
              description: itemToTransfer.description,
              category: itemToTransfer.category,
              price: itemToTransfer.price,
              sku: itemToTransfer.sku,
              quantity: transferDetails.quantity,
              origin: itemToTransfer.origin,
              imageUrl: itemToTransfer.imageUrl,
              branchId: transferDetails.toBranchId,
            },
          })
        }
      }

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
      setIsTransferModalVisible(false)
      refetchItems()
    } catch (error) {
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
      render: (price: number) => price.toString(),
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
          onClick={() => {
            setTransferDetails({
              itemId: record.id,
              quantity: 0,
              toBranchId: '',
            })
            setIsTransferModalVisible(true)
          }}
        >
          Transfer
        </Button>
      ),
    },
  ]

  return (
    <PageLayout layout="full-width">
      <Title level={2} style={{ textAlign: 'center' }}>
        Home Page
      </Title>
      <Text
        style={{ textAlign: 'center', display: 'block', marginBottom: '20px' }}
      >
        View and manage your stock across different branches.
      </Text>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Select
          placeholder="Select Branch"
          onChange={handleBranchChange}
          loading={branchesLoading}
          style={{ width: 200, marginRight: 10 }}
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
          style={{ width: 200, marginRight: 10 }}
        />
        <Button
          type="primary"
          onClick={handleSearch}
          icon={<SearchOutlined />}
        >
          Search
        </Button>
      </div>
      <Table
        dataSource={items}
        columns={columns}
        loading={itemsLoading}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />
      <Modal
        title="Transfer Stock"
        visible={isTransferModalVisible}
        onCancel={() => setIsTransferModalVisible(false)}
        onOk={handleTransfer}
      >
        <Form layout="vertical">
          <Form.Item label="Quantity">
            <InputNumber
              min={1}
              value={transferDetails.quantity}
              onChange={value =>
                setTransferDetails({ ...transferDetails, quantity: value })
              }
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="To Branch">
            <Select
              placeholder="Select Branch"
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
