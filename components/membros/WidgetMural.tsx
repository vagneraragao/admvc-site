// components/membros/WidgetMural.tsx
'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Menu, X, ArrowRight, UserCircle, Hash } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function WidgetMural({ avisos }: { avisos: any[] }) {
    const [open, setOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(false);

    // EFEITO PARA VERIFICAR SE HÁ MENSAGENS NÃO LIDAS
    useEffect(() => {
        if (!avisos || avisos.length === 0) return;

        // Vai buscar o tempo da última vez que o membro abriu o widget
        const lastReadTime = localStorage.getItem('mural_last_read');
        // Pega no tempo da mensagem mais recente que veio da BD
        const newestMsgTime = new Date(avisos[0].createdAt).getTime();

        // Se nunca abriu, ou se a mensagem mais nova é mais recente que a sua última leitura -> PISCA!
        if (!lastReadTime || newestMsgTime > Number(lastReadTime)) {
            setHasUnread(true);
        }
    }, [avisos]);

    const handleToggle = () => {
        const newState = !open;
        setOpen(newState);

        // Se estiver a abrir o painel, marca as mensagens como lidas
        if (newState && avisos.length > 0) {
            const newestMsgTime = new Date(avisos[0].createdAt).getTime();
            localStorage.setItem('mural_last_read', newestMsgTime.toString());
            setHasUnread(false);
        }
    };

    if (!avisos || avisos.length === 0) return null;

    const formatDate = (dateString: string) => {
        const data = new Date(dateString);
        return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(data);
    };

    return (
        <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex flex-col items-end">

            {open && (
                <div className="mb-4 w-[calc(100vw-3rem)] md:w-96 bg-bg2 border border-soft rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 origin-bottom-right">

                    <div className="bg-bg border-b border-soft p-4 flex items-center justify-between">
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-fg flex items-center gap-2">
                            <MessageSquare size={14} className="text-figueira" />
                            Últimos Avisos
                        </h4>
                        <Link href="/membros/mural" className="text-[9px] font-bold uppercase tracking-widest text-figueira hover:text-fg transition-colors flex items-center gap-1">
                            Ver Mural <ArrowRight size={10} />
                        </Link>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
                        <div className="space-y-1">
                            {avisos.map((msg) => (
                                <Link key={msg.id} href="/membros/mural" className="block p-4 rounded-2xl hover:bg-soft/30 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {msg.autor.avatar_file ? (
                                                <Image src={msg.autor.avatar_file} alt="Avatar" width={24} height={24} className="rounded-full object-cover border border-soft" />
                                            ) : (
                                                <UserCircle size={24} className="text-muted" />
                                            )}
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-wider text-fg leading-none">
                                                    {msg.autor.first_name} {msg.autor.last_name}
                                                </p>
                                                <p className="text-[8px] font-bold uppercase tracking-widest text-muted mt-1">
                                                    {formatDate(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="shrink-0 bg-figueira/10 text-figueira px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Hash size={8} />
                                            {msg.departamento?.nome || msg.grupo?.nome}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted font-medium line-clamp-2 leading-relaxed">
                                        {msg.texto}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={handleToggle}
                className="relative bg-figueira text-white h-16 w-16 rounded-[1.5rem] shadow-xl shadow-figueira/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300"
            >
                {/* O ALERTA AGORA SÓ PISCA SE HOUVER MENSAGENS NÃO LIDAS */}
                {!open && hasUnread && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-figueira"></span>
                    </span>
                )}

                <div className="flex flex-col items-center justify-center gap-0.5">
                    {open ? (
                        <X size={28} strokeWidth={2.5} />
                    ) : (
                        <>
                            <MessageSquare size={20} strokeWidth={2.5} className="-mt-1" />
                            <Menu size={12} strokeWidth={3} className="opacity-80" />
                        </>
                    )}
                </div>
            </button>

        </div>
    )
}