'use client'

import { useState } from 'react'
import { X, Target, Users, Euro, CalendarDays, Hash, Loader2, Ticket, Gift } from 'lucide-react'
import { criarCampanhaEmLoteAction, criarRifaAction } from '@/app/financeiro/actions'

interface Membro {
    id: number;
    first_name: string;
    last_name: string;
}

interface Props {
    membros: Membro[];
    tipoPredefinido?: 'CARNE' | 'RIFA';
}

export default function ModalNovaCampanha({ membros, tipoPredefinido = 'CARNE' }: Props) {
    const [aberto, setAberto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [membrosSelecionados, setMembrosSelecionados] = useState<number[]>([]);
    const [busca, setBusca] = useState('');

    const isRifa = tipoPredefinido === 'RIFA';

    const membrosFiltrados = membros.filter(m =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(busca.toLowerCase())
    );

    const toggleMembro = (id: number) => {
        setMembrosSelecionados(prev =>
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
        );
    };

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        let result;

        if (isRifa) {
            // Se for Rifa, chama a action específica da Rifa (não precisa de membros aqui)
            result = await criarRifaAction(formData);
        } else {
            // Se for Carnê, chama a action em lote
            result = await criarCampanhaEmLoteAction(formData, membrosSelecionados);
        }

        if (result.ok) {
            setAberto(false);
            setMembrosSelecionados([]);
            setBusca('');
        } else {
            alert(result.error);
        }
        setLoading(false);
    }

    return (
        <>
            <button
                onClick={() => setAberto(true)}
                className="flex items-center gap-4 p-5 bg-bg2 border border-soft rounded-3xl hover:border-figueira/50 hover:bg-figueira/5 transition-all group text-left w-full"
            >
                <div className="bg-figueira/10 p-3 rounded-2xl text-figueira group-hover:scale-110 transition-transform">
                    {isRifa ? <Ticket size={20} /> : <Target size={20} />}
                </div>
                <div>
                    <h5 className="text-xs font-black uppercase text-fg tracking-widest">
                        {isRifa ? 'Nova Rifa' : 'Criar Carnê'}
                    </h5>
                    <p className="text-[10px] text-muted font-medium mt-0.5">
                        {isRifa ? 'Sorteios e angariações' : 'Ex: Obra (10 Parcelas)'}
                    </p>
                </div>
            </button>

            {aberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-bg2 border border-soft w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">

                        <div className="flex items-center justify-between p-6 md:p-8 border-b border-soft">
                            <div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-fg leading-none">
                                    {isRifa ? 'Configurar Rifa' : 'Novo Carnê de Oferta'}
                                </h3>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-2">
                                    {isRifa ? 'Definir prémios e números' : 'Adicionar campanha em lote para membros'}
                                </p>
                            </div>
                            <button onClick={() => setAberto(false)} className="p-3 bg-soft text-muted rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form action={handleSubmit} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">
                                        {isRifa ? 'Nome da Rifa' : 'Nome da Campanha'}
                                    </label>
                                    <input name="nome" required defaultValue={isRifa ? "Rifa de Páscoa" : "Carnê da Obra"} className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1" />
                                </div>

                                {isRifa && (
                                    <div className="md:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-1"><Gift size={12} /> Prémio a Sortear</label>
                                        <input name="premio" required placeholder="Ex: Cabaz com 5kg de Chocolate" className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1" />
                                    </div>
                                )}

                                <div>
                                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-1"><Euro size={12} /> {isRifa ? 'Valor por Número' : 'Valor Mensal'}</label>
                                    <input name={isRifa ? "valor_numero" : "valor_mensal"} type="number" step="0.01" required placeholder="Ex: 5.00" className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1" />
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-1"><Hash size={12} /> {isRifa ? 'Total de Números' : 'Total de Parcelas'}</label>
                                    <input name={isRifa ? "total_numeros" : "parcelas_total"} type="number" required defaultValue={isRifa ? 100 : 10} min="1" className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1" />
                                </div>

                                {!isRifa && (
                                    <div className="md:col-span-2">
                                        <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-1"><CalendarDays size={12} /> Dia de Vencimento</label>
                                        <input name="data_pagamento" type="number" required min="1" max="31" defaultValue="10" className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1" />
                                    </div>
                                )}
                            </div>

                            {/* SELEÇÃO DE MEMBROS (APENAS PARA CARNÊ) */}
                            {!isRifa && (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between border-b border-soft pb-2">
                                        <label className="text-[10px] font-black uppercase text-fg tracking-widest flex items-center gap-2">
                                            <Users size={14} className="text-figueira" /> Selecionar Aderentes
                                        </label>
                                        <span className="text-[10px] font-black text-figueira bg-figueira/10 px-3 py-1 rounded-full">
                                            {membrosSelecionados.length} Selecionados
                                        </span>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="Pesquisar membro..."
                                        value={busca}
                                        onChange={(e) => setBusca(e.target.value)}
                                        className="w-full bg-bg border border-soft p-3 rounded-xl text-xs font-bold outline-none focus:border-figueira"
                                    />

                                    <div className="max-h-48 overflow-y-auto border border-soft rounded-2xl p-2 space-y-1 bg-bg">
                                        {membrosFiltrados.map((m) => {
                                            const selecionado = membrosSelecionados.includes(m.id);
                                            return (
                                                <div
                                                    key={m.id}
                                                    onClick={() => toggleMembro(m.id)}
                                                    className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors text-xs font-bold uppercase ${selecionado ? 'bg-figueira/10 text-figueira' : 'hover:bg-soft text-fg'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${selecionado ? 'bg-figueira border-figueira text-white' : 'border-muted'}`}>
                                                        {selecionado && <X size={12} className="rotate-45" />}
                                                    </div>
                                                    {m.first_name} {m.last_name}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            <button
                                disabled={loading || (!isRifa && membrosSelecionados.length === 0)}
                                className="w-full bg-fg text-bg py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-figueira transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 shadow-xl"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : (isRifa ? <Ticket size={16} /> : <Target size={16} />)}
                                {loading ? 'A Gerar...' : (isRifa ? 'Criar Grelha da Rifa' : `Gerar para ${membrosSelecionados.length} Membros`)}
                            </button>

                        </form>
                    </div>
                </div>
            )}
        </>
    )
}