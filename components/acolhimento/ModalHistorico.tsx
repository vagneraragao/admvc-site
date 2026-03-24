// components/acolhimento/ModalHistorico.tsx
'use client'

import { useState } from 'react'
import { History, X, MessageCircle, Phone, Users, Clock } from 'lucide-react'

export default function ModalHistorico({ visitante }: { visitante: any }) {
    const [isOpen, setIsOpen] = useState(false);

    // Define o ícone com base no tipo de contacto
    const getIcon = (tipo: string) => {
        if (tipo === 'WHATSAPP') return <MessageCircle size={14} className="text-green-500" />;
        if (tipo === 'LIGACAO') return <Phone size={14} className="text-blue-500" />;
        return <Users size={14} className="text-figueira" />; // PRESENCIAL
    };

    return (
        <>
            {/* O Botão Discreto */}
            <button
                onClick={() => setIsOpen(true)}
                className="text-figueira hover:underline flex items-center gap-1 transition-all group"
            >
                <History size={10} className="group-hover:-rotate-45 transition-transform" />
                Ver Histórico ({visitante.acompanhamentos.length})
            </button>

            {/* O Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg2 w-full max-w-lg border border-soft p-8 rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-200 text-left max-h-[90vh] flex flex-col">

                        <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 p-2 bg-soft text-muted rounded-full hover:bg-fg hover:text-bg transition-colors z-10">
                            <X size={16} />
                        </button>

                        <div className="mb-6 pr-8 shrink-0">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                <History size={20} className="text-figueira" /> Linha do Tempo
                            </h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                Histórico de: <span className="text-fg">{visitante.nome}</span>
                            </p>
                        </div>

                        {/* Corpo com Scroll para a Linha do Tempo */}
                        <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
                            {visitante.acompanhamentos.length > 0 ? (
                                <div className="relative border-l-2 border-soft/50 ml-3 space-y-6">
                                    {visitante.acompanhamentos.map((acomp: any) => (
                                        <div key={acomp.id} className="relative pl-6">
                                            {/* Ponto na Linha do Tempo */}
                                            <div className="absolute -left-[17px] top-1 w-8 h-8 bg-bg2 border border-soft rounded-full flex items-center justify-center shadow-sm">
                                                {getIcon(acomp.tipo_contacto)}
                                            </div>

                                            {/* Cartão de Registo */}
                                            <div className="bg-bg border border-soft p-4 rounded-2xl shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-figueira">
                                                            {acomp.tipo_contacto}
                                                        </span>
                                                        <p className="text-[10px] font-bold text-fg uppercase mt-0.5">
                                                            Por {acomp.membro?.first_name} {acomp.membro?.last_name}
                                                        </p>
                                                    </div>
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted flex items-center gap-1 bg-soft/50 px-2 py-1 rounded-md">
                                                        <Clock size={8} />
                                                        {new Date(acomp.data_contacto).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="pt-2 border-t border-soft/50">
                                                    <p className="text-xs text-muted font-medium italic leading-relaxed">
                                                        "{acomp.observacoes}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-50">
                                    <p className="text-[10px] font-bold uppercase tracking-widest italic">Nenhum registo de contacto encontrado.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </>
    )
}