'use client'

import { useUserContext } from '@/core/context'
import { useRouter } from 'next/navigation'
import { useDesignSystem } from '@/designSystem/provider'
import { Leftbar } from './components/Leftbar'
import { Topbar } from './components/Topbar/index.layout'
import { Logo } from './components/Logo'

interface Props {
  children: React.ReactNode
}

export const NavigationLayout: React.FC<Props> = ({ children }) => {
  const { checkRole, authenticationStatus } = useUserContext()
  const isAdmin = checkRole('admin')
  const router = useRouter()
  const goTo = (path: string) => router.push(path)
  const { isMobile } = useDesignSystem()

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
    {
      key: '/stock-management',
      label: 'Stock Management',
      onClick: () => goTo('/stock-management'),
    },
    {
      key: '/branch-management',
      label: 'Branch Management',
      onClick: () => goTo('/branch-management'),
    },
  ]

  // Add admin-only pages
  if (isAdmin) {
    itemsLeftbar.push({
      key: '/admin-management',
      label: 'Admin Management',
      onClick: () => goTo('/admin-management'),
    })
  }

  let itemsTopbar = []
  let itemsMobile = [
    ...itemsTopbar,
    ...itemsLeftbar,
  ]

  const isLeftbar = itemsLeftbar.length > 0 && !isMobile

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        position: 'relative',
      }}
    >
      {isLeftbar && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          zIndex: 1000,
        }}>
          <Leftbar items={itemsLeftbar} logo={<Logo className="m-2" />} />
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          marginLeft: isLeftbar ? '250px' : '0',
        }}
      >
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: isLeftbar ? 'calc(100% - 250px)' : '100%',
          zIndex: 1000,
        }}>
          <Topbar
            logo={!isLeftbar && <Logo className="m-2" />}
            itemsMobile={itemsMobile}
            isMobile={isMobile}
            isLoggedIn={authenticationStatus === 'authenticated'}
            items={itemsTopbar}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            padding: '20px',
            marginTop: '64px',
            overflowY: 'auto',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
