import type { LogoProps } from 'sanity'

export function Logo(_props?: Partial<LogoProps>) {
  return (
    <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
      RUTA <span style={{ color: '#f59e0b' }}>TECH</span>
    </div>
  )
}
