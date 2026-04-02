'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
    ShieldCheck, PieChart, UserCircle, LogOut, Users,
    LayoutDashboard, HeartHandshake, Store, Menu, MonitorPlay,
    Wallet2, Home, Church
} from 'lucide-react'
import { logoutMembro } from '@/actions/auth-actions'
import DrawerEditarPerfil from '@/components/membros/DrawerEditarPerfil'
import ModalIndisponibilidade from '@/components/membros/ModalIndisponibilidade'
import ModalRelatorioEscalas from '@/components/membros/ModalRelatorioEscalas'

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
    }
    mostraServico: boolean
    escolaridades: any[]
}

const NAV_ITEMS = [
    { href: '/membros/dashboard', label: 'Home', match: '/membros/dashboard' },
    { href: '/membros/dashboard?tab=departamentos', label: 'Igreja', match: 'tab=departamentos' },
]

export default function MembroHeader({ membro, igrejaName, role, permissoes, mostraServico, escolaridades }: Props) {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // Paginas que nao devem mostrar header
    const hideHeader = pathname === '/membros/login' || pathname === '/membros/termos' || pathname === '/membros/selecionar-congregacao'
    if (hideHeader) return null

    const iniciais = `${membro.first_name?.[0] || ''}${membro.last_name?.[0] || ''}`

    // Detectar rota activa para highlight
    const isHome = pathname === '/membros/dashboard' && !globalThis?.location?.search?.includes('tab=')
    const isIgreja = globalThis?.location?.search?.includes('tab=departamentos')
    const isTesouraria = pathname.startsWith('/membros/tesouraria') || pathname.startsWith('/departamentos/financeiro')
    const isAcolhimento = pathname.startsWith('/membros/acolhimento') || pathname.startsWith('/departamentos/acolhimento')
    const isCantina = pathname.startsWith('/membros/cantina') || pathname.startsWith('/departamentos/cantina')
    const isMidia = pathname.startsWith('/louvor')
    const isModulo = isTesouraria || isAcolhimento || isCantina || isMidia

    // Label do modulo activo
    const moduloLabel = isTesouraria ? 'Tesouraria' : isAcolhimento ? 'Acolhimento' : isCantina ? 'Cantina' : isMidia ? 'Midia' : null

    return (
        <header className="bg-bg2 border-b border-soft sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* LINHA PRINCIPAL */}
                <div className="flex items-center justify-between py-4 gap-4">
                    {/* ESQUERDA: Foto + Nome */}
                    <Link href="/membros/dashboard" className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 shrink-0">
                            {membro.avatar_file ? (
                                <Image src={membro.avatar_file} alt="Perfil" fill className="rounded-xl object-cover border border-soft" />
                            ) : (
                                <div className="w-full h-full rounded-xl bg-fg text-bg flex items-center justify-center text-xs font-black border border-soft">
                                    {iniciais}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[7px] font-black uppercase tracking-widest text-figueira truncate">
                                {igrejaName}{membro.congregacao ? ` · ${membro.congregacao.nome}` : ''}
                            </p>
                            <h1 className="text-sm sm:text-base font-black text-fg italic tracking-tighter uppercase leading-none truncate">
                                {membro.first_name} <span className="text-muted/40 hidden sm:inline">{membro.last_name}</span>
                            </h1>
                        </div>
                    </Link>

                    {/* DIREITA: Menu + Acoes */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* MENU SERVIÇO */}
                        <details className="group relative z-50">
                            <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                                <div className="h-9 px-3 bg-figueira text-white rounded-lg flex items-center gap-1.5 hover:bg-figueira/90 transition-all active:scale-95 text-[8px] font-black uppercase tracking-widest">
                                    <Menu size={14} /> Servico
                                </div>
                            </summary>
                            <div className="absolute right-0 top-full mt-1.5 w-56 bg-bg border border-soft p-1.5 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-0.5 z-50">
                                <p className="text-[7px] font-black uppercase text-muted tracking-widest px-2.5 pt-1 pb-0.5">Minha Conta</p>
                                <DrawerEditarPerfil membro={membro} escolaridades={escolaridades} isMenuItem />
                                <ModalIndisponibilidade isMenuItem />
                                <ModalRelatorioEscalas membroId={membro.id} isMenuItem />
                                <Link href="/membros/dashboard?tab=financeiro" className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                    <Wallet2 size={12} className="text-emerald-500" /> Financas
                                </Link>

                                {mostraServico && <div className="border-t border-soft my-0.5" />}

                                {mostraServico && (
                                    <>
                                        <p className="text-[7px] font-black uppercase text-muted tracking-widest px-2.5 pt-1 pb-0.5">Departamentos</p>
                                        {permissoes.isAdmin && (
                                            <Link href="/admin/dashboard" className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <ShieldCheck size={12} className="text-figueira" /> Painel Admin
                                            </Link>
                                        )}
                                        {permissoes.isFinance && (
                                            <Link href="/departamentos/financeiro/dashboard" className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <PieChart size={12} className="text-emerald-500" /> Tesouraria
                                            </Link>
                                        )}
                                        {permissoes.isAcolhimento && (
                                            <Link href="/departamentos/acolhimento/dashboard" className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <HeartHandshake size={12} className="text-blue-500" /> Acolhimento
                                            </Link>
                                        )}
                                        {permissoes.isCantina && (
                                            <Link href="/departamentos/cantina/dashboard" className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <Store size={12} className="text-orange-500" /> Cantina
                                            </Link>
                                        )}
                                        {permissoes.isMidia && (
                                            <Link href="/louvor/holyrics" className="text-[9px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-2.5 py-2 rounded-lg transition-all flex items-center gap-2.5">
                                                <MonitorPlay size={12} className="text-purple-500" /> Midia
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </details>

                        {/* LOGOUT */}
                        <form action={logoutMembro}>
                            <button type="submit" className="h-9 w-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                                <LogOut size={14} strokeWidth={3} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* BARRA DE NAVEGACAO / MODULO ACTIVO */}
                <div className="flex items-center gap-1 pb-2 overflow-x-auto custom-scrollbar -mt-1">
                    <Link href="/membros/dashboard"
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            isHome && !isModulo ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                        }`}>
                        Home
                    </Link>
                    <Link href="/membros/dashboard?tab=departamentos"
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            isIgreja ? 'bg-fg text-bg' : 'text-muted hover:bg-soft/30 hover:text-fg'
                        }`}>
                        Igreja
                    </Link>
                    {moduloLabel && (
                        <span className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-figueira/10 text-figueira border border-figueira/20 whitespace-nowrap">
                            {moduloLabel}
                        </span>
                    )}
                </div>
            </div>
        </header>
    )
}
