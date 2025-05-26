'use client'

import { useUserContext } from '@/core/context'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { DeleteOutlined, DollarOutlined, DownloadOutlined, EditOutlined, GiftOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tabs,
    Tag,
    Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useParams, useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'
const { Title, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

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
  const [editPointsForm] = Form.useForm();
  const [isEditPointsModalVisible, setIsEditPointsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize for responsive design
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on initial load
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const {
    data: users,
    isLoading,
    refetch,
  } = Api.user.findMany.useQuery({ include: { admins: true, roles: true } })

  // Add the sales data query with debugging
  const {
    data: salesData,
    isLoading: isLoadingSales,
  } = Api.sale.findMany.useQuery({
    orderBy: { saleDate: 'desc' },
    select: {
      id: true,
      saleDate: true,
      userName: true,
      itemName: true,
      branchName: true,
      quantitySold: true,
      sellPrice: true,
      profit: true,
      userId: true,
      customerId: true,
      loyaltyPointsEarned: true,

    }
  }, {
    onSuccess: (data) => {
      console.log('Sales data fetched:', data);
    },
    onError: (error) => {
      console.error('Error fetching sales data:', error);
    }
  })

  const { mutateAsync: createUser } = Api.user.create.useMutation()
  const { mutateAsync: updateUser } = Api.user.update.useMutation()
  const { mutateAsync: deleteUser } = Api.user.delete.useMutation()
  const { mutateAsync: createRole } = Api.role.create.useMutation()
  const { mutateAsync: createAdmin } = Api.admin.create.useMutation()
  const { mutateAsync: deleteRole } = Api.role.delete.useMutation()
  const { mutateAsync: deleteAdmin } = Api.admin.delete.useMutation()
  const { data: roles } = Api.role.findMany.useQuery({})

  const { data: customers, refetch: refetchCustomers } = Api.customer.findMany.useQuery({})
  const { mutateAsync: updateCustomer } = Api.customer.update.useMutation()

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

        refetch()
        handleCancel()
      }
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
    console.log('getFilteredSales called, salesData:', salesData);

    if (!salesData) return [];

    let filtered = salesData;

    // Filter by user
    if (selectedUser) {
      filtered = filtered.filter(sale => sale.userId === selectedUser);
      console.log('Filtered by user:', selectedUser, 'results:', filtered.length);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');

      filtered = filtered.filter(sale => {
        const saleDate = dayjs(sale.saleDate);
        return saleDate.isAfter(startDate) && saleDate.isBefore(endDate);
      });
      console.log('Filtered by date range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'), 'results:', filtered.length);
    }

    console.log('Final filtered sales:', filtered);
    return filtered;
  };

  const calculateTotalRevenue = () => {
    return getFilteredSales().reduce((total, sale) => total + (sale.sellPrice * sale.quantitySold), 0);
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
      dataIndex: 'sellPrice',
      key: 'sellPrice',
      render: (price) => price ? `KES ${price.toFixed(2)}` : 'N/A',
    },
    {
      title: 'Total',
      key: 'total',
      render: (_, record) => record.sellPrice && record.quantitySold ?
        `KES ${(record.sellPrice * record.quantitySold).toFixed(2)}` : 'N/A',
    },
    {
      title: 'Profit',
      dataIndex: 'profit',
      key: 'profit',
      render: (profit) => profit ? <Tag color="green">{`KES ${profit.toFixed(2)}`}</Tag> : <Tag color="gray">N/A</Tag>,
    },
  ];

  // Add function to handle CSV export
  const handleExportCSV = () => {
    const filteredSales = getFilteredSales();
    if (filteredSales.length === 0) {
      enqueueSnackbar('No data to export', { variant: 'warning' });
      return;
    }

    // Create CSV content
    const headers = [
      'Date',
      'User',
      'Item',
      'Branch',
      'Quantity',
      'Price (KES)',
      'Total (KES)',
      'Profit (KES)'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredSales.map(sale => [
        dayjs(sale.saleDate).format('DD-MM-YYYY HH:mm'),
        sale.userName,
        sale.itemName,
        sale.branchName,
        sale.quantitySold,
        sale.sellPrice.toFixed(2),
        (sale.sellPrice * sale.quantitySold).toFixed(2),
        sale.profit.toFixed(2)
      ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_report_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpdateLoyaltyPoints = async (values: any) => {
    try {
      await updateCustomer({
        where: { id: selectedCustomer.id },
        data: { loyaltyPoints: values.loyaltyPoints }
      })
      enqueueSnackbar('Loyalty points updated successfully', { variant: 'success' })
      refetchCustomers()
      setIsEditPointsModalVisible(false)
      editPointsForm.resetFields()
    } catch (error) {
      enqueueSnackbar('Failed to update loyalty points', { variant: 'error' })
    }
  }

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
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <Table
                      dataSource={users}
                      columns={[
                        {
                          title: 'Email',
                          dataIndex: 'email',
                          key: 'email',
                          ellipsis: isMobile
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
                          render: text => dayjs(text).format(isMobile ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss'),
                          responsive: ['md']
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (text, record) => (
                            <Space size="middle" wrap={isMobile}>
                              {isAdmin && (
                                <>
                                  <Button
                                    icon={<EditOutlined />}
                                    onClick={() => showModal(record)}
                                    size={isMobile ? 'small' : 'middle'}
                                  >
                                    {isMobile ? '' : 'Edit'}
                                  </Button>
                                  <Button
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleDelete(record.id)}
                                    size={isMobile ? 'small' : 'middle'}
                                  >
                                    {isMobile ? '' : 'Delete'}
                                  </Button>
                                </>
                              )}
                            </Space>
                          ),
                        },
                      ]}
                      loading={isLoading}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        size: isMobile ? 'small' : undefined
                      }}
                      scroll={{ x: isMobile ? 600 : undefined }}
                      size={isMobile ? 'small' : 'middle'}
                    />
                  </div>
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
                          <Space
                            align="center"
                            style={{
                              width: '100%',
                              justifyContent: 'space-between',
                              flexDirection: isMobile ? 'column' : 'row',
                              alignItems: isMobile ? 'flex-start' : 'center',
                              gap: '10px'
                            }}
                          >
                            <Title level={4}>Filter Sales</Title>
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              onClick={handleExportCSV}
                              disabled={!salesData || salesData.length === 0}
                              style={{ width: isMobile ? '100%' : 'auto' }}
                            >
                              Export to CSV
                            </Button>
                          </Space>
                          <Space
                            direction={isMobile ? 'vertical' : 'horizontal'}
                            style={{
                              width: '100%',
                              display: 'flex',
                              flexWrap: isMobile ? 'nowrap' : 'wrap'
                            }}
                          >
                            <Select
                              placeholder="Select User"
                              style={{ width: isMobile ? '100%' : 200 }}
                              allowClear
                              onChange={(value) => setSelectedUser(value)}
                            >
                              {users?.map(user => (
                                <Option key={user.id} value={user.id}>
                                  {user.name || user.email}
                                </Option>
                              ))}
                            </Select>
                            <div style={{ width: isMobile ? '100%' : 'auto' }}>
                              <RangePicker
                                onChange={(dates) => setDateRange(dates)}
                                style={{ width: isMobile ? '100%' : 300 }}
                              />
                            </div>
                          </Space>
                        </Space>
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
                    <Col xs={24} sm={24} md={8}>
                      <Card>
                        <Statistic
                          title="Total Sales"
                          value={getFilteredSales().length}
                          suffix="transactions"
                          valueStyle={{ fontSize: isMobile ? '20px' : '24px' }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Card>
                        <Statistic
                          title="Total Revenue"
                          value={calculateTotalRevenue()}
                          prefix="KES "
                          precision={2}
                          valueStyle={{
                            fontSize: isMobile ? '18px' : '24px',
                            wordBreak: 'break-word'
                          }}
                        />
                      </Card>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Card>
                        <Statistic
                          title="Total Profit"
                          value={calculateTotalProfit()}
                          prefix="KES "
                          precision={2}
                          valueStyle={{
                            fontSize: isMobile ? '18px' : '24px',
                            wordBreak: 'break-word'
                          }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <div style={{ width: '100%', overflowX: 'auto', marginTop: '16px' }}>
                    <Table
                      dataSource={getFilteredSales()}
                      columns={salesColumns.map(column => ({
                        ...column,
                        ellipsis: column.key === 'itemName' || column.key === 'userName' ? isMobile : false,
                        responsive: column.key === 'branchName' ? ['md'] : undefined
                      }))}
                      loading={isLoadingSales}
                      rowKey="id"
                      pagination={{
                        pageSize: 10,
                        size: isMobile ? 'small' : undefined
                      }}
                      scroll={{ x: isMobile ? 800 : undefined }}
                      size={isMobile ? 'small' : 'middle'}
                    />
                  </div>
                </>
              )
            },
            {
              key: 'loyalty',
              label: <span><GiftOutlined /> Loyalty Program</span>,
              children: (
                <>
                  <Row gutter={[16, 16]} style={{ marginTop: '20px' }}>
                    <Col span={24}>
                      <Card>
                        <Title level={4}>Customer Loyalty Program</Title>
                        <Alert
                          message="Loyalty Program Rules"
                          description="Customers earn 5% of profit as loyalty points. Referrers earn 2% of profit when their referrals make purchases."
                          type="info"
                          showIcon
                          style={{ marginBottom: '20px' }}
                        />
                        <div style={{ width: '100%', overflowX: 'auto' }}>
                          <Table
                            dataSource={customers}
                            columns={[
                              {
                                title: 'Customer Name',
                                dataIndex: 'name',
                                key: 'name',
                                ellipsis: isMobile
                              },
                              {
                                title: 'Phone Number',
                                dataIndex: 'phoneNumber',
                                key: 'phoneNumber',
                                responsive: ['sm']
                              },
                              {
                                title: 'Loyalty Points',
                                dataIndex: 'loyaltyPoints',
                                key: 'loyaltyPoints',
                                render: (points: number) => `KES ${points.toFixed(2)}`,
                              },
                              {
                                title: 'Referred By',
                                key: 'referredBy',
                                render: (_, record) => {
                                  const referrer = customers?.find(c => c.id === record.referredBy)
                                  return referrer ? referrer.name : '-'
                                },
                                responsive: ['md']
                              },
                              {
                                title: 'Referrals',
                                key: 'referrals',
                                render: (_, record) => {
                                  return customers?.filter(c => c.referredBy === record.id).length || 0
                                },
                                responsive: ['md']
                              },
                              {
                                title: 'Total Earned',
                                key: 'totalPoints',
                                render: (_, record) => {
                                  const sales = salesData?.filter(s => s.customerId === record.id) || [];
                                  const pointsEarned = sales.reduce((sum, sale) => sum + sale.loyaltyPointsEarned, 0);
                                  return `KES ${pointsEarned.toFixed(2)}`;
                                },
                                responsive: ['lg']
                              },
                              {
                                title: 'Actions',
                                key: 'actions',
                                render: (_, record) => (
                                  <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    size={isMobile ? 'small' : 'middle'}
                                    onClick={() => {
                                      setSelectedCustomer(record);
                                      editPointsForm.setFieldsValue({
                                        loyaltyPoints: record.loyaltyPoints
                                      });
                                      setIsEditPointsModalVisible(true);
                                    }}
                                  >
                                    {isMobile ? '' : 'Edit Points'}
                                  </Button>
                                ),
                              },
                            ]}
                            rowKey="id"
                            pagination={{
                              pageSize: 10,
                              size: isMobile ? 'small' : undefined
                            }}
                            scroll={{ x: isMobile ? 600 : undefined }}
                            size={isMobile ? 'small' : 'middle'}
                          />
                        </div>
                      </Card>
                    </Col>
                  </Row>

                  <Modal
                    title="Edit Loyalty Points"
                    open={isEditPointsModalVisible}
                    onCancel={() => {
                      setIsEditPointsModalVisible(false);
                      editPointsForm.resetFields();
                    }}
                    footer={null}
                    width={isMobile ? '95%' : 520}
                    style={{
                      top: isMobile ? 20 : 100,
                      maxWidth: isMobile ? '95vw' : '520px'
                    }}
                    styles={{
                      body: {
                        maxHeight: isMobile ? '70vh' : '80vh',
                        overflowY: 'auto'
                      }
                    }}
                  >
                    <Form
                      form={editPointsForm}
                      onFinish={handleUpdateLoyaltyPoints}
                      layout="vertical"
                    >
                      <Form.Item
                        name="loyaltyPoints"
                        label="Loyalty Points"
                        rules={[{ required: true, message: 'Please input the loyalty points!' }]}
                      >
                        <InputNumber
                          style={{ width: '100%' }}
                          formatter={value => `KES ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value!.replace(/KES\s?|(,*)/g, '')}
                          placeholder="Enter loyalty points"
                        />
                      </Form.Item>
                      <Form.Item>
                        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                          <Button onClick={() => {
                            setIsEditPointsModalVisible(false);
                            editPointsForm.resetFields();
                          }}>
                            Cancel
                          </Button>
                          <Button type="primary" htmlType="submit">
                            Update Points
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </Modal>
                </>
              ),
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
        width={isMobile ? '95%' : 520}
        style={{
          top: isMobile ? 20 : 100,
          maxWidth: isMobile ? '95vw' : '520px'
        }}
        styles={{
          body: {
            maxHeight: isMobile ? '70vh' : '80vh',
            overflowY: 'auto'
          }
        }}
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