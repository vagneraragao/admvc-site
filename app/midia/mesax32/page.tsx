import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import X32HolyricsClient from '@/components/midia/X32HolyricsClient'
import X32Client from '@/components/midia/X32Client'
import type { X32CenasConfig } from '@/actions/midia-actions'

export const revalidate = 60

export default async function X32Page() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
            x32_ip: true,
            x32_port: true,
            holyrics_url: true,
            holyrics_token: true,
            x32_cenas: true,
        }
    })

    const x32Config = (tenant?.x32_cenas as X32CenasConfig | null) || { scenes: [] }
    const temPresets = x32Config.scenes.length > 0
    const temHolyrics = !!tenant?.holyrics_url && !!tenant?.holyrics_token

    return (
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <header className="space-y-1">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Mesa de Som</h1>
                <p className="text-xs text-muted">
                    {temPresets && temHolyrics
                        ? 'Presets via Holyrics — sem proxy necessario.'
                        : 'Behringer X32 — Controlo de volumes e mix bus.'}
                </p>
            </header>

            {/* Modo Holyrics (presets — sem proxy) */}
            {temPresets && temHolyrics && (
                <X32HolyricsClient
                    holyricsUrl={tenant!.holyrics_url!}
                    holyricsToken={tenant!.holyrics_token!}
                    scenes={x32Config.scenes}
                />
            )}

            {/* Modo Avancado (proxy — faders individuais) */}
            {(!temPresets || !temHolyrics) && (
                <X32Client ip={tenant?.x32_ip || ''} port={tenant?.x32_port || 10023} />
            )}

            {/* Se tem presets mas tambem quer modo avancado, mostrar como colapsavel */}
            {temPresets && temHolyrics && tenant?.x32_ip && (
                <details className="group">
                    <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-bg2 border border-soft rounded-2xl text-[9px] font-black uppercase tracking-widest text-muted hover:text-fg transition-colors">
                            <span className="group-open:rotate-90 transition-transform">&#9654;</span>
                            Modo Avancado (Faders — requer proxy local)
                        </div>
                    </summary>
                    <div className="mt-3">
                        <X32Client ip={tenant.x32_ip} port={tenant.x32_port || 10023} />
                    </div>
                </details>
            )}
        </main>
    )
}
