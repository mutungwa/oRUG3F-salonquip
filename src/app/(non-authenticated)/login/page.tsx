'use client'

import { Configuration } from '@/core/configuration'
import { AppHeader } from '@/designSystem/ui/AppHeader'
import { Button, Flex, Form, Input, Typography } from 'antd'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useEffect, useState } from 'react'

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthError extends Error {
  code?: string;
  statusCode?: number;
}

export default function LoginPage() {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const searchParams = useSearchParams()
  const [isLoading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const errorKey = searchParams.get('error')

  const errorMessage = {
    Signin: 'Try signing in with a different account.',
    OAuthSignin: 'Try signing in with a different account.',
    OAuthCallback: 'Try signing in with a different account.',
    OAuthCreateAccount: 'Try signing in with a different account.',
    EmailCreateAccount: 'Try signing in with a different account.',
    Callback: 'Try signing in with a different account.',
    OAuthAccountNotLinked:
      'To confirm your identity, sign in with the same account you used originally.',
    EmailSignin: 'Check your email address.',
    CredentialsSignin:
      'Sign in failed. Check the details you provided are correct.',
    default: 'Unable to sign in.',
  }[errorKey ?? 'default']

  useEffect(() => {
    if (Configuration.isDevelopment()) {
      form.setFieldValue('email', 'test@test.com')
      form.setFieldValue('password', 'password')
    }
  }, [])

  const getErrorMessage = (error: AuthError): string => {
    if (error.code === 'INVALID_CREDENTIALS') {
      return 'Invalid email or password'
    }
    if (error.statusCode === 429) {
      return 'Too many login attempts. Please try again later'
    }
    return error.message || 'An unexpected error occurred'
  }

  const handleSubmit = async (values: LoginCredentials) => {
    setLoading(true)
    form.validateFields() // Ensure all fields are valid

    try {
      // Sanitize inputs
      const sanitizedValues = {
        email: values.email?.trim().toLowerCase(),
        password: values.password,
      }

      const signInResult = await signIn('credentials', {
        ...sanitizedValues,
        callbackUrl: '/home',
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      if (signInResult?.url) {
        router.push(signInResult.url)
      }

    } catch (error: any) {
      const errorMessage = getErrorMessage(error as AuthError)
      
      enqueueSnackbar(`Login failed: ${errorMessage}`, {
        variant: 'error',
        preventDuplicate: true,
      })

      // Log error for debugging
      console.error('Login error:', {
        message: error.message,
        code: error.code,
      })

      // Reset password field on error
      form.setFields([
        {
          name: 'password',
          value: '',
        },
      ])
    } finally {
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

        {errorKey && (
          <Typography.Text type="danger">{errorMessage}</Typography.Text>
        )}

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
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
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              disabled={isLoading}
            />
          </Form.Item>

          <Form.Item>
            <Flex justify="end">
              <Button
                type="link"
                onClick={() => router.push('/reset-password')}
                style={{ padding: 0, margin: 0 }}
                disabled={isLoading}
              >
                Forgot password?
              </Button>
            </Flex>
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              loading={isLoading}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>

        <Button
          ghost
          style={{ border: 'none' }}
          onClick={() => router.push('/register')}
          disabled={isLoading}
        >
          <Flex gap={'small'} justify="center">
            <Typography.Text type="secondary">No account?</Typography.Text>{' '}
            <Typography.Text>Sign up</Typography.Text>
          </Flex>
        </Button>
      </Flex>
    </Flex>
  )
}