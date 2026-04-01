// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('admvc_session')
    const { pathname } = request.nextUrl

    // 1. Defina as rotas
    const isPublicRoute = pathname === '/membros/login' || pathname === '/admin/login'
    const isMembrosProtected = pathname.startsWith('/membros/dashboard') || pathname.startsWith('/membros/termos')
    const isAdminProtected = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')

    // 2. Se a rota é protegida e não há sessão, redireciona
    if ((isMembrosProtected || isAdminProtected) && !session) {
        return NextResponse.redirect(new URL(isAdminProtected ? '/admin/login' : '/membros/login', request.url))
    }

    // 3. Se houver sessão, extraímos os dados multitenant
    if (session) {
        // Quebra a string "id:1|role:ADMIN|tenant_id:5"
        const parts = session.value.split('|');
        let userId = '';
        let userRole = '';
        let tenantId = '';

        parts.forEach(part => {
            const [key, val] = part.split(':');
            if (key === 'id') userId = val;
            if (key === 'role') userRole = val;
            if (key === 'tenant_id') tenantId = val;
        });

        // (Opcional) Proteção extra de Role: Se for USER tentando acessar /admin, bloqueia.
        if (isAdminProtected && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/membros/dashboard', request.url));
        }

        // 4. A MÁGICA DO MULTITENANT NO NEXT.JS: Injetar Headers
        // Clonamos os headers atuais da requisição e adicionamos os nossos
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', userId);
        requestHeaders.set('x-user-role', userRole);
        requestHeaders.set('x-tenant-id', tenantId);

        // Retornamos a requisição para o Next.js, mas agora com os headers injetados!
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*', '/membros/:path*', '/api/admin/:path*'],
}