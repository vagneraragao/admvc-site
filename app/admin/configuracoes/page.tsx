import Link from 'next/link'
import prisma from '@/lib/prisma'
import { criarCargo, excluirCargo, criarDepartamento, excluirDepartamento } from '@/actions/admin-actions'
import ConfigForm from '@/components/ConfigForm'
import DeptoItem from '@/components/DeptoItem'
import BotaoExcluirCargo from '@/components/BotaoExcluirCargo'
import GerenciadorGrupos from '@/components/admin/GerenciadorGrupos'
import { Plus, Briefcase, LayoutGrid, Users, ArrowLeft, ChevronRight, Settings2, Shield, ChevronDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
    // ========================================================================
    // CONSULTAS AO PRISMA (SERVER-SIDE FETCHING)
    // ========================================================================
    const [cargos, deptos, deptosParaSelect, membrosDisponiveis, grupos] = await Promise.all([
        prisma.cargo.findMany({ orderBy: { nome: 'asc' } }),
        prisma.departamento.findMany({
            include: {
                lider: { select: { first_name: true, last_name: true } },
                funcoes: { orderBy: { nome: 'asc' } },
                integrantes: {
                    include: { membro: { select: { id: true, first_name: true, last_name: true } } }
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
    ]);

    return (
        <main className="max-w-6xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            {/* --- BREADCRUMBS --- */}
            <nav className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/admin/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Painel Admin
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Configurações Estruturais</span>
            </nav>

            {/* --- CABEÇALHO --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Settings2 size={14} /> Módulo Administrativo
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Estrutura <span className="text-muted/30">&</span> Gestão.
                    </h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest pt-2">
                        Configure os pilares, departamentos e grupos da sua igreja.
                    </p>
                </div>
            </header>

            {/* --- NAVEGAÇÃO INTERNA FIXA (STICKY SUB-NAV) --- */}
            <nav className="sticky top-0 z-40 bg-bg/80 backdrop-blur-md border-y border-soft py-4 flex gap-8 overflow-x-auto custom-scrollbar shadow-sm">
                <a href="#cargos" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Briefcase size={14} /> Cargos Gerais
                </a>
                <a href="#departamentos" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-blue-500 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <LayoutGrid size={14} /> Departamentos
                </a>
                <a href="#grupos" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-emerald-500 transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Users size={14} /> Grupos & Células
                </a>
            </nav>

            {/* --- 01. CARGOS GERAIS (CARD CONTRAÍVEL) --- */}
            <section id="cargos" className="scroll-mt-24">
                <details className="group bg-bg2 border border-soft rounded-[3.5rem] shadow-sm overflow-hidden transition-all duration-300">

                    <summary className="list-none cursor-pointer p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 [&::-webkit-details-marker]:hidden hover:bg-soft/20 transition-colors outline-none">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-bg border border-soft flex items-center justify-center shrink-0 shadow-sm transition-transform group-open:scale-110">
                                <Briefcase size={20} className="text-figueira" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                    Cargos Gerais
                                    <span className="text-[9px] font-black bg-bg border border-soft px-3 py-1 rounded-md uppercase text-muted tracking-widest not-italic shadow-sm">{cargos.length}</span>
                                </h2>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">Atribuições base disponíveis para os membros.</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-bg border border-soft flex items-center justify-center text-muted group-open:bg-figueira group-open:text-white group-open:border-figueira transition-all shadow-sm shrink-0">
                            <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300" />
                        </div>
                    </summary>

                    {/* CONTEÚDO EXPANDIDO */}
                    <div className="px-8 md:px-10 pb-10 border-t border-soft/50 pt-8 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-fg">Lista de Cargos</h3>
                            <PopoverAdicionar
                                titulo="Cargo"
                                actionComponent={<ConfigForm action={criarCargo} placeholder="Ex: Diácono..." label="Novo Cargo" />}
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {cargos.map(c => (
                                <div key={c.id} className="group/item flex justify-between items-center p-4 bg-bg border border-soft rounded-2xl hover:border-figueira/40 hover:shadow-sm transition-all relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-figueira/20 group-hover/item:bg-figueira transition-colors"></div>
                                    <span className="text-[10px] font-black uppercase truncate text-fg tracking-widest pl-2">{c.nome}</span>
                                    <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                        <BotaoExcluirCargo id={c.id} nome={c.nome} onExcluir={excluirCargo} />
                                    </div>
                                </div>
                            ))}
                            {cargos.length === 0 && (
                                <div className="col-span-full py-10 text-center border-2 border-dashed border-soft rounded-3xl bg-bg">
                                    <Shield size={24} className="mx-auto text-muted/30 mb-3" />
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Nenhum cargo registado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </details>
            </section>

            {/* --- 02. DEPARTAMENTOS (CARD CONTRAÍVEL) --- */}
            <section id="departamentos" className="scroll-mt-24">
                <details className="group bg-bg2 border border-soft rounded-[3.5rem] shadow-sm overflow-hidden transition-all duration-300">

                    <summary className="list-none cursor-pointer p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 [&::-webkit-details-marker]:hidden hover:bg-soft/20 transition-colors outline-none">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-bg border border-soft flex items-center justify-center shrink-0 shadow-sm transition-transform group-open:scale-110">
                                <LayoutGrid size={20} className="text-blue-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                    Departamentos
                                    <span className="text-[9px] font-black bg-bg border border-soft px-3 py-1 rounded-md uppercase text-muted tracking-widest not-italic shadow-sm">{deptos.length}</span>
                                </h2>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">Setores de atuação e as suas respetivas equipas.</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-bg border border-soft flex items-center justify-center text-muted group-open:bg-blue-600 group-open:text-white group-open:border-blue-600 transition-all shadow-sm shrink-0">
                            <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300" />
                        </div>
                    </summary>

                    {/* CONTEÚDO EXPANDIDO */}
                    <div className="px-8 md:px-10 pb-10 border-t border-soft/50 pt-8 animate-in slide-in-from-top-4 fade-in duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xs font-black uppercase tracking-widest text-fg">Lista de Setores</h3>
                            <PopoverAdicionar
                                titulo="Setor"
                                buttonColor="bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                highlightColor="bg-blue-600"
                                actionComponent={<ConfigForm action={criarDepartamento} placeholder="Nome do setor..." label="Novo Setor" buttonColor="bg-blue-600" />}
                            />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            {deptos.map(d => (
                                <DeptoItem
                                    key={d.id}
                                    depto={d}
                                    membrosDisponiveis={membrosDisponiveis}
                                    onExcluir={excluirDepartamento}
                                />
                            ))}
                            {deptos.length === 0 && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-soft rounded-[3rem] bg-bg">
                                    <LayoutGrid size={32} className="mx-auto text-muted/30 mb-3" />
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Nenhum departamento registado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </details>
            </section>

            {/* --- 03. GRUPOS DE TRABALHO (CARD CONTRAÍVEL) --- */}
            <section id="grupos" className="scroll-mt-24">
                <details className="group bg-bg2 border border-soft rounded-[3.5rem] shadow-sm overflow-hidden transition-all duration-300">

                    <summary className="list-none cursor-pointer p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 [&::-webkit-details-marker]:hidden hover:bg-soft/20 transition-colors outline-none">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-bg border border-soft flex items-center justify-center shrink-0 shadow-sm transition-transform group-open:scale-110">
                                <Users size={20} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                    Grupos & Células
                                    <span className="text-[9px] font-black bg-bg border border-soft px-3 py-1 rounded-md uppercase text-muted tracking-widest not-italic shadow-sm">{grupos.length}</span>
                                </h2>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">Faça a gestão dos grupos de trabalho e reuniões.</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-bg border border-soft flex items-center justify-center text-muted group-open:bg-emerald-500 group-open:text-white group-open:border-emerald-500 transition-all shadow-sm shrink-0">
                            <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300" />
                        </div>
                    </summary>

                    {/* CONTEÚDO EXPANDIDO */}
                    <div className="px-8 md:px-10 pb-10 border-t border-soft/50 pt-8 animate-in slide-in-from-top-4 fade-in duration-300">
                        {/* O GerenciadorGrupos já tem o seu próprio botão de "+ Criar Grupo", logo não precisamos do PopoverAdicionar aqui */}
                        <GerenciadorGrupos
                            grupos={grupos}
                            departamentos={deptosParaSelect}
                            membrosDisponiveis={membrosDisponiveis}
                        />
                    </div>
                </details>
            </section>
        </main>
    )
}

// ============================================================================
// COMPONENTE AUXILIAR (POPOVER DE ADIÇÃO NO CANTO DIREITO)
// ============================================================================
function PopoverAdicionar({ titulo, actionComponent, buttonColor = "bg-fg text-bg hover:bg-figueira hover:text-white", highlightColor = "bg-figueira" }: any) {
    return (
        <details className="group/pop relative z-30">
            <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden outline-none">
                <div className={`${buttonColor} px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 active:scale-95 group-open/pop:ring-2 ring-offset-2 ring-offset-bg2 ring-soft`}>
                    <Plus size={14} className="group-open/pop:rotate-45 transition-transform" />
                    Adicionar
                </div>
            </summary>

            <div className="absolute right-0 top-full mt-3 w-[320px] sm:w-[360px] bg-bg border border-soft p-8 rounded-[2rem] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted tracking-widest border-b border-soft pb-3 mb-4 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${highlightColor}`}></span> Registar Novo(a) {titulo}
                    </p>
                    {actionComponent}
                </div>
            </div>
        </details>
    )
}