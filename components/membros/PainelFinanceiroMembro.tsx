'use client'

import { useState } from 'react'
import { Wallet, CalendarDays, Target, Ticket, CheckCircle2, ChevronDown, EyeOff, Trophy, HeartHandshake } from 'lucide-react'
import BotaoRelatorio from '@/components/membros/BotaoRelatorio'

interface PainelFinanceiroProps {
    objetivos: any[];
    numerosRifa: any[];
    contribuicoes?: any[];
}

export default function PainelFinanceiroMembro({
    objetivos = [],
    numerosRifa = [],
    contribuicoes = []
}: PainelFinanceiroProps) {

    // ========================================================================
    // LÓGICA DE AGRUPAMENTO
    // ========================================================================

    // 1. Agrupar Rifas por ID da Rifa
    const rifasAgrupadas = numerosRifa.reduce((acc: any, curr: any) => {
        if (!acc[curr.rifa_id]) {
            acc[curr.rifa_id] = {
                rifa: curr.rifa,
                numeros: [],
                dataCompra: curr.createdAt
            };
        }
        acc[curr.rifa_id].numeros.push(curr.numero);
        return acc;
    }, {});

    const rifasList = Object.values(rifasAgrupadas) as any[];

    // 2. Agrupar Dízimos e Ofertas por Mês/Ano
    const contribuicoesAgrupadas = contribuicoes.reduce((acc: any, curr: any) => {
        const data = new Date(curr.data || curr.createdAt);
        const mesAnoCru = data.toLocaleString('pt-PT', { month: 'long', year: 'numeric' });
        const chave = mesAnoCru.charAt(0).toUpperCase() + mesAnoCru.slice(1).replace(' de ', ' ');

        if (!acc[chave]) acc[chave] = [];
        acc[chave].push(curr);
        return acc;
    }, {});

    const euro = (valor: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);

    // Se não houver dados financeiros, não mostra a secção
    if (objetivos.length === 0 && rifasList.length === 0 && contribuicoes.length === 0) {
        return null;
    }

    return (
        <section className="space-y-6 scroll-mt-10 pb-20" id="meu-financeiro">

            {/* CABEÇALHO DA SECÇÃO COM BOTÃO PDF */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Wallet size={20} className="text-figueira" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">
                        O Meu Financeiro
                    </h2>
                </div>
                <div className="no-print">
                    <BotaoRelatorio />
                </div>
            </div>
            <div className="h-[1px] flex-1 bg-soft"></div>

            <div className="grid lg:grid-cols-2 gap-10">

                {/* --- COLUNA 1: DÍZIMOS E OFERTAS --- */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-black uppercase text-muted tracking-[0.3em] flex items-center gap-2">
                            <HeartHandshake size={14} className="text-figueira" /> Dízimos e Ofertas
                        </h3>
                        <span className="text-[8px] font-bold uppercase text-muted/50 flex items-center gap-1">
                            <EyeOff size={10} /> Privacidade Ativa
                        </span>
                    </div>

                    {Object.keys(contribuicoesAgrupadas).length === 0 ? (
                        <div className="bg-bg2 border border-dashed border-soft p-10 rounded-[2.5rem] text-center opacity-40">
                            <p className="text-[10px] font-bold uppercase">Nenhuma contribuição registada</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(contribuicoesAgrupadas).map(([mes, lista]: [string, any]) => (
                                <GrupoContribuicao key={mes} mes={mes} lista={lista} euro={euro} />
                            ))}
                        </div>
                    )}
                </div>

                {/* --- COLUNA 2: CARNÊS E RIFAS --- */}
                <div className="space-y-10">

                    {/* CARNÊS */}
                    {objetivos.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-muted tracking-[0.3em] flex items-center gap-2 mb-6">
                                <Target size={14} className="text-figueira" /> Meus Carnês
                            </h3>
                            <div className="grid gap-4">
                                {objetivos.map(obj => (
                                    <CarneItem key={obj.id} obj={obj} euro={euro} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RIFAS */}
                    {rifasList.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase text-muted tracking-[0.3em] flex items-center gap-2 mb-6">
                                <Ticket size={14} className="text-figueira" /> Minhas Rifas
                            </h3>
                            <div className="grid gap-4">
                                {rifasList.map((item: any, idx: number) => (
                                    <RifaItem key={idx} item={item} euro={euro} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </section>
    )
}

// ============================================================================
// COMPONENTE INTERATIVO: GRUPO DE DÍZIMOS/OFERTAS (ACORDEÃO)
// ============================================================================
function GrupoContribuicao({ mes, lista, euro }: { mes: string, lista: any[], euro: (v: number) => string }) {
    const [isOpen, setIsOpen] = useState(false);

    // Soma o total do mês
    const totalMes = lista.reduce((acc: number, curr: any) => acc + (curr.valor || 0), 0);

    return (
        <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden transition-all hover:border-figueira/30 shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex justify-between items-center hover:bg-soft/30 transition-all active:scale-[0.99]"
            >
                <div className="text-left">
                    <h4 className="text-sm font-black uppercase tracking-tight text-fg flex items-center gap-2">
                        {mes}
                        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDown size={14} className={isOpen ? "text-figueira" : "text-muted"} />
                        </div>
                    </h4>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest">{lista.length} registos</span>
                </div>

                <div className="text-right">
                    <p className={`text-base font-black italic transition-all ${isOpen ? 'text-fg' : 'text-fg opacity-60 tracking-widest'}`}>
                        {isOpen ? euro(totalMes) : "••••••"}
                    </p>
                    <span className="text-[7px] font-black uppercase text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-md border border-green-500/10">Confirmado</span>
                </div>
            </button>

            {isOpen && (
                <div className="p-6 pt-0 animate-in slide-in-from-top-2">
                    <div className="space-y-3 pt-3 border-t border-soft/50">
                        {lista.map((c: any) => (
                            <div key={c.id} className="flex justify-between items-center group/item hover:bg-soft/20 p-2 -m-2 rounded-lg transition-colors">
                                <div>
                                    <span className="text-[9px] font-black text-figueira uppercase tracking-widest block mb-0.5">{c.tipo}</span>
                                    <span className="text-[11px] font-bold text-fg uppercase tracking-tight">
                                        <CalendarDays size={10} className="inline mr-1 text-muted" />
                                        {new Date(c.data || c.createdAt).toLocaleDateString('pt-PT')}
                                    </span>
                                    {c.observacao && <p className="text-[9px] italic text-muted mt-0.5">{c.observacao}</p>}
                                </div>
                                <span className="text-xs font-black text-fg font-mono">{euro(c.valor)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// COMPONENTE INTERATIVO: ITEM DO CARNÊ (COM LÓGICA DE MBWAY PENDENTE)
// ============================================================================
function CarneItem({ obj, euro }: { obj: any, euro: (v: number) => string }) {
    const [isOpen, setIsOpen] = useState(false);

    const lancamentosValidos = obj.lancamentos?.filter((l: any) => l.forma_pagamento !== 'MBWAY') || [];
    const lancamentosPendentes = obj.lancamentos?.filter((l: any) => l.forma_pagamento === 'MBWAY') || [];

    const totalPago = lancamentosValidos.reduce((sum: number, l: any) => sum + l.valor_pago, 0);
    const valorPendente = lancamentosPendentes.reduce((sum: number, l: any) => sum + l.valor_pago, 0);

    const metaTotal = obj.valor_mensal * obj.parcelas_total;
    const porcentagem = Math.min((totalPago / metaTotal) * 100, 100);
    const concluido = porcentagem >= 100;

    const ultimaData = obj.lancamentos && obj.lancamentos.length > 0
        ? new Date(obj.lancamentos[0].data_recebimento).toLocaleDateString('pt-PT')
        : null;

    return (
        <div className="bg-bg2 border border-soft rounded-3xl relative overflow-hidden shadow-sm transition-all hover:border-figueira/30">
            <div className="absolute top-0 left-0 h-[3px] bg-figueira transition-all duration-1000 z-10" style={{ width: `${porcentagem}%` }}></div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left flex justify-between items-center p-5 pt-6 hover:bg-soft/30 transition-colors active:scale-[0.99]"
            >
                <div>
                    <h4 className="text-sm font-black uppercase tracking-tighter text-fg flex items-center gap-2">
                        {obj.nome}
                        {concluido && <CheckCircle2 size={14} className="text-green-500" />}
                    </h4>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                        Vence dia {obj.data_pagamento}
                    </p>
                </div>
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} className={isOpen ? "text-figueira" : "text-muted"} />
                </div>
            </button>

            {isOpen && (
                <div className="relative border-t border-soft/50 bg-bg p-5 pt-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-[8px] font-black text-muted uppercase tracking-widest block mb-1">Contribuição</span>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-black text-fg italic leading-none">
                                    {euro(totalPago)} <span className="text-[9px] text-muted not-italic">/ {euro(metaTotal)}</span>
                                </p>

                                {valorPendente > 0 && (
                                    <span className="text-[8px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-md border border-orange-200 shadow-sm" title="A aguardar validação do tesoureiro">
                                        +{euro(valorPendente)} em validação
                                    </span>
                                )}
                            </div>

                            {ultimaData && (
                                <div className="flex items-center gap-1 text-muted mt-2">
                                    <CalendarDays size={10} className="opacity-50" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest">Último pagamento: {ultimaData}</span>
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="text-[8px] font-black text-muted uppercase tracking-widest block mb-1">Parcelas</span>
                            <p className="text-sm font-black text-figueira">{Math.floor(totalPago / obj.valor_mensal)} <span className="text-muted text-[10px]">de {obj.parcelas_total}</span></p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// COMPONENTE INTERATIVO: ITEM DA RIFA (COM LÓGICA DE VENCEDOR 👑)
// ============================================================================
function RifaItem({ item, euro }: { item: any, euro: (v: number) => string }) {
    const [isOpen, setIsOpen] = useState(false);

    const valorTotalRifa = item.numeros.length * (item.rifa?.valor_numero || 0);
    const dataCompra = new Date(item.dataCompra).toLocaleDateString('pt-PT');

    const numeroVencedor = item.rifa?.numero_sorteado;
    const temNumeroVencedor = numeroVencedor && item.numeros.includes(numeroVencedor);
    const isEncerrada = item.rifa?.status === 'FINALIZADA';

    return (
        <div className={`bg-bg2 border ${temNumeroVencedor ? 'border-figueira shadow-figueira/20 bg-figueira/5' : 'border-soft hover:border-figueira/30'} rounded-3xl relative overflow-hidden shadow-sm transition-all`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left flex justify-between items-center p-5 hover:bg-soft/30 transition-colors active:scale-[0.99]"
            >
                <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-tighter text-fg flex items-center gap-2">
                        {item.rifa?.nome || "Rifa"}
                        {temNumeroVencedor && <Trophy size={14} className="text-figueira animate-bounce" />}
                    </h4>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">
                        Prémio: {item.rifa?.premio || "---"}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {temNumeroVencedor ? (
                        <span className="text-[8px] font-black bg-figueira text-white px-2 py-1 rounded-md uppercase tracking-widest flex items-center gap-1">
                            <Trophy size={10} /> Vencedor
                        </span>
                    ) : isEncerrada ? (
                        <span className="text-[8px] font-black bg-soft text-muted px-2 py-1 rounded-md uppercase tracking-widest">
                            Encerrada
                        </span>
                    ) : null}

                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                        <ChevronDown size={16} className={isOpen ? "text-figueira" : "text-muted"} />
                    </div>
                </div>
            </button>

            {isOpen && (
                <div className="border-t border-soft/50 bg-bg p-5 pt-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">

                        {temNumeroVencedor && (
                            <div className="bg-figueira/10 border border-figueira/20 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in zoom-in-95">
                                <div className="p-2 bg-figueira text-white rounded-xl">
                                    <Trophy size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-figueira uppercase tracking-widest leading-tight">Parabéns!</p>
                                    <p className="text-[9px] font-bold text-fg uppercase">O número <span className="font-black text-figueira">#{numeroVencedor}</span> foi sorteado.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-[8px] font-black text-muted uppercase tracking-widest block mb-2">Meus Números ({item.numeros.length})</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {item.numeros.sort((a: number, b: number) => a - b).map((num: number) => (
                                        <span
                                            key={num}
                                            className={`text-[10px] font-black px-2.5 py-1 rounded-lg border flex items-center gap-1 transition-all ${num === numeroVencedor
                                                ? 'bg-figueira text-white border-figueira shadow-md shadow-figueira/30'
                                                : 'bg-soft/50 text-muted border-soft/50'
                                                }`}
                                        >
                                            #{num}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="text-right shrink-0 ml-4">
                                <span className="text-[8px] font-black text-muted uppercase tracking-widest block mb-1">Total Pago</span>
                                <p className="text-sm font-black text-fg italic leading-none">{euro(valorTotalRifa)}</p>

                                <div className="flex items-center gap-1 text-muted mt-2 justify-end">
                                    <CalendarDays size={10} className="opacity-50" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest">{dataCompra}</span>
                                </div>
                            </div>
                        </div>

                        {isEncerrada && !temNumeroVencedor && numeroVencedor && (
                            <p className="text-[8px] font-bold text-center text-muted uppercase tracking-widest pt-3 border-t border-soft/50">
                                O número sorteado nesta rifa foi o <span className="font-black">#{numeroVencedor}</span>.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}