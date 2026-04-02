// app/admin/midia/lumikit/page.tsx
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import Link from 'next/link'
import { Lightbulb, ArrowLeft, Wifi, WifiOff, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function LumikitPage() {
    const session = await getSessionData()
    if (!session || !['ADMIN', 'LEADER'].includes(session.role)) redirect('/membros/dashboard')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { lumikit_url: true }
    })

    const configurado = !!tenant?.lumikit_url

    return (
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <header className="space-y-1">
                <Link href="/admin/midia" className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors">
                    ← Configuracoes de Midia
                </Link>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg flex items-center gap-3">
                    <Lightbulb size={24} className="text-amber-500" /> Lumikit
                </h1>
                <p className="text-xs text-muted">Controlo de iluminacao e cenas DMX.</p>
            </header>

            {!configurado ? (
                <div className="bg-bg2 border border-soft rounded-2xl p-8 text-center space-y-4">
                    <WifiOff size={32} className="mx-auto text-muted/30" />
                    <p className="text-sm font-black uppercase tracking-widest text-muted">Lumikit nao configurado</p>
                    <p className="text-xs text-muted/60">Configure o endereco do Lumikit nas <Link href="/admin/midia" className="text-figueira underline">configuracoes de midia</Link>.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-bg2 border border-soft rounded-2xl p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                <Wifi size={18} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-fg uppercase tracking-widest">{tenant.lumikit_url}</p>
                                <p className="text-[8px] font-bold text-muted uppercase tracking-widest">Protocolo Art-Net / HTTP</p>
                            </div>
                        </div>
                    </div>

                    {/* PLACEHOLDER: Cenas */}
                    <div className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-soft flex items-center gap-2">
                            <Zap size={14} className="text-amber-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-fg">Cenas e Atalhos</h2>
                        </div>
                        <div className="p-8 text-center space-y-3">
                            <Lightbulb size={40} className="mx-auto text-muted/20" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                                Em desenvolvimento
                            </p>
                            <p className="text-[9px] text-muted/60 max-w-sm mx-auto">
                                O controlo de cenas do Lumikit sera implementado apos definir
                                o protocolo de comunicacao (Art-Net ou API HTTP do equipamento).
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
