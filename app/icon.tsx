import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#534AB7',
        width: 32,
        height: 32,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
        <div style={{ fontSize: 9, color: 'white', fontWeight: 800, lineHeight: 1 }}>PE</div>
      </div>
    </div>,
    { ...size }
  )
}
