'use client'

import { useState } from 'react'
import { Archive, X, Ticket, CheckCircle2, User, Euro } from 'lucide-react'

interface Props {
    rifa: any;
}

export default function ModalHistoricoRifa({ rifa }: Props) {
    const [aberto, setAberto] = useState(false);
    const [numeroSelecionado, setNumeroSelecionado] = useState<number | null>(null);

    const numVendidos = rifa.numeros_vendidos.length;
    const rendimentoTotal = numVendidos * rifa.valor_numero;

    const euro = (valor: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);

    // Recria a grelha para visualização
    const todosNumeros = Array.from({ length: rifa.total_numeros }, (_, i) => i + 1);
    const mapaVendidos = new Map();
    rifa.numeros_vendidos.forEach((venda: any) => {
        mapaVendidos.set(venda.numero, venda);
    });

    const vendaSelecionada = numeroSelecionado ? mapaVendidos.get(numeroSelecionado) : null;

    return (
        <>
            {/* O CARTÃO QUE FICA NA DASHBOARD (Clicável) */}
            <button
                onClick={() => setAberto(true)}
                className="bg-bg2 border border-soft p-5 rounded-3xl flex flex-col justify-between gap-4 opacity-80 hover:opacity-100 hover:border-figueira/50 transition-all text-left group"
            >
                <div className="flex justify-between items-start w-full">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-tighter text-fg leading-none group-hover:text-figueira transition-colors">{rifa.nome}</h3>
                        <p className="text-[9px] font-bold text-muted uppercase mt-1 line-clamp-1">Prémio: {rifa.premio}</p>
                    </div>
                    <span className="text-[8px] font-black bg-soft text-muted px-2 py-1 rounded-md uppercase tracking-widest shrink-0">
                        Encerrada
                    </span>
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-soft w-full">
                    <div>
                        <span className="text-[8px] font-black text-muted uppercase block">Vendidos</span>
                        <p className="text-xs font-black text-fg">{numVendidos} <span className="text-muted text-[10px]">/ {rifa.total_numeros}</span></p>
                    </div>
                    <div className="text-right">
                        <span className="text-[8px] font-black text-muted uppercase block">Total Arrecadado</span>
                        <p className="text-sm font-black text-figueira italic">{euro(rendimentoTotal)}</p>
                    </div>
                </div>
            </button>

            {/* O MODAL DE CONSULTA (Abre ao clicar no cartão) */}
            {aberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-bg2 border border-soft w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* LADO ESQUERDO: GRELHA DE LEITURA */}
                        <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-soft overflow-y-auto">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none flex items-center gap-2">
                                        <Archive className="text-muted" /> Histórico: {rifa.nome}
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                        Consulta de números vendidos
                                    </p>
                                </div>
                                <button onClick={() => setAberto(false)} className="p-3 bg-soft text-muted rounded-full hover:bg-red-50 hover:text-red-500 transition-all md:hidden">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                                {todosNumeros.map(num => {
                                    const venda = mapaVendidos.get(num);
                                    const isVendido = !!venda;
                                    const isSelecionado = numeroSelecionado === num;

                                    const nomeCurto = isVendido
                                        ? (venda.membro ? venda.membro.first_name : venda.nome_externo.split(' ')[0])
                                        : '';

                                    return (
                                        <button
                                            key={num}
                                            onClick={() => isVendido ? setNumeroSelecionado(num) : null}
                                            disabled={!isVendido}
                                            className={`
                                                relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden
                                                ${!isVendido ? 'bg-bg border border-soft opacity-30 cursor-not-allowed' : ''}
                                                ${isVendido && !isSelecionado ? 'bg-figueira/10 text-figueira border border-figueira/30 hover:bg-figueira/20 cursor-pointer' : ''}
                                                ${isVendido && isSelecionado ? 'bg-figueira text-white shadow-lg scale-110 z-10 border-2 border-white' : ''}
                                            `}
                                        >
                                            <span className="text-sm font-black">{num}</span>
                                            {isVendido && (
                                                <span className="text-[7px] font-black uppercase w-full truncate px-1 text-center opacity-80 mt-0.5">
                                                    {nomeCurto}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* LADO DIREITO: DETALHES DO COMPRADOR */}
                        <div className="w-full md:w-80 p-6 md:p-8 bg-bg flex flex-col">
                            <div className="hidden md:flex justify-end mb-4">
                                <button onClick={() => setAberto(false)} className="p-2 bg-bg2 rounded-xl text-muted hover:text-red-500 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                {!numeroSelecionado ? (
                                    <div className="text-center opacity-50 space-y-3">
                                        <Ticket size={40} className="mx-auto text-muted" />
                                        <p className="text-[10px] font-black uppercase text-muted tracking-widest leading-relaxed">
                                            Clica num número verde<br />para ver quem o comprou
                                        </p>
                                    </div>
                                ) : vendaSelecionada && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                                        <div>
                                            <span className="text-[9px] font-black uppercase text-figueira tracking-widest block flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Comprador Confirmado
                                            </span>
                                            <h4 className="text-4xl font-black italic text-fg leading-none mt-1">
                                                #{numeroSelecionado}
                                            </h4>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-soft">
                                            <div className="bg-figueira/10 border border-figueira/20 p-5 rounded-2xl">
                                                <span className="text-[8px] font-black uppercase text-muted tracking-widest block mb-1">Nome</span>
                                                <p className="text-sm font-black text-figueira uppercase">
                                                    {vendaSelecionada.membro
                                                        ? `${vendaSelecionada.membro.first_name} ${vendaSelecionada.membro.last_name}`
                                                        : vendaSelecionada.nome_externo}
                                                </p>
                                                <span className="text-[9px] font-bold text-muted uppercase mt-2 block flex items-center gap-1">
                                                    <User size={10} /> {vendaSelecionada.membro ? 'Membro da Igreja' : 'Externo'}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center p-4 bg-bg2 rounded-2xl border border-soft">
                                                <span className="text-[9px] font-black uppercase text-muted tracking-widest block">Valor Recebido</span>
                                                <span className="text-lg font-black text-fg italic flex items-center gap-1">
                                                    {rifa.valor_numero.toFixed(2)} <Euro size={14} className="text-muted" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}