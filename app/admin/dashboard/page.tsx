//app/admin/dashboard/page.tsx

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { logoutAdmin } from '@/actions/auth-actions'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { Settings, Calendar, Users, Home, BarChart3, ChevronRight, ChevronDown, LogOut, ArrowLeft, ArrowRight, ShieldCheck, HeartHandshake, AlertTriangle, Menu, CreditCard } from 'lucide-react'
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    // 0. BUSCA DO ADMIN LOGADO
    const session = await getSessionData();

    const adminLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        select: { first_name: true, last_name: true }
    });

    // 🛡️ FILTRO INTELIGENTE PARA RESOLVER O PROBLEMA DE MAIÚSCULAS/MINÚSCULAS
    const statusAtivo = { in: ['Ativo', 'ATIVO'] };
    const statusPendente = { in: ['Pendente', 'PENDENTE'] };

    // 1. ESTATÍSTICAS BÁSICAS (AGORA A CONTAR CORRETAMENTE)
    const totalMembros = await prisma.membro.count({ where: { status: statusAtivo } })
    const pendentesCount = await prisma.membro.count({ where: { status: statusPendente } })
    const batizados = await prisma.membro.count({ where: { baptism_status: 'Batizado', status: statusAtivo } })
    const totalFamilias = await prisma.familia.count();

    // 2. PRÓXIMAS 5 ESCALAS (Eventos futuros)
    const proximasEscalas = await prisma.evento.findMany({
        where: { data: { gte: new Date() } },
        orderBy: { data: 'asc' },
        take: 5,
        include: {
            escalas: {
                select: { funcao: true, confirmado: true, horario: true },
                take: 1
            },
            _count: { select: { escalas: true } }
        }
    })


    const mesAtual = new Date().getMonth() + 1;
    const todosMembros = await prisma.membro.findMany({
        where: { status: statusAtivo },
        select: { first_name: true, last_name: true, birthdate: true }
    });

    const aniversariantesDoMes = todosMembros.filter(m =>
        m.birthdate && new Date(m.birthdate).getMonth() + 1 === mesAtual
    ).sort((a, b) => new Date(a.birthdate!).getDate() - new Date(b.birthdate!).getDate());

    // 4. MEMBROS SEM ASSINATURA GDPR (NOVO)
    // Nota: Certifique-se que o campo no seu banco de dados se chama 'termo_aceite'
    // O { not: true } apanha tanto quem tem "false" como quem tem "null"
    const pendentesGDPR = await prisma.membro.findMany({
        where: {
            status: statusAtivo,
            termo_aceite: false
        },
        select: { id: true, first_name: true, last_name: true, phone_1: true },
        orderBy: { first_name: 'asc' }
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700">

            {/* --- BREADCRUMBS --- */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/membros/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Dashboard Global
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Painel Administrativo</span>
            </nav>

            {/* --- CABEÇALHO LIMPO --- */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Centro de Comando
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        A Paz, <span className="text-muted/20">{adminLogado?.first_name || "Admin"}.</span>
                    </h1>
                </div>

                {/* --- ÁREA DE ACÕES DO TOPO (MENU + LOGOUT) --- */}
                <div className="flex items-center gap-3 shrink-0">

                    {/* MINI-MENU HAMBURGER (Dropdown Nativo) */}
                    <details className="group relative z-50">
                        {/* Remove a setinha padrão do HTML */}
                        <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                            <div className="h-14 w-14 bg-bg2 border border-soft text-fg rounded-2xl flex items-center justify-center hover:bg-soft transition-all active:scale-95 shadow-sm">
                                <Menu size={20} strokeWidth={2.5} className="group-open:text-figueira transition-colors" />
                            </div>
                        </summary>

                        {/* Conteúdo do Dropdown */}
                        <div className="absolute right-0 top-full mt-3 w-64 bg-bg border border-soft p-4 rounded-[2rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1">
                            <p className="text-[9px] font-black uppercase text-figueira tracking-widest border-b border-soft/50 pb-3 mb-2 px-3">
                                Acesso Rápido
                            </p>

                            <Link href="/admin/relatorios/loyverse" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 group/link">
                                <CreditCard size={14} className="text-muted group-hover/link:text-figueira transition-colors" />
                                Códigos Loyverse
                            </Link>

                            <Link href="/admin/relatorios/escalas" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 group/link">
                                <Calendar size={14} className="text-muted group-hover/link:text-figueira transition-colors" />
                                Relatório de Escalas
                            </Link>
                            <Link href="/admin/membros/importar" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3.5 rounded-xl transition-all flex items-center gap-3 group/link">
                                <Calendar size={14} className="text-muted group-hover/link:text-figueira transition-colors" />
                                Importar/Exportar Membros
                            </Link>
                        </div>
                    </details>

                    {/* LOGOUT ISOLADO */}
                    <form action={logoutAdmin}>
                        <button
                            type="submit"
                            className="flex items-center justify-center gap-3 h-14 px-5 bg-red-50 border border-red-100 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                            title="Sair do Painel"
                        >
                            <LogOut size={18} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Terminar Sessão</span>
                        </button>
                    </form>
                </div>
            </header>

            {/* --- MENU PRINCIPAL --- */}
            <nav className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <MenuAction title="Escalas" href="/admin/escalas" icon={<Calendar size={18} />} />
                <MenuAction title="Membros" href="/admin/membros" icon={<Users size={18} />} />
                <MenuAction title="Famílias" href="/admin/familias" icon={<Home size={18} />} />
                <MenuAction title="Departamentos" href="/admin/configuracoes" icon={<HeartHandshake size={18} />} />
                <MenuAction title="Relatórios" href="/admin/relatorios" icon={<BarChart3 size={18} />} className="col-span-2 md:col-span-1" />
            </nav>

            {/* --- ESTATÍSTICAS BÁSICAS --- */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Membros" value={totalMembros} />
                <StatCard label="Membros Batizados" value={batizados} />
                <StatCard label="Familias" value={totalFamilias} />
                <StatCard label="Cadastros Pendentes" value={pendentesCount} highlight={pendentesCount > 0} />
            </section>

            {/* --- LAYOUT PRINCIPAL (AGENDA + WIDGETS) --- */}
            <div className="grid lg:grid-cols-12 gap-10 items-start pt-6">

                {/* COLUNA ESQUERDA (AGENDA MAIOR) */}
                <section className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between border-b border-soft pb-4">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                            <Calendar size={20} className="text-figueira" /> Agenda de Escalas
                        </h2>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted bg-soft px-3 py-1 rounded-full">Próximos</span>
                    </div>

                    <div className="grid gap-4">
                        {proximasEscalas.length > 0 ? proximasEscalas.map((ev) => (
                            <Link href={`/admin/escalas`} key={ev.id} className="bg-bg2 border border-soft p-5 rounded-[2rem] hover:border-figueira/50 transition-all group flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-5">
                                    <div className="bg-bg border border-soft text-center min-w-[50px] p-2 rounded-xl shadow-inner group-hover:bg-figueira group-hover:text-white group-hover:border-figueira transition-colors">
                                        <p className="text-xl font-black italic leading-none">{format(ev.data, 'dd')}</p>
                                        <p className="text-[8px] font-black uppercase tracking-widest mt-0.5">{format(ev.data, 'MMM', { locale: pt })}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase text-fg leading-none tracking-tight">{ev.nome}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                                {format(ev.data, "EEEE", { locale: pt })}
                                            </span>
                                            <span className="text-[8px] text-muted">•</span>
                                            <span className="text-[9px] font-black bg-figueira/10 text-figueira px-2 py-0.5 rounded border border-figueira/20 italic">
                                                {ev.escalas?.[0]?.horario || "Horário não definido"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[10px] font-black text-fg">{ev._count.escalas} Escalados</p>
                                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest">neste evento</p>
                                    </div>
                                    <div className="p-2 bg-soft rounded-xl text-muted group-hover:bg-figueira group-hover:text-white transition-colors">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="py-12 text-center border-2 border-dashed border-soft rounded-[2.5rem] bg-bg2/30">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Nenhum evento futuro agendado.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* COLUNA DIREITA (WIDGETS COMPACTOS) */}
                <aside className="lg:col-span-5 space-y-6">

                    {/* 🚨 WIDGET OTIMIZADO: ALERTA GDPR (COLAPSÁVEL) 🚨 */}
                    {pendentesGDPR.length > 0 && (
                        <details className="group bg-orange-50 border border-orange-200 rounded-[2.5rem] shadow-sm relative overflow-hidden transition-all duration-300">

                            {/* O que aparece fechado (O Cabeçalho / Botão) */}
                            <summary className="list-none cursor-pointer p-8 relative z-10 flex items-center justify-between outline-none marker:hidden [&::-webkit-details-marker]:hidden hover:bg-orange-100/50 transition-colors">
                                <div className="flex flex-col gap-2">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-orange-600 flex items-center gap-2">
                                        <AlertTriangle size={16} /> Faltam Assinar GDPR
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase shadow-sm">
                                            {pendentesGDPR.length} Membros
                                        </span>
                                        <span className="text-[9px] font-bold text-orange-600/70 uppercase tracking-widest">
                                            Pendentes
                                        </span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-2xl bg-orange-200/50 flex items-center justify-center text-orange-600 group-open:rotate-180 transition-transform duration-300 shadow-inner">
                                    <ChevronDown size={16} strokeWidth={3} />
                                </div>
                            </summary>

                            {/* A Lista que abre ao clicar */}
                            <div className="px-8 pb-8 relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar border-t border-orange-200/50 pt-4 mt-2">
                                    {pendentesGDPR.map(m => (
                                        <div key={m.id} className="flex justify-between items-center bg-white/60 p-3 md:p-4 rounded-2xl border border-orange-100 hover:border-orange-300 transition-colors">
                                            <p className="text-[11px] font-black uppercase text-orange-900 tracking-tight truncate">
                                                {m.first_name} {m.last_name}
                                            </p>
                                            <Link
                                                href={`https://wa.me/${m.phone_1?.replace(/\D/g, '')}`}
                                                target="_blank"
                                                className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-orange-500 hover:text-white transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                            >
                                                Cobrar
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Efeito Visual de Fundo */}
                            <AlertTriangle className="absolute -right-4 -bottom-4 w-32 h-32 text-orange-500 opacity-5 pointer-events-none" />
                        </details>
                    )}

                    {/* ANIVERSARIANTES */}
                    <div className="bg-bg2 p-8 rounded-[2.5rem] border border-soft shadow-sm">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-fg italic flex items-center gap-2 mb-6">
                            🎂 Aniversariantes do Mês
                        </h3>
                        <div className="space-y-4">
                            {aniversariantesDoMes.length > 0 ? aniversariantesDoMes.slice(0, 5).map((m, i) => (
                                <div key={i} className="flex justify-between items-center group">
                                    <p className="text-xs font-black uppercase text-fg tracking-tight">{m.first_name} {m.last_name}</p>
                                    <span className="bg-soft px-3 py-1 rounded-xl text-[9px] font-black text-muted uppercase group-hover:bg-figueira group-hover:text-white transition-colors">
                                        Dia {new Date(m.birthdate!).getDate()}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-muted italic">Ninguém faz anos este mês.</p>
                            )}
                        </div>
                    </div>

                </aside>
            </div>
        </main>
    )
}

// ============================================================================
// COMPONENTES AUXILIARES (Design System Minimalista)
// ============================================================================

function MenuAction({ title, href, icon, className = "" }: any) {
    return (
        <Link href={href} className={`flex flex-col items-center justify-center gap-3 p-6 bg-bg2 border border-soft rounded-[2rem] hover:border-figueira hover:shadow-lg hover:shadow-figueira/10 transition-all group ${className}`}>
            <div className="text-muted group-hover:text-figueira group-hover:scale-110 transition-all duration-300">
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-fg">{title}</span>
        </Link>
    )
}

function StatCard({ label, value, highlight }: any) {
    return (
        <div className={`p-6 md:p-8 rounded-[2rem] border ${highlight ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-bg2 border-soft text-fg'} shadow-sm flex flex-col justify-center`}>
            <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-orange-500/80' : 'text-muted'}`}>{label}</p>
            <p className="text-3xl sm:text-4xl font-black italic tracking-tighter leading-none">{value}</p>
        </div>
    )
}

function ProgressBar({ label, value, total, color }: any) {
    const percent = total > 0 ? (value / total) * 100 : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-fg">
                <span>{label}</span>
                <span className="text-muted">{value} ({percent.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-soft h-2 rounded-full overflow-hidden">
                <div className={`${color} h-full transition-all duration-1000`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    )
}