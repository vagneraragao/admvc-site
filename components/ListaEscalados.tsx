"use client"
import { useState } from 'react'
import { ChevronDown, Clock, CheckCircle2, XCircle, HelpCircle, MessageCircle } from 'lucide-react'

// --- COMPONENTE DE STATUS (REVISADO COM TOOLTIP) ---
function StatusIcon({ confirmado }: { confirmado: boolean | null }) {
    // Classe base para os ícones e a tooltip
    const baseClass = "w-7 h-7 flex items-center justify-center rounded-lg border flex-shrink-0 relative group/tooltip cursor-help";

    // Classe base para o texto da Tooltip
    const tooltipTextClass = "absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-fg text-bg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none";

    // Classe base para a seta da Tooltip
    const tooltipArrowClass = "absolute -bottom-1 top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-fg rotate-45 opacity-0 group-hover/tooltip:opacity-100 transition-opacity z-10 pointer-events-none";

    // 1. CONFIRMADO (Verde)
    if (confirmado === true) {
        return (
            <div className={`${baseClass} bg-green-500/10 border-green-500/20 text-green-500`}>
                <CheckCircle2 size={14} />
                <span className={tooltipTextClass}>Confirmado</span>
                <span className={tooltipArrowClass}></span>
            </div>
        );
    }

    // 2. RECUSADO (Vermelho)
    if (confirmado === false) {
        return (
            <div className={`${baseClass} bg-red-500/10 border-red-500/20 text-red-500`}>
                <XCircle size={14} />
                <span className={tooltipTextClass}>Recusado</span>
                <span className={tooltipArrowClass}></span>
            </div>
        );
    }

    // 3. PENDENTE (Neutro/Cinza)
    return (
        <div className={`${baseClass} bg-soft border-soft/80 text-muted`}>
            <HelpCircle size={14} />
            <span className={tooltipTextClass}>Pendente</span>
            <span className={tooltipArrowClass}></span>
        </div>
    );
}

