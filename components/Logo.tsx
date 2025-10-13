import Image from 'next/image'
import { LOGOS } from '@/lib/logos'

interface LogoProps {
  variant?: 'color' | 'white'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  priority?: boolean
}

const sizeMap = {
  sm: { width: 120, height: 36 },
  md: { width: 200, height: 60 },
  lg: { width: 300, height: 90 },
  xl: { width: 400, height: 120 },
}

export function Logo({ 
  variant = 'color', 
  size = 'md', 
  className = '',
  priority = false 
}: LogoProps) {
  const logoUrl = variant === 'white' ? LOGOS.white : LOGOS.color
  const dimensions = sizeMap[size]
  
  return (
    <Image
      src={logoUrl}
      alt="Alambres del Norte SRL"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={className}
    />
  )
}

// Componente específico para el favicon
export function Favicon() {
  return (
    <link rel="icon" href={LOGOS.favicon} />
  )
}

// Componente para isologo (versión pequeña)
interface IsoLogoProps {
  variant?: 'red' | 'white'
  size?: number
  className?: string
}

export function IsoLogo({ 
  variant = 'red', 
  size = 32,
  className = ''
}: IsoLogoProps) {
  const logoUrl = variant === 'white' ? LOGOS.isoWhite : LOGOS.isoRed
  
  return (
    <Image
      src={logoUrl}
      alt="ADN"
      width={size}
      height={size}
      className={className}
    />
  )
}
