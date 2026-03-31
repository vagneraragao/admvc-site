import prisma from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, CalendarDays, PlusCircle, Settings2, Users } from 'lucide-react'
//import GerenciadorEventos from '@/components/GerenciadorEventos'
import MontadorEscalas from '@/components/escalas/MontadorEscalas'
import ListaEscalados from '@/components/escalas/ListaEscalados'
import CalendarioAgenda from '@/components/escalas/CalendarioAgenda'
//import ModalGerarEventosLote from '@/components/escalas/ModalGerarEventosLote'
import ModalNovoEvento from '@/components/escalas/ModalNovoEvento'
//import ModalEditarEscala from '@/components/admin/ModalEditarEscala'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function EscalasPage() {
    const dataInicioMes = new Date();
    dataInicioMes.setDate(1);

    const eventos = await prisma.evento.findMany({
        where: { data: { gte: dataInicioMes } },
        include: {
            mensagemEvento: {                    // ← ADICIONA
                include: {
                    pregador: {
                        select: { id: true, first_name: true, last_name: true, avatar_file: true }
                    }
                }
            },
            escalas: {
                include: {
                    membro: { select: { id: true, first_name: true, last_name: true, avatar_file: true, phone_1: true } },
                    departamento: true
                },
                orderBy: [{ departamento: { nome: 'asc' } }]
            }
        },
        orderBy: { data: 'asc' }
    })

    const departamentos = await prisma.departamento.findMany({ orderBy: { nome: 'asc' } });

    const membrosComFuncoes = await prisma.membro.findMany({
        where: { status: 'ATIVO' },
        include: {
            ministerios: {
                select: {
                    departamento_id: true,
                    funcoes: {
                        select: {
                            funcao: {
                                select: {
                                    nome: true
                                }
                            }
                        }
                    }
                }
            },
            departamentos_liderados: { select: { id: true } } // Garantimos que traz as lideranças também
        },
        orderBy: { first_name: "asc" }
    });

    const eventosFuturos = eventos.filter(e => new Date(e.data) >= new Date(new Date().setHours(0, 0, 0, 0)));

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            {/* BREADCRUMB PADRONIZADO E INTELIGENTE */}
            <Breadcrumb items={[
                {
                    label: "Dashboard",
                    href: "/admin/dashboard",
                    isBackIcon: true
                },
                {
                    label: "Escalas e Eventos"
                }
            ]} />




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
                <a href="#atribuicoes" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-blue-500 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Settings2 size={14} /> Gestão de Escalas
                </a>
            </nav>

            <div className="space-y-12">

                {/* --- 01. CALENDÁRIO (SEMPRE ABERTO) --- */}
                <section id="calendario" className="w-full scroll-mt-24">
                    <CalendarioAgenda eventos={eventos} />
                </section>

                {/* ========================================================= */}
                {/* 02. NOVO LAYOUT UNIFICADO: LADO A LADO                    */}
                {/* ========================================================= */}
                <section id="atribuicoes" className="grid lg:grid-cols-12 gap-8 items-start pt-4 scroll-mt-24">

                    {/* COLUNA ESQUERDA: MONTADOR DE ESCALAS (Fixo no scroll) */}
                    {/* Alterei o top-24 para compensar a barra de navegação sticky que adicionaste */}
                    <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 z-10 space-y-6">
                        <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                            {/* Linha de destaque no topo do card */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>

                            <div className="flex items-center gap-4 border-b border-soft pb-6 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                    <Settings2 size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">Atribuir Escala</h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">
                                        Adicionar voluntário
                                    </p>
                                </div>
                            </div>

                            <MontadorEscalas
                                eventos={eventosFuturos}
                                departamentos={departamentos}
                                membros={membrosComFuncoes}
                            />
                        </div>
                    </aside>

                    {/* COLUNA DIREITA: VISÃO GERAL (Lista de Eventos Colapsáveis) */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-6">

                        {/* Cabeçalho subtil da lista */}
                        <div className="flex items-center gap-3 px-2">
                            <Users size={16} className="text-emerald-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-fg">Quadro Geral de Escalas</h2>
                        </div>

                        {/* Chamamos a Lista passando isAdmin e os membros */}
                        <div className="animate-in slide-in-from-bottom-4 duration-500">
                            <ListaEscalados
                                eventos={eventosFuturos}
                                isAdmin={true}
                                membros={membrosComFuncoes}
                            />
                        </div>

                    </div>
                </section>

            </div>
        </main>
    );
}