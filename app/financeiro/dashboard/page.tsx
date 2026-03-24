// app/financeiro/dashboard/page.tsx
import prisma from '@/lib/prisma'
import { Target, TrendingUp, Receipt, Wallet, Ticket, Archive, CheckCircle2, AlertCircle, Coffee, ArrowLeft, ChevronRight } from 'lucide-react'
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
import FiltroTotaisFinanceiro from '@/components/financeiro/FiltroTotaisFinanceiro' // NOVO COMPONENTE
import GestaoObraWidget from '@/components/financeiro/GestaoObraWidget';


export default async function DashboardFinanceiro() {
    const session = await getSessionData();
    const temAcesso = session && (session.role === 'FINANCE' || session.role === 'ADMIN');

    if (!temAcesso) {
        redirect('/membros/dashboard?error=Acesso negado ao módulo financeiro');
    }

    // 1. Busca do utilizador logado e dados globais
    const [adminLogado, rifasAtivasCount, objetivos, membros, lancamentos, pendentesMBWay, rifaAtiva, rifasFinalizadas, todasRifas, pedidosCantina, carregamentosAprovados, todasContribuicoes] = await Promise.all([
        // Utilizador Logado
        prisma.membro.findUnique({
            where: { id: session.membroId },
            select: { first_name: true, last_name: true }
        }),
        // Contagem de Rifas Ativas
        prisma.rifa.count({ where: { status: 'ATIVA' } }),
        // Carnês
        prisma.objetivoFinanceiro.findMany({
            include: { membro: true, lancamentos: true },
            orderBy: { createdAt: 'desc' }
        }),
        // Membros
        prisma.membro.findMany({
            select: { id: true, first_name: true, last_name: true, loyverse_id: true },
            orderBy: { first_name: 'asc' }
        }),
        // Lançamentos Recentes
        prisma.lancamentoFinanceiro.findMany({
            take: 5,
            where: { NOT: { forma_pagamento: 'MBWAY' } },
            include: { objetivo: { include: { membro: true } } },
            orderBy: { data_recebimento: 'desc' }
        }),
        // MBWAY Pendentes
        prisma.lancamentoFinanceiro.findMany({
            where: { forma_pagamento: 'MBWAY' },
            include: { objetivo: { include: { membro: true } } },
            orderBy: { data_recebimento: 'asc' }
        }),
        // Rifa Ativa (Detalhes)
        prisma.rifa.findFirst({
            where: { status: 'ATIVA' },
            include: { numeros_vendidos: { include: { membro: true } } }
        }),
        // Rifas Finalizadas
        prisma.rifa.findMany({
            where: { status: 'FINALIZADA' },
            orderBy: { createdAt: 'desc' },
            include: { numeros_vendidos: { include: { membro: true } } }
        }),
        // Todas as Rifas
        prisma.rifa.findMany({ include: { numeros_vendidos: true } }),
        // Pedidos Cantina
        prisma.pedidoSaldoCantina.findMany({
            where: { status: 'PENDENTE' },
            include: { membro: true },
            orderBy: { createdAt: 'asc' }
        }),
        // Carregamentos Aprovados
        prisma.pedidoSaldoCantina.findMany({
            where: { status: 'APROVADO' },
            include: { membro: true },
            orderBy: { createdAt: 'desc' }
        }),
        // Todas Contribuições
        prisma.contribuicao.findMany()
    ]);

    // 2. Cálculo dos KPI do Topo
    const dizimistasIds = new Set(todasContribuicoes.filter((c: any) => c.tipo === 'DIZIMO').map((c: any) => c.membro_id));
    const totalDizimistas = dizimistasIds.size;

    // 3. Preparação dos dados para o filtro dinâmico no rodapé (Achatamos tudo num único array simples)
    const transacoesFlat = [
        ...objetivos.flatMap(o => o.lancamentos
            // 👇 AQUI: Ignora os pagamentos MBWAY pendentes do total do caixa
            .filter((l: any) => l.forma_pagamento !== 'MBWAY')
            .map((l: any) => ({ valor: l.valor_pago, data: l.data_recebimento.toISOString(), categoria: 'CARNE' }))
        ),
        //...objetivos.flatMap(o => o.lancamentos.map((l: any) => ({ valor: l.valor_pago, data: l.data_recebimento.toISOString(), categoria: 'CARNE' }))),
        ...todasRifas.flatMap(r => r.numeros_vendidos.map((n: any) => ({ valor: r.valor_numero, data: n.createdAt.toISOString(), categoria: 'RIFA' }))),
        ...carregamentosAprovados.map((c: any) => ({ valor: c.valor, data: c.createdAt.toISOString(), categoria: 'CANTINA' })),
        ...todasContribuicoes.map((c: any) => ({ valor: c.valor, data: (c.data || c.createdAt).toISOString(), categoria: c.tipo }))
    ];

    const euro = (valor: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);

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

            {/* --- CABEÇALHO E NOVOS KPIs --- */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b border-soft pb-8">
                <div>
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                        <Wallet size={14} /> Módulo Tesouraria
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        A Paz, <span className="text-muted/20">{adminLogado?.first_name}.</span>
                    </h1>
                </div>

                {/* NOVOS BOXES COM OS TOTAIS SOLICITADOS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
                    <div className="bg-bg2 border border-soft p-6 rounded-[2rem] flex flex-col justify-center shadow-sm min-w-[160px]">
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">Carnês Ativos</span>
                        <h4 className="text-4xl font-black italic text-fg leading-none">{objetivos.length}</h4>
                    </div>
                    <div className="bg-bg2 border border-soft p-6 rounded-[2rem] flex flex-col justify-center shadow-sm min-w-[160px]">
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">Rifas Ativas</span>
                        <h4 className="text-4xl font-black italic text-fg leading-none">{rifasAtivasCount}</h4>
                    </div>
                    <div className="bg-bg2 border border-soft p-6 rounded-[2rem] flex flex-col justify-center shadow-sm min-w-[160px]">
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-1">Dizimistas</span>
                        <h4 className="text-4xl font-black italic text-fg leading-none">{totalDizimistas}</h4>
                    </div>

                </div>
            </header>

            {/* --- AÇÕES RÁPIDAS --- */}
            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <ModalNovaCampanha membros={membros} tipoPredefinido="CARNE" />
                <ModalNovaCampanha membros={membros} tipoPredefinido="RIFA" />
                <ModalLancarContribuicaoGlobal membros={membros} />
                <div className="md:col-span-1 hidden md:block">
                    <FormLancamentoOferta membros={membros} objetivos={objetivos} />
                </div>
            </section>

            {/* ========================================================= */}
            {/* SECÇÃO DA RIFA ATIVA                                      */}
            {/* ========================================================= */}
            {rifaAtiva && (
                <section className="space-y-4 pt-6">
                    <div className="flex items-center gap-4">
                        <Ticket size={20} className="text-figueira" />
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg">Sorteios em Andamento</h2>
                        <div className="h-[1px] flex-1 bg-soft"></div>
                    </div>
                    <GrelhaRifa rifa={rifaAtiva} membros={membros} />
                </section>
            )}

            {/* --- COLUNAS: ALERTAS, HISTÓRICO E CARNÊS --- */}
            <div className="grid lg:grid-cols-12 gap-10 items-start pt-6">

                {/* COLUNA ESQUERDA: ALERTAS E HISTÓRICO */}
                <aside className="lg:col-span-5 space-y-6">

                    {/* ALERTAS CANTINA */}
                    {pedidosCantina && pedidosCantina.length > 0 && (
                        <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-6 space-y-4">
                            <div className="flex items-center gap-2 text-orange-600">
                                <Coffee size={18} className="animate-bounce" />
                                <h3 className="text-xs font-black uppercase tracking-widest">Carregamentos de Cantina</h3>
                            </div>
                            <div className="space-y-3">
                                {pedidosCantina.map((pedido) => (
                                    <div key={pedido.id} className="p-4 bg-white rounded-2xl flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-fg">
                                                {pedido.membro.first_name} {pedido.membro.last_name}
                                            </p>
                                            <p className="text-[9px] font-bold text-muted uppercase mt-0.5">{pedido.forma_pagamento}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-orange-500">{euro(pedido.valor)}</span>
                                            <BotaoAprovarCantina pedidoId={pedido.id} loyverseId={pedido.membro.loyverse_id} valor={pedido.valor} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ALERTAS MBWAY */}
                    {pendentesMBWay.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-6 space-y-4">
                            <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle size={18} className="animate-pulse" />
                                <h3 className="text-xs font-black uppercase tracking-widest">Validação MB WAY</h3>
                            </div>
                            <div className="space-y-3">
                                {pendentesMBWay.map((r) => (
                                    <div key={r.id} className="p-4 bg-white rounded-2xl flex justify-between items-center shadow-sm">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-fg">
                                                {r.objetivo.membro.first_name} {r.objetivo.membro.last_name}
                                            </p>
                                            <p className="text-sm font-black text-red-500 mt-0.5">{euro(r.valor_pago)}</p>
                                        </div>
                                        <BotaoConfirmarMBWay lancamentoId={r.id} membroId={r.objetivo.membro.id} valor={r.valor_pago} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* HISTÓRICO RECENTE */}
                    <div className="bg-bg2 rounded-[2.5rem] border border-soft p-6">
                        <h4 className="text-[10px] font-black uppercase text-muted tracking-widest mb-6">Últimos Lançamentos</h4>
                        <div className="space-y-5">
                            {lancamentos.map((l) => (
                                <div key={l.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-soft p-2 rounded-xl text-muted">
                                            <Receipt size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-fg leading-none">{l.objetivo.membro.first_name}</p>
                                            <p className="text-[9px] font-medium text-muted mt-1 truncate max-w-[150px]">{l.objetivo.nome}</p>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-black text-fg">{euro(l.valor_pago)}</span>
                                </div>
                            ))}
                            {lancamentos.length === 0 && (
                                <p className="text-[10px] text-muted italic text-center py-4">Nenhum lançamento recente.</p>
                            )}
                        </div>
                    </div>
                </aside>

                {/* COLUNA DIREITA: ACOMPANHAMENTO DE CARNÊS */}
                <section className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-4">
                        <Target size={20} className="text-figueira" />
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg">Acompanhamento de Carnês</h2>
                        <div className="h-[1px] flex-1 bg-soft"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {objetivos.map(obj => {
                            // 👇 1. SEPARAMOS OS VALORES VÁLIDOS DOS PENDENTES
                            const lancamentosValidos = obj.lancamentos.filter((l: any) => l.forma_pagamento !== 'MBWAY');
                            const lancamentosPendentes = obj.lancamentos.filter((l: any) => l.forma_pagamento === 'MBWAY');

                            // 👇 2. CALCULAMOS APENAS COM OS VÁLIDOS
                            const totalPago = lancamentosValidos.reduce((sum: number, l: any) => sum + l.valor_pago, 0);
                            const valorPendente = lancamentosPendentes.reduce((sum: number, l: any) => sum + l.valor_pago, 0);

                            const metaTotal = obj.valor_mensal * obj.parcelas_total;
                            const porcentagem = Math.min((totalPago / metaTotal) * 100, 100);
                            const concluido = porcentagem >= 100;

                            return (
                                <div key={obj.id} className="bg-bg2 border border-soft p-6 rounded-[2rem] hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                                    <div className="absolute top-0 left-0 h-1 bg-figueira transition-all duration-1000" style={{ width: `${porcentagem}%` }}></div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em]">{obj.membro.first_name} {obj.membro.last_name}</span>
                                                <h3 className="text-sm font-black uppercase tracking-tighter text-fg leading-tight mt-1">{obj.nome}</h3>
                                            </div>
                                            {concluido && <CheckCircle2 size={16} className="text-green-500" />}
                                        </div>
                                        <div className="flex justify-between items-end pt-2 border-t border-soft">
                                            <div>
                                                <span className="text-[8px] font-black text-muted uppercase block">Arrecadado</span>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-fg">{euro(totalPago)} <span className="text-[8px] text-muted font-medium">/ {euro(metaTotal)}</span></p>

                                                    {/* 👇 BÓNUS: AVISA SE TIVER VALOR PENDENTE NESTE CARNÊ */}
                                                    {valorPendente > 0 && (
                                                        <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md border border-orange-200" title="A aguardar validação MBWay">
                                                            +{euro(valorPendente)} pendente
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] font-black text-muted uppercase block">Progresso</span>
                                                <p className="text-xs font-black text-figueira">{porcentagem.toFixed(0)}%</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            <section className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

                {/* LADO ESQUERDO: Relatório Consolidado (Ocupa 2 colunas em ecrãs grandes) */}
                <div className="xl:col-span-2 flex flex-col h-full">
                    {/* Coloque aqui o seu componente ou código do Relatório Consolidado */}
                    <FiltroTotaisFinanceiro transacoes={transacoesFlat} />
                </div>

                {/* LADO DIREITO: Widget da Obra (Ocupa 1 coluna em ecrãs grandes) */}
                <div className="xl:col-span-1 flex flex-col h-full">
                    <GestaoObraWidget />
                </div>

            </section>

            {/* ========================================================= */}
            {/* NOVO RODAPÉ: FILTROS E RELATÓRIO FINANCEIRO TOTAL         */}
            {/* ========================================================= */}


            {/* ========================================================= */}
            {/* HISTÓRICO DE RIFAS ENCERRADAS                             */}
            {/* ========================================================= */}
            {rifasFinalizadas.length > 0 && (
                <section className="space-y-6 pt-10 border-t border-soft">
                    <div className="flex items-center gap-4">
                        <div className="bg-soft p-2 rounded-xl text-muted">
                            <Archive size={16} />
                        </div>
                        <h2 className="text-lg font-black uppercase italic tracking-tighter text-fg">Histórico de Sorteios</h2>
                        <div className="h-[1px] flex-1 bg-soft"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rifasFinalizadas.map(rifa => (
                            <ModalHistoricoRifa key={rifa.id} rifa={rifa} />
                        ))}
                    </div>
                </section>
            )}
        </main>
    )
}