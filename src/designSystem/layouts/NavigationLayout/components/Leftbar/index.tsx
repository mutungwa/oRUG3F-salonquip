import { Menu, Row } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface Props {
  logo: ReactNode
  items: { key: string; label: string; icon?: ReactNode; onClick: () => void }[]
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export const Leftbar: React.FC<Props> = ({ logo, items, collapsed }) => {
  const pathname = usePathname()

  return (
    <>
      <Sider
        width={250}
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={{
          height: '100vh',
          overflow: 'auto',
        }}
      >
        <Row align="middle" style={{ height: 60, paddingLeft: 16 }}>
          {logo}
        </Row>
        <Menu
          mode="inline"
          items={items}
          selectedKeys={[pathname]}
          style={{
            width: '100%',
            height: 'calc(100% - 50px)', // Adjust for smaller logo height (40px + padding)
          }}
        />
      </Sider>
    </>
  )
}
