// app/membros/selecionar-congregacao/page.tsx
import prisma from '@/lib/prisma'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import SelecionarCongregacaoClient from '@/components/membros/SelecionarCongregacaoClient'

export const dynamic = 'force-dynamic'

export default async function SelecionarCongregacaoPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const [congregacoes, tenant] = await Promise.all([
        prisma.congregacao.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, nome: true, cidade: true },
            orderBy: { nome: 'asc' },
        }),
        prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { nome: true }
        })
    ])

    // Se só tem 1 congregação, associa automaticamente
    if (congregacoes.length <= 1) {
        redirect('/membros/dashboard')
    }

    return (
        <SelecionarCongregacaoClient
            congregacoes={congregacoes}
            igrejaName={tenant?.nome || 'Igreja'}
            adminNome={isAdmin(session.role) ? 'Administrador' : 'Lider'}
        />
    )
}
