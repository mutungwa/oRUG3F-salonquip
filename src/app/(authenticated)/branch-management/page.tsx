'use client'

import { useState } from 'react'
import { Form, Input, Button, Row, Col, Typography, Table, Space, Modal } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
const { Title, Text } = Typography
import { useUserContext } from '@/core/context'
import { useRouter, useParams } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'

export default function BranchManagementPage() {
  const router = useRouter()
  const { user } = useUserContext()
  const { enqueueSnackbar } = useSnackbar()
  const { mutateAsync: createBranch } = Api.branch.create.useMutation()
  const { mutateAsync: updateBranch } = Api.branch.update.useMutation()
  const { mutateAsync: deleteBranch } = Api.branch.delete.useMutation()

  const { data: branches, isLoading } = Api.branch.findMany.useQuery({})

  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [editingBranch, setEditingBranch] = useState(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

  const onFinish = async (values: { name: string; location: string; phoneNumber: string }) => {
    try {
      await createBranch({ data: values })
      enqueueSnackbar('Branch added successfully', { variant: 'success' })
      form.resetFields()
      setIsFormVisible(false)
    } catch (error) {
      enqueueSnackbar('Failed to add branch', { variant: 'error' })
    }
  }

  const handleEdit = (branch) => {
    setEditingBranch(branch)
    editForm.setFieldsValue(branch)
  }

  const handleUpdate = async (values) => {
    try {
      await updateBranch({ where: { id: editingBranch.id }, data: values })
      enqueueSnackbar('Branch updated successfully', { variant: 'success' })
      setEditingBranch(null)
    } catch (error) {
      enqueueSnackbar('Failed to update branch', { variant: 'error' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteBranch({ where: { id } })
      enqueueSnackbar('Branch deleted successfully', { variant: 'success' })
    } catch (error) {
      enqueueSnackbar('Failed to delete branch', { variant: 'error' })
    }
  }

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: '30%',
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: '20%',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (text, record) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ]

  return (
    <PageLayout layout="full-width">
      <Row justify="center" style={{ marginTop: '20px' }}>
        <Col xs={24} sm={18} md={12} lg={10} xl={8}>
          <Title level={2}>Branch Management</Title>
          <Text>Add new branches to manage different locations.</Text>
          <Button type="primary" onClick={() => setIsFormVisible(true)} style={{ marginTop: '20px' }}>
            Add Branch
          </Button>
          <Modal
            title="Add Branch"
            visible={isFormVisible}
            onCancel={() => setIsFormVisible(false)}
            footer={null}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              <Form.Item
                label="Name"
                name="name"
                rules={[
                  { required: true, message: 'Please input the branch name!' },
                ]}
              >
                <Input placeholder="Branch Name" />
              </Form.Item>
              <Form.Item
                label="Location"
                name="location"
                rules={[
                  {
                    required: true,
                    message: 'Please input the branch location!',
                  },
                ]}
              >
                <Input placeholder="Branch Location" />
              </Form.Item>
              <Form.Item
                label="Phone Number"
                name="phoneNumber"
                rules={[
                  {
                    required: true,
                    message: 'Please input the branch phone number!',
                  },
                ]}
              >
                <Input placeholder="Branch Phone Number" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                  Add Branch
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </Col>
      </Row>
      <Row justify="center" style={{ marginTop: '20px' }}>
        <Col span={24}>
          <Table
            columns={columns}
            dataSource={branches?.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())}
            rowKey="id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: '100%' }}
          />
        </Col>
      </Row>
      <Modal
        title="Edit Branch"
        visible={!!editingBranch}
        onCancel={() => setEditingBranch(null)}
        onOk={() => {
          editForm
            .validateFields()
            .then((values) => {
              handleUpdate(values)
            })
            .catch((info) => {
              console.log('Validate Failed:', info)
            })
        }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[
              { required: true, message: 'Please input the branch name!' },
            ]}
          >
            <Input placeholder="Branch Name" />
          </Form.Item>
          <Form.Item
            label="Location"
            name="location"
            rules={[
              { required: true, message: 'Please input the branch location!' },
            ]}
          >
            <Input placeholder="Branch Location" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[
              { required: true, message: 'Please input the branch phone number!' },
            ]}
          >
            <Input placeholder="Branch Phone Number" />
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  )
}
