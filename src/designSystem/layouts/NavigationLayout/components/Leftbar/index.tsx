import { Menu, Row } from 'antd'
import Sider from 'antd/es/layout/Sider'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface Props {
  logo: ReactNode
  items: { key: string; label: string; onClick: () => void }[]
}

export const Leftbar: React.FC<Props> = ({ logo, items }) => {
  const pathname = usePathname()

  return (
    <>
      <Sider 
        width={250} 
        trigger={null} 
        style={{ 
          height: '100vh', 
          overflow: 'auto',
        }}
      >
        <Row>{logo}</Row>
        <Menu
          mode="inline"
          items={items}
          selectedKeys={[pathname]}
          style={{ 
            width: '100%',
            height: 'calc(100% - 60px)', // Adjust for logo height
          }}
        />
      </Sider>
    </>
  )
}
