'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // 👈 Importar o Link do Next.js
import {
    Wallet, Eye, EyeOff, Coffee, Plus, RefreshCw,
    Euro, Loader2, CheckCircle2, X, Check, Utensils, Receipt // 👈 Novos ícones
} from 'lucide-react'
import ModalHistoricoCantina from '@/components/financeiro/ModalHistoricoCantina'
import { solicitarSaldoCantinaAction } from '@/actions/financeiro-actions'

export default function CardWalletCantina({ membro, saldoLoyverse }: { membro: any, saldoLoyverse?: number }) {
    const router = useRouter()

    // ESTADOS DO CARTÃO
    const [showBalance, setShowBalance] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const saldo = saldoLoyverse ?? 0

    // ESTADOS DO MODAL DE CARREGAMENTO
    const [aberto, setAberto] = useState(false)
    const [loading, setLoading] = useState(false)
    const [sucesso, setSucesso] = useState(false)
    const [valorSelecionado, setValorSelecionado] = useState<number | string>(10)
    const [isCustom, setIsCustom] = useState(false)

    const opcoesPadrao = [5, 10, 20]

    // --- FUNÇÕES DE AÇÃO ---

    const handleRefreshSaldo = async () => {
        setIsRefreshing(true)
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 1500)
    }

    const handleCaixaClick = (val: number) => {
        setValorSelecionado(val)
        setIsCustom(false)
    }

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValorSelecionado(e.target.value)
        setIsCustom(true)
    }

    async function handleSubmit(formData: FormData) {
        if (!valorSelecionado || Number(valorSelecionado) <= 0) {
            alert("Por favor, insira um valor válido.")
            return
        }

        setLoading(true)
        const res = await solicitarSaldoCantinaAction(formData)

        if (res.ok) {
            setSucesso(true)
            setTimeout(() => {
                setAberto(false)
                setSucesso(false)
                setValorSelecionado(10)
                setIsCustom(false)
            }, 3000)
        } else {
            alert(res.error)
        }
        setLoading(false)
    }

    return (
        <>
            <div className="bg-fg text-bg p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group transition-all hover:shadow-figueira/10 hover:-translate-y-1 duration-300 flex flex-col h-full">

                {/* Elementos Decorativos de Fundo */}
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-figueira opacity-10 rounded-full blur-3xl group-hover:opacity-20 group-hover:scale-110 transition-all duration-700"></div>
                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

                <div className="flex flex-col h-full justify-between space-y-8 relative z-10">

                    {/* CABEÇALHO DO CARTÃO */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            {/* 👇 Nova versão com hover (group/wallet) 👇 */}
                            <div className="p-2.5 bg-bg/10 hover:bg-figueira rounded-2xl backdrop-blur-md border border-white/5 shadow-inner transition-all duration-300 group/wallet cursor-default">
                                <Wallet size={16} className="text-figueira group-hover/wallet:text-white group-hover/wallet:scale-110 transition-all duration-300" />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
                                Saldo Cantina
                            </span>
                        </div>

                        {/* CONTROLES: Sincronizar & Olho */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleRefreshSaldo}
                                disabled={isRefreshing}
                                title="Sincronizar Saldo"
                                className="p-3 bg-white/5 hover:bg-figueira hover:text-white rounded-2xl transition-all duration-300 active:scale-95 text-white/40 border border-white/5 disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-white' : ''} />
                            </button>

                            <button
                                onClick={() => setShowBalance(!showBalance)}
                                title={showBalance ? "Ocultar Saldo" : "Mostrar Saldo"}
                                className="p-3 bg-white/5 hover:bg-figueira hover:text-white rounded-2xl transition-all duration-300 active:scale-95 text-white/40 border border-white/5"
                            >
                                {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* ZONA DO VALOR CENTRAL */}
                    <div className="space-y-1 py-2">
                        <div className="flex items-baseline gap-2">
                            <h2 className={`text-5xl font-black italic tracking-tighter transition-all duration-300 ${!showBalance && "translate-y-1 opacity-80 tracking-widest"}`}>
                                {showBalance ? (
                                    new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(saldo)
                                ) : (
                                    "••••••"
                                )}
                            </h2>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-figueira flex items-center gap-2 mt-2">
                            <Coffee size={12} /> Disponível para consumo
                        </p>
                    </div>

                    {/* ========================================================= */}
                    {/* NOVO RODAPÉ - ESTILO APP FINANCEIRA                       */}
                    {/* ========================================================= */}
                    <div className="pt-6 border-t border-white/10 flex justify-between items-start gap-2 w-full z-20 relative">

                        {/* 1. BOTÃO CARREGAR */}
                        <button onClick={() => setAberto(true)} className="flex flex-col items-center gap-2 group/btn flex-1 cursor-pointer">
                            <div className="w-12 h-12 bg-figueira/20 text-figueira rounded-[1rem] flex items-center justify-center group-hover/btn:bg-figueira group-hover/btn:text-white transition-all duration-300 shadow-inner group-active/btn:scale-95">
                                <Plus size={20} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/50 group-hover/btn:text-white transition-colors">Carregar</span>
                        </button>

                        {/* 2. BOTÃO MENU CANTINA */}
                        <Link href="/departamentos/cantina/menu" className="flex flex-col items-center gap-2 group/btn flex-1 cursor-pointer">
                            <div className="w-12 h-12 bg-white/5 text-white/70 rounded-[1rem] flex items-center justify-center group-hover/btn:bg-white/20 group-hover/btn:text-white transition-all duration-300 border border-white/5 group-active/btn:scale-95">
                                <Utensils size={20} />
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/50 group-hover/btn:text-white transition-colors">Menu</span>
                        </Link>

                        {/* 3. BOTÃO HISTÓRICO */}
                        <div className="flex flex-col items-center flex-1 w-full">
                            <ModalHistoricoCantina loyverseId={membro?.loyverse_id} />
                        </div>
                    </div>

                </div>
            </div>

            {/* MODAL DE CARREGAMENTO (Ocultado aqui para brevidade, mas mantenha o código do modal que estava na resposta anterior exatamente igual!) */}
            {aberto && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg/80 backdrop-blur-md animate-in fade-in duration-200">
                    {/* ... Restante do código do Modal permanece igual ... */}
                    <div className="bg-bg2 border border-soft w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Cabeçalho do Modal */}
                        <div className="flex justify-between items-center p-6 border-b border-soft">
                            <h3 className="text-lg font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                <Coffee className="text-figueira" /> Adicionar Saldo
                            </h3>
                            <button onClick={() => setAberto(false)} className="text-muted hover:text-red-500 bg-soft/50 hover:bg-soft p-2 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {sucesso ? (
                            <div className="p-8 text-center space-y-4 animate-in zoom-in-50 duration-500">
                                <CheckCircle2 size={56} className="text-green-500 mx-auto" strokeWidth={1.5} />
                                <div>
                                    <h4 className="text-xl font-black italic text-fg uppercase">Pedido Enviado!</h4>
                                    <p className="text-xs text-muted mt-2 leading-relaxed">O tesoureiro irá validar o pagamento e o saldo ficará disponível em breve.</p>
                                </div>
                            </div>
                        ) : (
                            <form action={handleSubmit} className="p-6 space-y-6">
                                <input type="hidden" name="membro_id" value={membro?.id} />
                                <input type="hidden" name="valor" value={valorSelecionado} />

                                <div>
                                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">Selecione o Valor</label>
                                    <div className="grid grid-cols-3 gap-3 mt-3">
                                        {opcoesPadrao.map(val => {
                                            const isAtivo = !isCustom && Number(valorSelecionado) === val;
                                            return (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => handleCaixaClick(val)}
                                                    className={`
                                                        relative p-4 rounded-xl border-2 font-black text-lg transition-all active:scale-95 flex flex-col items-center justify-center
                                                        ${isAtivo
                                                            ? 'bg-figueira border-figueira text-white scale-105 shadow-lg shadow-figueira/20 z-10'
                                                            : 'bg-bg border-soft text-muted hover:border-figueira/40 hover:text-fg'
                                                        }
                                                    `}
                                                >
                                                    {isAtivo && <Check size={14} className="absolute top-1.5 right-1.5 opacity-60" strokeWidth={4} />}
                                                    €{val}
                                                </button>
                                            )
                                        })}
                                    </div>

                                    <div className="flex items-center gap-3 py-4">
                                        <div className="h-[1px] flex-1 bg-soft"></div>
                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted">Ou Customizado</span>
                                        <div className="h-[1px] flex-1 bg-soft"></div>
                                    </div>

                                    <div className="relative">
                                        <Euro size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isCustom ? 'text-figueira' : 'text-muted'}`} />
                                        <input
                                            type="number"
                                            min="1"
                                            step="0.01"
                                            placeholder="Ex: 15.00"
                                            value={isCustom ? valorSelecionado : ''}
                                            onChange={handleCustomChange}
                                            className={`
                                                w-full bg-bg border-2 rounded-xl pl-12 pr-4 py-4 text-sm font-black outline-none transition-all
                                                ${isCustom ? 'border-figueira text-fg ring-4 ring-figueira/10' : 'border-soft text-fg focus:border-figueira'}
                                            `}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">Método de Envio</label>
                                    <select name="forma_pagamento" required className="w-full bg-bg border-2 border-soft p-4 rounded-xl text-xs font-bold outline-none focus:border-figueira mt-2 transition-colors appearance-none cursor-pointer">
                                        <option value="MBWAY">MB WAY</option>
                                        <option value="Transferencia">Transferência Bancária</option>
                                        <option value="Dinheiro">Dinheiro (Entregue em Mão)</option>
                                    </select>
                                </div>

                                <button
                                    disabled={loading || !valorSelecionado || Number(valorSelecionado) <= 0}
                                    className="w-full bg-fg text-bg py-5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-figueira hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group active:scale-95 shadow-xl"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} className="group-hover:scale-110 transition-transform" />
                                            Confirmar • €{valorSelecionado || '0'}
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}