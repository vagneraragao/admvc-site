'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, Receipt, Euro } from 'lucide-react'
import { registrarPagamentoCampanhaAction } from '@/app/financeiro/actions'

export default function FormLancamentoOferta({ membros, objetivos }: { membros: any[], objetivos: any[] }) {
    const [loading, setLoading] = useState(false);

    // Estados das caixas de seleção
    const [membroId, setMembroId] = useState('');
    const [objetivoId, setObjetivoId] = useState('');
    const [valorInput, setValorInput] = useState('');

    // Filtra os objetivos para mostrar APENAS os do membro selecionado
    const objetivosDoMembro = objetivos.filter(obj => obj.membro_id === parseInt(membroId));

    // Encontra os detalhes do objetivo selecionado
    const objetivoSelecionado = objetivosDoMembro.find(obj => obj.id === parseInt(objetivoId));

    // Efeito Mágico: Quando escolhe a campanha, preenche o valor sozinho!
    useEffect(() => {
        if (objetivoSelecionado) {
            setValorInput(objetivoSelecionado.valor_mensal.toString());
        } else {
            setValorInput('');
        }
    }, [objetivoSelecionado]);

    // Reseta a campanha se mudar de membro
    useEffect(() => {
        setObjetivoId('');
    }, [membroId]);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        const result = await registrarPagamentoCampanhaAction(formData);

        if (result.ok) {
            setMembroId('');
            setObjetivoId('');
            setValorInput('');
            alert("Pagamento registado com sucesso! 🎉");
        } else {
            alert(result.error);
        }
        setLoading(false);
    }

    return (
        <form action={handleSubmit} className="bg-bg2 border border-soft p-6 rounded-[2.5rem] space-y-5 h-full flex flex-col justify-between shadow-sm">
            <div className="flex items-center gap-3 border-b border-soft pb-4">
                <div className="bg-figueira/10 p-3 rounded-2xl text-figueira">
                    <Receipt size={20} />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg leading-none">Receber Pagamento</h3>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">Carnês e Rifas</p>
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {/* 1. SELECIONAR O MEMBRO */}
                <div>
                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">Membro</label>
                    <select
                        value={membroId}
                        onChange={(e) => setMembroId(e.target.value)}
                        className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1 transition-all"
                        required
                    >
                        <option value="">1. Quem está a pagar?</option>
                        {membros.map(m => (
                            <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                        ))}
                    </select>
                </div>

                {/* 2. SELECIONAR A CAMPANHA (Só abre se tiver escolhido o membro) */}
                <div>
                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">Campanha / Carnê</label>
                    <select
                        name="objetivo_id"
                        value={objetivoId}
                        onChange={(e) => setObjetivoId(e.target.value)}
                        disabled={!membroId || objetivosDoMembro.length === 0}
                        className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1 disabled:opacity-50 transition-all"
                        required
                    >
                        <option value="">2. Selecione o plano...</option>
                        {objetivosDoMembro.map(obj => (
                            <option key={obj.id} value={obj.id}>{obj.nome}</option>
                        ))}
                    </select>
                    {membroId && objetivosDoMembro.length === 0 && (
                        <p className="text-[9px] text-red-500 font-bold ml-2 mt-1 uppercase tracking-widest">Este membro não tem campanhas ativas.</p>
                    )}
                </div>

                {/* 3. INFORMAÇÃO DA PARCELA E VALOR */}
                {objetivoSelecionado && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">

                        {/* Caixa de Resumo do Plano */}
                        <div className="bg-figueira/5 border border-figueira/20 p-4 rounded-2xl flex justify-between items-center">
                            <div>
                                <span className="text-[9px] font-black uppercase text-figueira tracking-widest block mb-1">Status do Carnê</span>
                                <p className="text-xs font-black text-fg italic">
                                    Pagou {objetivoSelecionado.parcelas_pagas} de {objetivoSelecionado.parcelas_total} parcelas
                                </p>
                            </div>
                            {objetivoSelecionado.parcelas_pagas >= objetivoSelecionado.parcelas_total && (
                                <CheckCircle2 size={24} className="text-green-500" />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">Valor</label>
                                <div className="relative mt-1">
                                    <Euro size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                                    <input
                                        name="valor_pago"
                                        type="number"
                                        step="0.01"
                                        required
                                        value={valorInput}
                                        onChange={(e) => setValorInput(e.target.value)}
                                        className="w-full bg-bg border border-soft p-4 pl-8 rounded-2xl text-xs font-bold outline-none focus:border-figueira transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">Método</label>
                                <select
                                    name="forma_pagamento"
                                    required
                                    className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1 transition-all"
                                >
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="TPA">TPA / Cartão</option>
                                    <option value="MBWAY">MB WAY</option>
                                    <option value="Transferência">Transferência</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button
                disabled={loading || !objetivoSelecionado}
                className="w-full bg-fg text-bg py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-figueira transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                {loading ? 'A Registar...' : 'Confirmar Pagamento'}
            </button>
        </form>
    )
}