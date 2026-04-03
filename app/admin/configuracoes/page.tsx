import prisma from '@/lib/prisma'
import { headers } from 'next/headers'
import { criarCargo, excluirCargo, criarDepartamento, excluirDepartamento } from '@/actions/admin-actions'
import FormCriarDepartamento from '@/components/admin/FormCriarDepartamento'
import DeptoItem from '@/components/DeptoItem'
import GerenciadorGrupos from '@/components/admin/GerenciadorGrupos'
import { Plus, Briefcase, LayoutGrid, Users, MapPin, Settings } from 'lucide-react'
import EstruturaSubMenu from '@/components/admin/EstruturaSubMenu'

export const dynamic = 'force-dynamic'

export default async function EstruturaPage() {
    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const [cargos, deptos, deptosParaSelect, membrosDisponiveis, grupos, tenantConfig, congregacoes] = await Promise.all([
        prisma.cargo.findMany({ orderBy: { nome: 'asc' } }),
        prisma.departamento.findMany({
            include: {
                lider: { select: { first_name: true, last_name: true } },
                congregacao: { select: { nome: true } },
                funcoes: { orderBy: { nome: 'asc' } },
                integrantes: {
                    include: {
                        membro: { select: { id: true, first_name: true, last_name: true } },
                        funcoes: { include: { funcao: true } }
                    }
                },
                _count: { select: { integrantes: true } }
            },
            orderBy: { nome: 'asc' }
        }),
        prisma.departamento.findMany({ select: { id: true, nome: true }, orderBy: { nome: 'asc' } }),
        prisma.membro.findMany({ select: { id: true, first_name: true, last_name: true }, orderBy: { first_name: 'asc' } }),
        prisma.grupo.findMany({
            orderBy: { nome: 'asc' },
            include: {
                membros: { select: { id: true, first_name: true, last_name: true } },
                lideres: { select: { id: true, first_name: true, last_name: true } },
                departamento: { select: { id: true, nome: true } },
                _count: { select: { membros: true } }
            }
        }),
        tenantId ? prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { regioes_custom: true }
        }) : null,
        tenantId ? prisma.congregacao.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, nome: true, cidade: true },
            orderBy: { nome: 'asc' }
        }) : [],
    ])

    const cargosSerializados = cargos.map((c: any) => ({ id: c.id, nome: c.nome }))

    return (
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-in fade-in duration-700 pb-20">

            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Estrutura</h1>
                    <p className="text-xs text-muted">Departamentos, grupos, cargos e regioes da igreja.</p>
                </div>
                {/* Submenu: Cargos e Regiões */}
                <EstruturaSubMenu
                    cargos={cargosSerializados}
                    regioesIniciais={(tenantConfig?.regioes_custom as string[]) || ['Norte', 'Centro', 'Sul', 'Lisboa', 'Online']}
                />
            </header>

            {/* DEPARTAMENTOS */}
            <section className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
                    <div className="flex items-center gap-2">
                        <LayoutGrid size={14} className="text-blue-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-fg">Departamentos</h2>
                        <span className="text-[8px] bg-soft/50 px-2 py-0.5 rounded text-muted font-bold">{deptos.length}</span>
                    </div>
                    <Popover titulo="Departamento" cor="blue">
                        <FormCriarDepartamento congregacoes={congregacoes} />
                    </Popover>
                </div>
                <div className="p-5">
                {deptos.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {deptos.map(d => (
                            <DeptoItem
                                key={d.id}
                                depto={d}
                                membrosDisponiveis={membrosDisponiveis}
                                congregacoes={congregacoes}
                                onExcluir={excluirDepartamento}
                            />
                        ))}
                    </div>
                ) : (
                    <Empty message="Nenhum departamento registado." />
                )}
                </div>
            </section>

            {/* GRUPOS */}
            <section className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-soft">
                    <Users size={14} className="text-emerald-500" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Grupos & PGs</h2>
                    <span className="text-[8px] bg-soft/50 px-2 py-0.5 rounded text-muted font-bold">{grupos.length}</span>
                </div>
                <div className="p-5">
                    <GerenciadorGrupos
                        grupos={grupos}
                        departamentos={deptosParaSelect}
                        membrosDisponiveis={membrosDisponiveis}
                        regioes={(tenantConfig?.regioes_custom as string[]) || ['Norte', 'Centro', 'Sul', 'Lisboa', 'Online']}
                    />
                </div>
            </section>
        </main>
    )
}

function Empty({ message }: { message: string }) {
    return (
        <div className="py-10 text-center border border-dashed border-soft rounded-2xl bg-bg2/30">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{message}</p>
        </div>
    )
}

function Popover({ titulo, cor = 'figueira', children }: { titulo: string; cor?: string; children: React.ReactNode }) {
    const btnClass = cor === 'blue'
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'bg-fg text-bg hover:bg-figueira'

    return (
        <details className="group relative z-30">
            <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden outline-none">
                <div className={`${btnClass} px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-1.5 active:scale-95`}>
                    <Plus size={12} className="group-open:rotate-45 transition-transform" />
                    {titulo}
                </div>
            </summary>
            <div className="absolute right-0 top-full mt-2 w-[300px] bg-bg border border-soft p-5 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <p className="text-[9px] font-black uppercase text-muted tracking-widest border-b border-soft pb-2 mb-3">
                    Novo(a) {titulo}
                </p>
                {children}
            </div>
        </details>
    )
}
