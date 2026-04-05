'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, Users, Home, Calendar, HeartHandshake,
    BarChart3, Settings, Shield, LogOut, Package,
    Palette, Church, CreditCard, PanelLeftClose, PanelLeftOpen,
    Menu, X, MonitorPlay, BookOpen, GraduationCap, Car,
    Coffee, ShoppingCart, Wallet2, Clock, ChevronDown, ChevronUp, Store, Banknote
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
    { label: 'Escalas', href: '/admin/escalas', icon: Calendar, adminOnly: false },
    { label: 'Inventario', href: '/admin/inventario', icon: Package, adminOnly: false },
    { label: 'Relatorios', href: '/admin/relatorios', icon: BarChart3, adminOnly: false },
    { label: 'Rel. Escalas', href: '/admin/relatorios/escalas', icon: Calendar, adminOnly: false },
    { label: 'Loyverse', href: '/admin/relatorios/loyverse', icon: CreditCard, adminOnly: true },
    { label: 'Pregacao', href: '/admin/formacao/pregacao', icon: BookOpen, adminOnly: false },
    { label: 'Cursos', href: '/admin/formacao/ebd', icon: GraduationCap, adminOnly: false },
    { label: 'Assistencia', href: '/assistencia', icon: HeartHandshake, adminOnly: false },
    { label: 'Fundos', href: '/financeiro/fundos', icon: Wallet2, adminOnly: true },
    { label: 'Despesas', href: '/financeiro/despesas', icon: Banknote, adminOnly: false },
    { label: 'Orcamento', href: '/financeiro/orcamento', icon: BarChart3, adminOnly: true },
]

const NAV_CANTINA = [
    { label: 'Produtos', href: '/cantina/produtos', icon: Package },
    { label: 'POS', href: '/cantina/pos', icon: CreditCard },
    { label: 'Vendas', href: '/cantina/dashboard', icon: BarChart3 },
    { label: 'Turnos', href: '/cantina/turnos', icon: Clock },
    { label: 'Fiados', href: '/cantina/fiados', icon: CreditCard, adminOnly: true },
    { label: 'Recargas', href: '/cantina/recargas', icon: Wallet2, adminOnly: true },
    { label: 'Cardapio', href: '/cantina/cardapio', icon: Coffee },
    { label: 'Encomendas', href: '/cantina/encomendas', icon: ShoppingCart },
]

const NAV_SISTEMA = [
    { label: 'Personalizacao', href: '/admin/personalizacao', icon: Palette, adminOnly: true },
    { label: 'Midia', href: '/admin/midia', icon: MonitorPlay, adminOnly: true },
    { label: 'Auditoria', href: '/admin/auditoria', icon: Shield, adminOnly: false },
]

