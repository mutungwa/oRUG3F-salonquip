'use client'

import { useUserContext } from '@/core/context'
import { useUploadPublic } from '@/core/hooks/upload'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { DeleteOutlined, DollarOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Prisma } from '@prisma/client'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useParams, useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
const { Title, Text } = Typography
const { Option } = Select

export default function ItemsManagementPage() {
  const router = useRouter()
  const params = useParams<any>()
  const { user } = useUserContext()
  const { enqueueSnackbar } = useSnackbar()
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [sellForm] = Form.useForm()
  const [items, setItems] = useState<
    Prisma.ItemGetPayload<{ include: { branch: true } }>[] | null
  >(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isSellModalVisible, setIsSellModalVisible] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null)
  const [currentItem, setCurrentItem] = useState<any>(null)

  const { data: branches } = Api.branch.findMany.useQuery({})
  const { data: fetchedItems, refetch } = Api.item.findMany.useQuery({
    include: { branch: true },
  })
  const { mutateAsync: createItem } = Api.item.create.useMutation()
  const { mutateAsync: updateItem } = Api.item.update.useMutation()
  const { mutateAsync: deleteItem } = Api.item.delete.useMutation()
  const { mutateAsync: createSale } = Api.sale.create.useMutation()
  const { mutateAsync: upload } = useUploadPublic()

  useEffect(() => {
    setItems(fetchedItems)
  }, [fetchedItems])

  const handleAddItem = async (values: any) => {
    try {
      const imageUrl = values.image
        ? await upload({ file: values.image.file })
        : null
      await createItem({
        data: {
          name: values.name,
          description: values.description,
          category: values.category,
          price: values.price,
          sku: values.sku,
          quantity: values.quantity,
          origin: values.origin,
          imageUrl: imageUrl?.url || '',
          branchId: values.branch,
        },
      })
      enqueueSnackbar('Item added successfully', { variant: 'success' })
      refetch()
      form.resetFields()
      setIsModalVisible(false)
    } catch (error) {
      enqueueSnackbar('Failed to add item', { variant: 'error' })
    }
  }

  const handleSellItem = async (
    item: Prisma.ItemGetPayload<{ include: { branch: true } }>,
    values: any,
  ) => {
    try {
      // Fetch the item details including its current quantity
      const { data: fetchedItem } = Api.item.findUnique.useQuery({
        where: { id: item.id },
      })

      if (!fetchedItem) {
        enqueueSnackbar('Item not found', { variant: 'error' })
        return
      }

      // Subtract the sold quantity from the current quantity
      const newQuantity = fetchedItem.quantity - values.quantitySold

      // Update the item with the new quantity
      await updateItem({
        where: { id: item.id },
        data: {
          quantity: newQuantity,
        },
      })

      // Create a sale record with the sold details
      await createSale({
        data: {
          itemId: item.id,
          item: {
            connect: { id: item.id },
          },
          branchId: item.branchId as string, // Ensure it's explicitly a string
          branch: {
            connect: { id: item.branchId },
          },
          sellPrice: values.sellPrice,
          quantitySold: values.quantitySold,
          saleDate: dayjs().format(),
          branchName: item.branch.name,
          itemPrice: item.price,
          itemName: item.name,         // Add this line to include itemName
          itemCategory: item.category,  // Add this line to include itemCategory
        } as Prisma.SaleCreateInput, // Explicitly cast the data to the correct type
      });
      enqueueSnackbar('Item sold successfully', { variant: 'success' })
      refetch()
    } catch (error) {
      enqueueSnackbar('Failed to sell item', { variant: 'error' })
    }
  }

  const handleFilterByBranch = (branchId: string) => {
    setSelectedBranch(branchId)
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem({ where: { id: itemId } })
      enqueueSnackbar('Item deleted successfully', { variant: 'success' })
      refetch()
    } catch (error) {
      enqueueSnackbar('Failed to delete item', { variant: 'error' })
    }
  }

  const handleEditItem = async (values: any) => {
    try {
      const imageUrl = values.image
        ? await upload({ file: values.image.file })
        : null
      await updateItem({
        where: { id: currentItem.id },
        data: {
          name: values.name,
          description: values.description,
          category: values.category,
          price: values.price,
          sku: values.sku,
          quantity: values.quantity,
          origin: values.origin,
          imageUrl: imageUrl?.url || currentItem.imageUrl,
          branchId: values.branch,
        },
      })
      enqueueSnackbar('Item updated successfully', { variant: 'success' })
      refetch()
      editForm.resetFields()
      setIsEditModalVisible(false)
    } catch (error) {
      enqueueSnackbar('Failed to update item', { variant: 'error' })
    }
  }

  const filteredItems = selectedBranch
    ? items?.filter(item => item.branchId === selectedBranch)
    : items

  const columns = [
    {
      title: 'Name',
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
      title: 'Branch',
      dataIndex: ['branch', 'name'],
      key: 'branch',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price.toString(),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => quantity.toString(),
    },
    {
      title: 'Origin',
      dataIndex: 'origin',
      key: 'origin',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: any, record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => {
              setCurrentItem(record)
              setIsSellModalVisible(true)
              sellForm.setFieldsValue({
                itemName: record.name,
                category: record.category,
                branch: record.branch.name,
                price: record.price,
              })
            }}
          >
            Sell
          </Button>
          <Button
            type="default"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentItem(record)
              setIsEditModalVisible(true)
              editForm.setFieldsValue(record)
            }}
          >
            Edit
          </Button>
          <Button
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteItem(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageLayout layout="full-width">
      <Title level={2}>Items Management</Title>
      <Text>Manage your inventory by adding, viewing, and selling items.</Text>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setIsModalVisible(true)}
        style={{ margin: '20px 0' }}
      >
        Add Item
      </Button>
      <Select
        placeholder="Filter by Branch"
        onChange={handleFilterByBranch}
        style={{ width: 200, marginBottom: 20 }}
        allowClear
      >
        {branches?.map(branch => (
          <Option key={branch.id} value={branch.id}>
            {branch.name}
          </Option>
        ))}
      </Select>
      <Table columns={columns} dataSource={filteredItems} rowKey="id" />
      <Modal
        title="Add New Item"
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddItem} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please input the category!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="branch"
            label="Branch"
            rules={[{ required: true, message: 'Please select a branch!' }]}
          >
            <Select>
              {branches?.map(branch => (
                <Option key={branch.id} value={branch.id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please input the price!' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Please input the SKU!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input the quantity!' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="origin"
            label="Origin"
            rules={[{ required: true, message: 'Please input the origin!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="image" label="Image">
            <Input type="file" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Item
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Edit Item"
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
      >
        <Form form={editForm} onFinish={handleEditItem} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please input the category!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="branch"
            label="Branch"
            rules={[{ required: true, message: 'Please select a branch!' }]}
          >
            <Select>
              {branches?.map(branch => (
                <Option key={branch.id} value={branch.id}>
                  {branch.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Please input the price!' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="sku"
            label="SKU"
            rules={[{ required: true, message: 'Please input the SKU!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please input the quantity!' }]}
          >
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item
            name="origin"
            label="Origin"
            rules={[{ required: true, message: 'Please input the origin!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="image" label="Image">
            <Input type="file" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Item
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Sell Item"
        visible={isSellModalVisible}
        onCancel={() => setIsSellModalVisible(false)}
        footer={null}
      >
        <Form form={sellForm} onFinish={values => handleSellItem(currentItem, values)} layout="vertical">
          <Form.Item name="itemName" label="Item Name">
            <Input disabled />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input disabled />
          </Form.Item>
          <Form.Item name="branch" label="Branch">
            <Input disabled />
          </Form.Item>
          <Form.Item name="price" label="Price">
            <InputNumber disabled style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="quantitySold"
            label="Quantity Sold"
            rules={[
              { required: true, message: 'Please input the quantity sold!' },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="sellPrice"
            label="Sell Price"
            rules={[
              { required: true, message: 'Please input the sell price!' },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Sell Item
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  )
}
