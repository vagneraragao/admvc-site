'use client'

import { useState } from 'react'
import { CalendarDays, Clock, MapPin, ChevronDown, Edit3 } from 'lucide-react'
import Link from 'next/link'

const cultosMock = [
    { id: 1, titulo: "Culto de Ensino", data: "2026-03-26T19:30:00", local: "Templo Principal" },
    { id: 2, titulo: "Culto de Celebração", data: "2026-03-29T18:00:00", local: "Templo Principal" },
    { id: 3, titulo: "Reunião de Jovens", data: "2026-04-04T20:00:00", local: "Salão Anexo" },
    { id: 4, titulo: "Santa Ceia do Senhor", data: "2026-04-12T18:00:00", local: "Templo Principal" },
];

// 👇 Adicionámos o isAdmin às props
export default function WidgetAgendaIgreja({ eventos = cultosMock, isAdmin = false }: { eventos?: any[], isAdmin?: boolean }) {
    const [expandido, setExpandido] = useState(false);

    const eventosVisiveis = expandido ? eventos : eventos.slice(0, 2);

    const formatarDia = (dataISO: string) => new Date(dataISO).getDate().toString().padStart(2, '0');
    const formatarMes = (dataISO: string) => new Intl.DateTimeFormat('pt-PT', { month: 'short' }).format(new Date(dataISO)).replace('.', '').toUpperCase();
    const formatarHora = (dataISO: string) => new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(new Date(dataISO));
    const formatarDiaSemana = (dataISO: string) => new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(new Date(dataISO));

    return (
        <div className="bg-bg2 border border-soft rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col h-full transition-all duration-500">

            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center shrink-0">
                    <CalendarDays size={18} />
                </div>
                <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">
                        Agenda da Igreja
                    </h3>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                        Próximos Cultos e Eventos
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-4">
                {eventosVisiveis.map((evento, index) => (
                    // O 'group' aqui é importante para o efeito de hover do botão
                    <div
                        key={evento.id}
                        className={`flex gap-4 p-3 rounded-3xl transition-all group hover:bg-bg ${index !== eventosVisiveis.length - 1 ? 'border-b border-soft pb-5' : ''}`}
                    >
                        {/* BLOCO DA DATA */}
                        <div className="w-14 h-14 bg-soft/50 group-hover:bg-figueira group-hover:text-white rounded-2xl flex flex-col items-center justify-center shrink-0 transition-colors shadow-sm">
                            <span className="text-lg font-black leading-none">{formatarDia(evento.data)}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest mt-0.5">{formatarMes(evento.data)}</span>
                        </div>

                        {/* DETALHES DO EVENTO */}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <p className="text-[10px] text-figueira font-black uppercase tracking-widest mb-0.5 truncate capitalize">
                                {formatarDiaSemana(evento.data)}
                            </p>
                            <h4 className="text-sm font-black uppercase text-fg truncate tracking-tight">
                                {evento.titulo}
                            </h4>

                            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-muted uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Clock size={10} /> {formatarHora(evento.data)}</span>
                                <span className="w-1 h-1 bg-soft rounded-full"></span>
                                <span className="flex items-center gap-1 truncate"><MapPin size={10} /> {evento.local}</span>
                            </div>
                        </div>

                        {/* 👇 BOTÃO DE EDIÇÃO (Apenas para ADMINS) */}
                        {isAdmin && (
                            <div className="shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {/* Substitui o href pelo caminho real de edição da tua aplicação */}
                                <Link
                                    href={`/admin/eventos/${evento.id}`}
                                    className="p-2.5 bg-soft/50 text-muted hover:text-figueira hover:bg-figueira/10 rounded-xl transition-all"
                                    title="Editar Evento"
                                >
                                    <Edit3 size={16} />
                                </Link>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {eventos.length > 2 && (
                <button
                    onClick={() => setExpandido(!expandido)}
                    className="mt-6 w-full py-4 bg-bg border border-soft rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-fg hover:border-figueira transition-all flex items-center justify-center gap-2"
                >
                    {expandido ? 'Ocultar Agenda' : `Ver todos os ${eventos.length} eventos`}
                    <ChevronDown size={14} className={`transition-transform duration-300 ${expandido ? 'rotate-180' : ''}`} />
                </button>
            )}

        </div>
    )
}