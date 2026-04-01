// app/escalas/admin/page.tsx
import prisma from '@/lib/prisma'
import { CalendarDays, Settings2, Users } from 'lucide-react'
import MontadorEscalas from '@/components/escalas/MontadorEscalas'
import ListaEscalados from '@/components/escalas/ListaEscalados'
import CalendarioAgenda from '@/components/escalas/CalendarioAgenda'
import ModalNovoEvento from '@/components/escalas/ModalNovoEvento'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function EscalasPage() {
    const dataInicioMes = new Date()
    dataInicioMes.setDate(1)

    const [eventos, departamentos, membrosComFuncoes] = await Promise.all([
        prisma.evento.findMany({
            where: { data: { gte: dataInicioMes } },
            include: {
                mensagemEvento: {
                    include: {
                        pregador: {
                            select: { id: true, first_name: true, last_name: true, avatar_file: true }
                        }
                    }
                },
                escalas: {
                    include: {
                        membro: {
                            select: { id: true, first_name: true, last_name: true, avatar_file: true, phone_1: true }
                        },
                        departamento: true
                    },
                    orderBy: [{ departamento: { nome: 'asc' } }]
                }
            },
            orderBy: { data: 'asc' }
        }),
        prisma.departamento.findMany({ orderBy: { nome: 'asc' } }),
        prisma.membro.findMany({
            where: { status: 'ATIVO' },
            include: {
                ministerios: {
                    select: {
                        departamento_id: true,
                        funcoes: {
                            select: { funcao: { select: { nome: true } } }
                        }
                    }
                },
                departamentos_liderados: { select: { id: true } }
            },
            orderBy: { first_name: 'asc' }
        })
    ])

    const hoje = new Date(new Date().setHours(0, 0, 0, 0))
    const eventosFuturos = eventos.filter(e => new Date(e.data) >= hoje)

    // KPIs rápidos
    const totalVoluntarios = eventosFuturos.reduce((sum, ev) => sum + ev.escalas.length, 0)
    const totalEventos = eventosFuturos.length
    const pendentesConfirmacao = eventosFuturos.reduce(
        (sum, ev) => sum + ev.escalas.filter((e: any) => !e.confirmado && !e.motivo_recusa).length, 0
    )

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-700 pb-32">

            <Breadcrumb items={[
                { label: 'Dashboard', href: '/admin/dashboard', isBackIcon: true },
                { label: 'Escalas e Eventos' }
            ]} />

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <CalendarDays size={14} /> Gestao de Voluntarios
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Agenda de <span className="text-muted/30">Servico.</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                    <ModalNovoEvento />
                </div>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Proximos Eventos', value: totalEventos, cor: 'text-fg' },
                    { label: 'Voluntarios Escalados', value: totalVoluntarios, cor: 'text-blue-600' },
                    { label: 'Pendentes Confirmacao', value: pendentesConfirmacao, cor: pendentesConfirmacao > 0 ? 'text-orange-600' : 'text-emerald-600' },
                ].map(k => (
                    <div key={k.label} className="bg-bg2 border border-soft rounded-2xl px-5 py-4">
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted">{k.label}</p>
                        <p className={`text-2xl font-black italic ${k.cor}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* CALENDÁRIO */}
            <section className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-soft">
                    <CalendarDays size={16} className="text-figueira" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Visao Calendario</h2>
                </div>
                <div className="p-6">
                    <CalendarioAgenda eventos={eventos} />
                </div>
            </section>

            {/* LAYOUT LADO A LADO */}
            <section className="grid lg:grid-cols-12 gap-6 items-start">

                {/* MONTADOR — STICKY */}
                <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 z-10">
                    <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-soft">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                <Settings2 size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-black uppercase tracking-widest text-fg leading-none">Atribuir Escala</h2>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                                    Adicionar voluntario
                                </p>
                            </div>
                        </div>
                        <div className="p-6">
                            <MontadorEscalas
                                eventos={eventosFuturos}
                                departamentos={departamentos}
                                membros={membrosComFuncoes}
                            />
                        </div>
                    </div>
                </aside>

                {/* LISTA DE ESCALADOS */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                    <div className="flex items-center gap-3 px-1">
                        <Users size={15} className="text-emerald-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-fg">Quadro Geral de Escalas</h2>
                        {totalEventos > 0 && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-soft border border-soft px-2 py-1 rounded-lg text-muted">
                                {totalEventos} evento{totalEventos !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <ListaEscalados
                            eventos={eventosFuturos}
                            isAdmin={true}
                            membros={membrosComFuncoes}
                        />
                    </div>
                </div>
            </section>
        </main>
    )
}