'use client'

import { useState } from 'react'
import {
  Typography,
  Form,
  Input,
  Button,
  Table,
  Space,
  Modal,
  Select,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
const { Title, Text } = Typography
const { Option } = Select
import { useUserContext } from '@/core/context'
import { useRouter, useParams } from 'next/navigation'
import { useUploadPublic } from '@/core/hooks/upload'
import { useSnackbar } from 'notistack'
import dayjs from 'dayjs'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'

export default function AdminManagementPage() {
  const router = useRouter()
  const params = useParams<any>()
  const { user } = useUserContext()
  const { enqueueSnackbar } = useSnackbar()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()

  const {
    data: users,
    isLoading,
    refetch,
  } = Api.user.findMany.useQuery({ include: { admins: true } })
  const { mutateAsync: createUser } = Api.user.create.useMutation()
  const { mutateAsync: updateUser } = Api.user.update.useMutation()
  const { mutateAsync: deleteUser } = Api.user.delete.useMutation()

  const showModal = (user = null) => {
    setEditingUser(user)
    setIsModalVisible(true)
    if (user) {
      form.setFieldsValue({
        email: user.email,
        name: user.name,
        password: '',
        role: user.admins?.length > 0 ? 'admin' : 'user',
      })
    } else {
      form.resetFields()
    }
  }

  const handleCancel = () => {
    setIsModalVisible(false)
    setEditingUser(null)
  }

  const handleSave = async values => {
    try {
      if (editingUser) {
        await updateUser({ where: { id: editingUser.id }, data: values })
        enqueueSnackbar('User updated successfully', { variant: 'success' })
      } else {
        await createUser({ data: values })
        enqueueSnackbar('User created successfully', { variant: 'success' })
      }
      refetch()
      handleCancel()
    } catch (error) {
      enqueueSnackbar('Error saving user', { variant: 'error' })
    }
  }

  const handleDelete = async userId => {
    try {
      await deleteUser({ where: { id: userId } })
      enqueueSnackbar('User deleted successfully', { variant: 'success' })
      refetch()
    } catch (error) {
      enqueueSnackbar('Error deleting user', { variant: 'error' })
    }
  }

  const columns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Username',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Role',
      key: 'role',
      render: (text, record) => (record.admins?.length > 0 ? 'Admin' : 'User'),
    },
    {
      title: 'Last Login',
      dataIndex: 'dateUpdated',
      key: 'dateUpdated',
      render: text => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageLayout layout="full-width">
      <Title level={2}>Admin Management</Title>
      <Text>
        Manage users and admins, and view their last login information.
      </Text>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => showModal()}
        style={{ margin: '20px 0' }}
      >
        Add User
      </Button>
      <Table
        dataSource={users}
        columns={columns}
        loading={isLoading}
        rowKey="id"
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please input the email!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Username"
            rules={[{ required: true, message: 'Please input the username!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input the password!' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select>
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  )
}
