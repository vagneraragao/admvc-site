'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, SunMoon } from 'lucide-react'
import { useHighContrast } from '@/hooks/useHighContrast'
import { logoutMembro } from '@/actions/auth-actions'
import DrawerEditarPerfil from '@/components/membros/DrawerEditarPerfil'
import NotificacaoHeader from '@/components/membros/NotificacaoHeader'

interface Props {
    membro: any
    igrejaName: string
    escolaridades: any[]
    avisos?: any[]
    alertasAcolhimento?: any[]
}

function HighContrastButton() {
    const { active, toggle } = useHighContrast()
    return (
        <button
            onClick={toggle}
            className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${active ? 'bg-figueira text-white' : 'bg-soft text-muted hover:text-fg'}`}
            aria-label="Modo alto contraste"
        >
            <SunMoon size={13} strokeWidth={3} />
        </button>
    )
}

export default function MobileHeader({ membro, igrejaName, escolaridades, avisos = [], alertasAcolhimento = [] }: Props) {
    const pathname = usePathname()
    const iniciais = `${membro.first_name?.[0] || ''}${membro.last_name?.[0] || ''}`
    const [hidden, setHidden] = useState(false)
    const lastScrollY = useRef(0)

    const isHome = pathname === '/membros/dashboard'

    useEffect(() => {
        if (!isHome) { setHidden(false); return }

        function onScroll() {
            const y = window.scrollY
            if (y > lastScrollY.current + 10) setHidden(true)
            else if (y < lastScrollY.current - 10) setHidden(false)
            lastScrollY.current = y
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [isHome])

    useEffect(() => { setHidden(false); lastScrollY.current = 0 }, [pathname])

    const hideHeader = pathname === '/membros/login' || pathname === '/membros/termos' || pathname === '/membros/selecionar-congregacao' || pathname.startsWith('/louvor/setlist') || pathname === '/cantina/pos'
    if (hideHeader) return null

    return (
        <header className={`bg-bg2 border-b border-soft fixed top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top)] px-4 py-2.5 md:hidden transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
            <div className="flex items-center justify-between gap-3">
                {/* ESQUERDA: Foto + Nome da igreja */}
                <DrawerEditarPerfil
                    membro={membro}
                    escolaridades={escolaridades}
                    trigger={
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-figueira text-white text-[11px] font-black overflow-hidden shrink-0">
                                {membro.avatar_file ? (
                                    <Image src={membro.avatar_file} alt="" width={36} height={36} className="rounded-full object-cover" />
                                ) : (
                                    iniciais
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase italic tracking-tighter text-fg truncate leading-tight">
                                    {membro.first_name} {membro.last_name}
                                </p>
                                <p className="text-[7px] font-black uppercase tracking-widest text-figueira truncate leading-tight">
                                    {igrejaName}
                                </p>
                            </div>
                        </div>
                    }
                />

                {/* DIREITA: Notificações + Alto Contraste + Logout */}
                <div className="flex items-center gap-2 shrink-0">
                    <NotificacaoHeader avisos={avisos} alertasAcolhimento={alertasAcolhimento} />
                    <HighContrastButton />
                    <form action={logoutMembro}>
                        <button type="submit" className="h-8 w-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                            <LogOut size={13} strokeWidth={3} />
                        </button>
                    </form>
                </div>
            </div>
        </header>
    )
}
