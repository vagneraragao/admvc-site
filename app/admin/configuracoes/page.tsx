import Link from 'next/link'
import prisma from '@/lib/prisma'
import { criarCargo, excluirCargo, criarDepartamento, excluirDepartamento } from '@/actions/admin-actions'
import ConfigForm from '@/components/ConfigForm'
import DeptoItem from '@/components/DeptoItem'
import BotaoExcluirCargo from '@/components/BotaoExcluirCargo'
import GerenciadorGrupos from '@/components/admin/GerenciadorGrupos'
import { Plus, Briefcase, LayoutGrid, Users, Settings2, ChevronDown, Shield, Hash } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
    const [cargos, deptos, deptosParaSelect, membrosDisponiveis, grupos] = await Promise.all([
        prisma.cargo.findMany({ orderBy: { nome: 'asc' } }),
        prisma.departamento.findMany({
            include: {
                lider: { select: { first_name: true, last_name: true } },
                funcoes: { orderBy: { nome: 'asc' } },
                integrantes: {
                    include: {
                        membro: { select: { id: true, first_name: true, last_name: true } },
                        funcoes: { include: { funcao: true } }
                    }
                },
                _count: { select: { integrantes: true } }
            },
            orderBy: { nome: 'asc' }
        }),
        prisma.departamento.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
        prisma.membro.findMany({ select: { id: true, first_name: true, last_name: true }, orderBy: { first_name: 'asc' } }),
        prisma.grupo.findMany({
            orderBy: { nome: 'asc' },
            include: {
                membros: { select: { id: true, first_name: true, last_name: true } },
                lideres: { select: { id: true, first_name: true, last_name: true } },
                departamento: { select: { id: true, nome: true } },
                _count: { select: { membros: true } }
            }
        })
    ])

    return (
        <main className="min-h-screen bg-bg">

            {/* TOP BAR */}
            <div className="border-b border-soft bg-bg/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Breadcrumb items={[
                        { label: "Painel Admin", href: "/admin/dashboard", isBackIcon: true },
                        { label: "Sistema", hideOnMobile: true },
                        { label: "Configurações" }
                    ]} />
                    <div className="flex items-center gap-2">
                        <span className="hidden sm:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted bg-soft/50 px-3 py-1.5 rounded-lg border border-soft">
                            <Settings2 size={11} /> Estrutural
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 pb-32">

                {/* HERO HEADER */}
                <header className="pt-4 pb-2">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-3 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 bg-figueira rounded-full" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-figueira">
                                    Módulo Administrativo
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-fg leading-[0.9]">
                                Estrutura
                                <br />
                                <span className="text-muted/30">&amp;</span> Gestão
                            </h1>
                            <p className="text-sm text-muted font-medium leading-relaxed max-w-md">
                                Configure os cargos, departamentos e grupos que formam a estrutura da sua igreja.
                            </p>
                        </div>

                        {/* STATS RÁPIDAS */}
                        <div className="grid grid-cols-3 gap-3 lg:gap-4 shrink-0">
                            {[
                                { label: 'Cargos', value: cargos.length, color: 'text-figueira', bg: 'bg-figueira/8' },
                                { label: 'Departamentos', value: deptos.length, color: 'text-blue-500', bg: 'bg-blue-500/8' },
                                { label: 'Grupos', value: grupos.length, color: 'text-emerald-500', bg: 'bg-emerald-500/8' },
                            ].map(stat => (
                                <div key={stat.label} className={`${stat.bg} border border-soft rounded-2xl p-4 text-center min-w-[80px]`}>
                                    <p className={`text-3xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                {/* NAV ÂNCORAS */}
                <nav className="flex gap-1 p-1 bg-bg2 border border-soft rounded-2xl w-fit">
                    {[
                        { href: '#cargos', label: 'Cargos', icon: <Briefcase size={12} />, color: 'text-figueira' },
                        { href: '#departamentos', label: 'Departamentos', icon: <LayoutGrid size={12} />, color: 'text-blue-500' },
                        { href: '#grupos', label: 'Grupos & PGs', icon: <Users size={12} />, color: 'text-emerald-500' },
                    ].map(item => (
                        <a key={item.href} href={item.href}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-fg hover:bg-bg transition-all">
                            <span className={item.color}>{item.icon}</span>
                            {item.label}
                        </a>
                    ))}
                </nav>

                {/* ── 01. CARGOS ── */}
                <section id="cargos" className="scroll-mt-20 space-y-4">
                    <SectionHeader
                        icon={<Briefcase size={18} />}
                        iconBg="bg-figueira/10 text-figueira"
                        title="Cargos Gerais"
                        count={cargos.length}
                        description="Atribuições base disponíveis para os membros"
                        action={
                            <PopoverAdicionar
                                titulo="Cargo"
                                actionComponent={<ConfigForm action={criarCargo} placeholder="Ex: Diácono..." label="Novo Cargo" />}
                            />
                        }
                    />

                    {cargos.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {cargos.map(c => (
                                <div key={c.id} className="group/item relative flex items-center justify-between p-3.5 bg-bg2 border border-soft rounded-2xl hover:border-figueira/30 transition-all overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-figueira/0 group-hover/item:bg-figueira/60 transition-all" />
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Hash size={10} className="text-figueira/40 shrink-0" />
                                        <span className="text-[10px] font-black uppercase truncate text-fg tracking-wide">{c.nome}</span>
                                    </div>
                                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 ml-2">
                                        <BotaoExcluirCargo id={c.id} nome={c.nome} onExcluir={excluirCargo} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<Shield size={28} />} message="Nenhum cargo registado." />
                    )}
                </section>

                {/* DIVIDER */}
                <div className="border-t border-soft/50" />

                {/* ── 02. DEPARTAMENTOS ── */}
                <section id="departamentos" className="scroll-mt-20 space-y-4">
                    <SectionHeader
                        icon={<LayoutGrid size={18} />}
                        iconBg="bg-blue-500/10 text-blue-500"
                        title="Departamentos"
                        count={deptos.length}
                        description="Setores de atuação e as suas respetivas equipas"
                        action={
                            <PopoverAdicionar
                                titulo="Departamento"
                                buttonColor="bg-blue-600 text-white hover:bg-blue-700"
                                highlightColor="bg-blue-600"
                                actionComponent={<ConfigForm action={criarDepartamento} placeholder="Nome do setor..." label="Novo Setor" buttonColor="bg-blue-600" />}
                            />
                        }
                    />

                    {deptos.length > 0 ? (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {deptos.map(d => (
                                <DeptoItem
                                    key={d.id}
                                    depto={d}
                                    membrosDisponiveis={membrosDisponiveis}
                                    onExcluir={excluirDepartamento}
                                />
                            ))}
                        </div>
                    ) : (
                        <EmptyState icon={<LayoutGrid size={28} />} message="Nenhum departamento registado." />
                    )}
                </section>

                {/* DIVIDER */}
                <div className="border-t border-soft/50" />

                {/* ── 03. GRUPOS ── */}
                <section id="grupos" className="scroll-mt-20 space-y-4">
                    <SectionHeader
                        icon={<Users size={18} />}
                        iconBg="bg-emerald-500/10 text-emerald-500"
                        title="Grupos & PGs"
                        count={grupos.length}
                        description="Grupos de trabalho, células e reuniões"
                    />
                    <GerenciadorGrupos
                        grupos={grupos}
                        departamentos={deptosParaSelect}
                        membrosDisponiveis={membrosDisponiveis}
                    />
                </section>

            </div>
        </main>
    )
}

// ── COMPONENTE: CABEÇALHO DE SECÇÃO ──────────────────────────────────────────
function SectionHeader({ icon, iconBg, title, count, description, action }: {
    icon: React.ReactNode
    iconBg: string
    title: string
    count: number
    description: string
    action?: React.ReactNode
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    {icon}
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">
                            {title}
                        </h2>
                        <span className="text-[9px] font-black bg-bg2 border border-soft px-2.5 py-1 rounded-lg uppercase text-muted tracking-widest">
                            {count}
                        </span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-1">{description}</p>
                </div>
            </div>
            {action}
        </div>
    )
}

// ── COMPONENTE: ESTADO VAZIO ──────────────────────────────────────────────────
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
    return (
        <div className="py-16 text-center border-2 border-dashed border-soft rounded-3xl bg-bg2/50">
            <div className="text-muted/30 flex justify-center mb-3">{icon}</div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{message}</p>
        </div>
    )
}

// ── COMPONENTE: POPOVER DE ADIÇÃO ─────────────────────────────────────────────
function PopoverAdicionar({
    titulo,
    actionComponent,
    buttonColor = "bg-fg text-bg hover:bg-figueira hover:text-white",
    highlightColor = "bg-figueira"
}: any) {
    return (
        <details className="group/pop relative z-30">
            <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden outline-none">
                <div className={`${buttonColor} px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-sm`}>
                    <Plus size={13} className="group-open/pop:rotate-45 transition-transform duration-200" />
                    Adicionar {titulo}
                </div>
            </summary>
            <div className="absolute right-0 top-full mt-2 w-[300px] sm:w-[340px] bg-bg border border-soft p-6 rounded-[1.5rem] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[9px] font-black uppercase text-muted tracking-widest border-b border-soft pb-3 mb-4 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${highlightColor}`} />
                    Registar Novo(a) {titulo}
                </p>
                {actionComponent}
            </div>
        </details>
    )
}
