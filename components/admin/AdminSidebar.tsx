'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, Home, Calendar, HeartHandshake,
    BarChart3, Settings, Shield, LogOut, Package,
    Palette, Church, CreditCard, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { logoutAdmin } from '@/actions/auth-actions'

const NAV_PRINCIPAL = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Membros', href: '/admin/membros', icon: Users },
    { label: 'Familias', href: '/admin/familias', icon: Home },
    { label: 'Congregacoes', href: '/admin/congregacoes', icon: Church },
    { label: 'Estrutura', href: '/admin/configuracoes', icon: HeartHandshake },
]

const NAV_MODULOS = [
    { label: 'Escalas', href: '/escalas/admin', icon: Calendar, adminOnly: false },
    { label: 'Inventario', href: '/inventario', icon: Package, adminOnly: false },
    { label: 'Relatorios', href: '/admin/relatorios', icon: BarChart3, adminOnly: false },
    { label: 'Loyverse', href: '/admin/relatorios/loyverse', icon: CreditCard, adminOnly: true },
]

const NAV_SISTEMA = [
    { label: 'Personalizacao', href: '/admin/personalizacao', icon: Palette, adminOnly: true },
    { label: 'Definicoes', href: '/admin/configuracoes', icon: Settings, adminOnly: true },
    { label: 'Auditoria', href: '/admin/auditoria', icon: Shield, adminOnly: false },
]

function NavSection({ titulo, items, collapsed, pathname, isFullAdmin = true }: {
    titulo: string
    items: { label: string; href: string; icon: any; adminOnly?: boolean }[]
    collapsed: boolean
    pathname: string
    isFullAdmin?: boolean
}) {
    const filteredItems = items.filter(item => !item.adminOnly || isFullAdmin)
    return (
        <div className="space-y-1">
            {!collapsed && (
                <p className="px-3 text-[8px] font-black uppercase tracking-[0.2em] text-muted mb-2">{titulo}</p>
            )}
            {collapsed && <div className="border-t border-soft my-2" />}
            {filteredItems.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center rounded-xl transition-all ${
                            collapsed
                                ? 'justify-center p-2.5'
                                : 'gap-3 px-3 py-2.5'
                        } ${
                            isActive
                                ? 'bg-figueira/10 text-figueira'
                                : 'text-muted hover:bg-soft/30 hover:text-fg'
                        } text-[10px] font-bold uppercase tracking-widest`}
                    >
                        <Icon size={16} className="shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </Link>
                )
            })}
        </div>
    )
}

export default function AdminSidebar({ adminNome, igrejaName, congregacaoNome, role = 'ADMIN' }: {
    adminNome?: string
    igrejaName?: string
    congregacaoNome?: string | null
    role?: string
}) {
    const isFullAdmin = role === 'ADMIN'
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    // Persist state in localStorage
    useEffect(() => {
        const saved = localStorage.getItem('admin_sidebar_collapsed')
        if (saved === 'true') setCollapsed(true)
    }, [])

    function toggle() {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('admin_sidebar_collapsed', String(next))
    }

    return (
        <aside className={`hidden md:flex bg-bg2 border-r border-soft flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 ${
            collapsed ? 'w-16' : 'w-60'
        }`}>
            {/* HEADER: Igreja + Admin */}
            <div className={`border-b border-soft ${collapsed ? 'px-1.5 py-3' : 'px-3 py-3'}`}>
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    {!collapsed && (
                        <Link href="/admin/dashboard" className="flex items-center gap-2 px-1 min-w-0">
                            <div className="w-7 h-7 bg-figueira rounded-lg flex items-center justify-center shrink-0">
                                <Shield size={14} className="text-white" />
                            </div>
                            <div className="min-w-0">
                                <span className="font-black italic uppercase tracking-tighter text-fg text-sm truncate block">
                                    {adminNome || 'Admin'}
                                </span>
                            </div>
                        </Link>
                    )}
                    <button
                        onClick={toggle}
                        className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-soft/30 transition-all shrink-0"
                        title={collapsed ? 'Expandir menu' : 'Recolher menu'}
                    >
                        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                    </button>
                </div>
                {!collapsed && igrejaName && (
                    <div className="mt-2 px-1 space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-figueira truncate">
                            {igrejaName}
                        </p>
                        {congregacaoNome && (
                            <p className="text-[8px] font-bold text-muted truncate">
                                {congregacaoNome}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* NAV */}
            <nav className={`flex-1 overflow-y-auto space-y-4 ${collapsed ? 'p-1.5' : 'p-3'}`}>
                <NavSection titulo="Igreja" items={NAV_PRINCIPAL} collapsed={collapsed} pathname={pathname} isFullAdmin={isFullAdmin} />
                <NavSection titulo="Modulos" items={NAV_MODULOS} collapsed={collapsed} pathname={pathname} isFullAdmin={isFullAdmin} />
                <NavSection titulo="Sistema" items={NAV_SISTEMA} collapsed={collapsed} pathname={pathname} isFullAdmin={isFullAdmin} />
            </nav>

            {/* FOOTER */}
            <div className={`border-t border-soft space-y-1 ${collapsed ? 'p-1.5' : 'p-3'}`}>
                <Link
                    href="/membros/dashboard"
                    title={collapsed ? 'Painel do Membro' : undefined}
                    className={`flex items-center rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-soft/30 hover:text-fg transition-all ${
                        collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                    }`}
                >
                    <LayoutDashboard size={16} className="shrink-0" />
                    {!collapsed && <span>Painel do Membro</span>}
                </Link>

                <form action={logoutAdmin}>
                    <button
                        type="submit"
                        title={collapsed ? 'Terminar Sessao' : undefined}
                        className={`w-full flex items-center rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all ${
                            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                        }`}
                    >
                        <LogOut size={16} className="shrink-0" />
                        {!collapsed && <span>Terminar Sessao</span>}
                    </button>
                </form>
            </div>
        </aside>
    )
}
