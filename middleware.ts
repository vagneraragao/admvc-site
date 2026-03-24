// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('admvc_session')
    const { pathname } = request.nextUrl

    // 1. Defina as rotas que NÃO precisam de login
    const isPublicRoute = pathname === '/membros/login' || pathname === '/admin/login'

    // 2. Defina as rotas que PRECISAM de login
    const isMembrosProtected = pathname.startsWith('/membros/dashboard') || pathname.startsWith('/membros/termos')
    const isAdminProtected = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')

    // Lógica de Redirecionamento
    if ((isMembrosProtected || isAdminProtected) && !session) {
        return NextResponse.redirect(new URL(isAdminProtected ? '/admin/login' : '/membros/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/membros/:path*'],
}