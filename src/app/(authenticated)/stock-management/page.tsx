'use client'

import { useState } from 'react'
import {
  Typography,
  Table,
  Input,
  Button,
  DatePicker,
  Space,
  Row,
  Col,
} from 'antd'
import {
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
const { Title, Text } = Typography
const { RangePicker } = DatePicker
import { useUserContext } from '@/core/context'
import { useRouter, useParams } from 'next/navigation'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'

export default function StockManagementPage() {
  const router = useRouter()
  const params = useParams<any>()
  const { user } = useUserContext()
  const { enqueueSnackbar } = useSnackbar()

  const [searchText, setSearchText] = useState('')
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null])

  const {
    data: items,
    isLoading,
    refetch,
  } = Api.item.findMany.useQuery({
    include: { sales: true },
  })

  const {
    data: branches,
    isLoading: isBranchesLoading,
  } = Api.branch.findMany.useQuery({})

  const handleSearch = () => {
    refetch()
  }

  const handleDownloadReport = () => {
    // Logic to download report
    enqueueSnackbar('Report downloaded successfully', { variant: 'success' })
  }

  const handleEditBranch = (branchId: string) => {
    // Logic to edit branch
    enqueueSnackbar('Edit branch feature coming soon', { variant: 'info' })
  }

  const handleDeleteBranch = (branchId: string) => {
    // Logic to delete branch
    enqueueSnackbar('Delete branch feature coming soon', { variant: 'info' })
  }

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
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
      title: 'Items Sold',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales: any[]) =>
        sales?.reduce((acc, sale) => acc + sale.quantitySold, 0).toString(),
    },
    {
      title: 'Branches',
      dataIndex: 'branch',
      key: 'branch',
      render: (branch: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditBranch(branch.id)}
          >
            Edit
          </Button>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBranch(branch.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageLayout layout="full-width">
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Title level={2}>Stock Management</Title>
          <Text>Manage your stock and analyze sales performance.</Text>
        </Col>
      </Row>
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Input
              placeholder="Search by item name"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
            <RangePicker
              onChange={dates => setDateRange(dates)}
              style={{ width: '100%' }}
            />
            <Button
              type="primary"
              onClick={handleSearch}
              icon={<SearchOutlined />}
            >
              Search
            </Button>
            <Button
              type="default"
              onClick={handleDownloadReport}
              icon={<DownloadOutlined />}
            >
              Download Report
            </Button>
          </Space>
        </Col>
      </Row>
      <Row justify="center">
        <Col span={24}>
          <Table
            columns={columns}
            dataSource={items}
            loading={isLoading || isBranchesLoading}
            rowKey="id"
          />
        </Col>
      </Row>
    </PageLayout>
  )
}
