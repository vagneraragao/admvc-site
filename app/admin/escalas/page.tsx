import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, CalendarDays, PlusCircle, Settings2, Users, ChevronDown } from 'lucide-react'
import GerenciadorEventos from '@/components/GerenciadorEventos'
import MontadorEscalas from '@/components/MontadorEscalas'
import ListaEscalados from '@/components/escalas/ListaEscalados'
import CalendarioAgenda from '@/components/escalas/CalendarioAgenda'
import ModalGerarEventosLote from '@/components/escalas/ModalGerarEventosLote'
import ModalNovoEvento from '@/components/escalas/ModalNovoEvento'

export const dynamic = 'force-dynamic'

export default async function EscalasPage() {
    const dataInicioMes = new Date();
    dataInicioMes.setDate(1);

    const eventos = await prisma.evento.findMany({
        where: { data: { gte: dataInicioMes } },
        include: {
            escalas: {
                include: {
                    membro: { select: { id: true, first_name: true, last_name: true, avatar_file: true, phone_1: true } },
                    departamento: true
                },
                orderBy: [{ departamento: { nome: 'asc' } }]
            }
        },
        orderBy: { data: 'asc' }
    });

    const departamentos = await prisma.departamento.findMany({ orderBy: { nome: 'asc' } });

    const membrosComFuncoes = await prisma.membro.findMany({
        where: { status: 'ATIVO' },
        include: {
            ministerios: { select: { departamento_id: true, funcao: true } }
        },
        orderBy: { first_name: "asc" }
    });

    const eventosFuturos = eventos.filter(e => new Date(e.data) >= new Date(new Date().setHours(0, 0, 0, 0)));

    return (
        <main className="max-w-6xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            {/* --- BREADCRUMBS --- */}
            <nav className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/admin/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Dashboard Admin
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Escalas e Eventos</span>
            </nav>

            {/* --- CABEÇALHO --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <CalendarDays size={14} /> Gestão de Voluntários
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Agenda de <span className="text-muted/30">Serviço.</span>
                    </h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest pt-2">
                        Organize eventos, serviços e a disponibilidade da equipa.
                    </p>
                </div>

                <div className="shrink-0 w-full md:w-auto relative z-50">
                    <ModalNovoEvento />
                </div>
            </header>

            {/* --- NAVEGAÇÃO INTERNA FIXA (STICKY SUB-NAV) --- */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-y border-soft py-4 flex gap-8 overflow-x-auto custom-scrollbar shadow-sm">
                <a href="#calendario" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors flex items-center gap-2 whitespace-nowrap">
                    <CalendarDays size={14} /> Visão Calendário
                </a>
                <a href="#montador" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-blue-500 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Settings2 size={14} /> Montador de Escalas
                </a>
                <a href="#visao-geral" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-emerald-500 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Users size={14} /> Equipas Escaladas
                </a>
            </nav>

            <div className="space-y-10">

                {/* --- 01. CALENDÁRIO (SEMPRE ABERTO COMO PEDISTE) --- */}
                <section id="calendario" className="w-full scroll-mt-24">
                    <CalendarioAgenda eventos={eventos} />
                </section>

                {/* --- 02. MONTADOR DE ESCALAS (CARD CONTRAÍVEL) --- */}
                <section id="montador" className="scroll-mt-24 w-full">
                    <details className="group bg-bg2 border border-soft rounded-[3.5rem] shadow-sm overflow-hidden transition-all duration-300">

                        <summary className="list-none cursor-pointer p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 [&::-webkit-details-marker]:hidden hover:bg-soft/20 transition-colors outline-none">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-bg border border-soft flex items-center justify-center shrink-0 shadow-sm transition-transform group-open:scale-110">
                                    <Settings2 size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                        Atribuir Escala
                                    </h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">
                                        Selecione o evento e aloque os voluntários nas respetivas funções.
                                    </p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-bg border border-soft flex items-center justify-center text-muted group-open:bg-blue-600 group-open:text-white group-open:border-blue-600 transition-all shadow-sm shrink-0">
                                <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300" />
                            </div>
                        </summary>

                        {/* CONTEÚDO EXPANDIDO */}
                        <div className="px-8 md:px-10 pb-10 border-t border-soft/50 pt-8 animate-in slide-in-from-top-4 fade-in duration-300">
                            <MontadorEscalas
                                eventos={eventosFuturos}
                                departamentos={departamentos}
                                membros={membrosComFuncoes}
                            />
                        </div>
                    </details>
                </section>

                {/* --- 03. VISÃO GERAL DAS EQUIPAS (CARD CONTRAÍVEL) --- */}
                <section id="visao-geral" className="scroll-mt-24 w-full">
                    <details className="group bg-bg2 border border-soft rounded-[3.5rem] shadow-sm overflow-hidden transition-all duration-300">

                        <summary className="list-none cursor-pointer p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 [&::-webkit-details-marker]:hidden hover:bg-soft/20 transition-colors outline-none">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-bg border border-soft flex items-center justify-center shrink-0 shadow-sm transition-transform group-open:scale-110">
                                    <Users size={20} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                        Visão Geral das Equipas
                                    </h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">
                                        Consulte quem está escalado para os próximos eventos e confirmações.
                                    </p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-bg border border-soft flex items-center justify-center text-muted group-open:bg-emerald-500 group-open:text-white group-open:border-emerald-500 transition-all shadow-sm shrink-0">
                                <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300" />
                            </div>
                        </summary>

                        {/* CONTEÚDO EXPANDIDO */}
                        <div className="px-8 md:px-10 pb-10 border-t border-soft/50 pt-8 animate-in slide-in-from-top-4 fade-in duration-300">
                            <ListaEscalados eventos={eventosFuturos} />
                        </div>
                    </details>
                </section>

            </div>
        </main>
    );
}