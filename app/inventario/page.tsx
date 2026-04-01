// app/inventario/page.tsx
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import InventarioClient from '@/components/inventario/InventarioClient'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function InventarioPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')
    if (!['ADMIN', 'FINANCE', 'LEADER'].includes(session.role)) redirect('/membros/dashboard')

    const [itens, departamentos, grupos, membros] = await Promise.all([
        prisma.itemInventario.findMany({
            where: { ativo: true },
            include: {
                dono_departamento: { select: { id: true, nome: true } },
                dono_grupo: { select: { id: true, nome: true } },
                dono_membro: { select: { id: true, first_name: true, last_name: true } },
                movimentos: { orderBy: { created_at: 'desc' }, take: 3 }
            },
            orderBy: [{ categoria: 'asc' }, { nome: 'asc' }]
        }),
        prisma.departamento.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
        prisma.grupo.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
        prisma.membro.findMany({
            where: { status: 'ATIVO' },
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
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 pb-32 animate-in fade-in duration-500">
            <Breadcrumb items={[
                { label: 'Dashboard', href: '/admin/dashboard', isBackIcon: true },
                { label: 'Administracao', hideOnMobile: true },
                { label: 'Inventario' }
            ]} />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Package size={14} /> Patrimonio da Igreja
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Inventario <span className="text-muted/30">ADMVC.</span>
                    </h1>
                </div>
            </header>

            <InventarioClient
                itens={itensSerializados}
                departamentos={departamentos}
                grupos={grupos}
                membros={membros}
                kpis={{ total, emprestados, emManutencao, garantiaExpirando, valorTotal }}
                isAdmin={session.role === 'ADMIN'}
            />
        </main>
    )
}