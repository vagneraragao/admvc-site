"use client";

import { useState, useMemo } from "react";
import { PlusCircle, X, User, ArrowRight, Receipt, Ticket, HandCoins, Loader2 } from "lucide-react";
import GrelhaRifa from "@/components/financeiro/GrelhaRifa";
import { lancarPagamentoCarne, lancarContribuicaoAction } from "@/actions/financeiro-actions";

export default function ModalEntradaUnificada({ membros, carnesAtivos, rifaAtiva }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);
    
    // Estados do Formulário
    const [membroId, setMembroId] = useState("");
    const [tipoEntrada, setTipoEntrada] = useState("");
    const [valor, setValor] = useState("");
    
    // Estados Específicos para Carnê
    const [carneSelecionado, setCarneSelecionado] = useState("");

    const carnesDoMembro = useMemo(() => {
        if (!membroId || membroId === "anonimo") return [];
        
        return carnesAtivos.filter((c: any) => {
            const isMesmoMembro = String(c.membro_id) === String(membroId);
            const pagas = c.parcelas_pagas || 0;
            const total = c.parcelas_total || 0;
            const temFaltaPagar = pagas < total;

            return isMesmoMembro && temFaltaPagar;
        });
    }, [membroId, carnesAtivos]);

    const fecharModal = () => {
        setIsOpen(false);
        setMembroId("");
        setTipoEntrada("");
        setValor("");
        setCarneSelecionado("");
    };

    // FUNÇÃO QUE EXECUTA AO CLICAR NO BOTÃO
    async function handleSalvarEntrada() {
        console.log("▶️ 1. Botão CLICADO!");
        
        // Verifica se os campos obrigatórios estão preenchidos
        if (!tipoEntrada || !valor || Number(valor) <= 0) {
            alert("Por favor, preencha todos os campos e certifique-se que o valor é maior que zero.");
            return;
        }

        setIsPending(true);

        try {
            if (tipoEntrada === 'CARNE') {
                console.log("➡️ 2A. A preparar envio para CARNE (ID:", carneSelecionado, ")");
                const res = await lancarPagamentoCarne(Number(carneSelecionado), 1);
                
                if (!res.ok) {
                    alert("Erro ao gravar Carnê: " + res.error);
                    setIsPending(false);
                    return;
                }
            } else {
                console.log("➡️ 2B. A preparar envio para", tipoEntrada);
                const formData = new FormData();
                if (membroId !== 'anonimo') {
                    formData.append('membroId', membroId);
                }
                formData.append('valor', valor);
                formData.append('tipo', tipoEntrada);
                // Adicionamos a data atual para garantir que o Prisma não se queixa
                formData.append('data', new Date().toISOString()); 
                
                const res = await lancarContribuicaoAction(formData);
                
                if (!res.ok) {
                    alert("Erro ao gravar Oferta/Dízimo: " + res.error);
                    setIsPending(false);
                    return;
                }
            }

            console.log("✅ 3. Sucesso! A fechar o modal.");
            fecharModal(); 

        } catch (error) {
            console.error("🚨 ERRO CRÍTICO NO FRONTEND:", error);
            alert("Ocorreu um erro ao comunicar com o servidor.");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className="h-12 px-6 bg-fg text-bg rounded-2xl flex items-center gap-2 hover:bg-figueira hover:text-white transition-all active:scale-95 shadow-lg"
            >
                <PlusCircle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Lançar Entrada</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="absolute inset-0" onClick={fecharModal}></div>

                    <div className={`bg-bg border border-soft p-6 md:p-8 rounded-[2.5rem] shadow-2xl w-full relative z-10 transition-all duration-500 animate-in zoom-in-95 ${
                        tipoEntrada === 'RIFA' ? 'max-w-5xl' : 'max-w-lg'
                    }`}>                        
                        <button onClick={fecharModal} className="absolute top-6 right-6 text-muted hover:text-red-500 bg-soft/50 p-2 rounded-xl transition-colors">
                            <X size={16} strokeWidth={3} />
                        </button>

                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg mb-6 flex items-center gap-3">
                            <HandCoins size={24} className="text-figueira" />
                            Registo Financeiro
                        </h2>

                        <div className="space-y-6">
                            
                            {/* PASSO 1: IDENTIFICAR MEMBRO */}
                            <div className="space-y-2 relative z-20">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                    <User size={12} /> 1. Identificar Membro
                                </label>
                                <select 
                                    className="w-full h-12 px-4 bg-bg2 border border-soft rounded-2xl text-sm font-bold text-fg focus:border-figueira focus:ring-1 focus:ring-figueira outline-none transition-all cursor-pointer"
                                    value={membroId}
                                    onChange={(e) => {
                                        setMembroId(e.target.value);
                                        setTipoEntrada(""); 
                                        setCarneSelecionado("");
                                    }}
                                >
                                    <option value="" disabled>Selecione um membro...</option>
                                    <option value="anonimo">✝ Oferta Anónima</option>
                                    {membros.map((m: any) => (
                                        <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* PASSO 2: TIPO DE ENTRADA */}
                            {membroId && (
                                <div className="space-y-2 animate-in slide-in-from-top-2 relative z-10">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-2">
                                        <ArrowRight size={12} /> 2. O que estamos a receber?
                                    </label>
                                    <select 
                                        className="w-full h-12 px-4 bg-bg2 border border-soft rounded-2xl text-sm font-bold text-fg focus:border-figueira focus:ring-1 focus:ring-figueira outline-none transition-all cursor-pointer"
                                        value={tipoEntrada}
                                        onChange={(e) => setTipoEntrada(e.target.value)}
                                    >
                                        <option value="" disabled>Selecione o tipo...</option>
                                        <option value="DIZIMO">Dízimo</option>
                                        <option value="OFERTA">Oferta Voluntária</option>
                                        <option value="MISSAO">Oferta de Missões</option>
                                        
                                        {carnesDoMembro.length > 0 && (
                                            <option value="CARNE" className="font-black text-figueira">
                                                📑 Pagamento de Carnê/Campanha ({carnesDoMembro.length})
                                            </option>
                                        )}
                                        
                                        {rifaAtiva && (
                                            <option value="RIFA">🎟️ Venda de Rifa</option>
                                        )}
                                    </select>
                                </div>
                            )}

                            {/* CENÁRIO A: CARNÊ */}
                            {tipoEntrada === 'CARNE' && carnesDoMembro.length > 0 && (
                                <div className="p-5 bg-figueira/5 border border-figueira/20 rounded-3xl space-y-4 animate-in fade-in">
                                    <div className="flex items-center gap-3 border-b border-figueira/10 pb-3 mb-3">
                                        <Receipt size={18} className="text-figueira" />
                                        <p className="text-xs font-black uppercase text-figueira tracking-tighter">Detalhes do Carnê</p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5 block">Qual Campanha?</label>
                                        <select 
                                            className="w-full h-12 px-4 bg-white border border-soft rounded-2xl text-sm font-bold text-fg cursor-pointer focus:border-figueira outline-none"
                                            value={carneSelecionado}
                                            onChange={(e) => {
                                                setCarneSelecionado(e.target.value);
                                                const carne = carnesDoMembro.find((c: any) => String(c.id) === e.target.value);
                                                if (carne) setValor(String(carne.valor_mensal));
                                            }}
                                        >
                                            <option value="" disabled>Selecione o Carnê...</option>
                                            {carnesDoMembro.map((c: any) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nome} (Faltam {c.parcelas_total - (c.parcelas_pagas || 0)} parcelas)
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {carneSelecionado && (
                                        <div className="flex items-center justify-between bg-white border border-soft p-4 rounded-2xl animate-in slide-in-from-top-2">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Valor a Pagar</p>
                                                <p className="text-lg font-black text-fg mt-1">€{Number(valor).toFixed(2)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Parcelas</p>
                                                <p className="text-sm font-bold text-fg mt-1.5">1 parcela(s)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* CENÁRIO B: RIFA */}
                            {tipoEntrada === 'RIFA' && (
                                <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl space-y-4 animate-in fade-in">
                                    <div className="flex items-center gap-3 border-b border-blue-100 pb-3 mb-3">
                                        <Ticket size={18} className="text-blue-600" />
                                        <p className="text-xs font-black uppercase text-blue-700 tracking-tighter">Sorteio: {rifaAtiva.nome}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-2 shadow-sm border border-blue-100/50">
                                        <GrelhaRifa rifa={rifaAtiva} membros={membros} membroPreSelecionadoId={membroId} />
                                    </div>
                                </div>
                            )}

                            {/* CENÁRIO C: OFERTAS LIVRES */}
                            {['DIZIMO', 'OFERTA', 'MISSAO'].includes(tipoEntrada) && (
                                <div className="space-y-2 animate-in fade-in bg-soft/20 p-5 rounded-3xl border border-soft">
                                    <label className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center justify-between">
                                        <span>Valor Livre (€)</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg font-black text-xl">€</span>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            placeholder="0.00"
                                            className="w-full h-14 pl-10 pr-4 bg-white border border-soft rounded-2xl text-2xl font-black text-fg focus:border-figueira focus:ring-1 focus:ring-figueira outline-none transition-all"
                                            value={valor}
                                            onChange={(e) => setValor(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* BOTÃO SUBMIT */}
                            {tipoEntrada !== 'RIFA' && (
                                <button 
                                    type="button"
                                    onClick={handleSalvarEntrada}
                                    disabled={
                                        isPending || 
                                        !tipoEntrada || 
                                        (tipoEntrada === 'CARNE' && !carneSelecionado) ||
                                        (!valor || Number(valor) <= 0)
                                    }
                                    className="w-full h-14 flex items-center justify-center gap-2 bg-figueira text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-figueira/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-figueira/20"
                                >
                                    {isPending ? (
                                        <><Loader2 size={16} className="animate-spin" /> Processando...</>
                                    ) : (
                                        "Confirmar Registo"
                                    )}
                                </button>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}