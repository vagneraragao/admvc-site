// app/admin/membros/page.tsx
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import MembrosListClient from '@/components/admin/MembrosListClient'

export default async function ListaMembrosAdmin({ searchParams }: { searchParams: Promise<{ congregacao?: string }> }) {
    const params = await searchParams
    const session = await getSessionData()
    const congFilter = session?.role === 'CONGREGATION_ADMIN' && session.congregacaoId
        ? session.congregacaoId
        : params.congregacao ? Number(params.congregacao) : undefined

    const membros = await prisma.membro.findMany({
        where: congFilter ? { congregacao_id: congFilter } : undefined,
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_1: true,
            gender: true,
            id_city: true,
            avatar_file: true,
            status: true,
            role: true,
            baptism_status: true,
            church_role: true,
            data_admissao: true,
            gdpr_aceite: true,
            gdpr_validade: true,
            permanecer_aceite: true,
            permanecer_validade: true,
            familia_id: true,
            departamentos_liderados: { select: { id: true } },
            ministerios: { select: { departamento: { select: { nome: true } } } },
        }
    })

    // KPIs
    const total = membros.length
    const ativos = membros.filter(m => ['ATIVO', 'Ativo'].includes(m.status ?? '')).length
    const pendentes = membros.filter(m => ['PENDENTE', 'Pendente'].includes(m.status ?? '')).length
    const semFamilia = membros.filter(m => !m.familia_id).length

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-6">
            <MembrosListClient
                membros={membros}
                kpis={{ total, ativos, pendentes, semFamilia }}
            />
        </main>
    )
}