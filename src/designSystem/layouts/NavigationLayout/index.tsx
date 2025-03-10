import { useUserContext } from '@/core/context'
import { Col, Layout, Row } from 'antd'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { useDesignSystem } from '../../provider'
import { Leftbar } from './components/Leftbar'
import { Logo } from './components/Logo'
import { Topbar } from './components/Topbar/index.layout'

interface Props {
  children: ReactNode
}

export const NavigationLayout: React.FC<Props> = ({ children }) => {
  const router = useRouter()

  const { user, authenticationStatus: isLoggedIn, checkRole } = useUserContext()
  const isAdmin = checkRole('admin')

  const { isMobile } = useDesignSystem()

  const goTo = (url: string) => {
    router.push(url)
  }

  // Base navigation items for all users
  let itemsLeftbar = [
    {
      key: '/home',
      label: 'Home',
      onClick: () => goTo('/home'),
    },
    {
      key: '/items-management',
      label: 'Items Management',
      onClick: () => goTo('/items-management'),
    },
  ]

  // Admin-only navigation items
  if (isAdmin) {
    itemsLeftbar = [
      ...itemsLeftbar,
      {
        key: '/stock-management',
        label: 'Sales Management',
        onClick: () => goTo('/stock-management'),
      },
      {
        key: '/branch-management',
        label: 'Branch Management',
        onClick: () => goTo('/branch-management'),
      },
      {
        key: '/admin-management',
        label: 'Admin Management',
        onClick: () => goTo('/admin-management'),
      },
    ]
  }

  let itemsTopbar = []

  let itemsMobile = [
    {
      key: 'profile',
      label: 'Profile',
      onClick: () => goTo('/profile'),
    },
    ...itemsTopbar,
    ...itemsLeftbar,
  ]

  const isLeftbar = itemsLeftbar.length > 0 && !isMobile

  return (
    <>
      <Layout>
        <Row
          style={{
            height: '100vh',
            width: '100vw',
          }}
        >
          {isLeftbar && (
            <Col>
              <Leftbar items={itemsLeftbar} logo={<Logo className="m-2" />} />
            </Col>
          )}

          <Col
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Topbar
              isMobile={isMobile}
              itemsMobile={itemsMobile}
              isLoggedIn={isLoggedIn === 'authenticated'}
              items={itemsTopbar}
              logo={!isLeftbar && <Logo height={40} />}
            />

            <Col
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {children}
            </Col>
          </Col>
        </Row>
      </Layout>
    </>
  )
}
