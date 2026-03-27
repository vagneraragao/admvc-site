"use client";

import { useState } from "react";
import { CalendarDays, Users, ChevronDown, X, MapPin, Clock, Info } from "lucide-react";

export default function WidgetAgendaUnificada({ eventosIgreja = [], gruposMembro = [], isAdmin }: any) {
    // ESTADOS
    const [expandido, setExpandido] = useState(false);
    const [eventoSelecionado, setEventoSelecionado] = useState<any | null>(null); // Controla o Popup

    // 1. UNIR E PADRONIZAR EVENTOS (Agora puxando mais dados para o popup)
    const todosEventos = [
        ...eventosIgreja.map((evento: any) => ({
            id: `igreja-${evento.id}`,
            titulo: evento.nome,
            data: new Date(evento.data),
            tipo: 'IGREJA',
            // Adicione os campos reais do seu Prisma aqui:
            descricao: evento.descricao || 'Sem informações adicionais registadas para este evento.',
            local: evento.local || 'Instalações da Igreja',
        })),
        ...gruposMembro.map((grupo: any) => ({
            id: `grupo-${grupo.id}`,
            titulo: `Reunião: ${grupo.nome}`,
            data: grupo.createdAt ? new Date(grupo.createdAt) : new Date(), 
            tipo: 'GRUPO',
            // Adicione os campos reais do seu Prisma aqui:
            descricao: grupo.descricao || 'Reunião regular do seu grupo/pg.',
            local: grupo.local || 'Casa do Líder ou Local Habitual',
        }))
    ];

    // 2. ORDENAR POR DATA
    todosEventos.sort((a, b) => a.data.getTime() - b.data.getTime());

    // 3. LIMITAR E PAGINAR
    const eventosLimitados = todosEventos.slice(0, 8);
    const eventosParaMostrar = expandido ? eventosLimitados : eventosLimitados.slice(0, 3);

    return (
        <>
            <div className="bg-bg2 border border-soft p-6 lg:p-8 rounded-[2.5rem] shadow-sm flex flex-col h-full animate-in fade-in duration-500 relative">
                {/* CABEÇALHO DO WIDGET */}
                <div className="flex items-center gap-4 mb-6">
                    <CalendarDays size={20} className="text-figueira" />
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg">Agenda</h2>
                    <div className="h-[1px] flex-1 bg-soft"></div>
                </div>

                {/* LISTA DE EVENTOS */}
                <div className="flex flex-col gap-4 flex-1">
                    {eventosParaMostrar.map((item) => (
                        <div 
                            key={item.id}
                            onClick={() => setEventoSelecionado(item)} // ABRE O POPUP
                            className="flex items-center gap-4 p-4 rounded-2xl border border-soft bg-bg hover:border-figueira/50 hover:shadow-md cursor-pointer transition-all active:scale-[0.98] group"
                        >
                            {/* ÍCONE COM AS CORES */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                item.tipo === 'IGREJA' 
                                    ? 'bg-figueira/10 text-figueira group-hover:bg-figueira group-hover:text-white' 
                                    : 'bg-fg/5 text-fg group-hover:bg-fg group-hover:text-bg'
                            }`}>
                                {item.tipo === 'IGREJA' ? <CalendarDays size={18} /> : <Users size={18} />}
                            </div>

                            {/* INFO DO EVENTO */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-fg uppercase italic tracking-tight truncate group-hover:text-figueira transition-colors">
                                    {item.titulo}
                                </p>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-0.5">
                                    {item.data.toLocaleDateString('pt-PT', { 
                                        day: '2-digit', month: 'short'
                                    })} às {item.data.toLocaleTimeString('pt-PT', { 
                                        hour: '2-digit', minute:'2-digit' 
                                    })}
                                </p>
                            </div>
                            
                            {/* TAG CONDICIONAL */}
                            <div className="shrink-0 hidden sm:block">
                                <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border ${
                                    item.tipo === 'IGREJA' 
                                        ? 'text-figueira bg-figueira/5 border-figueira/20' 
                                        : 'text-muted bg-soft border-soft/50'
                                }`}>
                                    {item.tipo === 'IGREJA' ? 'Igreja' : 'Grupo'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {todosEventos.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-soft rounded-[2rem] bg-bg/50">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">
                                Nenhum evento programado.
                            </p>
                        </div>
                    )}
                </div>

                {/* BOTÃO EXPANDIR / COLAPSAR */}
                {eventosLimitados.length > 3 && (
                    <button
                        onClick={() => setExpandido(!expandido)}
                        className="mt-6 flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-soft text-[10px] font-black text-muted uppercase tracking-widest hover:bg-soft hover:text-fg transition-all active:scale-95 group"
                    >
                        {expandido ? 'Ver Menos' : `Ver Mais (${eventosLimitados.length - 3})`}
                        <ChevronDown size={14} className={`transition-transform text-muted group-hover:text-fg ${expandido ? 'rotate-180' : ''}`} />
                    </button>
                )}
            </div>

            {/* POPUP / MODAL DE DETALHES DO EVENTO */}
            {eventoSelecionado && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Clique fora do popup para fechar */}
                    <div className="absolute inset-0" onClick={() => setEventoSelecionado(null)}></div>
                    
                    {/* Conteúdo do Popup */}
                    <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200">
                        {/* Botão de Fechar */}
                        <button 
                            onClick={() => setEventoSelecionado(null)}
                            className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-soft text-muted hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-95"
                        >
                            <X size={16} strokeWidth={3} />
                        </button>

                        <div className="space-y-6 mt-2">
                            {/* Cabeçalho do Popup */}
                            <div className="flex items-center gap-4 border-b border-soft pb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                    eventoSelecionado.tipo === 'IGREJA' 
                                        ? 'bg-figueira/10 text-figueira' 
                                        : 'bg-fg text-bg'
                                }`}>
                                    {eventoSelecionado.tipo === 'IGREJA' ? <CalendarDays size={24} /> : <Users size={24} />}
                                </div>
                                <div className="pr-8">
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border inline-block mb-2 ${
                                        eventoSelecionado.tipo === 'IGREJA' ? 'text-figueira bg-figueira/5 border-figueira/20' : 'text-muted bg-soft border-soft/50'
                                    }`}>
                                        {eventoSelecionado.tipo === 'IGREJA' ? 'Evento da Igreja' : 'Reunião de Grupo'}
                                    </span>
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-tight">
                                        {eventoSelecionado.titulo}
                                    </h3>
                                </div>
                            </div>

                            {/* Informações Detalhadas */}
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <Clock size={16} className="text-muted shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Data e Hora</p>
                                        <p className="text-sm font-bold text-fg mt-0.5">
                                            {eventoSelecionado.data.toLocaleDateString('pt-PT', { 
                                                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                                            })} <br/>
                                            <span className="text-figueira">
                                                às {eventoSelecionado.data.toLocaleTimeString('pt-PT', { hour: '2-digit', minute:'2-digit' })}
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <MapPin size={16} className="text-muted shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Localização</p>
                                        <p className="text-sm font-bold text-fg mt-0.5">{eventoSelecionado.local}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 bg-bg border border-soft p-4 rounded-2xl mt-4">
                                    <Info size={16} className="text-figueira shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted">Detalhes</p>
                                        <p className="text-xs font-medium text-fg mt-1 leading-relaxed">
                                            {eventoSelecionado.descricao}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Botão de Ação Opcional */}
                            <button 
                                onClick={() => setEventoSelecionado(null)}
                                className="w-full py-4 mt-2 bg-fg text-bg rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira transition-all active:scale-95 shadow-sm"
                            >
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}