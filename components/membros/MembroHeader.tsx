'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    ShieldCheck, PieChart, UserCircle, LogOut, Users,
    LayoutDashboard, HeartHandshake, Store, Menu, MonitorPlay,
    Wallet2, Home, Church, Music2, Lightbulb, BarChart3, Calendar, MessageSquare,
    BookOpen, GraduationCap, ChevronDown, ChevronUp
} from 'lucide-react'
import { logoutMembro } from '@/actions/auth-actions'
import DrawerEditarPerfil from '@/components/membros/DrawerEditarPerfil'
import ModalIndisponibilidade from '@/components/membros/ModalIndisponibilidade'
import ModalRelatorioEscalas from '@/components/membros/ModalRelatorioEscalas'
import ModalRelatorioLouvor from '@/components/louvor/ModalRelatorioLouvor'
import NotificacaoHeader from '@/components/membros/NotificacaoHeader'
import PushNotificationSetup from '@/components/ui/PushNotificationSetup'

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
    const [menuAberto, setMenuAberto] = useState(false)
    const [expandido, setExpandido] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => setMounted(true), [])

    // Fechar menu ao navegar
    useEffect(() => { setMenuAberto(false) }, [pathname])

    // Fechar menu ao clicar fora
    useEffect(() => {
        if (!menuAberto) return
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [menuAberto])

    // Persistir estado expandido
    useEffect(() => {
        const saved = localStorage.getItem('membro_header_expanded')
        if (saved === 'true') setExpandido(true)
    }, [])

    function toggleExpandido() {
        const next = !expandido
        setExpandido(next)
        localStorage.setItem('membro_header_expanded', String(next))
    }

    const hideHeader = pathname === '/membros/login' || pathname === '/membros/termos' || pathname === '/membros/selecionar-congregacao' || pathname.startsWith('/louvor/setlist')
    if (hideHeader) return null

    const iniciais = `${membro.first_name?.[0] || ''}${membro.last_name?.[0] || ''}`

    // Detectar rota activa
    const isHome = pathname === '/membros/dashboard'
    const isTesouraria = pathname.startsWith('/tesouraria') || pathname.startsWith('/departamentos/financeiro')
    const isAcolhimento = pathname.startsWith('/departamentos/acolhimento')
    const isCantina = pathname.startsWith('/cantina') || pathname.startsWith('/departamentos/cantina')
    const isAcaoSocial = pathname.startsWith('/acaosocial')
    const isMidiaRoute = pathname.startsWith('/midia')
    const isHolyrics = pathname.startsWith('/midia/holyrics')
    const isMesaSom = pathname.startsWith('/midia/mesax32')
    const isLumikit = pathname.startsWith('/midia/lumikit')
    const isPregacao = pathname.startsWith('/pregacao')
    const isEBD = pathname.startsWith('/ebd')

    // Breadcrumb do modulo activo
    const moduloPath = isTesouraria ? 'Tesouraria'
        : isAcolhimento ? 'Acolhimento'
        : isCantina ? 'Cantina'
        : isAcaoSocial ? 'Acao Social'
        : isHolyrics ? 'Midia / Holyrics'
        : isMesaSom ? 'Midia / Mesa de Som'
        : isLumikit ? 'Midia / Iluminacao'
        : isMidiaRoute ? 'Midia'
        : isPregacao ? 'Pregacao'
        : null

    const podePregacao = permissoes.isAdmin || permissoes.isDiaconia

    return (
        <header className="bg-bg2 border-b border-soft sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* LINHA PRINCIPAL */}
                <div className={`flex items-center justify-between gap-3 transition-all duration-300 ${expandido ? 'py-4' : 'py-3'}`}>
                    <Link href="/membros/dashboard" className="flex items-center gap-3 min-w-0">
                        <div className={`relative shrink-0 transition-all duration-300 ${expandido ? 'w-14 h-14' : 'w-9 h-9'}`}>
                            {membro.avatar_file ? (
                                <Image src={membro.avatar_file} alt="" fill className="rounded-lg object-cover border border-soft" />
                            ) : (
                                <div className={`w-full h-full rounded-lg bg-fg text-bg flex items-center justify-center font-black border border-soft transition-all duration-300 ${expandido ? 'text-base rounded-xl' : 'text-[10px]'}`}>
                                    {iniciais}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className={`font-black uppercase tracking-widest text-figueira truncate transition-all duration-300 ${expandido ? 'text-[8px]' : 'text-[7px]'}`}>
                                {igrejaName}{membro.congregacao ? ` · ${membro.congregacao.nome}` : ''}
                            </p>
                            <h1 className={`font-black text-fg italic tracking-tighter uppercase leading-none truncate transition-all duration-300 ${expandido ? 'text-lg' : 'text-sm'}`}>
                                {membro.first_name} <span className={`text-muted/40 ${expandido ? 'inline' : 'hidden sm:inline'}`}>{membro.last_name}</span>
                            </h1>
                            {expandido && (
                                <p className="text-[8px] font-bold text-muted mt-0.5 animate-in fade-in duration-200">
                                    {role === 'ADMIN' ? 'Administrador' : role === 'LEADER' ? 'Lider' : role === 'FINANCE' ? 'Tesouraria' : 'Membro'}
                                    {membro.email && <span className="ml-2 text-muted/50">{membro.email}</span>}
                                </p>
                            )}
                        </div>
                    </Link>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Botão expandir/recolher */}
                        <button onClick={toggleExpandido}
                            className="h-9 w-9 flex items-center justify-center bg-bg2 border border-soft text-muted rounded-lg hover:text-figueira hover:border-figueira/30 transition-all"
                            title={expandido ? 'Recolher' : 'Expandir'}>
                            {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {/* MENU SERVIÇO */}
                        <div ref={menuRef} className="relative z-50">
                            <button onClick={() => setMenuAberto(!menuAberto)}
                                className={`h-9 px-3 rounded-lg flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95 ${menuAberto ? 'bg-fg text-bg' : 'bg-figueira text-white hover:bg-figueira/90'}`}>
                                <Menu size={14} /> Servico
                            </button>

                            {menuAberto && (
                                <div className="absolute right-0 top-full mt-1.5 w-56 bg-bg border border-soft p-1.5 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5">
                                    <p className="text-[7px] font-black uppercase text-muted tracking-widest px-2.5 pt-1 pb-0.5">Minha Conta</p>
                                    <DrawerEditarPerfil membro={membro} escolaridades={escolaridades} isMenuItem />
                                    <ModalIndisponibilidade isMenuItem />
                                    <ModalRelatorioEscalas membroId={membro.id} isMenuItem />
                                    {(permissoes.isLouvor || permissoes.isMidia) && (
                                        <ModalRelatorioLouvor />
                                    )}
                                    <Link href="/membros/agendar" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                        <Calendar size={12} className="text-figueira" /> Agendar Reuniao
                                    </Link>

                                    {mostraServico && <div className="border-t border-soft my-0.5" />}

                                    {mostraServico && (
                                        <>
                                            <p className="text-[7px] font-black uppercase text-muted tracking-widest px-2.5 pt-1 pb-0.5">Departamentos</p>
                                            {permissoes.isAdmin && (
                                                <Link href="/admin/dashboard" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <ShieldCheck size={12} className="text-figueira" /> Painel Admin
                                                </Link>
                                            )}
                                            {permissoes.isFinance && (
                                                <Link href="/tesouraria" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <PieChart size={12} className="text-emerald-500" /> Tesouraria
                                                </Link>
                                            )}
                                            {permissoes.isAcolhimento && (
                                                <Link href="/departamentos/acolhimento/dashboard" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <HeartHandshake size={12} className="text-blue-500" /> Acolhimento
                                                </Link>
                                            )}
                                            {permissoes.isCantina && (
                                                <Link href="/cantina" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <Store size={12} className="text-orange-500" /> Cantina
                                                </Link>
                                            )}
                                            {podePregacao && (
                                                <Link href="/pregacao" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <BookOpen size={12} className="text-indigo-400" /> Pregacao
                                                </Link>
                                            )}
                                            {permissoes.isMidia && (
                                                <Link href="/midia/holyrics" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <MonitorPlay size={12} className="text-purple-500" /> Holyrics
                                                </Link>
                                            )}
                                            {(permissoes.isMidia || permissoes.isLouvor) && (
                                                <Link href="/midia/mesax32" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <Music2 size={12} className="text-blue-500" /> Mesa de Som
                                                </Link>
                                            )}
                                            {permissoes.isMidia && (
                                                <Link href="/midia/lumikit" onClick={() => setMenuAberto(false)} className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                    <Lightbulb size={12} className="text-amber-500" /> Iluminacao
                                                </Link>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <Link href="/membros/mural"
                            className="h-9 w-9 flex items-center justify-center bg-bg2 border border-soft text-muted rounded-lg hover:text-figueira hover:border-figueira/30 transition-all"
                            title="Mural">
                            <MessageSquare size={14} />
                        </Link>
                        <PushNotificationSetup />
                        <NotificacaoHeader avisos={avisos} alertasAcolhimento={alertasAcolhimento} />

                        <form action={logoutMembro}>
                            <button type="submit" className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                <LogOut size={14} strokeWidth={3} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* NAV BAR */}
                <div className="flex items-center gap-1 pb-2 overflow-x-auto custom-scrollbar -mt-1">
                    <Link href="/membros/dashboard"
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            isHome && !moduloPath ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                        }`}>
                        Home
                    </Link>
                    <Link href="/membros/dashboard?tab=departamentos"
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            mounted && globalThis?.location?.search?.includes('tab=departamentos') ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                        }`}>
                        Igreja
                    </Link>
                    <Link href="/ebd"
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            isEBD ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                        }`}>
                        Cursos
                    </Link>
                    {moduloPath && !isEBD && (
                        <>
                            <span className="text-muted/30 text-[9px]">/</span>
                            <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-figueira/10 text-figueira border border-figueira/20 whitespace-nowrap">
                                {moduloPath}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
