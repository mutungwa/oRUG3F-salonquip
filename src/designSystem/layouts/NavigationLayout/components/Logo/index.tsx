import { Typography } from 'antd'
import { useRouter } from 'next/navigation'
import React, { ImgHTMLAttributes, useState } from 'react'

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  isLabel?: boolean
}

export const Logo: React.FC<Props> = ({
  height = 50,
  isLabel = false,
  style,
  ...props
}) => {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [imageSrc] = useState('/logo.png') // Check for logo.png in public folder

  // Ensure height is a number
  const logoHeight = typeof height === 'string' ? parseInt(height) || 50 : height

  const goTo = (url: string) => {
    router.push(url)
  }

  const handleImageError = () => {
    setImageError(true)
  }

  // Text-based round logo component
  const TextLogo = () => (
    <div
      style={{
        width: `${logoHeight}px`,
        height: `${logoHeight}px`,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
        transition: 'all 0.3s ease',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        ...style,
      }}
      onClick={() => goTo('/home')}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
      }}
    >
      <span
        style={{
          color: 'white',
          fontSize: `${logoHeight * 0.4}px`,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        }}
      >
        SQ
      </span>
    </div>
  )

  return (
    <div className="flex flex-row items-center gap-2">
      {!imageError ? (
        <img
          src={imageSrc}
          alt="SalonQuip Logo"
          height={logoHeight}
          style={{
            borderRadius: '50%',
            cursor: 'pointer',
            objectFit: 'cover',
            height: `${logoHeight}px`,
            width: `${logoHeight}px`,
            transition: 'all 0.3s ease',
            ...style,
          }}
          {...props}
          onClick={() => goTo('/home')}
          onError={handleImageError}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
          }}
        />
      ) : (
        <TextLogo />
      )}
      {isLabel && (
        <Typography.Title level={4} style={{ margin: '0px' }}>
          SalonQuip
        </Typography.Title>
      )}
    </div>
  )
}
