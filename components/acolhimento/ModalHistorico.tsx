// components/acolhimento/ModalHistorico.tsx
'use client'

import { useState } from 'react'
import { History, X, MessageCircle, Phone, Users, Clock } from 'lucide-react'

// 1. Definimos a interface para aceitar o acionador opcional
interface ModalHistoricoProps {
    visitante: any;
    acionador?: React.ReactNode; // Permite passar qualquer elemento React (ícone, div, etc)
}

export default function ModalHistorico({ visitante, acionador }: ModalHistoricoProps) {
    const [isOpen, setIsOpen] = useState(false);

    const getIcon = (tipo: string) => {
        if (tipo === 'WHATSAPP') return <MessageCircle size={14} className="text-green-500" />;
        if (tipo === 'LIGACAO') return <Phone size={14} className="text-blue-500" />;
        return <Users size={14} className="text-figueira" />;
    };

    return (
        <>
            {/* 2. Lógica do Acionador: Se existir a prop, usa-a. Se não, usa o botão padrão */}
            {acionador ? (
                <div onClick={() => setIsOpen(true)} className="cursor-pointer inline-block">
                    {acionador}
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="text-figueira hover:underline flex items-center gap-1 transition-all group text-[10px] font-black uppercase tracking-widest"
                >
                    <History size={10} className="group-hover:-rotate-45 transition-transform" />
                    Ver Histórico ({visitante.acompanhamentos?.length || 0})
                </button>
            )}

            {/* O Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg2 w-full max-w-lg border border-soft p-8 rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 text-left max-h-[85vh] flex flex-col">

                        {/* Botão Fechar */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-bg border border-soft text-muted rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all z-20 shadow-sm"
                        >
                            <X size={18} strokeWidth={2.5} />
                        </button>

                        <div className="mb-8 pr-12 shrink-0">
                            <span className="text-figueira font-black text-[9px] uppercase tracking-[0.3em] flex items-center gap-2 mb-1">
                                <History size={12} /> Linha do Tempo
                            </span>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg leading-none">
                                Histórico de <span className="opacity-30">{visitante.nome}</span>
                            </h2>
                        </div>

                        {/* Corpo com Scroll */}
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar pb-4">
                            {visitante.acompanhamentos && visitante.acompanhamentos.length > 0 ? (
                                <div className="relative border-l-2 border-soft/50 ml-4 space-y-8 py-2">
                                    {visitante.acompanhamentos.map((acomp: any) => (
                                        <div key={acomp.id} className="relative pl-8">
                                            {/* Ponto na Linha do Tempo */}
                                            <div className="absolute -left-[19px] top-0 w-9 h-9 bg-bg border-2 border-soft rounded-2xl flex items-center justify-center shadow-sm z-10 group-hover:border-figueira transition-colors">
                                                {getIcon(acomp.tipo_contacto)}
                                            </div>

                                            {/* Cartão de Registo */}
                                            <div className="bg-bg border border-soft p-5 rounded-[1.8rem] shadow-sm hover:border-figueira/20 transition-all">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-figueira bg-figueira/5 px-2 py-0.5 rounded-md border border-figueira/10">
                                                            {acomp.tipo_contacto}
                                                        </span>
                                                        <p className="text-[10px] font-black text-fg uppercase italic tracking-tight mt-1.5">
                                                            {acomp.membro?.first_name} {acomp.membro?.last_name}
                                                        </p>
                                                    </div>
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5 bg-soft/30 px-2.5 py-1 rounded-full border border-soft/50">
                                                        <Clock size={10} />
                                                        {new Date(acomp.data_contacto).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="pt-3 border-t border-soft/50">
                                                    <p className="text-[11px] text-fg font-medium italic leading-relaxed">
                                                        "{acomp.observacoes}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-30 flex flex-col items-center gap-3">
                                    <History size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Nenhum registo de contacto.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}