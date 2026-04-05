'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    ShieldCheck, PieChart, LogOut, Users,
    Store, MonitorPlay,
    Home, Music2, Lightbulb, Calendar, MessageSquare,
    BookOpen, ChevronDown, ChevronUp, Car, Coffee, Info,
    UserCircle, ClipboardList, CalendarOff, BarChart3
} from 'lucide-react'
import { logoutMembro } from '@/actions/auth-actions'
import DrawerEditarPerfil from '@/components/membros/DrawerEditarPerfil'
import ModalIndisponibilidade from '@/components/membros/ModalIndisponibilidade'
import ModalRelatorioEscalas from '@/components/membros/ModalRelatorioEscalas'
import ModalRelatorioLouvor from '@/components/louvor/ModalRelatorioLouvor'
import NotificacaoHeader from '@/components/membros/NotificacaoHeader'
import ModalAjuda from '@/components/membros/ModalAjuda'
import { APP_VERSION } from '@/lib/constants'

interface Props {
    membro: any
    igrejaName: string
    role: string
    permissoes: {
        isAdmin: boolean
        isLider: boolean
        isMidia: boolean
        isAcolhimento: boolean
        isCantina: boolean
        isFinance: boolean
        isLouvor: boolean
        isDiaconia: boolean
    }
    mostraServico: boolean
    escolaridades: any[]
    avisos?: any[]
    alertasAcolhimento?: any[]
}

