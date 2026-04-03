// app/admin/midia/page.tsx
import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import { getModulosAtivos, MODULOS } from '@/lib/planos'
import MidiaConfigClient from '@/components/admin/MidiaConfigClient'
import LumikitCenasEditor from '@/components/admin/LumikitCenasEditor'
import X32CenasEditor from '@/components/admin/X32CenasEditor'
import Link from 'next/link'
import { Music2, Lightbulb, MonitorPlay, Download, Terminal, ArrowRight, Sliders } from 'lucide-react'
import type { LumikitConfig, X32CenasConfig } from '@/actions/midia-actions'

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
            lumikit_cenas: true,
            x32_cenas: true,
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
                            <Link href="/midia/mesax32"
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
                            <Link href="/midia/lumikit"
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

            {/* CONFIGURADOR DE CENAS LUMIKIT */}
            {temLumikit && (
                <LumikitCenasEditor initialConfig={(tenant?.lumikit_cenas as LumikitConfig | null) || { scenes: [] }} />
            )}

            {/* CONFIGURADOR DE PRESETS X32 (via Holyrics) */}
            {temMesaSom && (
                <X32CenasEditor initialConfig={(tenant?.x32_cenas as X32CenasConfig | null) || { scenes: [] }} />
            )}

            {/* PROXY LOCAL — DOWNLOAD E INSTRUCOES (modo avancado) */}
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

                        <div className="bg-bg border border-soft rounded-xl p-4 text-sm text-fg space-y-3">
                            <p className="text-[8px] font-black uppercase tracking-widest text-figueira">Opcao 1 — Script (requer Node.js)</p>
                            <div className="bg-black/50 rounded-lg px-3 py-2 font-mono text-emerald-400 text-xs space-y-1">
                                <p>npm install ws</p>
                                <p>node x32-proxy.js</p>
                            </div>

                            <div className="border-t border-soft pt-3">
                                <p className="text-[8px] font-black uppercase tracking-widest text-figueira">Opcao 2 — Executavel (sem instalar nada)</p>
                                <p className="text-[9px] text-muted mt-1">Descarregue o executavel, de duplo-clique e o proxy corre automaticamente.</p>
                            </div>

                            <p className="text-[9px] text-muted">Apos iniciar o proxy, va a Midia → Mesa de Som e conecte com <code className="bg-soft px-1.5 rounded text-[10px]">ws://localhost:8080</code></p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted">Executavel (duplo-clique, sem instalar nada):</p>
                            <div className="grid grid-cols-3 gap-2">
                                <a href="https://tjlntjdqtemsmz7i.public.blob.vercel-storage.com/proxy/admvc-x32-proxy-win.exe" download
                                    className="flex flex-col items-center gap-1 py-3 rounded-xl bg-fg text-bg text-[8px] font-black uppercase tracking-widest hover:bg-figueira transition-all">
                                    <Download size={14} /> Windows
                                </a>
                                <a href="https://tjlntjdqtemsmz7i.public.blob.vercel-storage.com/proxy/admvc-x32-proxy-macos" download
                                    className="flex flex-col items-center gap-1 py-3 rounded-xl bg-bg border border-soft text-muted text-[8px] font-black uppercase tracking-widest hover:text-fg hover:border-figueira/30 transition-all">
                                    <Download size={14} /> macOS
                                </a>
                                <a href="https://tjlntjdqtemsmz7i.public.blob.vercel-storage.com/proxy/admvc-x32-proxy-linux" download
                                    className="flex flex-col items-center gap-1 py-3 rounded-xl bg-bg border border-soft text-muted text-[8px] font-black uppercase tracking-widest hover:text-fg hover:border-figueira/30 transition-all">
                                    <Download size={14} /> Linux
                                </a>
                            </div>
                            <a href="https://tjlntjdqtemsmz7i.public.blob.vercel-storage.com/proxy/x32-proxy.js" download="x32-proxy.js"
                                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest text-muted hover:text-fg transition-all">
                                <Download size={10} /> Ou descarregar script .js (requer Node.js)
                            </a>
                        </div>
                    </div>
                </section>
            )}
        </main>
    )
}
