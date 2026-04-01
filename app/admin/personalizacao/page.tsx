// app/admin/personalizacao/page.tsx
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import PersonalizacaoClient from '@/components/admin/PersonalizacaoClient'

export const dynamic = 'force-dynamic'

export default async function PersonalizacaoPage() {
    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)
    if (!tenantId) redirect('/membros/login')

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            cor_primaria: true,
            cor_secundaria: true,
            cor_fundo: true,
            logo_url: true,
            nome: true,
        }
    })

    if (!tenant) redirect('/admin/dashboard')

    return <PersonalizacaoClient tenant={tenant} />
}
