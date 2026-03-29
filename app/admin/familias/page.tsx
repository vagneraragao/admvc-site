import Link from 'next/link'
import prisma from '@/lib/prisma'
import { GestaoFamiliaCard } from '@/components/familias/GestaoFamiliaCard'
import NovaFamiliaModal from '@/components/familias/NovaFamiliaModal'
import { ArrowLeft, ChevronRight, Home, Users, ShieldCheck } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

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

    // Mapeia os nomes existentes para bloquear duplicados no Modal de Nova Família
    const nomesFamiliasExistentes = familias.map(f => f.surname);

    // 2. NOVA ABORDAGEM: Em vez de carregar todos os membros (pesado), apenas contamos quantos estão sem vínculo!
    const qtdMembrosSemVinculo = await prisma.membro.count({
        where: { familia_id: null }
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700">
            {/* BREADCRUMB PADRONIZADO E INTELIGENTE */}
            <div className="mb-6">
                <Breadcrumb items={[
                    {
                        label: "Painel Admin",
                        href: "/admin/dashboard",
                        isBackIcon: true
                    },
                    {
                        label: "Comunidade", // ou "Membros", dependendo de como organizas mentalmente a tua plataforma
                        hideOnMobile: true
                    },
                    {
                        label: "Gestão de Famílias"
                    }
                ]} />
            </div>

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
                            <Users size={12} /> {qtdMembrosSemVinculo} Membros Sem Vínculo
                        </p>
                    </div>
                </div>

                {/* BOTÃO QUE ABRE O MODAL ANTI-DUPLICAÇÃO */}
                <div className="w-full md:w-auto shrink-0">
                    <NovaFamiliaModal familiasExistentes={nomesFamiliasExistentes} />
                </div>
            </header>

            {/* GRID DE FAMÍLIAS */}
            <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {familias.map(familia => (
                    <GestaoFamiliaCard
                        key={familia.id}
                        familia={familia}
                    // Já não precisamos passar os membrosDisponiveis por aqui!
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