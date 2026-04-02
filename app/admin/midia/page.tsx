// app/admin/midia/page.tsx
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import MidiaConfigClient from '@/components/admin/MidiaConfigClient'

export const dynamic = 'force-dynamic'

export default async function MidiaConfigPage() {
    const session = await getSessionData()
    if (!session || !['ADMIN'].includes(session.role)) redirect('/membros/dashboard')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            holyrics_url: true,
            holyrics_token: true,
            x32_ip: true,
            x32_port: true,
            lumikit_url: true,
        }
    })

    return (
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <MidiaConfigClient config={tenant} />
        </main>
    )
}
