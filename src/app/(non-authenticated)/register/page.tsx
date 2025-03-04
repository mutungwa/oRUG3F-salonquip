'use client'
import { Api } from '@/core/trpc'
import { AppHeader } from '@/designSystem/ui/AppHeader'
import { User } from '@prisma/client'
import { Button, Flex, Form, Input, Typography, Spin } from 'antd'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

interface AuthError extends Error {
  code?: string;
  statusCode?: number;
}

export default function RegisterPage() {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [form] = Form.useForm()
  const [isLoading, setLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { mutateAsync: registerUser } = Api.authentication.register.useMutation()

  const getErrorMessage = (error: AuthError): string => {
    if (error.code === 'USER_EXISTS') {
      return 'This email is already registered'
    }
    if (error.statusCode === 429) {
      return 'Too many attempts. Please try again later'
    }
    return error.message || 'An unexpected error occurred'
  }

  const handleSubmit = async (values: Partial<User>) => {
    setLoading(true)

    try {
      const sanitizedValues = {
        ...values,
        email: values.email?.trim().toLowerCase(),
        name: values.name?.trim(),
      }

      await registerUser(sanitizedValues)

      try {
        const signInResult = await signIn('credentials', {
          ...sanitizedValues,
          callbackUrl: '/home',
          redirect: false,
        })

        if (signInResult?.error) {
          throw new Error('Authentication failed after registration')
        }

        setIsRedirecting(true)
        router.push('/home')
      } catch (signInError) {
        enqueueSnackbar('Registration successful but login failed. Please try logging in.', {
          variant: 'warning',
        })
        router.push('/login')
      }

    } catch (error: any) {
      const errorMessage = getErrorMessage(error as AuthError)
      
      enqueueSnackbar(`Registration failed: ${errorMessage}`, {
        variant: 'error',
        preventDuplicate: true,
      })

      console.error('Registration error:', {
        message: error.message,
        code: error.code,
      })

      form.setFields([
        {
          name: 'password',
          value: '',
        },
      ])
      setLoading(false)
    }
  }

  return (
    <Flex align="center" justify="center" vertical flex={1}>
      <Flex
        vertical
        style={{
          width: '340px',
          paddingBottom: '100px',
          paddingTop: '100px',
        }}
        gap="middle"
      >
        <AppHeader description="Welcome!" />

        {isRedirecting ? (
          <Flex vertical align="center" gap="middle">
            <Spin size="large" />
            <Typography.Text>Setting up your account...</Typography.Text>
          </Flex>
        ) : (
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            autoComplete="off"
            requiredMark={false}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[{ required: true, message: 'Email is required' }]}
            >
              <Input 
                type="email" 
                placeholder="Your email" 
                autoComplete="email"
                disabled={isLoading} 
              />
            </Form.Item>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Name is required' }]}
              label="Name"
            >
              <Input 
                placeholder="Your name"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password
                type="password"
                placeholder="Your password"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={isLoading} 
                block
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Register'}
              </Button>
            </Form.Item>
          </Form>
        )}

        <Button
          ghost
          style={{ border: 'none' }}
          onClick={() => router.push('/login')}
          disabled={isLoading || isRedirecting}
        >
          <Flex gap={'small'} justify="center">
            <Typography.Text type="secondary">Have an account?</Typography.Text>{' '}
            <Typography.Text>Sign in</Typography.Text>
          </Flex>
        </Button>
      </Flex>
    </Flex>
  )
}