function NavSection({ titulo, items, collapsed, pathname, isFullAdmin = true, onNavigate }: {
    titulo: string
    items: { label: string; href: string; icon: any; adminOnly?: boolean }[]
    collapsed: boolean
    pathname: string
    isFullAdmin?: boolean
    onNavigate?: () => void
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
                        onClick={onNavigate}
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

export default function AdminSidebar({ adminNome, igrejaName, logoUrl, congregacaoNome, role = 'ADMIN', congregacaoFilter }: {
    adminNome?: string
    igrejaName?: string
    logoUrl?: string | null
    congregacaoNome?: string | null
    role?: string
    congregacaoFilter?: React.ReactNode
}) {
    const isFullAdmin = role === 'ADMIN'
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const [cantinaAberto, setCantinaAberto] = useState(false)

    useEffect(() => {
        const saved = localStorage.getItem('admin_sidebar_collapsed')
        if (saved === 'true') setCollapsed(true)
    }, [])

    // Fechar mobile menu ao navegar
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    function toggle() {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem('admin_sidebar_collapsed', String(next))
    }

    const sidebarContent = (isMobile: boolean) => (
        <>
            {/* HEADER */}
            <div className={`border-b border-soft ${isMobile || !collapsed ? 'px-3 py-3' : 'px-1.5 py-3'}`}>
                <div className={`flex items-center ${!isMobile && collapsed ? 'justify-center' : 'justify-between'}`}>
                    {(isMobile || !collapsed) && (
                        <Link href="/admin/dashboard" className="flex items-center gap-2 px-1 min-w-0" onClick={() => isMobile && setMobileOpen(false)}>
                            {logoUrl ? (
                                <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                            ) : (
                                <div className="w-7 h-7 bg-figueira rounded-lg flex items-center justify-center shrink-0">
                                    <Shield size={14} className="text-white" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <span className="font-black italic uppercase tracking-tighter text-fg text-sm truncate block">
                                    {adminNome || 'Admin'}
                                </span>
                            </div>
                        </Link>
                    )}
                    {isMobile ? (
                        <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-soft/30 transition-all">
                            <X size={20} />
                        </button>
                    ) : (
                        <button onClick={toggle} className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-soft/30 transition-all shrink-0"
                            title={collapsed ? 'Expandir menu' : 'Recolher menu'}>
                            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        </button>
                    )}
                </div>
                {(isMobile || !collapsed) && igrejaName && (
                    <div className="mt-2 px-1 space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-[0.15em] text-figueira truncate">{igrejaName}</p>
                        {congregacaoNome && <p className="text-[8px] font-bold text-muted truncate">{congregacaoNome}</p>}
                    </div>
                )}
                {(isMobile || !collapsed) && congregacaoFilter && (
                    <div className="mt-2 px-1">{congregacaoFilter}</div>
                )}
            </div>

            {/* NAV */}
            <nav className={`flex-1 overflow-y-auto space-y-4 ${!isMobile && collapsed ? 'p-1.5' : 'p-3'}`}>
                <NavSection titulo="Igreja" items={NAV_PRINCIPAL} collapsed={!isMobile && collapsed} pathname={pathname} isFullAdmin={isFullAdmin} onNavigate={isMobile ? () => setMobileOpen(false) : undefined} />
                <NavSection titulo="Modulos" items={NAV_MODULOS} collapsed={!isMobile && collapsed} pathname={pathname} isFullAdmin={isFullAdmin} onNavigate={isMobile ? () => setMobileOpen(false) : undefined} />

                {/* Cantina collapsible group */}
                <div className="space-y-1">
                    {(!isMobile && collapsed) ? (
                        <div className="border-t border-soft my-2" />
                    ) : (
                        <button
                            onClick={() => setCantinaAberto(!cantinaAberto)}
                            className="w-full flex items-center justify-between px-3 text-[8px] font-black uppercase tracking-[0.2em] text-muted mb-2 hover:text-fg transition-all"
                        >
                            <span className="flex items-center gap-1.5">
                                <Store size={12} /> Cantina
                            </span>
                            {cantinaAberto ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                    {((!isMobile && collapsed) || cantinaAberto) && (
                        NAV_CANTINA.filter(item => !item.adminOnly || isFullAdmin).map(item => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    title={(!isMobile && collapsed) ? item.label : undefined}
                                    onClick={isMobile ? () => setMobileOpen(false) : undefined}
                                    className={`flex items-center rounded-xl transition-all ${
                                        (!isMobile && collapsed)
                                            ? 'justify-center p-2.5'
                                            : 'gap-3 px-3 py-2.5'
                                    } ${
                                        isActive
                                            ? 'bg-figueira/10 text-figueira'
                                            : 'text-muted hover:bg-soft/30 hover:text-fg'
                                    } text-[10px] font-bold uppercase tracking-widest`}
                                >
                                    <Icon size={16} className="shrink-0" />
                                    {(isMobile || !collapsed) && <span>{item.label}</span>}
                                </Link>
                            )
                        })
                    )}
                </div>

                <NavSection titulo="Sistema" items={NAV_SISTEMA} collapsed={!isMobile && collapsed} pathname={pathname} isFullAdmin={isFullAdmin} onNavigate={isMobile ? () => setMobileOpen(false) : undefined} />
            </nav>

            {/* FOOTER */}
            <div className={`border-t border-soft space-y-1 ${!isMobile && collapsed ? 'p-1.5' : 'p-3'}`}>
                <Link href="/membros/dashboard" onClick={() => isMobile && setMobileOpen(false)}
                    title={!isMobile && collapsed ? 'Painel do Membro' : undefined}
                    className={`flex items-center rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-soft/30 hover:text-fg transition-all ${
                        !isMobile && collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                    }`}>
                    <LayoutDashboard size={16} className="shrink-0" />
                    {(isMobile || !collapsed) && <span>Painel do Membro</span>}
                </Link>
                <form action={logoutAdmin}>
                    <button type="submit"
                        title={!isMobile && collapsed ? 'Terminar Sessao' : undefined}
                        className={`w-full flex items-center rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all ${
                            !isMobile && collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                        }`}>
                        <LogOut size={16} className="shrink-0" />
                        {(isMobile || !collapsed) && <span>Terminar Sessao</span>}
                    </button>
                </form>
            </div>
        </>
    )

    return (
        <>
            {/* MOBILE: Top bar com hamburger */}
            <div className="md:hidden flex items-center justify-between bg-bg2 border-b border-soft px-4 py-3 sticky top-0 z-40">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                    {logoUrl ? (
                        <img src={logoUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                        <div className="w-7 h-7 bg-figueira rounded-lg flex items-center justify-center">
                            <Shield size={14} className="text-white" />
                        </div>
                    )}
                    <span className="font-black italic uppercase tracking-tighter text-fg text-sm">
                        {adminNome || 'Admin'}
                    </span>
                </Link>
                <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-muted hover:text-fg hover:bg-soft/30 transition-all">
                    <Menu size={20} />
                </button>
            </div>

            {/* MOBILE: Drawer overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 bg-bg2 flex flex-col animate-in slide-in-from-left duration-200 shadow-2xl">
                        {sidebarContent(true)}
                    </aside>
                </div>
            )}

            {/* DESKTOP: Sidebar normal */}
            <aside className={`hidden md:flex bg-bg2 border-r border-soft flex-col shrink-0 sticky top-0 h-screen transition-all duration-300 ${
                collapsed ? 'w-16' : 'w-60'
            }`}>
                {sidebarContent(false)}
            </aside>
        </>
    )
}
