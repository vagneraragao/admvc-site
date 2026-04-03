// app/admin/inventario/page.tsx
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import InventarioClient from '@/components/inventario/InventarioClient'

export default async function InventarioPage({ searchParams }: { searchParams: Promise<{ congregacao?: string }> }) {
    const params = await searchParams
    const session = await getSessionData()
    if (!session) redirect('/membros/login')
    if (!['ADMIN', 'CONGREGATION_ADMIN', 'FINANCE', 'LEADER'].includes(session.role)) redirect('/membros/dashboard')

    const congFilter = session.role === 'CONGREGATION_ADMIN' && session.congregacaoId
        ? session.congregacaoId
        : params.congregacao ? Number(params.congregacao) : undefined
    const congWhere = congFilter ? { congregacao_id: congFilter } : {}

    const [itens, departamentos, grupos, membros] = await Promise.all([
        prisma.itemInventario.findMany({
            where: { ativo: true, ...congWhere },
            include: {
                dono_departamento: { select: { id: true, nome: true } },
                dono_grupo: { select: { id: true, nome: true } },
                dono_membro: { select: { id: true, first_name: true, last_name: true } },
                movimentos: { orderBy: { created_at: 'desc' }, take: 3 }
            },
            orderBy: [{ categoria: 'asc' }, { nome: 'asc' }]
        }),
        prisma.departamento.findMany({
            where: congFilter
                ? { OR: [{ congregacaoId: congFilter }, { is_global: true }] }
                : undefined,
            select: { id: true, nome: true },
            orderBy: { nome: 'asc' }
        }),
        prisma.grupo.findMany({
            where: congFilter ? { congregacaoId: congFilter } : undefined,
            select: { id: true, nome: true },
            orderBy: { nome: 'asc' }
        }),
        prisma.membro.findMany({
            where: { status: 'ATIVO', ...congWhere },
            select: { id: true, first_name: true, last_name: true },
            orderBy: { first_name: 'asc' }
        }),
    ])

    // KPIs
    const total = itens.length
    const emprestados = itens.filter(i => i.quantidade_disponivel < i.quantidade_total).length
    const emManutencao = itens.filter(i =>
        i.movimentos.some(m => m.tipo === 'MANUTENCAO' && !m.data_retorno_real)
    ).length
    const garantiaExpirando = itens.filter(i => {
        if (!i.tem_garantia || !i.garantia_validade) return false
        return new Date(i.garantia_validade) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }).length
    const valorTotal = itens.reduce((sum, i) => sum + (i.valor_aquisicao || 0), 0)

    // Serializa datas
    const itensSerializados = itens.map(i => ({
        ...i,
        data_aquisicao: i.data_aquisicao?.toISOString() || null,
        garantia_validade: i.garantia_validade?.toISOString() || null,
        created_at: i.created_at.toISOString(),
        updated_at: i.updated_at.toISOString(),
        movimentos: i.movimentos.map(m => ({
            ...m,
            data: m.data.toISOString(),
            created_at: m.created_at.toISOString(),
            data_retorno_prevista: m.data_retorno_prevista?.toISOString() || null,
            data_retorno_real: m.data_retorno_real?.toISOString() || null,
        }))
    }))

    return (
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-500 pb-20">

            <header className="space-y-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Inventario</h1>
                <p className="text-xs text-muted">Controlo de patrimonio e equipamentos.</p>
            </header>

            <InventarioClient
                itens={itensSerializados}
                departamentos={departamentos}
                grupos={grupos}
                membros={membros}
                kpis={{ total, emprestados, emManutencao, garantiaExpirando, valorTotal }}
                isAdmin={isAdmin(session.role)}
            />
        </main>
    )
}