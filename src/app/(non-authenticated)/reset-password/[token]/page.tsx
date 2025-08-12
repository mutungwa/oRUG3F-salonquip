'use client'
import { Api } from '@/core/trpc'
import { AppHeader } from '@/designSystem/ui/AppHeader'
import { Alert, Button, Flex, Form, Input, Typography } from 'antd'
import { useParams, useRouter } from 'next/navigation'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

const { Text } = Typography

export default function ResetPasswordTokenPage() {
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const { token } = useParams<{ token: string }>()
  const [form] = Form.useForm()
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  })

  const {
    mutateAsync: resetPassword,
    isLoading,
    isSuccess,
  } = Api.authentication.resetPassword.useMutation()

  const checkPasswordStrength = (password: string) => {
    const requirements = {
      length: password.length >= 6,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    }
    
    setPasswordRequirements(requirements)
    
    // Calculate strength percentage
    const strength = Object.values(requirements).filter(Boolean).length * 25
    setPasswordStrength(strength)
    
    return requirements
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 50) return '#ff4d4f' // Red
    if (strength < 75) return '#faad14' // Yellow
    return '#52c41a' // Green
  }

  const handleSubmit = async (values: any) => {
    try {
      await resetPassword({ token, password: values.password })
    } catch (error) {
      enqueueSnackbar(`Could not reset password: ${error.message}`, {
        variant: 'error',
      })
    }
  }

  return (
    <>
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
          <AppHeader description="Change your password" />

          {isSuccess && (
            <Alert
              style={{ textAlign: 'center' }}
              type="success"
              message="Your password has been changed."
            />
          )}

          {!isSuccess && (
            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Password is required' }]}
              >
                <Input.Password
                  type="password"
                  placeholder="Your new password"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item
                label="Password confirmation"
                name="passwordConfirmation"
                rules={[
                  {
                    required: true,
                    message: 'Password confirmation is required',
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  type="password"
                  placeholder="Password confirmation"
                  autoComplete="current-password"
                />
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  block
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>
          )}

          <Flex justify="center" align="center">
            <Button
              ghost
              style={{ border: 'none' }}
              onClick={() => router.push('/login')}
            >
              <Flex gap={'small'} justify="center">
                <Text>Sign in</Text>
              </Flex>
            </Button>

            <Text type="secondary">or</Text>

            <Button
              ghost
              style={{ border: 'none' }}
              onClick={() => router.push('/register')}
            >
              <Flex gap={'small'} justify="center">
                <Text>Sign up</Text>
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
