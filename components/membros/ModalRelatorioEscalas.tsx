'use client'

import { useState, useEffect } from 'react'
import { CalendarSearch, X, Filter, Clock, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { buscarRelatorioEscalasAction } from '@/actions/membro-actions' // Ajuste o caminho se necessário

export default function ModalRelatorioEscalas({ membroId }: { membroId: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [escalas, setEscalas] = useState<any[]>([]);

    // Filtros
    const hoje = new Date();
    const [mes, setMes] = useState(hoje.getMonth() + 1); // 1 a 12
    const [ano, setAno] = useState(hoje.getFullYear());

    // Busca os dados sempre que o Modal abre ou os filtros mudam
    useEffect(() => {
        if (!isOpen) return;

        async function fetchRelatorio() {
            setLoading(true);
            const res = await buscarRelatorioEscalasAction(membroId, mes, ano);
            if (res.sucesso) {
                setEscalas(res.escalas);
            }
            setLoading(false);
        }

        fetchRelatorio();
    }, [isOpen, mes, ano, membroId]);

    const mesesNome = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    // Gerar últimos 3 anos e o próximo
    const anosOpcoes = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - 3 + i).reverse();

    return (
        <>
            {/* O Botão que fica na Dashboard */}
            <button
                onClick={() => setIsOpen(true)}
                className="bg-bg text-muted border border-soft hover:border-figueira hover:text-figueira transition-all text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 shrink-0"
            >
                <CalendarSearch size={14} /> Ver Relatório
            </button>

            {/* O Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg2 w-full max-w-3xl border border-soft p-6 md:p-8 rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Botão Fechar */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-bg text-muted border border-soft rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors z-10 shadow-sm"
                        >
                            <X size={16} />
                        </button>

                        {/* Cabeçalho do Modal */}
                        <div className="mb-8 pr-12 shrink-0">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                <Filter size={20} className="text-figueira" /> Filtro de Escalas
                            </h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                Consulta o teu histórico e programação futura.
                            </p>
                        </div>

                        {/* Barra de Filtros */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-6 shrink-0 bg-bg p-4 rounded-3xl border border-soft shadow-sm">
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-2">Mês</label>
                                <select
                                    value={mes}
                                    onChange={(e) => setMes(Number(e.target.value))}
                                    className="w-full bg-bg2 border border-soft rounded-2xl px-4 py-3 text-xs font-bold text-fg focus:border-figueira outline-none cursor-pointer appearance-none shadow-sm"
                                >
                                    {mesesNome.map((m, index) => (
                                        <option key={index + 1} value={index + 1}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-2">Ano</label>
                                <select
                                    value={ano}
                                    onChange={(e) => setAno(Number(e.target.value))}
                                    className="w-full bg-bg2 border border-soft rounded-2xl px-4 py-3 text-xs font-bold text-fg focus:border-figueira outline-none cursor-pointer appearance-none shadow-sm"
                                >
                                    {anosOpcoes.map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Lista de Resultados com Scroll */}
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 text-figueira gap-4">
                                    <Loader2 size={32} className="animate-spin" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">A carregar dados...</span>
                                </div>
                            ) : escalas.length > 0 ? (
                                <div className="space-y-4">
                                    {escalas.map((esc) => {
                                        const dataEvento = new Date(esc.evento.data);
                                        const jaPassou = dataEvento < new Date();

                                        return (
                                            <div key={esc.id} className={`p-5 rounded-[2rem] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${jaPassou ? 'bg-bg/50 border-soft opacity-70' : 'bg-bg border-soft hover:border-figueira/50'}`}>
                                                
                                                {/* Data e Evento */}
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm ${jaPassou ? 'bg-soft text-muted' : 'bg-fg text-bg'}`}>
                                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{dataEvento.toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                                        <span className="text-xl font-black italic leading-none">{dataEvento.toLocaleDateString('pt-PT', { day: '2-digit' })}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase italic tracking-tighter text-fg">{esc.evento.nome}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] font-bold uppercase tracking-widest text-figueira bg-figueira/10 px-2 py-0.5 rounded-md border border-figueira/20">
                                                                {esc.departamento.nome}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Função, Horário e Status */}
                                                <div className="flex flex-wrap items-center sm:justify-end gap-3 text-[9px] font-black uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5 bg-bg2 px-3 py-2 rounded-xl border border-soft text-blue-600">
                                                        <ShieldCheck size={12} /> {esc.funcao}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 bg-bg2 px-3 py-2 rounded-xl border border-soft text-muted">
                                                        <Clock size={12} /> {esc.horario || "Sem hora"}
                                                    </span>
                                                    
                                                    {/* Status da Escala */}
                                                    {esc.confirmado ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20">
                                                            <CheckCircle2 size={12} /> Confirmado
                                                        </span>
                                                    ) : jaPassou ? (
                                                        <span className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
                                                            <AlertCircle size={12} /> Faltou Confirmação
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-3 py-2 rounded-xl border border-orange-500/20">
                                                            <Clock size={12} /> Pendente
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 border-2 border-dashed border-soft rounded-[2.5rem]">
                                    <CalendarSearch size={40} className="mx-auto text-muted/30 mb-4" />
                                    <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Nenhuma escala encontrada para este período.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}