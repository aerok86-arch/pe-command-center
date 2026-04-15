import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(145deg, #6B61C8 0%, #534AB7 60%, #3C3489 100%)',
        width: 180,
        height: 180,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}
    >
      {/* 상단 점 */}
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }} />
      {/* PE 텍스트 */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-2px',
          lineHeight: 1,
        }}
      >
        PE
      </div>
      {/* 하단 서브텍스트 */}
      <div
        style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '2px',
          fontWeight: 500,
        }}
      >
        COMMAND
      </div>
    </div>,
    { ...size }
  )
}
