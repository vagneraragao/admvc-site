'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import {
    Home, HelpCircle, Calendar, Music2, MonitorPlay, HeartHandshake, Store,
    BookOpen, ShieldCheck, X, ChevronDown, ChevronRight, MessageCircle, Clock,
    Lightbulb, Monitor
} from 'lucide-react'
import ModalAjuda from '@/components/membros/ModalAjuda'

interface Permissoes {
    isAdmin: boolean
    isLider: boolean
    isMidia: boolean
    isAcolhimento: boolean
    isCantina: boolean
    isFinance: boolean
    isLouvor: boolean
    isDiaconia: boolean
    isSocial: boolean
}

interface Evento {
    id: number
    nome: string
    data: string
}

interface Props {
    permissoes: Permissoes
    proximosEventos?: Evento[]
}

export default function MobileBottomNav({ permissoes, proximosEventos = [] }: Props) {
    const pathname = usePathname()
    const [agendaAberta, setAgendaAberta] = useState(false)
    const [louvorAberto, setLouvorAberto] = useState(false)
    const [midiaAberto, setMidiaAberto] = useState(false)
    const [mostrarTodos, setMostrarTodos] = useState(false)

    const hideNav = pathname === '/membros/login' || pathname === '/membros/termos' || pathname === '/membros/selecionar-congregacao' || pathname.startsWith('/louvor/setlist') || pathname === '/cantina/pos'
    if (hideNav) return null

    // Build dynamic tabs: Home, Ajuda, Agenda, depois departamentos
    const tabs: { key: string; icon: typeof Home; label: string; href?: string; action?: () => void; custom?: React.ReactNode }[] = [
        { key: 'home', icon: Home, label: 'Inicio', href: '/membros/dashboard' },
        { key: 'ajuda', icon: HelpCircle, label: 'Ajuda', custom: 'ajuda' },
    ]

    if (permissoes.isLouvor) tabs.push({ key: 'louvor', icon: Music2, label: 'Louvor', action: () => setLouvorAberto(true) })
    if (permissoes.isMidia) tabs.push({ key: 'midia', icon: MonitorPlay, label: 'Midia', action: () => setMidiaAberto(true) })
    if (permissoes.isAcolhimento) tabs.push({ key: 'acolhimento', icon: HeartHandshake, label: 'Acolhimento', href: '/departamentos/acolhimento/dashboard' })
    if (permissoes.isCantina) tabs.push({ key: 'cantina', icon: Store, label: 'Cantina', href: '/cantina' })
    if (permissoes.isSocial) tabs.push({ key: 'social', icon: HeartHandshake, label: 'Social', href: '/assistencia' })
    if (permissoes.isDiaconia) tabs.push({ key: 'pregacao', icon: BookOpen, label: 'Pregacao', href: '/pregacao' })
    if (permissoes.isAdmin) tabs.push({ key: 'admin', icon: ShieldCheck, label: 'Admin', href: '/admin/dashboard' })

    const visibleTabs = tabs.slice(0, 5)
    const eventosVisiveis = mostrarTodos ? proximosEventos : proximosEventos.slice(0, 4)

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg2 border-t border-soft pb-[env(safe-area-inset-bottom)] md:hidden">
                <div className="flex items-center justify-around px-2 py-2">
                    {visibleTabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = tab.href
                            ? (tab.href === '/membros/dashboard' ? pathname === '/membros/dashboard' : pathname.startsWith(tab.href))
                            : false

                        // Ajuda — usa ModalAjuda com trigger
                        if (tab.custom === 'ajuda') {
                            return (
                                <ModalAjuda key={tab.key} trigger={
                                    <div className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] text-muted hover:text-fg">
                                        <HelpCircle size={20} strokeWidth={1.5} />
                                        <span className="text-[7px] font-black uppercase tracking-widest">Ajuda</span>
                                    </div>
                                } />
                            )
                        }

                        if (tab.action) {
                            return (
                                <button
                                    key={tab.key}
                                    onClick={tab.action}
                                    className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] text-muted hover:text-fg"
                                >
                                    <Icon size={20} strokeWidth={1.5} />
                                    <span className="text-[7px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            )
                        }

                        return (
                            <Link
                                key={tab.key}
                                href={tab.href!}
                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                                    isActive ? 'text-figueira' : 'text-muted hover:text-fg'
                                }`}
                            >
                                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                <span className={`text-[7px] font-black uppercase tracking-widest ${isActive ? 'text-figueira' : ''}`}>
                                    {tab.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* MODAL AGENDA */}
            {agendaAberta && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => { setAgendaAberta(false); setMostrarTodos(false) }}
                >
                    <div
                        className="bg-bg w-full max-w-md rounded-t-[2rem] border-t border-soft shadow-2xl animate-in slide-in-from-bottom-4 duration-200 max-h-[80vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-soft shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-figueira/10 text-figueira flex items-center justify-center">
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg">Agenda</h3>
                                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest">{proximosEventos.length} eventos</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setAgendaAberta(false); setMostrarTodos(false) }}
                                className="w-8 h-8 flex items-center justify-center bg-soft text-muted hover:text-fg rounded-xl transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Lista de eventos */}
                        <div className="overflow-y-auto p-4 space-y-2 flex-1">
                            {eventosVisiveis.length > 0 ? (
                                eventosVisiveis.map((evento) => {
                                    const d = new Date(evento.data)
                                    const dia = d.toLocaleDateString('pt-PT', { day: '2-digit' })
                                    const mes = d.toLocaleDateString('pt-PT', { month: 'short' })
                                    const diaSemana = d.toLocaleDateString('pt-PT', { weekday: 'short' })
                                    const hora = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

                                    const dataCompleta = d.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                                    const dataCapitalizada = dataCompleta.charAt(0).toUpperCase() + dataCompleta.slice(1)

                                    function partilharWhatsApp() {
                                        const texto = `⛪ *${evento.nome.toUpperCase()}*\n📅 ${dataCapitalizada}\n⏰ ${hora}\n\n🙏 Vemo-nos lá!`
                                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank')
                                    }

                                    return (
                                        <details key={evento.id} className="bg-bg2 border border-soft rounded-xl overflow-hidden group/ev">
                                            <summary className="flex items-center gap-3 p-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden select-none">
                                                <div className="p-2 rounded-lg bg-fg text-bg text-center min-w-[44px] shrink-0">
                                                    <span className="block text-[7px] font-black uppercase opacity-60">{mes}</span>
                                                    <span className="block text-lg font-black italic leading-tight">{dia}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-[11px] font-black uppercase italic text-fg truncate">{evento.nome}</h4>
                                                    <p className="text-[9px] text-muted font-bold mt-0.5">
                                                        {diaSemana} · {hora}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-muted shrink-0 transition-transform group-open/ev:rotate-90" />
                                            </summary>

                                            <div className="px-3 pb-3 pt-1 border-t border-soft space-y-3 animate-in fade-in duration-200">
                                                {/* Detalhes */}
                                                <div className="space-y-1.5">
                                                    <div className="flex items-center gap-2 text-[10px] text-fg font-medium">
                                                        <Calendar size={11} className="text-figueira shrink-0" />
                                                        {dataCapitalizada}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] text-muted">
                                                        <Clock size={11} className="shrink-0" />
                                                        {hora}
                                                    </div>
                                                </div>

                                                {/* Botão WhatsApp */}
                                                <button
                                                    onClick={partilharWhatsApp}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 text-green-600 border border-green-200 text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all active:scale-95"
                                                >
                                                    <MessageCircle size={13} /> Partilhar no WhatsApp
                                                </button>
                                            </div>
                                        </details>
                                    )
                                })
                            ) : (
                                <div className="text-center py-8">
                                    <Calendar size={28} className="mx-auto text-muted/20 mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Sem eventos agendados</p>
                                </div>
                            )}

                            {/* Botão ver mais / ver menos */}
                            {proximosEventos.length > 4 && (
                                <button
                                    onClick={() => setMostrarTodos(!mostrarTodos)}
                                    className="w-full py-2.5 text-[9px] font-black uppercase tracking-widest text-figueira hover:text-fg transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <ChevronDown size={12} className={`transition-transform ${mostrarTodos ? 'rotate-180' : ''}`} />
                                    {mostrarTodos ? 'Ver menos' : `Ver todos (${proximosEventos.length})`}
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL LOUVOR */}
            {louvorAberto && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setLouvorAberto(false)}
                >
                    <div
                        className="bg-bg w-full max-w-md rounded-t-[2rem] border-t border-soft shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-soft">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-figueira/10 text-figueira flex items-center justify-center">
                                    <Music2 size={18} />
                                </div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg">Louvor</h3>
                            </div>
                            <button onClick={() => setLouvorAberto(false)}
                                className="w-8 h-8 flex items-center justify-center bg-soft text-muted hover:text-fg rounded-xl transition-all">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            <Link
                                href="/louvor/repertorio"
                                onClick={() => setLouvorAberto(false)}
                                className="flex items-center gap-3 p-4 bg-bg2 border border-soft rounded-xl hover:border-figueira/30 transition-all"
                            >
                                <Music2 size={18} className="text-figueira shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-black uppercase text-fg">Repertório</h4>
                                    <p className="text-[8px] text-muted font-bold mt-0.5">Setlists, cifras e músicas</p>
                                </div>
                                <ChevronRight size={14} className="text-muted" />
                            </Link>
                            <Link
                                href="/midia/mesax32"
                                onClick={() => setLouvorAberto(false)}
                                className="flex items-center gap-3 p-4 bg-bg2 border border-soft rounded-xl hover:border-figueira/30 transition-all"
                            >
                                <MonitorPlay size={18} className="text-blue-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-black uppercase text-fg">Mesa X32</h4>
                                    <p className="text-[8px] text-muted font-bold mt-0.5">Controlo de som</p>
                                </div>
                                <ChevronRight size={14} className="text-muted" />
                            </Link>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL MÍDIA */}
            {midiaAberto && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setMidiaAberto(false)}
                >
                    <div
                        className="bg-bg w-full max-w-md rounded-t-[2rem] border-t border-soft shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-soft">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                                    <MonitorPlay size={18} />
                                </div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg">Mídia</h3>
                            </div>
                            <button onClick={() => setMidiaAberto(false)}
                                className="w-8 h-8 flex items-center justify-center bg-soft text-muted hover:text-fg rounded-xl transition-all">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="p-4 space-y-2">
                            <Link href="/midia/holyrics" onClick={() => setMidiaAberto(false)}
                                className="flex items-center gap-3 p-4 bg-bg2 border border-soft rounded-xl hover:border-figueira/30 transition-all">
                                <Monitor size={18} className="text-purple-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-black uppercase text-fg">Holyrics</h4>
                                    <p className="text-[8px] text-muted font-bold mt-0.5">Projeção de letras e media</p>
                                </div>
                                <ChevronRight size={14} className="text-muted" />
                            </Link>
                            <Link href="/midia/mesax32" onClick={() => setMidiaAberto(false)}
                                className="flex items-center gap-3 p-4 bg-bg2 border border-soft rounded-xl hover:border-figueira/30 transition-all">
                                <Music2 size={18} className="text-blue-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-black uppercase text-fg">Mesa X32</h4>
                                    <p className="text-[8px] text-muted font-bold mt-0.5">Controlo de som</p>
                                </div>
                                <ChevronRight size={14} className="text-muted" />
                            </Link>
                            <Link href="/midia/lumikit" onClick={() => setMidiaAberto(false)}
                                className="flex items-center gap-3 p-4 bg-bg2 border border-soft rounded-xl hover:border-figueira/30 transition-all">
                                <Lightbulb size={18} className="text-amber-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-black uppercase text-fg">Iluminação</h4>
                                    <p className="text-[8px] text-muted font-bold mt-0.5">Lumikit</p>
                                </div>
                                <ChevronRight size={14} className="text-muted" />
                            </Link>
                            <Link href="/louvor/repertorio" onClick={() => setMidiaAberto(false)}
                                className="flex items-center gap-3 p-4 bg-bg2 border border-soft rounded-xl hover:border-figueira/30 transition-all">
                                <Calendar size={18} className="text-figueira shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-black uppercase text-fg">Setlist do Culto</h4>
                                    <p className="text-[8px] text-muted font-bold mt-0.5">Músicas e repertório do dia</p>
                                </div>
                                <ChevronRight size={14} className="text-muted" />
                            </Link>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