export default function MembroHeader({ membro, igrejaName, role, permissoes, mostraServico, escolaridades, avisos = [], alertasAcolhimento = [] }: Props) {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const [expandido, setExpandido] = useState(false)
    const [menuAberto, setMenuAberto] = useState<string | null>(null) // 'igreja' | 'depto' | 'ajuda' | null
    const navRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])
    useEffect(() => { setMenuAberto(null) }, [pathname])

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        if (!menuAberto) return
        const handler = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) setMenuAberto(null)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [menuAberto])

    // Persistir expandido
    useEffect(() => {
        const saved = localStorage.getItem('membro_header_expanded')
        if (saved === 'true') setExpandido(true)
    }, [])

    function toggleExpandido() {
        const next = !expandido
        setExpandido(next)
        localStorage.setItem('membro_header_expanded', String(next))
    }

    function toggleMenu(menu: string) {
        setMenuAberto(prev => prev === menu ? null : menu)
    }

    const hideHeader = pathname === '/membros/login' || pathname === '/membros/termos' || pathname === '/membros/selecionar-congregacao' || pathname.startsWith('/louvor/setlist')
    if (hideHeader) return null

    const iniciais = `${membro.first_name?.[0] || ''}${membro.last_name?.[0] || ''}`
    const isHome = pathname === '/membros/dashboard'
    const podePregacao = permissoes.isAdmin || permissoes.isDiaconia

    // Contar departamentos do membro
    const numDeptos = membro.ministerios?.length || 0
    const numGrupos = (membro.grupos?.length || 0) + (membro.lider_de_grupo?.length || 0)

    // Tem algo no menu departamento?
    const temDepto = permissoes.isAdmin || permissoes.isFinance || permissoes.isCantina || podePregacao || permissoes.isMidia || permissoes.isLouvor || permissoes.isAcolhimento

    // Role label
    const roleLabel = role === 'ADMIN' ? 'Administrador' : role === 'CONGREGATION_ADMIN' ? 'Admin Congregacao' : role === 'LEADER' ? 'Lider' : role === 'FINANCE' ? 'Tesouraria' : role === 'MANAGER' ? 'Gestor' : 'Membro'

    return (
        <header className="bg-bg2 border-b border-soft sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* LINHA PRINCIPAL — Avatar + Nome + Acoes */}
                <div className={`flex items-center justify-between gap-3 transition-all duration-300 ${expandido ? 'py-4' : 'py-3'}`}>
                    <Link href="/membros/dashboard" className="flex items-center gap-3 min-w-0">
                        <div className={`relative shrink-0 transition-all duration-300 ${expandido ? 'w-16 h-16' : 'w-9 h-9'}`}>
                            {membro.avatar_file ? (
                                <Image src={membro.avatar_file} alt="" fill sizes="64px" className="rounded-xl object-cover border border-soft" />
                            ) : (
                                <div className={`w-full h-full rounded-xl bg-fg text-bg flex items-center justify-center font-black border border-soft transition-all duration-300 ${expandido ? 'text-lg' : 'text-[10px]'}`}>
                                    {iniciais}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className={`font-black uppercase tracking-widest text-figueira truncate transition-all duration-300 ${expandido ? 'text-[9px]' : 'text-[7px]'}`}>
                                {igrejaName}{membro.congregacao ? ` · ${membro.congregacao.nome}` : ''}
                            </p>
                            <h1 className={`font-black text-fg italic tracking-tighter uppercase leading-none truncate transition-all duration-300 ${expandido ? 'text-xl' : 'text-sm'}`}>
                                {membro.first_name} <span className={`text-muted/40 ${expandido ? 'inline' : 'hidden sm:inline'}`}>{membro.last_name}</span>
                            </h1>
                            {expandido && (
                                <div className="animate-in fade-in duration-200 mt-1 space-y-0.5">
                                    <p className="text-[9px] font-bold text-muted">
                                        <span className="bg-figueira/10 text-figueira border border-figueira/20 px-2 py-0.5 rounded-md mr-2">{roleLabel}</span>
                                        {membro.email && <span className="text-muted/50">{membro.email}</span>}
                                    </p>
                                    <div className="flex items-center gap-3 text-[8px] font-bold text-muted/60">
                                        {numDeptos > 0 && <span>{numDeptos} departamento{numDeptos !== 1 ? 's' : ''}</span>}
                                        {numGrupos > 0 && <span>{numGrupos} grupo{numGrupos !== 1 ? 's' : ''}</span>}
                                        {membro.phone_1 && <span>{membro.phone_1}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={toggleExpandido}
                            className="h-9 w-9 flex items-center justify-center bg-bg2 border border-soft text-muted rounded-lg hover:text-figueira hover:border-figueira/30 transition-all"
                            title={expandido ? 'Recolher' : 'Expandir'}>
                            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        <Link href="/membros/mural"
                            className="h-9 w-9 flex items-center justify-center bg-bg2 border border-soft text-muted rounded-lg hover:text-figueira hover:border-figueira/30 transition-all"
                            title="Mural">
                            <MessageSquare size={14} />
                        </Link>

                        <NotificacaoHeader avisos={avisos} alertasAcolhimento={alertasAcolhimento} />

                        <form action={logoutMembro}>
                            <button type="submit" className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                <LogOut size={14} strokeWidth={3} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* BARRA DE NAVEGACAO */}
                <div ref={navRef} className="border-t border-soft/60 bg-bg/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-1 py-2 overflow-x-auto custom-scrollbar">

                        {/* HOME */}
                        <Link href="/membros/dashboard"
                            className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                                isHome ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                            }`}>
                            Home
                        </Link>

                        {/* IGREJA (dropdown) */}
                        <div className="relative shrink-0">
                            <button onClick={() => toggleMenu('igreja')}
                                className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1 ${
                                    menuAberto === 'igreja' ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                                }`}>
                                Igreja <ChevronDown size={10} className={`transition-transform ${menuAberto === 'igreja' ? 'rotate-180' : ''}`} />
                            </button>

                            {menuAberto === 'igreja' && (
                                <div className="absolute left-0 top-full mt-1 w-56 bg-bg border border-soft p-1.5 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5 z-50">
                                    <DrawerEditarPerfil membro={membro} escolaridades={escolaridades} isMenuItem />
                                    <Link href="/membros/dashboard?tab=departamentos" onClick={() => setMenuAberto(null)}
                                        className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                        <Users size={12} className="text-figueira" /> Onde Eu Sirvo
                                    </Link>
                                    <ModalRelatorioEscalas membroId={membro.id} isMenuItem />
                                    <ModalIndisponibilidade isMenuItem />
                                    <Link href="/membros/agendar" onClick={() => setMenuAberto(null)}
                                        className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                        <Calendar size={12} className="text-figueira" /> Agendar Reuniao
                                    </Link>
                                    {(permissoes.isLouvor || permissoes.isMidia) && (
                                        <ModalRelatorioLouvor />
                                    )}
                                    <div className="border-t border-soft my-0.5" />
                                    <Link href="/boleia" onClick={() => setMenuAberto(null)}
                                        className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                        <Car size={12} className="text-figueira" /> Boleia Solidaria
                                    </Link>
                                    <Link href="/cantina/menu-local" onClick={() => setMenuAberto(null)}
                                        className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                        <Coffee size={12} className="text-orange-500" /> Menu Cantina
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* DEPARTAMENTO (dropdown, so se tem permissoes) */}
                        {temDepto && (
                            <div className="relative shrink-0">
                                <button onClick={() => toggleMenu('depto')}
                                    className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1 ${
                                        menuAberto === 'depto' ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                                    }`}>
                                    Departamento <ChevronDown size={10} className={`transition-transform ${menuAberto === 'depto' ? 'rotate-180' : ''}`} />
                                </button>

                                {menuAberto === 'depto' && (
                                    <div className="absolute left-0 top-full mt-1 w-52 bg-bg border border-soft p-1.5 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5 z-50">
                                        {permissoes.isAdmin && (
                                            <Link href="/admin/dashboard" onClick={() => setMenuAberto(null)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <ShieldCheck size={12} className="text-figueira" /> Painel Admin
                                            </Link>
                                        )}
                                        {(permissoes.isFinance || permissoes.isAdmin) && (
                                            <Link href="/tesouraria" onClick={() => setMenuAberto(null)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <PieChart size={12} className="text-emerald-500" /> Tesouraria
                                            </Link>
                                        )}
                                        {(permissoes.isCantina || permissoes.isAdmin) && (
                                            <Link href="/cantina" onClick={() => setMenuAberto(null)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <Store size={12} className="text-orange-500" /> Cantina
                                            </Link>
                                        )}
                                        {podePregacao && (
                                            <Link href="/pregacao" onClick={() => setMenuAberto(null)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <BookOpen size={12} className="text-indigo-400" /> Pregacao
                                            </Link>
                                        )}
                                        {permissoes.isMidia && (
                                            <Link href="/midia/holyrics" onClick={() => setMenuAberto(null)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <MonitorPlay size={12} className="text-purple-500" /> Holyrics
                                            </Link>
                                        )}
                                        {(permissoes.isMidia || permissoes.isLouvor) && (
                                            <Link href="/midia/mesax32" onClick={() => setMenuAberto(null)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <Music2 size={12} className="text-blue-500" /> Mesa de Som
                                            </Link>
                                        )}
                                        {permissoes.isMidia && (
                                            <Link href="/midia/lumikit" onClick={() => setMenuAberto(null)}
                                                className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <Lightbulb size={12} className="text-amber-500" /> Iluminacao
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* AJUDA (dropdown) */}
                        <div className="relative shrink-0">
                            <button onClick={() => toggleMenu('ajuda')}
                                className={`px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-1 ${
                                    menuAberto === 'ajuda' ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                                }`}>
                                Ajuda <ChevronDown size={10} className={`transition-transform ${menuAberto === 'ajuda' ? 'rotate-180' : ''}`} />
                            </button>

                            {menuAberto === 'ajuda' && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-bg border border-soft p-1.5 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5 z-50">
                                    <ModalAjuda isMenuItem />
                                    <div className="flex items-center justify-between px-2.5 py-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                                            <Info size={12} className="text-muted2" /> v{APP_VERSION}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
