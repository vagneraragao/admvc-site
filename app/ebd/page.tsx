import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import EBDClient from '@/components/pregacao/EBDClient'

export const dynamic = 'force-dynamic'

export default async function EBDPage({
    searchParams,
}: {
    searchParams: Promise<{ mes?: string; ano?: string; sermao_id?: string }>
}) {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const params = await searchParams
    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const agora = new Date()
    const mes = params.mes ? Number(params.mes) : agora.getMonth() + 1
    const ano = params.ano ? Number(params.ano) : agora.getFullYear()

    const inicio = new Date(ano, mes - 1, 1)
    const fim = new Date(ano, mes, 1)

    const [aulas, membros, sermoes] = await Promise.all([
        prisma.escolaBiblica.findMany({
            where: {
                tenant_id: tenantId,
                data: { gte: inicio, lt: fim },
            },
            include: {
                professor: { select: { first_name: true, last_name: true } },
                sermao: { select: { id: true, titulo: true } },
                _count: { select: { presencas: true } },
                presencas: { select: { membro_id: true } },
            },
            orderBy: { data: 'desc' },
        }),
        prisma.membro.findMany({
            where: { tenant_id: tenantId, is_active: true },
            select: { id: true, first_name: true, last_name: true },
            orderBy: { first_name: 'asc' },
        }),
        prisma.sermao.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, titulo: true, data_pregacao: true },
            orderBy: { data_pregacao: 'desc' },
            take: 100,
        }),
    ])

    // Serialize dates
    const aulasSerializadas = aulas.map((a) => ({
        ...a,
        data: a.data.toISOString(),
        created_at: a.created_at.toISOString(),
    }))

    const sermoesSerializados = sermoes.map((s) => ({
        ...s,
        data_pregacao: s.data_pregacao.toISOString(),
    }))

    return (
        <EBDClient
            aulas={aulasSerializadas}
            membros={membros}
            sermoes={sermoesSerializados}
            mes={mes}
            ano={ano}
            sermaoIdInicial={params.sermao_id || null}
        />
    )
}
