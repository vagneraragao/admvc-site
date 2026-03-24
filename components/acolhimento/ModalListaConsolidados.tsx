// components/acolhimento/ModalListaConsolidados.tsx
'use client'

import { useState } from 'react'
import { Users, X, Phone, CalendarCheck } from 'lucide-react'
import ModalHistorico from './ModalHistorico'

export default function ModalListaConsolidados({ consolidados }: { consolidados: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* O Botão Dourado/Principal da Caixa */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full bg-fg text-bg py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira hover:text-white transition-all shadow-sm active:scale-95"
            >
                Ver Lista Completa
            </button>

            {/* O Modal Oculto */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg2 w-full max-w-2xl border border-soft p-8 rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 text-left max-h-[90vh] flex flex-col">

                        <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 p-2 bg-soft text-muted rounded-full hover:bg-red-500 hover:text-white transition-colors z-10">
                            <X size={16} />
                        </button>

                        <div className="mb-6 pr-8 shrink-0 border-b border-soft pb-6">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                <Users size={20} className="text-figueira" /> Membros Consolidados
                            </h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                Total: <span className="text-fg">{consolidados.length} pessoas que decidiram ficar.</span>
                            </p>
                        </div>

                        {/* Corpo com Scroll */}
                        <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                            {consolidados.length > 0 ? (
                                consolidados.map((v) => (
                                    <div key={v.id} className="p-5 bg-bg border border-soft rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-figueira/30 transition-all">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-sm font-black uppercase text-fg">{v.nome}</h4>
                                                <span className="text-[8px] font-black bg-green-500/10 text-green-600 px-2 py-0.5 rounded-md uppercase tracking-widest flex items-center gap-1">
                                                    <CalendarCheck size={10} /> Consolidado
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Phone size={10} /> {v.telefone}
                                            </p>
                                        </div>

                                        <div className="shrink-0">
                                            {/* 👇 Reutilizamos a tua Timeline aqui mesmo! */}
                                            <ModalHistorico visitante={v} />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest italic">Ninguém foi consolidado ainda.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}