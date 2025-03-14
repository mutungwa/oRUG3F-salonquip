'use client'
import { Api } from '@/core/trpc'
import { AppHeader } from '@/designSystem/ui/AppHeader'
import { User } from '@prisma/client'
import { Button, Flex, Form, Input, Typography, Spin, Progress } from 'antd'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useState, useEffect } from 'react'
import { UserOutlined, LockOutlined, MailOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'

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
  const [isRegistrationDisabled, setIsRegistrationDisabled] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const { mutateAsync: registerUser } = Api.authentication.register.useMutation()
  const { data: adminCount } = Api.authentication.countAdmins.useQuery();

  useEffect(() => {
    if (adminCount && adminCount > 0) {
      setIsRegistrationDisabled(true);
    }
  }, [adminCount]);

  const getErrorMessage = (error: AuthError): string => {
    if (error.code === 'USER_EXISTS') {
      return 'This email is already registered'
    }
    if (error.statusCode === 429) {
      return 'Too many attempts. Please try again later'
    }
    return error.message || 'An unexpected error occurred'
  }

  const checkPasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    
    setPasswordRequirements(requirements)
    
    // Calculate strength percentage
    const strength = Object.values(requirements).filter(Boolean).length * 20
    setPasswordStrength(strength)
    
    return requirements
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 40) return '#ff4d4f' // Red
    if (strength < 80) return '#faad14' // Yellow
    return '#52c41a' // Green
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

        {isRegistrationDisabled ? (
          <Typography.Text type="danger">Registration is disabled. An admin already exists.</Typography.Text>
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
                prefix={<MailOutlined />}
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
                prefix={<UserOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[
                { required: true, message: 'Password is required' },
                {
                  validator: async (_, value) => {
                    if (!value) return Promise.resolve()
                    
                    const requirements = checkPasswordStrength(value)
                    
                    if (!requirements.length) {
                      return Promise.reject('Password must be at least 8 characters long')
                    }
                    if (!requirements.uppercase) {
                      return Promise.reject('Password must contain at least one uppercase letter')
                    }
                    if (!requirements.lowercase) {
                      return Promise.reject('Password must contain at least one lowercase letter')
                    }
                    if (!requirements.number) {
                      return Promise.reject('Password must contain at least one number')
                    }
                    if (!requirements.special) {
                      return Promise.reject('Password must contain at least one special character')
                    }
                    
                    return Promise.resolve()
                  }
                }
              ]}
              help={
                <div style={{ marginTop: '8px' }}>
                  <Progress
                    percent={passwordStrength}
                    strokeColor={getStrengthColor(passwordStrength)}
                    showInfo={false}
                    size="small"
                    style={{ marginBottom: '8px' }}
                  />
                  <div style={{ fontSize: '12px' }}>
                    <div>
                      {passwordRequirements.length ? 
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      } At least 8 characters
                    </div>
                    <div>
                      {passwordRequirements.uppercase ? 
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      } One uppercase letter
                    </div>
                    <div>
                      {passwordRequirements.lowercase ? 
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      } One lowercase letter
                    </div>
                    <div>
                      {passwordRequirements.number ? 
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      } One number
                    </div>
                    <div>
                      {passwordRequirements.special ? 
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      } One special character
                    </div>
                  </div>
                </div>
              }
            >
              <Input.Password
                type="password"
                placeholder="Your password"
                autoComplete="new-password"
                disabled={isLoading}
                prefix={<LockOutlined />}
                onChange={(e) => checkPasswordStrength(e.target.value)}
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