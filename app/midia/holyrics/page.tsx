import { headers } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import HolyricsController from '@/components/midia/HolyricsController'

export default async function HolyricsPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            holyrics_url: true,
            holyrics_token: true,
        }
    })

    return (
        <HolyricsController
            holyricsUrl={tenant?.holyrics_url || ''}
            holyricsToken={tenant?.holyrics_token || ''}
        />
    )
}
