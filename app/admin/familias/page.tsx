import Link from 'next/link'
import prisma from '@/lib/prisma'
import { GestaoFamiliaCard } from '@/components/familias/GestaoFamiliaCard'
import NovaFamiliaModal from '@/components/familias/NovaFamiliaModal'
import { ArrowLeft, ChevronRight, Home, Users, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminFamiliasPage() {
    // 1. Buscamos famílias com contagem de membros para o resumo
    const familias = await prisma.familia.findMany({
        include: {
            members: {
                select: { id: true, first_name: true, last_name: true, avatar_file: true, parentesco: true }
            }
        },
        orderBy: { surname: 'asc' }
    });

    // 2. Buscamos membros sem família e já formatamos o Nome Completo
    const membrosData = await prisma.membro.findMany({
        where: { familia_id: null },
        select: { id: true, first_name: true, last_name: true },
        orderBy: { first_name: 'asc' }
    });

    const membrosDisponiveis = membrosData.map(m => ({
        id: m.id,
        fullName: `${m.first_name} ${m.last_name}`.trim()
    }));

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700">

            {/* BREADCRUMBS (BARRA DE HISTÓRICO) */}
            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/admin/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Painel Admin
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Gestão de Famílias</span>
            </nav>

            {/* HEADER OTIMIZADO */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-soft pb-8">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Módulo Administrativo
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Agregados <span className="text-muted/20">Familiares.</span>
                    </h1>

                    <div className="flex flex-wrap gap-3 pt-4">
                        <p className="flex items-center gap-2 text-[9px] text-muted font-black uppercase tracking-widest bg-soft/30 px-4 py-2 rounded-xl border border-soft">
                            <Home size={12} /> {familias.length} Famílias Registadas
                        </p>
                        <p className="flex items-center gap-2 text-[9px] text-orange-600 font-black uppercase tracking-widest bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                            <Users size={12} /> {membrosDisponiveis.length} Membros Sem Vínculo
                        </p>
                    </div>
                </div>

                {/* BOTÃO QUE ABRE O MODAL */}
                <div className="w-full md:w-auto shrink-0">
                    <NovaFamiliaModal />
                </div>
            </header>

            {/* GRID DE FAMÍLIAS */}
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {familias.map(familia => (
                    <GestaoFamiliaCard
                        key={familia.id}
                        familia={familia}
                        membrosDisponiveis={membrosDisponiveis}
                    />
                ))}
            </section>

            {/* EMPTY STATE */}
            {familias.length === 0 && (
                <div className="text-center py-32 bg-bg2/30 rounded-[4rem] border-2 border-dashed border-soft">
                    <div className="max-w-xs mx-auto space-y-4 flex flex-col items-center">
                        <div className="w-20 h-20 bg-soft rounded-full flex items-center justify-center text-muted mb-4">
                            <Home size={32} />
                        </div>
                        <p className="text-fg font-black uppercase text-sm tracking-widest italic">Nenhuma Família</p>
                        <p className="text-muted text-[10px] uppercase font-bold tracking-widest">
                            Clique no botão acima para criar o primeiro agregado familiar.
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}