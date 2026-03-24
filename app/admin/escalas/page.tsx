import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, CalendarDays, PlusCircle, Settings2, CalendarPlus } from 'lucide-react'
import GerenciadorEventos from '@/components/GerenciadorEventos'
import MontadorEscalas from '@/components/MontadorEscalas'
import ListaEscalados from '@/components/ListaEscalados'
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
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700">

            {/* BREADCRUMBS */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/admin/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Dashboard Admin
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Escalas e Eventos</span>
            </nav>

            {/* HEADER COM AS SUAS SUGESTÕES APLICADAS */}
            {/* HEADER COM BOTÃO ÚNICO DE CRIAÇÃO */}
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <CalendarDays size={14} /> Gestão de Voluntários
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Agenda de <span className="text-muted/20">Serviço.</span>
                    </h1>
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                    {/* UM ÚNICO BOTÃO PARA DOMINAR A AGENDA */}
                    <ModalNovoEvento />
                </div>
            </header>

            {/* LAYOUT PRINCIPAL REFORMULADO (ESPAÇOSO E PROFISSIONAL) */}
            <div className="space-y-10 pt-4">

                {/* O NOVO CALENDÁRIO COM DUAS COLUNAS INTERNAS */}
                <section className="w-full">
                    <CalendarioAgenda eventos={eventos} />
                </section>

                {/* SUGESTÃO 3: MONTADOR DE ESCALAS (AGORA COM COLUNA INDIVIDUAL E LARGA) */}
                <section className="w-full">
                    <div className="bg-bg2 border border-soft rounded-[3rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8 border-b border-soft pb-4">
                            <Settings2 size={24} className="text-figueira" />
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Atribuir Escala</h2>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                    Selecione o evento e aloque os voluntários nas respetivas funções
                                </p>
                            </div>
                        </div>
                        <MontadorEscalas
                            eventos={eventosFuturos}
                            departamentos={departamentos}
                            membros={membrosComFuncoes}
                        />
                    </div>
                </section>

                {/* SUGESTÃO 3: LISTA DOS ESCALADOS (AGORA COM COLUNA INDIVIDUAL E LARGA) */}
                <section className="w-full">
                    <div className="bg-bg2 border border-soft rounded-[3rem] p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8 border-b border-soft pb-4">
                            <PlusCircle size={24} className="text-figueira" />
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Visão Geral das Equipas</h2>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                                    Consulte quem está escalado para os próximos eventos e acompanhe as confirmações
                                </p>
                            </div>
                        </div>
                        <ListaEscalados eventos={eventosFuturos} />
                    </div>
                </section>

            </div>
        </main>
    );
}