export default function ListaEscalados({ eventos }: any) {
    const [aberto, setAberto] = useState<number | null>(null);

    const toggleEvento = (id: number) => {
        setAberto(aberto === id ? null : id);
    };

    return (
        <div className="space-y-6 pt-12 animate-in fade-in duration-700">
            <header className="border-b border-soft pb-4">
                <span className="text-figueira font-black text-[9px] uppercase tracking-[0.4em]">Cronograma de Serviço</span>
                <h2 className="text-3xl font-black italic uppercase text-fg leading-none mt-1">Escalas de Voluntários</h2>
            </header>

            <div className="space-y-4">
                {eventos.map((evento: any) => {
                    const isAberto = aberto === evento.id;

                    const gruposPorDepto = evento.escalas.reduce((acc: any, escala: any) => {
                        const deptoNome = escala.departamento.nome;
                        if (!acc[deptoNome]) acc[deptoNome] = [];
                        acc[deptoNome].push(escala);
                        return acc;
                    }, {});

                    return (
                        <div key={evento.id} className={`group border transition-all duration-500 rounded-[2.5rem] overflow-hidden ${isAberto ? 'bg-bg border-figueira/30 shadow-2xl' : 'bg-bg2 border-soft hover:border-muted'}`}>

                            {/* TRIGGER DO EVENTO */}
                            <button
                                onClick={() => toggleEvento(evento.id)}
                                className="w-full flex items-center justify-between p-7 text-left outline-none"
                            >
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm ${isAberto ? 'bg-figueira text-white' : 'bg-bg text-muted border border-soft'}`}>
                                        <span className="text-xs font-black leading-none uppercase">
                                            {new Date(evento.data).toLocaleDateString('pt-BR', { day: '2-digit' })}
                                        </span>
                                        <span className="text-[9px] font-bold uppercase opacity-80">
                                            {new Date(evento.data).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className={`text-xl font-black uppercase italic leading-none transition-colors ${isAberto ? 'text-fg' : 'text-muted group-hover:text-fg'}`}>
                                            {evento.nome}
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-figueira/40" />
                                            {new Date(evento.data).toLocaleDateString('pt-BR', { weekday: 'long' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-5">
                                    <div className="hidden sm:flex flex-col items-end">
                                        <span className="text-[11px] font-black text-fg uppercase tracking-widest leading-none">{evento.escalas.length}</span>
                                        <span className="text-[8px] font-bold text-muted uppercase mt-1">Membros</span>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isAberto ? 'rotate-180 bg-figueira text-white' : 'bg-soft text-muted'}`}>
                                        <ChevronDown size={18} strokeWidth={3} />
                                    </div>
                                </div>
                            </button>

                            {/* CONTEÚDO REVELADO */}
                            <div className={`grid transition-all duration-500 ease-in-out ${isAberto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <div className="p-8 pt-0 border-t border-soft/50 space-y-8 mt-4">

                                        {Object.keys(gruposPorDepto).length > 0 ? (
                                            Object.entries(gruposPorDepto).map(([depto, escalasNoDepto]: [string, any]) => (
                                                <div key={depto} className="space-y-4">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-figueira bg-figueira/5 px-4 py-1.5 rounded-full border border-figueira/10">
                                                                {depto}
                                                            </h4>
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-soft/50 rounded-lg border border-soft">
                                                                <Clock size={10} className="text-muted" />
                                                                <span className="text-[10px] font-black text-fg uppercase italic tracking-widest">
                                                                    {escalasNoDepto[0]?.horario || '19:30'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-figueira/20 to-transparent" />
                                                    </div>

                                                    {/* GRID DE MEMBROS */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        {escalasNoDepto.map((escala: any) => {
                                                            const tel = escala.membro.phone_1?.replace(/\D/g, '') || '';
                                                            const msg = `Olá ${escala.membro.first_name}, confirmando sua escala de *${escala.funcao}* no evento *${evento.nome}* (${new Date(evento.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}). Confirma sua presença?`;
                                                            const linkWpp = `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`;

                                                            // Lógica para o WhatsApp Pulsante
                                                            const isPendente = escala.confirmado === null;
                                                            const whatsappClasses = isPendente
                                                                ? "p-2 rounded-lg transition-all animate-pulse bg-green-500 text-white shadow-lg shadow-green-500/30 hover:animate-none hover:scale-105 active:scale-95" // Pulsa e brilha no pendente
                                                                : "p-2 rounded-lg transition-all bg-green-500/10 text-green-600 hover:bg-green-600 hover:text-white border border-green-500/10"; // Botão normal no confirmado/recusado

                                                            return (
                                                                <div key={escala.id} className="flex items-center justify-between p-4 bg-bg border border-soft rounded-2xl hover:border-figueira/30 transition-all group/item">
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <div className="w-9 h-9 bg-soft border border-soft rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                                            {escala.membro.avatar_file ? (
                                                                                <img src={escala.membro.avatar_file} className="w-full h-full object-cover" alt="" />
                                                                            ) : (
                                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-figueira bg-figueira/5 uppercase">
                                                                                    {escala.membro.first_name[0]}{escala.membro.last_name[0]}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="truncate">
                                                                            <p className="text-[11px] font-black uppercase text-fg truncate group-hover/item:text-figueira transition-colors">
                                                                                {escala.membro.first_name} {escala.membro.last_name}
                                                                            </p>
                                                                            <p className="text-[9px] font-bold text-muted uppercase italic mt-0.5 tracking-wide">
                                                                                {escala.funcao}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-2">
                                                                        {/* ÍCONE DE STATUS COM TOOLTIP */}
                                                                        <StatusIcon confirmado={escala.confirmado} />

                                                                        {/* BOTÃO WHATSAPP (DINÂMICO) */}
                                                                        {escala.membro.phone_1 && (
                                                                            <a
                                                                                href={linkWpp}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className={whatsappClasses}
                                                                                title={isPendente ? "Cobrar confirmação via WhatsApp" : "Enviar lembrete via WhatsApp"}
                                                                            >
                                                                                <MessageCircle size={14} />
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center border-2 border-dashed border-soft rounded-[2rem]">
                                                <p className="text-[10px] font-bold uppercase text-muted tracking-[0.2em]">
                                                    Nenhum voluntário escalado para este dia.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}