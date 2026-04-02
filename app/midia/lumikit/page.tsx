// app/midia/lumikit/page.tsx
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import LumikitClient from '@/components/midia/LumikitClient'

export const dynamic = 'force-dynamic'

export default async function LumikitPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { lumikit_url: true }
    })

    return (
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <header className="space-y-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Iluminacao</h1>
                <p className="text-xs text-muted">Lumikit — Controlo de cenas e brilho.</p>
            </header>
            <LumikitClient url={tenant?.lumikit_url || ''} />
        </main>
    )
}
