'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Home, Music2, MonitorPlay, HeartHandshake, Store, BookOpen, ShieldCheck
} from 'lucide-react'

interface Permissoes {
    isAdmin: boolean
    isLider: boolean
    isMidia: boolean
    isAcolhimento: boolean
    isCantina: boolean
    isFinance: boolean
    isLouvor: boolean
    isDiaconia: boolean
}

interface Props {
    permissoes: Permissoes
}

export default function MobileBottomNav({ permissoes }: Props) {
    const pathname = usePathname()

    const hideNav = pathname === '/membros/login' || pathname === '/membros/termos' || pathname === '/membros/selecionar-congregacao' || pathname.startsWith('/louvor/setlist')
    if (hideNav) return null

    // Build dynamic tabs based on member's departments
    const tabs: { key: string; icon: typeof Home; label: string; href: string }[] = [
        { key: 'home', icon: Home, label: 'Inicio', href: '/membros/dashboard' },
    ]

    if (permissoes.isLouvor) {
        tabs.push({ key: 'louvor', icon: Music2, label: 'Louvor', href: '/midia/mesax32' })
    }
    if (permissoes.isMidia) {
        tabs.push({ key: 'midia', icon: MonitorPlay, label: 'Midia', href: '/midia/holyrics' })
    }
    if (permissoes.isAcolhimento) {
        tabs.push({ key: 'acolhimento', icon: HeartHandshake, label: 'Acolhimento', href: '/departamentos/acolhimento/dashboard' })
    }
    if (permissoes.isCantina) {
        tabs.push({ key: 'cantina', icon: Store, label: 'Cantina', href: '/cantina' })
    }
    if (permissoes.isDiaconia) {
        tabs.push({ key: 'pregacao', icon: BookOpen, label: 'Pregacao', href: '/pregacao' })
    }
    if (permissoes.isAdmin) {
        tabs.push({ key: 'admin', icon: ShieldCheck, label: 'Admin', href: '/admin/dashboard' })
    }

    // Limit to max 5 tabs to avoid crowding
    const visibleTabs = tabs.slice(0, 5)

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg2 border-t border-soft pb-[env(safe-area-inset-bottom)] md:hidden">
            <div className="flex items-center justify-around px-2 py-2">
                {visibleTabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = tab.href === '/membros/dashboard'
                        ? pathname === '/membros/dashboard'
                        : pathname.startsWith(tab.href)

                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                                isActive
                                    ? 'text-figueira'
                                    : 'text-muted hover:text-fg'
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
    )
}
