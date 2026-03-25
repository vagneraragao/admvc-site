import Link from 'next/link'
import prisma from '@/lib/prisma'
import { criarCargo, excluirCargo, criarDepartamento, excluirDepartamento } from '@/actions/admin-actions'
import ConfigForm from '@/components/ConfigForm'
import DeptoItem from '@/components/DeptoItem'
import BotaoExcluirCargo from '@/components/BotaoExcluirCargo'
import GerenciadorGrupos from '@/components/admin/GerenciadorGrupos'
import { Plus, Briefcase, LayoutGrid, Users, ArrowLeft, ChevronRight, Settings2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
    // Consultas ao Prisma
    const cargos = await prisma.cargo.findMany({ orderBy: { nome: 'asc' } });
    const deptos = await prisma.departamento.findMany({
        include: {
            lider: { select: { first_name: true, last_name: true } },
            funcoes: { orderBy: { nome: 'asc' } },
            integrantes: {
                include: { membro: { select: { id: true, first_name: true, last_name: true } } }
            },
            _count: { select: { integrantes: true } }
        },
        orderBy: { nome: 'asc' }
    });
    const deptosParaSelect = await prisma.departamento.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } });
    const membrosDisponiveis = await prisma.membro.findMany({ select: { id: true, first_name: true, last_name: true }, orderBy: { first_name: 'asc' } });
    const grupos = await prisma.grupo.findMany({
        orderBy: { nome: 'asc' },
        include: {
            membros: { select: { id: true, first_name: true, last_name: true } },
            lideres: { select: { id: true, first_name: true, last_name: true } },
            departamento: { select: { id: true, nome: true } },
            _count: { select: { membros: true } }
        }
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-12 animate-in fade-in duration-700 pb-32">

            {/* --- BREADCRUMBS --- */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/admin/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Painel Admin
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Configurações Estruturais</span>
            </nav>

            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-soft pb-8">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Settings2 size={14} /> Módulo Administrativo
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Configurações <span className="text-muted/20">Gerais.</span>
                    </h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest pt-2">
                        Gerencie os pilares estruturais da sua igreja.
                    </p>
                </div>
            </header>

            {/* --- 01. CARGOS GERAIS --- */}
            <section className="bg-bg2 border border-soft p-8 md:p-10 rounded-[3.5rem] shadow-sm">
                <SeccaoHeader
                    titulo="Cargos Gerais"
                    icon={<Briefcase size={20} className="text-figueira" />}
                    count={cargos.length}
                    actionComponent={<ConfigForm action={criarCargo} placeholder="Ex: Diácono..." label="Novo Cargo" />}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
                    {cargos.map(c => (
                        <div key={c.id} className="group flex justify-between items-center p-5 bg-bg border border-soft rounded-2xl hover:border-figueira/40 hover:shadow-md transition-all">
                            <span className="text-[10px] font-black uppercase truncate text-muted group-hover:text-fg tracking-widest">{c.nome}</span>
                            <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                                <BotaoExcluirCargo id={c.id} nome={c.nome} onExcluir={excluirCargo} />
                            </div>
                        </div>
                    ))}
                    {cargos.length === 0 && (
                        <div className="col-span-full py-8 text-center border-2 border-dashed border-soft rounded-2xl bg-bg2/50">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest italic">Nenhum cargo registado.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- 02. DEPARTAMENTOS --- */}
            <section className="bg-bg2 border border-soft p-8 md:p-10 rounded-[3.5rem] shadow-sm">
                <SeccaoHeader
                    titulo="Departamentos"
                    icon={<LayoutGrid size={20} className="text-blue-500" />}
                    count={deptos.length}
                    actionComponent={<ConfigForm action={criarDepartamento} placeholder="Nome do setor..." label="Novo Setor" buttonColor="bg-blue-600" />}
                />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
                    {deptos.map(d => (
                        <DeptoItem
                            key={d.id}
                            depto={d}
                            membrosDisponiveis={membrosDisponiveis}
                            onExcluir={excluirDepartamento}
                        />
                    ))}
                    {deptos.length === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-soft rounded-3xl bg-bg2/50">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest italic">Nenhum departamento registado.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* --- 03. GRUPOS DE TRABALHO (Células, PGs, etc.) --- */}
            <section className="bg-bg2 border border-soft p-8 md:p-10 rounded-[3.5rem] shadow-sm">
                <div className="flex items-center gap-4 border-b border-soft pb-6 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <Users size={20} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg leading-none">Grupos de Trabalho</h2>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">Células, Pequenos Grupos e Equipas</p>
                    </div>
                </div>

                <GerenciadorGrupos
                    grupos={grupos}
                    departamentos={deptosParaSelect}
                    membrosDisponiveis={membrosDisponiveis}
                />
            </section>
        </main>
    )
}

// ============================================================================
// COMPONENTE AUXILIAR (HEADER DAS SECÇÕES COM POPOVER DE CADASTRO)
// ============================================================================
function SeccaoHeader({ titulo, icon, count, actionComponent }: any) {
    return (
        <div className="flex justify-between items-center border-b border-soft pb-6 relative z-20">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-soft/50 flex items-center justify-center shrink-0">
                    {icon}
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg leading-none">{titulo}</h2>
                        <span className="text-[9px] font-black bg-soft px-3 py-1 rounded-full uppercase text-muted tracking-widest">
                            {count} {count === 1 ? 'Registo' : 'Registos'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Dropdown Nativo (Details/Summary) Customizado */}
            <details className="group relative">
                {/* Oculta a seta padrão do details no CSS */}
                <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                    <div className="w-12 h-12 bg-fg text-bg rounded-2xl flex items-center justify-center hover:bg-figueira hover:text-white transition-all active:scale-95 shadow-md group-open:bg-figueira group-open:text-white group-open:rotate-45">
                        <Plus size={20} strokeWidth={2.5} />
                    </div>
                </summary>

                {/* Janela de Popover */}
                <div className="absolute right-0 top-full mt-4 w-[320px] bg-bg border border-soft p-8 rounded-[2.5rem] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-figueira tracking-widest border-b border-soft/50 pb-3 mb-4">
                            Adicionar {titulo}
                        </p>
                        {actionComponent}
                    </div>
                </div>
            </details>
        </div>
    )
}