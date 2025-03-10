'use client'

import { useState, useEffect } from 'react'
import {
  Typography,
  Form,
  Input,
  Button,
  Table,
  Space,
  Modal,
  Select,
  Tabs,
  DatePicker,
  Card,
  Statistic,
  Row,
  Col,
  Tag,
  Alert,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, DollarOutlined } from '@ant-design/icons'
const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker
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
  const { user, checkRole } = useUserContext()
  const isAdmin = checkRole('admin')
  const { enqueueSnackbar } = useSnackbar()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'sales'
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const {
    data: users,
    isLoading,
    refetch,
  } = Api.user.findMany.useQuery({ include: { admins: true, roles: true } })
  
  // Add the missing sales data query
  const {
    data: salesData,
    isLoading: isLoadingSales,
  } = Api.sale.findMany.useQuery({
    include: { user: true },
    orderBy: { saleDate: 'desc' },
  })
  
  const { mutateAsync: createUser } = Api.user.create.useMutation()
  const { mutateAsync: updateUser } = Api.user.update.useMutation()
  const { mutateAsync: deleteUser } = Api.user.delete.useMutation()
  const { mutateAsync: createRole } = Api.role.create.useMutation()
  const { mutateAsync: createAdmin } = Api.admin.create.useMutation()
  const { mutateAsync: deleteRole } = Api.role.delete.useMutation()
  const { mutateAsync: deleteAdmin } = Api.admin.delete.useMutation()
  const { data: roles } = Api.role.findMany.useQuery({})

  const showModal = (user = null) => {
    setEditingUser(user)
    setIsModalVisible(true)
    if (user) {
      const isAdmin = user.admins?.length > 0 || user.roles?.some(role => role.name === 'admin');
      form.setFieldsValue({
        email: user.email,
        name: user.name,
        password: '',
        role: isAdmin ? 'admin' : 'user',
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
      const { role, password, ...otherUserData } = values;
      
      if (editingUser) {
        // Update existing user - only include password if provided
        const updateData = { ...otherUserData };
        if (password) {
          updateData.password = password;
        }
        
        await updateUser({ where: { id: editingUser.id }, data: updateData })
        
        // Check if role has changed
        const isCurrentlyAdmin = editingUser.admins?.length > 0 || editingUser.roles?.some(role => role.name === 'admin');
        const shouldBeAdmin = role === 'admin';
        
        if (isCurrentlyAdmin && !shouldBeAdmin) {
          // Remove admin role
          const adminRole = roles?.find(r => r.userId === editingUser.id && r.name === 'admin');
          if (adminRole) {
            await deleteRole({ where: { id: adminRole.id } });
          }
          
          // Remove admin record
          const admin = editingUser.admins?.[0];
          if (admin) {
            await deleteAdmin({ where: { id: admin.id } });
          }
        } else if (!isCurrentlyAdmin && shouldBeAdmin) {
          // Add admin role
          await createRole({ 
            data: { 
              name: 'admin',
              userId: editingUser.id
            } 
          });
          
          // Add admin record
          await createAdmin({ 
            data: { 
              userId: editingUser.id
            } 
          });
        }
        
        enqueueSnackbar('User updated successfully', { variant: 'success' })
      } else {
        // Create new user
        const newUser = await createUser({ 
          data: { 
            ...otherUserData,
            password
          } 
        })
        
        // If admin role, create role and admin records
        if (role === 'admin') {
          await createRole({ 
            data: { 
              name: 'admin',
              userId: newUser.id
            } 
          });
          
          await createAdmin({ 
            data: { 
              userId: newUser.id
            } 
          });
        }
        
        enqueueSnackbar('User created successfully', { variant: 'success' })
      }
      
      refetch()
      handleCancel()
    } catch (error) {
      console.error('Error saving user:', error);
      enqueueSnackbar('Error saving user: ' + (error.message || 'Unknown error'), { variant: 'error' })
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

  // Define helper functions for sales tracking
  const getFilteredSales = () => {
    if (!salesData) return [];
    
    let filtered = salesData;
    
    // Filter by user
    if (selectedUser) {
      filtered = filtered.filter(sale => sale.userId === selectedUser);
    }
    
    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      
      filtered = filtered.filter(sale => {
        const saleDate = dayjs(sale.saleDate);
        return saleDate.isAfter(startDate) && saleDate.isBefore(endDate);
      });
    }
    
    return filtered;
  };

  const calculateTotalRevenue = () => {
    return getFilteredSales().reduce((total, sale) => total + (sale.salePrice * sale.quantitySold), 0);
  };

  const calculateTotalProfit = () => {
    return getFilteredSales().reduce((total, sale) => total + sale.profit, 0);
  };

  // Define sales columns
  const salesColumns = [
    {
      title: 'Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
      render: (date) => dayjs(date).format('DD-MM-YYYY HH:mm'),
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: 'Item',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantitySold',
      key: 'quantitySold',
    },
    {
      title: 'Price',
      dataIndex: 'salePrice',
      key: 'salePrice',
      render: (price) => `KES ${price.toFixed(2)}`,
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => `KES ${(record.salePrice * record.quantitySold).toFixed(2)}`,
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit) => <Tag color="green">{`KES ${profit.toFixed(2)}`}</Tag>,
    },
  ];

  return (
    <PageLayout layout="full-width">
      <Title level={2}>Admin Management</Title>
      <Text>
        Manage users and track sales performance.
      </Text>
      
      {/* Only show content to admin users */}
      {isAdmin ? (
        <Tabs 
          defaultActiveKey="users" 
          onChange={setActiveTab}
          items={[
            {
              key: 'users',
              label: <span><UserOutlined /> Users</span>,
              children: (
                <>
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
                    columns={[
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
                        render: (text, record) => {
                          const isUserAdmin = record.admins?.length > 0 || record.roles?.some(role => role.name === 'admin');
                          return isUserAdmin ? 'Admin' : 'User';
                        },
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
                            {isAdmin && (
                              <>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)}>
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
                              </>
                            )}
        </Space>
      ),
    },
                    ]}
        loading={isLoading}
        rowKey="id"
      />
                </>
              )
            },
            {
              key: 'sales',
              label: <span><DollarOutlined /> Sales by User</span>,
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
                    <Col span={24}>
                      <Card>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Title level={4}>Filter Sales</Title>
                          <Space>
                            <Select
                              placeholder="Select User"
                              style={{ width: 200 }}
                              allowClear
                              onChange={(value) => setSelectedUser(value)}
                            >
                              {users?.map(user => (
                                <Option key={user.id} value={user.id}>
                                  {user.name || user.email}
                                </Option>
                              ))}
                            </Select>
                            <RangePicker 
                              onChange={(dates) => setDateRange(dates)}
                              style={{ width: 300 }}
                            />
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                  
                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Card>
                        <Statistic 
                          title="Total Sales"
                          value={getFilteredSales().length}
                          suffix="transactions"
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic 
                          title="Total Revenue"
                          value={calculateTotalRevenue()}
                          prefix="KES "
                          precision={2}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic 
                          title="Total Profit"
                          value={calculateTotalProfit()}
                          prefix="KES "
                          precision={2}
                        />
                      </Card>
                    </Col>
                  </Row>
                  
                  <Table
                    dataSource={getFilteredSales()}
                    columns={salesColumns}
                    loading={isLoadingSales}
                    rowKey="id"
                    style={{ marginTop: '16px' }}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            }
          ]}
        />
      ) : (
        <div style={{ marginTop: '20px' }}>
          <Alert
            message="Access Restricted"
            description="You need administrator privileges to access this page."
            type="warning"
            showIcon
          />
        </div>
      )}

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={isModalVisible}
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
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (editingUser) {
                    // For editing, password is optional
                    return Promise.resolve();
                  }
                  // For new users, password is required
                  if (!value) {
                    return Promise.reject('Please input the password!');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
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
