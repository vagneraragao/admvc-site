// app/admin/midia/page.tsx
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import { getModulosAtivos, MODULOS } from '@/lib/planos'
import MidiaConfigClient from '@/components/admin/MidiaConfigClient'
import Link from 'next/link'
import { Music2, Lightbulb, MonitorPlay, Download, Terminal, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MidiaConfigPage() {
    const session = await getSessionData()
    if (!session || !['ADMIN'].includes(session.role)) redirect('/membros/dashboard')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            plano: true,
            modulos_custom: true,
            holyrics_url: true,
            holyrics_token: true,
            x32_ip: true,
            x32_port: true,
            lumikit_url: true,
        }
    })

    const modulosAtivos = getModulosAtivos(tenant?.plano || 'FREE', tenant?.modulos_custom as string[] | null)
    const temMesaSom = modulosAtivos.includes(MODULOS.MESA_SOM)
    const temLumikit = modulosAtivos.includes(MODULOS.LUMIKIT)
    const temHolyrics = modulosAtivos.includes(MODULOS.HOLYRICS) || modulosAtivos.includes(MODULOS.LOUVOR)

    return (
        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <MidiaConfigClient config={tenant} />

            {/* ACESSO AOS MODULOS */}
            {(temMesaSom || temLumikit) && (
                <section className="space-y-3">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2 px-1">
                        Modulos de Controlo
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                        {temMesaSom && (
                            <Link href="/admin/midia/x32"
                                className="bg-bg2 border border-soft rounded-2xl p-5 hover:border-blue-500/30 transition-all flex items-center justify-between gap-4 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                        <Music2 size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-widest text-fg">X32</p>
                                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest">Controlo de faders</p>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-muted group-hover:text-blue-500 transition-colors" />
                            </Link>
                        )}
                        {temLumikit && (
                            <Link href="/admin/midia/lumikit"
                                className="bg-bg2 border border-soft rounded-2xl p-5 hover:border-amber-500/30 transition-all flex items-center justify-between gap-4 group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                                        <Lightbulb size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-widest text-fg">Lumikit</p>
                                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest">Controlo de cenas</p>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-muted group-hover:text-amber-500 transition-colors" />
                            </Link>
                        )}
                    </div>
                </section>
            )}

            {/* PROXY LOCAL — DOWNLOAD E INSTRUCOES */}
            {temMesaSom && (
                <section className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-soft flex items-center gap-2">
                        <Terminal size={14} className="text-figueira" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-fg">Proxy Local (X32)</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <p className="text-xs text-muted leading-relaxed">
                            O Behringer X32 usa protocolo OSC (UDP) que browsers nao suportam directamente.
                            Para controlar a mesa pelo Cloud, precisa de correr um pequeno proxy no PC da igreja.
                        </p>

                        <div className="bg-bg border border-soft rounded-xl p-4 font-mono text-sm text-fg space-y-2">
                            <p className="text-[8px] font-black uppercase tracking-widest text-figueira mb-2">Instrucoes:</p>
                            <p><span className="text-muted">1.</span> Instalar Node.js (nodejs.org) no PC da igreja</p>
                            <p><span className="text-muted">2.</span> Abrir terminal e executar:</p>
                            <div className="bg-black/50 rounded-lg px-3 py-2 text-emerald-400 text-xs">
                                <p>npm install ws</p>
                                <p>node x32-proxy.js</p>
                            </div>
                            <p><span className="text-muted">3.</span> No ADMVC Cloud, ir a Midia → X32 e conectar com <code className="bg-soft px-1.5 rounded text-[10px]">ws://localhost:8080</code></p>
                        </div>

                        <a href="/scripts/x32-proxy.js" download="x32-proxy.js"
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-fg text-bg text-[9px] font-black uppercase tracking-widest hover:bg-figueira transition-all">
                            <Download size={14} /> Descarregar x32-proxy.js
                        </a>
                    </div>
                </section>
            )}
        </main>
    )
}
