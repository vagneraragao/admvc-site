// app/super-admin/layout.tsx
import Link from 'next/link'
import { cookies } from 'next/headers'
import { Server, Building, CreditCard, Settings, LogOut, ShieldAlert } from 'lucide-react'
import { logoutSuperAdmin } from '@/actions/sa-auth-actions'

export default async function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const saSession = cookieStore.get('admvc_sa_session')

    // Sem sessão SA → renderizar apenas children (página de login)
    if (!saSession) {
        return <>{children}</>
    }

    // Com sessão SA → layout completo com sidebar
    return (
        <div className="min-h-screen bg-[#0A0A0A] flex flex-col md:flex-row font-sans text-white">

            {/* SIDEBAR DO SUPER ADMIN */}
            <aside className="w-full md:w-64 bg-[#111111] border-r border-[#222] flex flex-col justify-between shrink-0">
                <div>
                    <div className="h-20 flex items-center px-8 border-b border-[#222]">
                        <Link href="/super-admin/dashboard" className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                                <Server size={16} className="text-white" />
                            </div>
                            <span className="font-black italic uppercase tracking-tighter text-lg">
                                ADMVC <span className="text-blue-500">Cloud</span>
                            </span>
                        </Link>
                    </div>

                    <nav className="p-4 space-y-2 mt-4">
                        <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Plataforma</p>

                        <Link href="/super-admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-300 hover:bg-[#222] hover:text-white transition-all">
                            <Server size={16} /> Visao Geral
                        </Link>

                        <Link href="/super-admin/igrejas" className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-300 hover:bg-[#222] hover:text-white transition-all">
                            <Building size={16} /> Tenants (Igrejas)
                        </Link>

                        <Link href="/super-admin/igrejas" className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-300 hover:bg-[#222] hover:text-white transition-all">
                            <CreditCard size={16} /> Planos & Modulos
                        </Link>

                        <Link href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600 cursor-not-allowed">
                            <Settings size={16} /> Configuracoes
                        </Link>
                    </nav>
                </div>

                <div className="p-4 border-t border-[#222]">
                    <div className="flex items-center gap-3 px-4 py-3 bg-[#1A1A1A] rounded-xl border border-[#333] mb-4">
                        <ShieldAlert size={16} className="text-orange-500" />
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-orange-500">Acesso Restrito</p>
                            <p className="text-[10px] font-bold text-gray-400">Super Administrador</p>
                        </div>
                    </div>

                    <form action={logoutSuperAdmin}>
                        <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20">
                            <LogOut size={14} /> Terminar Sessao
                        </button>
                    </form>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto bg-[#0A0A0A]">
                <div className="min-h-screen text-white bg-gradient-to-br from-[#0A0A0A] to-[#111111]">
                    {children}
                </div>
            </main>
        </div>
    )
}
