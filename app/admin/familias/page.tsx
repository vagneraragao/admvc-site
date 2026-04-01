// app/admin/familias/page.tsx
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { GestaoFamiliaCard } from '@/components/familias/GestaoFamiliaCard'
import NovaFamiliaModal from '@/components/familias/NovaFamiliaModal'
import { Home, Users, UserX } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminFamiliasPage() {
    const [familias, qtdMembrosSemVinculo, totalMembros] = await Promise.all([
        prisma.familia.findMany({
            include: {
                members: {
                    select: {
                        id: true, first_name: true, last_name: true,
                        avatar_file: true, parentesco: true
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

    return (
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">

            {/* HEADER */}
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Familias</h1>
                    <p className="text-xs text-muted">
                        {familias.length} familias · {totalMembrosFamilia} membros vinculados
                        {qtdMembrosSemVinculo > 0 && ` · ${qtdMembrosSemVinculo} sem vinculo`}
                    </p>
                </div>
                <NovaFamiliaModal familiasExistentes={nomesFamiliasExistentes} />
            </header>

            {/* ALERTA */}
            {qtdMembrosSemVinculo > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <UserX size={14} className="text-orange-500 shrink-0" />
                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                            {qtdMembrosSemVinculo} membro{qtdMembrosSemVinculo !== 1 ? 's' : ''} sem familia
                        </p>
                    </div>
                    <Link href="/admin/membros" className="text-[9px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-800 transition-colors">
                        Ver
                    </Link>
                </div>
            )}

            {/* GRID */}
            {familias.length > 0 ? (
                <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {familias.map(familia => (
                        <GestaoFamiliaCard key={familia.id} familia={familia} />
                    ))}
                </section>
            ) : (
                <div className="py-16 text-center border border-dashed border-soft rounded-2xl bg-bg2/30">
                    <Home size={24} className="mx-auto text-muted/30 mb-2" />
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Nenhuma familia registada.</p>
                </div>
            )}
        </main>
    )
}
