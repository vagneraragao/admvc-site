// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getModuloDaRota, moduloIncluidoNoPlano } from '@/lib/planos'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('admvc_session')
    const { pathname } = request.nextUrl

    // 1. Classificação de rotas
    const isPublicRoute = pathname === '/membros/login'
    const isMembrosProtected = pathname.startsWith('/membros/dashboard') || pathname.startsWith('/membros/termos')
    const isAdminProtected = pathname.startsWith('/admin')
    const isModuleProtected = pathname.startsWith('/louvor')
        || pathname.startsWith('/escalas')
        || pathname.startsWith('/grupos')
        || pathname.startsWith('/departamentos')
        || pathname.startsWith('/gabinete')
        || pathname.startsWith('/inventario')

    // 2. Sem sessão em rota protegida → login
    if ((isMembrosProtected || isAdminProtected || isModuleProtected) && !session) {
        return NextResponse.redirect(new URL('/membros/login', request.url))
    }

    // 3. Com sessão → extrair dados e verificar permissões
    if (session) {
        const parts = session.value.split('|')
        let userId = ''
        let userRole = ''
        let tenantId = ''
        let plano = 'FREE'

        parts.forEach(part => {
            const [key, val] = part.split(':')
            if (key === 'id') userId = val
            if (key === 'role') userRole = val
            if (key === 'tenant_id') tenantId = val
            if (key === 'plano') plano = val
        })

        // 3a. Proteção de role: USER não acede a /admin
        if (isAdminProtected && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/membros/dashboard', request.url))
        }

        // 3b. Verificação de módulo: se a rota pertence a um módulo, verifica se o plano o inclui
        const modulo = getModuloDaRota(pathname)
        if (modulo && !moduloIncluidoNoPlano(plano, modulo)) {
            const url = new URL('/membros/dashboard', request.url)
            url.searchParams.set('modulo_bloqueado', modulo)
            return NextResponse.redirect(url)
        }

        // 4. Injectar headers multitenant
        const requestHeaders = new Headers(request.headers)
        requestHeaders.set('x-user-id', userId)
        requestHeaders.set('x-user-role', userRole)
        requestHeaders.set('x-tenant-id', tenantId)
        requestHeaders.set('x-tenant-plano', plano)

        return NextResponse.next({
            request: { headers: requestHeaders },
        })
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/membros/:path*',
        '/louvor/:path*',
        '/escalas/:path*',
        '/grupos/:path*',
        '/departamentos/:path*',
        '/gabinete/:path*',
        '/inventario/:path*',
        '/api/admin/:path*',
    ],
}
