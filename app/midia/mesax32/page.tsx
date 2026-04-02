// app/midia/mesax32/page.tsx
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import Link from 'next/link'
import X32Client from '@/components/midia/X32Client'

export const dynamic = 'force-dynamic'

export default async function X32Page() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { x32_ip: true, x32_port: true }
    })

    return (
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <header className="space-y-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Mesa de Som</h1>
                <p className="text-xs text-muted">Behringer X32 — Controlo de volumes e mix bus.</p>
            </header>
            <X32Client ip={tenant?.x32_ip || ''} port={tenant?.x32_port || 10023} />
        </main>
    )
}
