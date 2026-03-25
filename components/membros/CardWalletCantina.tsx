'use client'

import { useState } from 'react'
import { Wallet, Eye, EyeOff, Coffee } from 'lucide-react'
import ModalHistoricoCantina from '@/components/financeiro/ModalHistoricoCantina'

export default function CardWalletCantina({ membro, saldoLoyverse }: { membro: any, saldoLoyverse?: number }) {
    const [showBalance, setShowBalance] = useState(false)
    const saldo = saldoLoyverse ?? 0

    return (
        <div className="bg-fg text-bg p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group transition-all hover:shadow-figueira/10 hover:-translate-y-1 duration-300">

            {/* Elemento Decorativo de Fundo */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-figueira opacity-10 rounded-full blur-3xl group-hover:opacity-20 group-hover:scale-110 transition-all duration-700"></div>
            <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>

            <div className="flex flex-col h-full justify-between space-y-8 relative z-10">

                {/* CABEÇALHO DO CARTÃO */}
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-bg/10 rounded-2xl backdrop-blur-md border border-white/5 shadow-inner">
                            <Wallet size={16} className="text-figueira" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">
                            Saldo Cantina
                        </span>
                    </div>

                    {/* BOTÃO DO OLHO */}
                    <button
                        onClick={() => setShowBalance(!showBalance)}
                        title={showBalance ? "Ocultar Saldo" : "Mostrar Saldo"}
                        className="p-3 bg-white/5 hover:bg-figueira hover:text-white rounded-2xl transition-all duration-300 active:scale-95 text-white/40 border border-white/5"
                    >
                        {showBalance ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* ZONA DO VALOR */}
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

                {/* RODAPÉ DO CARTÃO - Limpo e Focado no Histórico */}
                <div className="pt-6 border-t border-white/10 flex justify-center w-full">
                    <div className="w-full">
                        <ModalHistoricoCantina loyverseId={membro?.loyverse_id} />
                    </div>
                </div>

            </div>
        </div>
    )
}