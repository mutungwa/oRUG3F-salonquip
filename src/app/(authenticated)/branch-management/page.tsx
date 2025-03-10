'use client'

import { useUserContext } from '@/core/context'
import { Api } from '@/core/trpc'
import { PageLayout } from '@/designSystem/layouts/Page.layout'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Col, Form, Input, Modal, Row, Space, Table, Typography } from 'antd'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
const { Title, Text } = Typography

export default function BranchManagementPage() {
  const router = useRouter()
  const { user, checkRole } = useUserContext()
  const isAdmin = checkRole('admin')
  const { enqueueSnackbar } = useSnackbar()
  
  const { mutateAsync: createBranch } = Api.branch.create.useMutation()
  const { mutateAsync: updateBranch } = Api.branch.update.useMutation()
  const { mutateAsync: deleteBranch } = Api.branch.delete.useMutation()

  // Use refetch from the query to trigger a re-fetch
  const { data: branches, isLoading, refetch } = Api.branch.findMany.useQuery({})

  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [editingBranch, setEditingBranch] = useState(null)
  const [isFormVisible, setIsFormVisible] = useState(false)

  const onFinish = async (values) => {
    try {
      await createBranch({ data: values })
      enqueueSnackbar('Branch added successfully', { variant: 'success' })
      form.resetFields()
      setIsFormVisible(false)
      refetch() // Refetch branches to update the list
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
      refetch() // Refetch branches to update the list
    } catch (error) {
      enqueueSnackbar('Failed to update branch', { variant: 'error' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteBranch({ where: { id } })
      enqueueSnackbar('Branch deleted successfully', { variant: 'success' })
      refetch() // Refetch branches to update the list
    } catch (error) {
      enqueueSnackbar('Failed to delete branch', { variant: 'error' })
    }
  }

  return (
    <PageLayout layout="full-width">
      <Title level={2}>Branch Management</Title>
      <Text>View and manage branches across different locations.</Text>
      
      {isAdmin && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsFormVisible(true)}
          style={{ margin: '20px 0' }}
        >
          Add Branch
        </Button>
      )}
      
      <Table
        dataSource={branches}
        columns={[
          {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
          },
          {
            title: 'Location',
            dataIndex: 'location',
            key: 'location',
          },
          {
            title: 'Phone Number',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
          },
          {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
              <Space size="middle">
                {isAdmin && (
                  <>
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="default"
                      danger
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
      
      <Modal
        title="Add Branch"
        visible={isFormVisible}
        onCancel={() => setIsFormVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please input the branch name!' }]}
          >
            <Input placeholder="Branch Name" />
          </Form.Item>
          <Form.Item
            label="Location"
            name="location"
            rules={[{ required: true, message: 'Please input the branch location!' }]}
          >
            <Input placeholder="Branch Location" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[{ required: true, message: 'Please input the branch phone number!' }]}
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
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please input the branch name!' }]}>
            <Input placeholder="Branch Name" />
          </Form.Item>
          <Form.Item
            label="Location"
            name="location"
            rules={[{ required: true, message: 'Please input the branch location!' }]}
          >
            <Input placeholder="Branch Location" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[{ required: true, message: 'Please input the branch phone number!' }]}
          >
            <Input placeholder="Branch Phone Number" />
          </Form.Item>
        </Form>
      </Modal>
    </PageLayout>
  )
}
