import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PE Command Center',
    short_name: 'PE Center',
    description: 'SV Investment 운용역 전용 투자 관리 허브',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f6f2',
    theme_color: '#534AB7',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
