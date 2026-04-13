'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
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
            // Esconde ao descer, mostra ao subir (threshold 10px para evitar jitter)
            if (y > lastScrollY.current + 10) setHidden(true)
            else if (y < lastScrollY.current - 10) setHidden(false)
            lastScrollY.current = y
        }

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [isHome])

    // Reset ao mudar de rota
    useEffect(() => { setHidden(false); lastScrollY.current = 0 }, [pathname])

    const hideHeader = pathname === '/membros/login' || pathname === '/membros/termos' || pathname === '/membros/selecionar-congregacao' || pathname.startsWith('/louvor/setlist')
    if (hideHeader) return null

    return (
        <header className={`bg-bg2 border-b border-soft fixed top-0 left-0 right-0 z-40 px-4 py-3 md:hidden transition-transform duration-300 ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
            <div className="flex items-center justify-between">
                {/* ESQUERDA: Nome da igreja */}
                <Link href="/membros/dashboard" className="min-w-0">
                    <p className="text-[8px] font-black uppercase tracking-widest text-figueira truncate">
                        {igrejaName}
                    </p>
                </Link>

                {/* DIREITA: Notificações + Logout + Iniciais (abre perfil) */}
                <div className="flex items-center gap-2 shrink-0">
                    <NotificacaoHeader avisos={avisos} alertasAcolhimento={alertasAcolhimento} />
                    <form action={logoutMembro}>
                        <button type="submit" className="h-8 w-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all">
                            <LogOut size={13} strokeWidth={3} />
                        </button>
                    </form>
                    <DrawerEditarPerfil
                        membro={membro}
                        escolaridades={escolaridades}
                        trigger={
                            <div className="h-9 w-9 flex items-center justify-center rounded-full bg-figueira text-white text-[11px] font-black overflow-hidden">
                                {membro.avatar_file ? (
                                    <Image src={membro.avatar_file} alt="" width={36} height={36} className="rounded-full object-cover" />
                                ) : (
                                    iniciais
                                )}
                            </div>
                        }
                    />
                </div>
            </div>
        </header>
    )
}
