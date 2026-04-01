// app/admin/dashboard/page.tsx

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { logoutAdmin } from '@/actions/auth-actions'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import {
    Calendar, Users, Home, BarChart3, LogOut, Shield,
    ShieldCheck, HeartHandshake, AlertTriangle,
    CreditCard, ArrowUpRight, Settings, BookOpen,
    TrendingUp, Clock, CheckCircle2, XCircle
} from 'lucide-react'
import BotaoModalDocumentos from '@/components/admin/BotaoModalDocumentos'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const adminLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        select: { first_name: true, last_name: true }
    })

    const statusAtivo = { in: ['Ativo', 'ATIVO'] }
    const statusPendente = { in: ['Pendente', 'PENDENTE'] }

    const [
        totalMembros,
        pendentesCount,
        batizados,
        totalFamilias,
        proximasEscalas,
        todosMembros,
        membrosPendentesDocs,
        totalDepartamentos,
        escalasPendentesConfirmacao,
    ] = await Promise.all([
        prisma.membro.count({ where: { status: statusAtivo } }),
        prisma.membro.count({ where: { status: statusPendente } }),
        prisma.membro.count({ where: { baptism_status: 'Batizado', status: statusAtivo } }),
        prisma.familia.count(),
        prisma.evento.findMany({
            where: { data: { gte: new Date() } },
            orderBy: { data: 'asc' },
            take: 6,
            include: {
                _count: { select: { escalas: true } },
                mensagemEvento: {
                    select: { titulo: true, pregador: { select: { first_name: true, last_name: true } } }
                }
            }
        }),
        prisma.membro.findMany({
            where: { status: statusAtivo },
            select: { first_name: true, last_name: true, birthdate: true }
        }),
        prisma.membro.findMany({
            where: {
                OR: [
                    { gdpr_aceite: false },
                    { permanecer_aceite: false },
                    { gdpr_validade: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
                    { permanecer_validade: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }
                ]
            },
            select: {
                id: true, first_name: true, last_name: true, avatar_file: true,
                phone_1: true, gdpr_aceite: true, gdpr_validade: true,
                permanecer_aceite: true, permanecer_validade: true
            },
            orderBy: { first_name: 'asc' }
        }),
        prisma.departamento.count(),
        prisma.escala.count({
            where: { confirmado: false, evento: { data: { gte: new Date() } } }
        }),
    ])

    const mesAtual = new Date().getMonth() + 1
    const aniversariantesDoMes = todosMembros
        .filter(m => m.birthdate && new Date(m.birthdate).getMonth() + 1 === mesAtual)
        .sort((a, b) => new Date(a.birthdate!).getDate() - new Date(b.birthdate!).getDate())
        .slice(0, 6)

    const taxaBatismo = totalMembros > 0 ? Math.round((batizados / totalMembros) * 100) : 0

    const hora = new Date().getHours()
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-700 pb-32">

            <Breadcrumb items={[
                { label: 'Dashboard Global', href: '/membros/dashboard', isBackIcon: true },
                { label: 'Administração', hideOnMobile: true },
                { label: 'Painel Admin' }
            ]} />

            {/* ── HEADER ───────────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Centro de Comando
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        {saudacao}, <span className="text-muted/20">{adminLogado?.first_name || 'Admin'}.</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <form action={logoutAdmin}>
                        <button
                            type="submit"
                            className="h-10 w-10 flex items-center justify-center bg-red-50 border border-red-100 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                            title="Terminar sessão"
                        >
                            <LogOut size={15} strokeWidth={3} />
                        </button>
                    </form>
                </div>
            </header>

            {/* ── NAVEGAÇÃO RÁPIDA ─────────────────────────────────────────── */}
            <nav className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                    { title: 'Eventos', href: '/escalas/admin', icon: <Calendar size={16} /> },
                    { title: 'Membros', href: '/admin/membros', icon: <Users size={16} /> },
                    { title: 'Famílias', href: '/admin/familias', icon: <Home size={16} /> },
                    { title: 'Departamentos', href: '/admin/configuracoes', icon: <HeartHandshake size={16} /> },
                    { title: 'Relatórios', href: '/admin/relatorios', icon: <BarChart3 size={16} /> },
                    { title: 'Loyverse', href: '/admin/relatorios/loyverse/diagnostico', icon: <CreditCard size={16} /> },
                ].map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-2 p-4 bg-bg2 border border-soft rounded-2xl hover:bg-fg hover:text-bg hover:border-fg transition-all group shadow-sm"
                    >
                        <div className="text-muted group-hover:text-bg transition-colors">{item.icon}</div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-center leading-tight">{item.title}</span>
                    </Link>
                ))}
            </nav>

            {/* ── ALERTA COMPLIANCE ────────────────────────────────────────── */}
            {membrosPendentesDocs.length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-2xl" />
                    <div className="flex items-center gap-4 pl-3">
                        <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center shrink-0">
                            <AlertTriangle size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-black uppercase tracking-tight text-orange-700 leading-none">
                                Compliance — Atenção
                            </p>
                            <p className="text-[9px] font-bold text-orange-600/80 uppercase tracking-widest mt-1">
                                {membrosPendentesDocs.length} membro{membrosPendentesDocs.length !== 1 ? 's' : ''} com documentos pendentes ou a expirar
                            </p>
                        </div>
                    </div>
                    <BotaoModalDocumentos membrosPendentes={membrosPendentesDocs} />
                </div>
            )}

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <KpiCard label="Membros Activos" value={totalMembros} icon={<Users size={14} />} />
                <KpiCard label="Famílias" value={totalFamilias} icon={<Home size={14} />} />
                <KpiCard label="Batizados" value={`${batizados} (${taxaBatismo}%)`} icon={<CheckCircle2 size={14} />} cor="emerald" />
                <KpiCard label="Escalas Pendentes" value={escalasPendentesConfirmacao} icon={<Clock size={14} />} cor={escalasPendentesConfirmacao > 0 ? 'orange' : 'emerald'} />
                <KpiCard label="Pendentes Aprovação" value={pendentesCount} icon={<AlertTriangle size={14} />} cor={pendentesCount > 0 ? 'red' : 'emerald'} />
            </section>

            {/* ── GRID PRINCIPAL ───────────────────────────────────────────── */}
            <div className="grid lg:grid-cols-12 gap-6">

                {/* PRÓXIMOS EVENTOS — col 7 */}
                <section className="lg:col-span-7 bg-bg2 border border-soft rounded-[2rem] overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-soft">
                        <div className="flex items-center gap-3">
                            <Calendar size={16} className="text-figueira" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-fg">Próximos Eventos</h2>
                        </div>
                        <Link
                            href="/escalas/admin"
                            className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors flex items-center gap-1"
                        >
                            Ver todos <ArrowUpRight size={12} />
                        </Link>
                    </div>

                    <div className="divide-y divide-soft">
                        {proximasEscalas.length === 0 ? (
                            <div className="py-12 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted italic">
                                    Nenhum evento programado
                                </p>
                            </div>
                        ) : proximasEscalas.map((ev, i) => {
                            const dataEv = new Date(ev.data)
                            const isHoje = dataEv.toDateString() === new Date().toDateString()
                            const diasFaltam = Math.ceil((dataEv.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

                            return (
                                <Link
                                    key={ev.id}
                                    href="/escalas/admin"
                                    className="flex items-center gap-4 px-6 py-4 hover:bg-soft/20 transition-all group"
                                >
                                    {/* DATA */}
                                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black transition-all
                                        ${isHoje ? 'bg-figueira text-white' : 'bg-bg border border-soft text-fg group-hover:border-figueira/30'}`}>
                                        <span className="text-[8px] uppercase tracking-widest opacity-70">
                                            {format(dataEv, 'MMM', { locale: pt })}
                                        </span>
                                        <span className="text-lg italic leading-none">
                                            {format(dataEv, 'dd')}
                                        </span>
                                    </div>

                                    {/* INFO */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black uppercase text-fg truncate leading-none group-hover:text-figueira transition-colors">
                                            {ev.nome}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="text-[8px] font-bold text-muted uppercase tracking-widest">
                                                {format(dataEv, "EEEE 'às' HH:mm", { locale: pt })}
                                            </span>
                                            {ev.mensagemEvento?.titulo && (
                                                <span className="text-[7px] font-black uppercase tracking-widest bg-figueira/10 text-figueira border border-figueira/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <BookOpen size={8} /> {ev.mensagemEvento.titulo}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* BADGES */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {isHoje && (
                                            <span className="text-[7px] font-black uppercase tracking-widest bg-figueira text-white px-2 py-1 rounded-lg">
                                                Hoje
                                            </span>
                                        )}
                                        {!isHoje && diasFaltam <= 7 && (
                                            <span className="text-[7px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-1 rounded-lg">
                                                {diasFaltam}d
                                            </span>
                                        )}
                                        <span className="text-[8px] font-black bg-bg border border-soft px-2.5 py-1 rounded-lg text-muted">
                                            {ev._count.escalas} vol.
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>

                {/* COLUNA DIREITA — col 5 */}
                <div className="lg:col-span-5 space-y-6">

                    {/* ANIVERSARIANTES */}
                    <section className="bg-bg2 border border-soft rounded-[2rem] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-soft">
                            <div className="flex items-center gap-3">
                                <span className="text-base">🎂</span>
                                <h3 className="text-sm font-black uppercase tracking-widest text-fg">
                                    Aniversariantes
                                </h3>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest bg-figueira/10 text-figueira border border-figueira/20 px-2.5 py-1 rounded-lg">
                                {format(new Date(), 'MMMM', { locale: pt })}
                            </span>
                        </div>

                        <div className="divide-y divide-soft">
                            {aniversariantesDoMes.length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted italic">
                                        Nenhum aniversariante este mês
                                    </p>
                                </div>
                            ) : aniversariantesDoMes.map((m, i) => {
                                const dia = new Date(m.birthdate!).getDate()
                                const isHoje = dia === new Date().getDate()
                                return (
                                    <div key={i} className={`flex items-center justify-between px-6 py-3 transition-all ${isHoje ? 'bg-figueira/5' : 'hover:bg-soft/20'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[9px] font-black
                                                ${isHoje ? 'bg-figueira text-white' : 'bg-bg border border-soft text-muted'}`}>
                                                {m.first_name[0]}
                                            </div>
                                            <p className={`text-[11px] font-black uppercase leading-none ${isHoje ? 'text-figueira' : 'text-fg'}`}>
                                                {m.first_name} {m.last_name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isHoje && <span className="text-sm">🎉</span>}
                                            <span className="text-[8px] font-black uppercase tracking-widest bg-bg border border-soft px-2.5 py-1 rounded-lg text-muted">
                                                Dia {dia}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>

                    {/* ACESSO RÁPIDO */}
                    <section className="bg-bg2 border border-soft rounded-[2rem] overflow-hidden">
                        <div className="px-6 py-5 border-b border-soft">
                            <h3 className="text-sm font-black uppercase tracking-widest text-fg flex items-center gap-3">
                                <Settings size={16} className="text-muted" /> Acesso Rápido
                            </h3>
                        </div>
                        <div className="p-3 space-y-1">
                            {[
                                { label: 'Importar Membros', href: '/admin/membros/importar', icon: <Users size={13} /> },
                                { label: 'Relatório Escalas', href: '/escalas/relatorios', icon: <BarChart3 size={13} /> },
                                { label: 'Diagnóstico Loyverse', href: '/admin/relatorios/loyverse/diagnostico', icon: <CreditCard size={13} /> },
                                { label: 'Configurações', href: '/admin/configuracoes', icon: <Settings size={13} /> },
                                { label: 'Auditoria', href: '/admin/auditoria', icon: <Shield size={16} /> },
                            ].map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-soft/50 transition-all group text-muted hover:text-fg"
                                >
                                    <div className="group-hover:text-figueira transition-colors">{item.icon}</div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest flex-1">{item.label}</span>
                                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-figueira" />
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    )
}

// ── COMPONENTES AUXILIARES ────────────────────────────────────────────────────

function KpiCard({ label, value, icon, cor }: {
    label: string
    value: any
    icon: React.ReactNode
    cor?: 'emerald' | 'orange' | 'red'
}) {
    const cores: Record<string, string> = {
        emerald: 'text-emerald-600 bg-emerald-500/8 border-emerald-500/15',
        orange: 'text-orange-600 bg-orange-500/8 border-orange-500/15',
        red: 'text-red-500 bg-red-500/8 border-red-500/15',
    }
    return (
        <div className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all hover:-translate-y-0.5
            ${cor ? cores[cor] : 'bg-bg2 border-soft text-fg'}`}>
            <div className="flex items-center justify-between">
                <p className={`text-[8px] font-black uppercase tracking-widest opacity-70`}>{label}</p>
                <div className="opacity-50">{icon}</div>
            </div>
            <p className="text-2xl font-black italic tracking-tighter leading-none">{value}</p>
        </div>
    )
}