'use client'

import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { DownloadOutlined } from '@ant-design/icons'
import {
  Button,
  Col,
  DatePicker,
  Row,
  Space,
  Table,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function StockManagementPage() {
  const { enqueueSnackbar } = useSnackbar()

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null])

  const {
    data: itemsWithSales,
    isLoading,
    refetch,
  } = Api.item.findMany.useQuery({
    where: { sales: { some: {} } }, // Fetch items with at least one sale
    include: { sales: true },
  })

  const handleDownloadReport = () => {
    // Logic to download report
    enqueueSnackbar('Report downloaded successfully', { variant: 'success' })
  }

  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Total Sold Quantity',
      dataIndex: 'sales',
      key: 'sales',
      render: (sales) => sales.reduce((acc, sale) => acc + sale.quantitySold, 0).toString(),
    },
    {
      title: 'Last Sold Date',
      dataIndex: 'sales',
      key: 'lastSoldDate',
      render: (sales) => {
        const lastSale = sales.reduce((latest, sale) =>
          new Date(sale.saleDate) > new Date(latest.saleDate) ? sale : latest
        )
        return dayjs(lastSale.saleDate).format('DD-MM-YYYY')
      },
    },
  ]

  return (
    <PageLayout layout="full-width">
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Title level={2}>Stock Management</Title>
          <Text>View all items with recorded sales.</Text>
        </Col>
      </Row>
      <Row justify="center" style={{ marginBottom: '20px' }}>
        <Col span={24}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <RangePicker
              onChange={(dates) => setDateRange(dates)}
              style={{ width: '100%' }}
            />
            <Button type="default" onClick={handleDownloadReport} icon={<DownloadOutlined />}>
              Download Report
            </Button>
          </Space>
        </Col>
      </Row>
      <Row justify="center">
        <Col span={24}>
          <Table columns={columns} dataSource={itemsWithSales} loading={isLoading} rowKey="id" />
        </Col>
      </Row>
    </PageLayout>
  )
}
