
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  // セッションを取得
  const { data: { session } } = await supabase.auth.getSession()
  
  // 認証が必要なパス
  const protectedPaths = ['/todos']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
  
  // ログインページは認証チェックをスキップ
  if (req.nextUrl.pathname === '/login') {
    return res
  }
  
  // 認証が必要なパスでセッションがない場合、ログインページにリダイレクト
  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  // 認証済みユーザーがログインページにアクセスした場合、todosにリダイレクト
  if (req.nextUrl.pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/todos', req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


