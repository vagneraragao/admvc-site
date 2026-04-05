// app/assistencia/page.tsx — Dashboard Assistencia Social
import { getDb } from '@/lib/db'
import { getSessionData, isAdmin as isAdminCheck } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { HeartHandshake, Package, ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CATEGORIAS_LABEL: Record<string, string> = {
    ALIMENTO: 'Alimento',
    HIGIENE: 'Higiene',
    VESTUARIO: 'Vestuario',
    OUTRO: 'Outro',
}

export default async function AssistenciaDashboardPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login?error=Sessao expirada')

    const db = await getDb()

    const membroLogado = await db.membro.findUnique({
        where: { id: session.membroId },
        include: { ministerios: { include: { departamento: true } } }
    })
    if (!membroLogado) redirect('/membros/login')

    const isAdmin = isAdminCheck(session.role)
    const isFinance = session.role === 'FINANCE'
    const isEquipaSocial = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || ''
        return nomeDepto.includes('social') || nomeDepto.includes('despensa') || nomeDepto.includes('assist')
    })

    if (!isAdmin && !isFinance && !isEquipaSocial) {
        redirect('/membros/dashboard?error=Acesso restrito a equipa de Assistencia Social.')
    }

    // Buscar dados
    const itens = await db.itemAssistenciaSocial.findMany({
        orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    })

    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)

    const movimentosMes = await db.movimentoAssistencia.count({
        where: { criado_em: { gte: inicioMes } },
    })

    // Stats
    const totalItens = itens.length
    const itensStockBaixo = itens.filter(i => i.stock <= i.stock_minimo)
    const totalStockBaixo = itensStockBaixo.length

    // Agrupar por categoria
    const porCategoria = itens.reduce<Record<string, typeof itens>>((acc, item) => {
        const cat = item.categoria || 'OUTRO'
        if (!acc[cat]) acc[cat] = []
        acc[cat].push(item)
        return acc
    }, {})

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700 pb-32">
            {/* Header */}
            <header className="space-y-2">
                <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                    <HeartHandshake size={14} /> Assistencia Social
                </span>
                <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-fg">
                    Painel Geral
                </h1>
                <p className="text-xs text-muted">Gestao de donativos, entregas e stock social.</p>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-bg2 border border-soft rounded-[2rem] p-6 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                        <Package size={12} /> Total de Itens
                    </p>
                    <p className="text-3xl font-black italic text-fg">{totalItens}</p>
                </div>
                <div className="bg-bg2 border border-soft rounded-[2rem] p-6 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                        <AlertTriangle size={12} className="text-orange-500" /> Stock Baixo
                    </p>
                    <p className={`text-3xl font-black italic ${totalStockBaixo > 0 ? 'text-orange-500' : 'text-fg'}`}>
                        {totalStockBaixo}
                    </p>
                </div>
                <div className="bg-bg2 border border-soft rounded-[2rem] p-6 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                        <ArrowDown size={12} className="text-green-500" /> Movimentos este Mes
                    </p>
                    <p className="text-3xl font-black italic text-fg">{movimentosMes}</p>
                </div>
            </div>

            {/* Low stock alerts */}
            {itensStockBaixo.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-[2rem] p-6 space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Alertas de Stock Baixo
                    </p>
                    <div className="space-y-2">
                        {itensStockBaixo.map(item => (
                            <div key={item.id} className="flex items-center justify-between">
                                <span className="text-sm font-bold text-fg">{item.nome}</span>
                                <span className="text-sm font-black text-orange-500">
                                    {item.stock} / {item.stock_minimo} {item.unidade}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Items grouped by category */}
            {totalItens === 0 ? (
                <div className="bg-bg2 border border-soft rounded-[2rem] p-12 text-center space-y-3">
                    <Package size={32} className="mx-auto text-muted/20" />
                    <p className="text-sm font-bold text-muted">Nenhum item de assistencia cadastrado.</p>
                    <p className="text-[10px] text-muted">
                        Comece por adicionar itens em{' '}
                        <Link href="/assistencia/stock" className="text-figueira underline">
                            Gestao de Stock
                        </Link>.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(porCategoria).map(([cat, catItens]) => (
                        <section key={cat} className="space-y-4">
                            <h2 className="text-lg font-black uppercase tracking-widest text-fg flex items-center gap-3">
                                <Package size={16} className="text-figueira" />
                                {CATEGORIAS_LABEL[cat] || cat}
                                <span className="text-[9px] font-bold text-muted">({catItens.length})</span>
                            </h2>
                            <div className="bg-bg2 border border-soft rounded-[2rem] overflow-hidden">
                                {catItens.map((item, idx) => (
                                    <div key={item.id} className={`flex items-center justify-between px-6 py-4 ${idx > 0 ? 'border-t border-soft' : ''}`}>
                                        <div>
                                            <p className="text-sm font-black uppercase text-fg">{item.nome}</p>
                                            <p className="text-[9px] text-muted">{item.unidade}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className={`text-lg font-black italic ${item.stock <= item.stock_minimo ? 'text-orange-500' : 'text-fg'}`}>
                                                    {item.stock}
                                                </p>
                                                <p className="text-[8px] font-black uppercase tracking-widest text-muted">
                                                    {item.unidade}
                                                </p>
                                            </div>
                                            {item.stock <= item.stock_minimo && (
                                                <AlertTriangle size={14} className="text-orange-500" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {/* Navigation links */}
            <div className="flex flex-wrap gap-3">
                <Link
                    href="/assistencia/stock"
                    className="flex items-center gap-2 bg-figueira text-bg px-6 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                >
                    <Package size={14} /> Gestao de Stock
                </Link>
                <Link
                    href="/assistencia/movimentos"
                    className="flex items-center gap-2 bg-bg2 border border-soft text-fg px-6 py-3.5 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:border-figueira/50 transition-all active:scale-95"
                >
                    <ArrowUp size={14} /> Movimentos
                </Link>
            </div>
        </main>
    )
}
