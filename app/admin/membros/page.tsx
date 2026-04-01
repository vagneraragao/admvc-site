// app/admin/membros/page.tsx
import prisma from '@/lib/prisma'
import MembrosListClient from '@/components/admin/MembrosListClient'

export const dynamic = 'force-dynamic'

export default async function ListaMembrosAdmin() {
    const membros = await prisma.membro.findMany({
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