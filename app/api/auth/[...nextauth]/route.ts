import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      // ALLOWED_EMAILS 환경변수에 허용할 이메일을 콤마로 구분해서 입력
      // 예: ALLOWED_EMAILS=you@gmail.com,colleague@gmail.com
      const allowed = process.env.ALLOWED_EMAILS?.split(',').map(e => e.trim()) ?? []
      if (allowed.length === 0) return true // 미설정 시 전체 허용 (초기 설정 전)
      return allowed.includes(user.email ?? '')
    },
    async session({ session, token }) {
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
})

export { handler as GET, handler as POST }
