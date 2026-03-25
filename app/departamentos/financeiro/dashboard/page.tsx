// app/financeiro/dashboard/page.tsx
import prisma from '@/lib/prisma'
import {
    Target, Receipt, Wallet, Ticket, Archive, CheckCircle2, AlertCircle,
    Coffee, ArrowLeft, ChevronRight, PlusCircle, ChevronDown, HandCoins,
    History, Users, Menu, Layers, ShieldCheck, Heart
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import FormLancamentoOferta from '@/components/financeiro/FormLancamentoOferta'
import BotaoConfirmarMBWay from '@/components/financeiro/BotaoConfirmarMBWay'
import ModalNovaCampanha from '@/components/financeiro/ModalNovaCampanha'
import GrelhaRifa from '@/components/financeiro/GrelhaRifa'
import ModalHistoricoRifa from '@/components/financeiro/ModalHistoricoRifa'
import BotaoAprovarCantina from '@/components/financeiro/BotaoAprovarCantina'
import ModalLancarContribuicaoGlobal from '@/components/financeiro/ModalLancarContribuicaoGlobal'
import FiltroTotaisFinanceiro from '@/components/financeiro/FiltroTotaisFinanceiro'
import GestaoObraWidget from '@/components/financeiro/GestaoObraWidget'
import ModalPagamentoRapidoCarne from '@/components/financeiro/ModalPagamentoRapidoCarne'

export const dynamic = 'force-dynamic'

export default async function DashboardFinanceiro() {
    const session = await getSessionData();
    const temAcesso = session && (session.role === 'FINANCE' || session.role === 'ADMIN');

    if (!temAcesso) redirect('/membros/dashboard?error=Acesso negado ao módulo financeiro');

    // 1. Busca de dados globais (MANTIDO INTACTO)
    const [adminLogado, rifasAtivasCount, objetivos, membros, lancamentos, pendentesMBWay, rifaAtiva, rifasFinalizadas, todasRifas, pedidosCantina, carregamentosAprovados, todasContribuicoes] = await Promise.all([
        prisma.membro.findUnique({ where: { id: session.membroId }, select: { first_name: true, last_name: true } }),
        prisma.rifa.count({ where: { status: 'ATIVA' } }),
        prisma.objetivoFinanceiro.findMany({ include: { membro: true, lancamentos: true }, orderBy: { createdAt: 'desc' } }),
        prisma.membro.findMany({ select: { id: true, first_name: true, last_name: true, loyverse_id: true }, orderBy: { first_name: 'asc' } }),
        prisma.lancamentoFinanceiro.findMany({ take: 10, where: { NOT: { forma_pagamento: 'MBWAY' } }, include: { objetivo: { include: { membro: true } } }, orderBy: { data_recebimento: 'desc' } }),
        prisma.lancamentoFinanceiro.findMany({ where: { forma_pagamento: 'MBWAY' }, include: { objetivo: { include: { membro: true } } }, orderBy: { data_recebimento: 'asc' } }),
        prisma.rifa.findFirst({ where: { status: 'ATIVA' }, include: { numeros_vendidos: { include: { membro: true } } } }),
        prisma.rifa.findMany({ where: { status: 'FINALIZADA' }, orderBy: { createdAt: 'desc' }, include: { numeros_vendidos: { include: { membro: true } } } }),
        prisma.rifa.findMany({ include: { numeros_vendidos: true } }),
        prisma.pedidoSaldoCantina.findMany({ where: { status: 'PENDENTE' }, include: { membro: true }, orderBy: { createdAt: 'asc' } }),
        prisma.pedidoSaldoCantina.findMany({ where: { status: 'APROVADO' }, include: { membro: true }, orderBy: { createdAt: 'desc' } }),
        prisma.contribuicao.findMany({ include: { membro: true } })
    ]);

    // Lógica de Agrupamento de Campanhas (MANTIDO INTACTO)
    const campanhasAgrupadasMap = objetivos.reduce((acc: any, obj: any) => {
        if (!acc[obj.nome]) {
            acc[obj.nome] = { nome: obj.nome, valor_mensal: obj.valor_mensal, parcelas_total: obj.parcelas_total, data_pagamento: obj.data_pagamento, objetivos: [], membros_ids: [], totalPago: 0, metaTotal: 0, valorPendente: 0 };
        }
        acc[obj.nome].objetivos.push(obj);
        acc[obj.nome].membros_ids.push(obj.membro_id);
        const lancamentosValidos = obj.lancamentos.filter((l: any) => l.forma_pagamento !== 'MBWAY');
        const lancamentosPendentes = obj.lancamentos.filter((l: any) => l.forma_pagamento === 'MBWAY');
        acc[obj.nome].totalPago += lancamentosValidos.reduce((sum: number, l: any) => sum + l.valor_pago, 0);
        acc[obj.nome].valorPendente += lancamentosPendentes.reduce((sum: number, l: any) => sum + l.valor_pago, 0);
        acc[obj.nome].metaTotal += (obj.valor_mensal * obj.parcelas_total);
        return acc;
    }, {});
    const campanhasAgrupadas = Object.values(campanhasAgrupadasMap) as any[];

    const dizimistasIds = new Set(todasContribuicoes.filter((c: any) => c.tipo === 'DIZIMO').map((c: any) => c.membro_id));
    const totalDizimistas = dizimistasIds.size;
    const membrosComCarneIds = new Set(objetivos.map(o => o.membro_id));
    const membrosParaReceber = membros.filter(m => rifaAtiva || membrosComCarneIds.has(m.id));

    const ultimosCarnes = lancamentos.map(l => ({ id: `carne-${l.id}`, nome: `${l.objetivo.membro.first_name} ${l.objetivo.membro.last_name}`, descricao: l.objetivo.nome, valor: l.valor_pago, data: l.data_recebimento, icone: <Receipt size={14} className="text-blue-500" /> }));
    const ultimasContribuicoes = todasContribuicoes.map((c: any) => ({ id: `contrib-${c.id}`, nome: c.membro ? `${c.membro.first_name} ${c.membro.last_name}` : 'Anónimo', descricao: c.tipo, valor: c.valor, data: c.data || c.createdAt, icone: <HandCoins size={14} className="text-emerald-500" /> }));
    const historicoRecente = [...ultimosCarnes, ...ultimasContribuicoes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()).slice(0, 10);

    const transacoesFlat = [
        ...objetivos.flatMap(o => o.lancamentos.filter((l: any) => l.forma_pagamento !== 'MBWAY').map((l: any) => ({ valor: l.valor_pago, data: l.data_recebimento.toISOString(), categoria: 'CARNE' }))),
        ...todasRifas.flatMap(r => r.numeros_vendidos.map((n: any) => ({ valor: r.valor_numero, data: n.createdAt.toISOString(), categoria: 'RIFA' }))),
        ...carregamentosAprovados.map((c: any) => ({ valor: c.valor, data: c.createdAt.toISOString(), categoria: 'CANTINA' })),
        ...todasContribuicoes.map((c: any) => ({ valor: c.valor, data: (c.data || c.createdAt).toISOString(), categoria: c.tipo }))
    ];

    const euro = (valor: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);
    const formatarData = (data: any) => new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(data)).replace(',', ' às');

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700">

            {/* --- BREADCRUMBS --- */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/membros/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Dashboard Global
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Tesouraria</span>
            </nav>

            {/* --- CABEÇALHO LIMPO E COMPACTO --- */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Wallet size={14} /> Módulo Tesouraria
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        A Paz, <span className="text-muted/20">{adminLogado?.first_name || "Tesoureiro"}.</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    {/* BOTÕES DE ACÇÃO RÁPIDA (Substituem aquela linha feia de botões que estava solta) */}
                    <ModalLancarContribuicaoGlobal membros={membros} />

                    <details className="group relative z-40">
                        <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                            <div className="h-12 px-5 bg-figueira text-white rounded-2xl flex items-center gap-2 hover:bg-figueira/90 transition-all active:scale-95 shadow-lg shadow-figueira/20">
                                <PlusCircle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Nova Campanha</span>
                                <ChevronDown size={14} className="opacity-50 group-open:rotate-180 transition-transform ml-1" />
                            </div>
                        </summary>

                        <div className="absolute right-0 top-full mt-2 w-64 bg-bg border border-soft p-3 rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-2">
                            <div className="text-[9px] text-muted font-bold uppercase tracking-widest px-2 pt-1 pb-2 border-b border-soft/50">Criar Novo Objetivo</div>
                            <ModalNovaCampanha membros={membros} tipoPredefinido="CARNE" campanhasExistentes={campanhasAgrupadas} />
                            <ModalNovaCampanha membros={membros} tipoPredefinido="RIFA" />
                        </div>
                    </details>

                    {/* DROPDOWN DE FERRAMENTAS DO ADMIN (Mantendo o design system) */}
                    {session.role === 'ADMIN' && (
                        <details className="group relative z-30">
                            <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                                <div className="h-12 w-12 bg-bg2 border border-soft text-fg rounded-2xl flex items-center justify-center hover:bg-soft transition-all active:scale-95 shadow-sm">
                                    <Menu size={16} className="text-muted group-open:text-figueira transition-colors" />
                                </div>
                            </summary>

                            <div className="absolute right-0 top-full mt-2 w-56 bg-bg border border-soft p-2 rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1">
                                <Link href="/admin/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                    <ShieldCheck size={14} className="text-muted group-hover/link:text-figueira" /> Painel ADMIN
                                </Link>
                                <Link href="/departamentos/cantina/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                    <Coffee size={14} className="text-muted group-hover/link:text-figueira" /> POS Cantina
                                </Link>
                                <Link href="/departamentos/cantina/despensa" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                    <Heart size={14} className="text-muted group-hover/link:text-figueira" /> Ação Social
                                </Link>
                            </div>
                        </details>
                    )}
                </div>
            </header>

            {/* --- KPI'S (ESTATÍSTICAS BÁSICAS) --- */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Campanhas Ativas" value={campanhasAgrupadas.length} icon={<Target size={14} className="text-muted" />} />
                <StatCard label="Rifas Ativas" value={rifasAtivasCount} icon={<Ticket size={14} className="text-muted" />} />
                <StatCard label="Dizimistas" value={totalDizimistas} icon={<Users size={14} className="text-muted" />} />
                <StatCard label="Pendentes MBWay" value={pendentesMBWay.length} highlight={pendentesMBWay.length > 0} icon={<AlertCircle size={14} className={pendentesMBWay.length > 0 ? "text-orange-500" : "text-muted"} />} />
            </section>

            {/* ALERTAS PENDENTES (MBWAY E CANTINA) */}
            {(pedidosCantina.length > 0 || pendentesMBWay.length > 0) && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendentesMBWay.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2rem] flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-500/10 text-orange-500 p-3 rounded-xl shrink-0"><AlertCircle size={24} /></div>
                                <div>
                                    <h4 className="text-sm font-black text-orange-700 uppercase tracking-tighter">Ofertas MBWay</h4>
                                    <p className="text-[10px] font-bold text-orange-600/80 uppercase tracking-widest mt-0.5">{pendentesMBWay.length} transações aguardam validação.</p>
                                </div>
                            </div>
                            <BotaoConfirmarMBWay pendentes={pendentesMBWay} />
                        </div>
                    )}
                    {pedidosCantina.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 p-6 rounded-[2rem] flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-500/10 text-blue-500 p-3 rounded-xl shrink-0"><Coffee size={24} /></div>
                                <div>
                                    <h4 className="text-sm font-black text-blue-700 uppercase tracking-tighter">Saldos Cantina</h4>
                                    <p className="text-[10px] font-bold text-blue-600/80 uppercase tracking-widest mt-0.5">{pedidosCantina.length} pedidos de carregamento pendentes.</p>
                                </div>
                            </div>
                            <BotaoAprovarCantina pedidos={pedidosCantina} />
                        </div>
                    )}
                </section>
            )}

            {/* LINHA 1: RECEBER PAGAMENTO | GESTÃO DA OBRA */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                <div className="h-full">
                    <FormLancamentoOferta membros={membrosParaReceber} objetivos={objetivos} />
                </div>
                <div className="h-full">
                    <GestaoObraWidget />
                </div>
            </section>

            {/* SORTEIO ATIVO */}
            {rifaAtiva && (
                <section className="space-y-6 pt-6 border-t border-soft">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                            <Ticket size={20} className="text-figueira" /> Sorteios em Andamento
                        </h2>
                    </div>
                    <GrelhaRifa rifa={rifaAtiva} membros={membros} />
                </section>
            )}

            {/* GESTÃO DE CAMPANHAS E CARNÊS */}
            <section className="space-y-6 pt-6 border-t border-soft">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                        <Target size={20} className="text-figueira" /> Gestão de Campanhas e Carnês
                    </h2>
                </div>

                <div className="space-y-4">
                    {campanhasAgrupadas.map((campanha: any) => {
                        const porcentagemGlobal = Math.min((campanha.totalPago / campanha.metaTotal) * 100, 100) || 0;
                        const concluida = porcentagemGlobal >= 100;

                        return (
                            <details key={campanha.nome} className="group bg-bg2 border border-soft rounded-[2.5rem] shadow-sm open:pb-6 overflow-hidden">
                                <summary className="cursor-pointer p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 list-none [&::-webkit-details-marker]:hidden hover:bg-soft/10 transition-colors relative">
                                    <div className="absolute bottom-0 left-0 h-1.5 bg-figueira transition-all duration-1000" style={{ width: `${porcentagemGlobal}%` }}></div>

                                    <div className="flex items-center gap-4">
                                        <div className={`p-4 rounded-3xl ${concluida ? 'bg-green-100 text-green-600' : 'bg-figueira/10 text-figueira'}`}>
                                            {concluida ? <CheckCircle2 size={24} /> : <Layers size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-fg leading-none">{campanha.nome}</h3>
                                            <p className="text-[10px] text-muted font-black mt-1.5 uppercase tracking-widest flex items-center gap-1">
                                                <Users size={12} /> {campanha.objetivos.length} Membros Aderentes
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 justify-between md:justify-end">
                                        <div className="text-right">
                                            <span className="text-[8px] font-black text-muted uppercase block">Arrecadado</span>
                                            <div className="flex items-center gap-2 justify-end">
                                                <p className="text-lg font-black text-fg">{euro(campanha.totalPago)} <span className="text-xs text-muted font-medium">/ {euro(campanha.metaTotal)}</span></p>
                                                {campanha.valorPendente > 0 && (
                                                    <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md border border-orange-200">
                                                        +{euro(campanha.valorPendente)} pendente
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right w-16 hidden md:block">
                                            <span className="text-[8px] font-black text-muted uppercase block">Progresso</span>
                                            <p className="text-lg font-black text-figueira">{porcentagemGlobal.toFixed(0)}%</p>
                                        </div>
                                        <div className="bg-bg border border-soft p-2 rounded-full group-open:bg-figueira group-open:text-white transition-all">
                                            <ChevronDown size={20} className="group-open:rotate-180 transition-transform" />
                                        </div>
                                    </div>
                                </summary>

                                <div className="px-6 md:px-8 pt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 border-t border-soft mt-2 animate-in slide-in-from-top-4">
                                    {campanha.objetivos.map((obj: any) => {
                                        const lancamentosValidos = obj.lancamentos.filter((l: any) => l.forma_pagamento !== 'MBWAY');
                                        const totalPagoInd = lancamentosValidos.reduce((sum: number, l: any) => sum + l.valor_pago, 0);
                                        const metaInd = obj.valor_mensal * obj.parcelas_total;
                                        const percInd = Math.min((totalPagoInd / metaInd) * 100, 100);
                                        const parcelasRestantes = obj.parcelas_total - obj.parcelas_pagas;
                                        const concluido = parcelasRestantes <= 0;

                                        return (
                                            <div key={obj.id} className="bg-bg border border-soft p-4 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-sm group">
                                                <div className="absolute top-0 left-0 h-1 bg-figueira/50 transition-all" style={{ width: `${percInd}%` }}></div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <div>
                                                        <h4 className="text-xs font-black uppercase text-fg tracking-tighter">{obj.membro.first_name} {obj.membro.last_name}</h4>
                                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                            Pagas {obj.parcelas_pagas} de {obj.parcelas_total}
                                                        </p>
                                                    </div>
                                                    {!concluido && (
                                                        <ModalPagamentoRapidoCarne
                                                            carneId={obj.id}
                                                            membroNome={`${obj.membro.first_name} ${obj.membro.last_name}`}
                                                            campanhaNome={campanha.nome}
                                                            valorParcela={obj.valor_mensal}
                                                            parcelasRestantes={parcelasRestantes}
                                                        />
                                                    )}
                                                    {concluido && <CheckCircle2 size={16} className="text-green-500" />}
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <p className="text-xs font-black text-fg">{euro(totalPagoInd)} <span className="text-[9px] text-muted font-medium">/ {euro(metaInd)}</span></p>
                                                    <p className="text-[10px] font-black text-figueira">{percInd.toFixed(0)}%</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </details>
                        )
                    })}
                </div>
            </section>

            {/* ÚLTIMOS LANÇAMENTOS (HISTÓRICO) */}
            <details className="group bg-bg2 border border-soft rounded-[2rem] overflow-hidden shadow-sm open:pb-2">
                <summary className="cursor-pointer p-6 flex justify-between items-center font-black uppercase tracking-widest text-[10px] text-muted hover:text-fg hover:bg-soft/30 transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2"><History size={16} /> Ver Últimos Lançamentos (Histórico)</span>
                    <ChevronDown size={14} className="group-open:rotate-180 transition-transform duration-300" />
                </summary>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historicoRecente.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-soft shadow-sm hover:border-figueira/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-soft p-2 rounded-xl text-muted">{item.icone}</div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-fg leading-none">{item.nome}</p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <p className="text-[9px] font-medium text-muted truncate max-w-[120px]">{item.descricao}</p>
                                        <span className="text-[8px] text-muted/40">•</span>
                                        <span className="text-[8px] font-black text-muted/60 uppercase tracking-widest bg-soft/50 px-1.5 py-0.5 rounded-md">
                                            {formatarData(item.data)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-black text-fg pr-2">{euro(item.valor)}</span>
                        </div>
                    ))}
                    {historicoRecente.length === 0 && (
                        <p className="text-[10px] text-muted italic p-4">Nenhum lançamento recente.</p>
                    )}
                </div>
            </details>

            {/* RELATÓRIO E HISTÓRICO DE SORTEIOS */}
            <section className="space-y-10 pt-6 border-t border-soft">
                <div className="w-full">
                    <FiltroTotaisFinanceiro transacoes={transacoesFlat} />
                </div>

                {rifasFinalizadas.length > 0 && (
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                <Archive size={20} className="text-muted" /> Histórico de Sorteios
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
                            {rifasFinalizadas.map(rifa => (
                                <ModalHistoricoRifa key={rifa.id} rifa={rifa} />
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </main>
    )
}

// Componente utilitário para os cartões de estatística
function StatCard({ label, value, highlight, icon }: any) {
    return (
        <div className={`p-6 rounded-[2rem] border ${highlight ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-bg2 border-soft text-fg'} shadow-sm flex flex-col justify-center transition-all hover:-translate-y-1`}>
            <div className="flex justify-between items-start mb-2">
                <p className={`text-[9px] font-black uppercase tracking-widest ${highlight ? 'text-orange-500' : 'text-muted'}`}>{label}</p>
                {icon}
            </div>
            <p className="text-3xl lg:text-4xl font-black italic tracking-tighter leading-none">{value}</p>
        </div>
    )
}