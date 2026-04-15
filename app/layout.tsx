import type { Metadata, Viewport } from 'next'
import './globals.css'
import Providers from './providers'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',        // iPhone 노치/Dynamic Island 대응
  themeColor: '#534AB7',
}

export const metadata: Metadata = {
  title: 'PE Command Center',
  description: 'SV Investment 운용역 전용 투자 관리 허브',
  // iOS PWA 설정
  appleWebApp: {
    capable: true,
    title: 'PE Center',
    statusBarStyle: 'black-translucent',  // 노치 영역까지 앱 배경색 확장
    startupImage: [
      // iPhone 15 Pro Max
      { url: '/splash/1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 15 / 14
      { url: '/splash/1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone SE
      { url: '/splash/750x1334.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
