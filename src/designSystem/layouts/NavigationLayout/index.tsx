'use client'

import { useUserContext } from '@/core/context'
import { useDesignSystem } from '@/designSystem/provider'
import {
    AppstoreOutlined,
    FileTextOutlined,
    HomeOutlined,
    ShopOutlined,
    ShoppingCartOutlined,
    UserOutlined
} from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import React from 'react'
import { Leftbar } from './components/Leftbar'
import { Logo } from './components/Logo'
import { Topbar } from './components/Topbar/index.layout'

interface Props {
  children: React.ReactNode
}

export const NavigationLayout: React.FC<Props> = ({ children }) => {
  const { checkRole, authenticationStatus } = useUserContext()
  const isAdmin = checkRole('admin')
  const router = useRouter()
  const goTo = (path: string) => router.push(path)
  const { isMobile } = useDesignSystem()
  const [collapsed, setCollapsed] = React.useState(false);

  // Base navigation items for all users
  let itemsLeftbar = [
    {
      key: '/home',
      label: 'Home',
      icon: <HomeOutlined />,
      onClick: () => goTo('/home'),
    },
    {
      key: '/items-management',
      label: 'Items Management',
      icon: <AppstoreOutlined />,
      onClick: () => goTo('/items-management'),
    },
    {
      key: '/inventory-log',
      label: 'Inventory Log',
      icon: <FileTextOutlined />,
      onClick: () => goTo('/inventory-log'),
    },
    {
      key: '/stock-management',
      label: 'Sales Management',
      icon: <ShoppingCartOutlined />,
      onClick: () => goTo('/stock-management'),
    },
    {
      key: '/branch-management',
      label: 'Branch Management',
      icon: <ShopOutlined />,
      onClick: () => goTo('/branch-management'),
    },
  ]

  // Add admin-only pages
  if (isAdmin) {
    itemsLeftbar.push({
      key: '/admin-management',
      label: 'Admin Management',
      icon: <UserOutlined />,
      onClick: () => goTo('/admin-management'),
    })
  }

  let itemsTopbar = []
  let itemsMobile = [
    ...itemsTopbar,
    ...itemsLeftbar,
  ]

  const isLeftbar = itemsLeftbar.length > 0 && !isMobile
  const sidebarWidth = collapsed ? 80 : 250;

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
          <Leftbar
            items={itemsLeftbar}
            logo={<Logo height="40" className="m-2" />}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          marginLeft: isLeftbar ? `${sidebarWidth}px` : '0',
          transition: 'margin-left 0.2s',
        }}
      >
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: isLeftbar ? `calc(100% - ${sidebarWidth}px)` : '100%',
          zIndex: 1000,
          transition: 'width 0.2s',
        }}>
          <Topbar
            logo={!isLeftbar && <Logo height="40" className="m-2" />}
            itemsMobile={itemsMobile}
            isMobile={isMobile}
            isLoggedIn={authenticationStatus === 'authenticated'}
            items={itemsTopbar}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
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
