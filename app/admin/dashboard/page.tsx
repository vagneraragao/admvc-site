// app/admin/dashboard/page.tsx

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { logoutAdmin } from '@/actions/auth-actions'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import {
    Calendar, Users, Home, BarChart3, ChevronRight, LogOut, ArrowLeft,
    ShieldCheck, HeartHandshake, AlertTriangle, Menu, CreditCard, ArrowUpRight
} from 'lucide-react'
import BotaoModalDocumentos from '@/components/admin/BotaoModalDocumentos'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    // 0. BUSCA DO ADMIN LOGADO
    const session = await getSessionData();
    if (!session) redirect('/membros/login');

    const adminLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        select: { first_name: true, last_name: true }
    });

    // 1. ESTATÍSTICAS BÁSICAS
    const statusAtivo = { in: ['Ativo', 'ATIVO'] };
    const statusPendente = { in: ['Pendente', 'PENDENTE'] };

    const totalMembros = await prisma.membro.count({ where: { status: statusAtivo } })
    const pendentesCount = await prisma.membro.count({ where: { status: statusPendente } })
    const batizados = await prisma.membro.count({ where: { baptism_status: 'Batizado', status: statusAtivo } })
    const totalFamilias = await prisma.familia.count();

    // 2. PRÓXIMAS ESCALAS (Eventos futuros)
    const proximasEscalas = await prisma.evento.findMany({
        where: { data: { gte: new Date() } },
        orderBy: { data: 'asc' },
        take: 5,
        include: { _count: { select: { escalas: true } } }
    });

    // 3. ANIVERSARIANTES
    const mesAtual = new Date().getMonth() + 1;
    const todosMembros = await prisma.membro.findMany({
        where: { status: statusAtivo },
        select: { first_name: true, last_name: true, birthdate: true }
    });

    const aniversariantesDoMes = todosMembros.filter(m =>
        m.birthdate && new Date(m.birthdate).getMonth() + 1 === mesAtual
    ).sort((a, b) => new Date(a.birthdate!).getDate() - new Date(b.birthdate!).getDate()).slice(0, 5);

    // 4. DOCUMENTOS PENDENTES (GDPR E PERMANECER)
    const hoje = new Date();
    const daquiA30Dias = new Date();
    daquiA30Dias.setDate(daquiA30Dias.getDate() + 30);

    const membrosPendentesDocs = await prisma.membro.findMany({
        where: {
            OR: [
                { gdpr_aceite: false },
                { permanecer_aceite: false },
                { gdpr_validade: { lte: daquiA30Dias } },
                { permanecer_validade: { lte: daquiA30Dias } }
            ]
        },
        select: {
            id: true, first_name: true, last_name: true, avatar_file: true,
            phone_1: true, gdpr_aceite: true, gdpr_validade: true,
            permanecer_aceite: true, permanecer_validade: true
        },
        orderBy: { first_name: 'asc' }
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700">

            {/* BREADCRUMB PADRONIZADO */}
            <Breadcrumb items={[
                {
                    label: "Dashboard Global",
                    href: "/membros/dashboard",
                    isBackIcon: true
                },
                {
                    label: "Administração",
                    hideOnMobile: true
                },
                {
                    label: "Painel Administrativo"
                }
            ]} />
            {/* --- CABEÇALHO LIMPO E COMPACTO --- */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Centro de Comando
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        A Paz, <span className="text-muted/20">{adminLogado?.first_name || "Admin"}.</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* MENU DROPDOWN DE FERRAMENTAS */}
                    <details className="group relative z-50">
                        <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                            <div className="h-12 px-5 bg-bg2 border border-soft text-fg rounded-2xl flex items-center gap-3 hover:bg-soft transition-all active:scale-95 shadow-sm">
                                <Menu size={16} className="text-muted group-open:text-figueira transition-colors" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Ferramentas</span>
                            </div>
                        </summary>

                        <div className="absolute right-0 top-full mt-2 w-56 bg-bg border border-soft p-2 rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1">
                            <Link href="/admin/relatorios/loyverse" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                <CreditCard size={14} className="text-muted group-hover/link:text-figueira" /> Loyverse
                            </Link>
                            <Link href="/admin/relatorios/escalas" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                <Calendar size={14} className="text-muted group-hover/link:text-figueira" /> Relatório Escalas
                            </Link>
                            <Link href="/admin/membros/importar" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                <Users size={14} className="text-muted group-hover/link:text-figueira" /> Importar Membros
                            </Link>
                        </div>
                    </details>

                    <form action={logoutAdmin}>
                        <button type="submit" className="h-12 w-12 flex items-center justify-center bg-red-50 border border-red-100 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm group">
                            <LogOut size={16} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    </form>
                </div>
            </header>

            {/* --- NAVEGAÇÃO PRINCIPAL (ESTILO MENU PILL) --- */}
            <nav className="flex flex-wrap gap-3">
                <MenuPill title="Eventos" href="/admin/escalas" icon={<Calendar size={14} />} />
                <MenuPill title="Membros" href="/admin/membros" icon={<Users size={14} />} />
                <MenuPill title="Famílias" href="/admin/familias" icon={<Home size={14} />} />
                <MenuPill title="Departamentos" href="/admin/configuracoes" icon={<HeartHandshake size={14} />} />
                <MenuPill title="Relatórios" href="/admin/relatorios" icon={<BarChart3 size={14} />} />
            </nav>

            {/* --- KPI'S (ESTATÍSTICAS BÁSICAS) --- */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Membros" value={totalMembros} />
                <StatCard label="Famílias" value={totalFamilias} />
                <StatCard label="Batizados" value={batizados} />
                <StatCard label="Pendentes" value={pendentesCount} highlight={pendentesCount > 0} />
            </section>

            {/* --- ALERTA DE COMPLIANCE (GDPR E PERMANECER) --- */}
            {membrosPendentesDocs.length > 0 && (
                <section className="bg-orange-50 border border-orange-200 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-500/10 text-orange-500 p-4 rounded-2xl shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-orange-700 uppercase tracking-tighter">Atenção ao Compliance</h4>
                            <p className="text-[10px] font-bold text-orange-600/80 uppercase tracking-widest mt-1 max-w-xl leading-relaxed">
                                Existem <span className="font-black text-orange-600">{membrosPendentesDocs.length} membro(s)</span> com documentos pendentes ou a expirar em menos de 30 dias.
                            </p>
                        </div>
                    </div>
                    <BotaoModalDocumentos membrosPendentes={membrosPendentesDocs} />
                </section>
            )}

            {/* --- LAYOUT DUAS COLUNAS: AGENDA E ANIVERSÁRIOS --- */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">

                {/* COLUNA 1: AGENDA (LISTA COMPACTA E MINIMALISTA) */}
                <section className="bg-bg2 border border-soft p-8 rounded-[3rem] shadow-sm">
                    <div className="flex items-center justify-between border-b border-soft pb-6 mb-6">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                            <Calendar size={18} className="text-figueira" /> Próximas Escalas
                        </h2>
                        <Link href="/admin/escalas" className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors flex items-center gap-1">
                            Ver todas <ArrowUpRight size={12} />
                        </Link>
                    </div>

                    <div className="space-y-0">
                        {proximasEscalas.length > 0 ? proximasEscalas.map((ev, index) => (
                            <Link href={`/admin/escalas`} key={ev.id} className={`flex items-center justify-between py-4 group hover:bg-soft/30 rounded-2xl px-3 transition-colors ${index !== proximasEscalas.length - 1 ? 'border-b border-soft' : ''}`}>
                                <div className="flex items-center gap-4">
                                    {/* Data Minimalista */}
                                    <div className="text-center w-10">
                                        <p className="text-lg font-black italic text-fg leading-none">{format(ev.data, 'dd')}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-muted mt-1">{format(ev.data, 'MMM', { locale: pt })}</p>
                                    </div>

                                    {/* Info do Evento */}
                                    <div>
                                        <p className="text-xs font-black uppercase text-fg tracking-tight group-hover:text-figueira transition-colors">{ev.nome}</p>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">
                                            {format(ev.data, "EEEE", { locale: pt })}
                                        </p>
                                    </div>
                                </div>

                                {/* Badge de Voluntários */}
                                <div className="bg-bg border border-soft px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-muted group-hover:border-figueira/30 transition-colors">
                                    <span className="text-fg">{ev._count.escalas}</span> Volts.
                                </div>
                            </Link>
                        )) : (
                            <p className="text-[10px] text-muted italic text-center py-6">Nenhuma escala programada.</p>
                        )}
                    </div>
                </section>

                {/* COLUNA 2: ANIVERSARIANTES DO MÊS */}
                <section className="bg-bg border border-soft p-8 rounded-[3rem] shadow-sm">
                    <div className="flex items-center justify-between border-b border-soft pb-6 mb-6">
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                            🎂 Aniversariantes do Mês
                        </h3>
                        <span className="bg-figueira/10 text-figueira px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {aniversariantesDoMes.length} Pessoas
                        </span>
                    </div>

                    <div className="space-y-2">
                        {aniversariantesDoMes.length > 0 ? aniversariantesDoMes.map((m, i) => (
                            <div key={i} className="flex justify-between items-center p-3 hover:bg-bg2 rounded-xl transition-colors">
                                <p className="text-xs font-black uppercase text-fg tracking-tight">
                                    {m.first_name} {m.last_name}
                                </p>
                                <span className="bg-soft/50 border border-soft px-3 py-1 rounded-lg text-[9px] font-black text-muted uppercase">
                                    Dia {new Date(m.birthdate!).getDate()}
                                </span>
                            </div>
                        )) : (
                            <p className="text-[10px] text-muted italic text-center py-6">Nenhum aniversariante este mês.</p>
                        )}
                    </div>
                </section>

            </div>
        </main>
    )
}

// ============================================================================
// COMPONENTES AUXILIARES OTIMIZADOS
// ============================================================================

function MenuPill({ title, href, icon }: { title: string, href: string, icon: React.ReactNode }) {
    return (
        <Link href={href} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-bg2 border border-soft rounded-[1.5rem] hover:bg-fg hover:text-bg hover:border-fg transition-all group shadow-sm">
            <div className="text-muted group-hover:text-bg transition-colors">
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">{title}</span>
        </Link>
    )
}

function StatCard({ label, value, highlight }: any) {
    return (
        <div className={`p-6 rounded-[2rem] border ${highlight ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-bg2 border-soft text-fg'} shadow-sm flex flex-col justify-center transition-all hover:-translate-y-1`}>
            <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-orange-500' : 'text-muted'}`}>{label}</p>
            <p className="text-3xl lg:text-4xl font-black italic tracking-tighter leading-none">{value}</p>
        </div>
    )
}