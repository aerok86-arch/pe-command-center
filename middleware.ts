export { default } from 'next-auth/middleware'

export const config = {
  // /login, /api/auth/* 제외한 모든 경로에 인증 적용
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
