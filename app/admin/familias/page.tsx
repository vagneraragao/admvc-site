// app/admin/familias/page.tsx

import Link from 'next/link'
import prisma from '@/lib/prisma'
import { GestaoFamiliaCard } from '@/components/familias/GestaoFamiliaCard'
import NovaFamiliaModal from '@/components/familias/NovaFamiliaModal'
import { Home, Users, ShieldCheck, UserX, TrendingUp } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function AdminFamiliasPage() {
    const [familias, qtdMembrosSemVinculo, totalMembros] = await Promise.all([
        prisma.familia.findMany({
            include: {
                members: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        avatar_file: true,
                        parentesco: true
                    }
                }
            },
            orderBy: { surname: 'asc' }
        }),
        prisma.membro.count({ where: { familia_id: null } }),
        prisma.membro.count({ where: { status: { in: ['Ativo', 'ATIVO'] } } }),
    ])

    const nomesFamiliasExistentes = familias.map(f => f.surname)

    const totalMembrosFamilia = familias.reduce((sum, f) => sum + f.members.length, 0)
    const mediaMembrosPorFamilia = familias.length > 0
        ? (totalMembrosFamilia / familias.length).toFixed(1)
        : '0'
    const pctVinculados = totalMembros > 0
        ? Math.round(((totalMembros - qtdMembrosSemVinculo) / totalMembros) * 100)
        : 0

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-700 pb-32">

            {/* ── HEADER ───────────────────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Módulo Administrativo
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Agregados <span className="text-muted/20">Familiares.</span>
                    </h1>
                </div>
                <NovaFamiliaModal familiasExistentes={nomesFamiliasExistentes} />
            </header>

            {/* ── KPIs ─────────────────────────────────────────────────────── */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard
                    label="Famílias"
                    value={familias.length}
                    icon={<Home size={14} />}
                />
                <KpiCard
                    label="Membros em Família"
                    value={totalMembrosFamilia}
                    icon={<Users size={14} />}
                    cor="emerald"
                />
                <KpiCard
                    label="Média por Família"
                    value={mediaMembrosPorFamilia}
                    icon={<TrendingUp size={14} />}
                />
                <KpiCard
                    label="Sem Vínculo"
                    value={qtdMembrosSemVinculo}
                    icon={<UserX size={14} />}
                    cor={qtdMembrosSemVinculo > 0 ? 'orange' : 'emerald'}
                    sub={`${pctVinculados}% vinculados`}
                />
            </section>

            {/* ALERTA DE MEMBROS SEM VÍNCULO */}
            {qtdMembrosSemVinculo > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl px-5 py-4 flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500 rounded-l-2xl" />
                    <div className="w-9 h-9 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0 ml-1">
                        <UserX size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-700 leading-none">
                            {qtdMembrosSemVinculo} membro{qtdMembrosSemVinculo !== 1 ? 's' : ''} sem família associada
                        </p>
                        <p className="text-[9px] font-bold text-orange-600/70 uppercase tracking-widest mt-0.5">
                            Acede à lista de membros para associar ao agregado correcto
                        </p>
                    </div>
                    <Link
                        href="/admin/membros"
                        className="ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest text-orange-600 bg-bg border border-orange-500/20 hover:bg-orange-500 hover:text-white px-3 py-2 rounded-xl transition-all"
                    >
                        Ver Membros
                    </Link>
                </div>
            )}

            {/* ── GRID DE FAMÍLIAS ─────────────────────────────────────────── */}
            {familias.length > 0 ? (
                <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {familias.map(familia => (
                        <GestaoFamiliaCard
                            key={familia.id}
                            familia={familia}
                        />
                    ))}
                </section>
            ) : (
                <div className="py-24 text-center border-2 border-dashed border-soft rounded-[2.5rem]">
                    <div className="w-16 h-16 bg-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Home size={24} className="text-muted" />
                    </div>
                    <p className="text-sm font-black uppercase italic tracking-tighter text-fg">
                        Nenhuma família registada
                    </p>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">
                        Clica no botão acima para criar o primeiro agregado familiar
                    </p>
                </div>
            )}
        </main>
    )
}

// ── COMPONENTE KPI ────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, cor, sub }: {
    label: string
    value: any
    icon: React.ReactNode
    cor?: 'emerald' | 'orange' | 'red'
    sub?: string
}) {
    const cores: Record<string, string> = {
        emerald: 'text-emerald-600 bg-emerald-500/8 border-emerald-500/15',
        orange: 'text-orange-600 bg-orange-500/8 border-orange-500/15',
        red: 'text-red-500 bg-red-500/8 border-red-500/15',
    }
    return (
        <div className={`p-5 rounded-2xl border flex flex-col gap-3 transition-all hover:-translate-y-0.5
            ${cor ? cores[cor] : 'bg-bg2 border-soft text-fg'}`}>
            <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{label}</p>
                <div className="opacity-50">{icon}</div>
            </div>
            <p className="text-2xl font-black italic tracking-tighter leading-none">{value}</p>
            {sub && (
                <p className="text-[8px] font-bold uppercase tracking-widest opacity-60">{sub}</p>
            )}
        </div>
    )
}