// app/departamentos/acolhimento/dashboard/page.tsx
import { getDb } from '@/lib/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionData, isAdmin as isAdminCheck } from '@/lib/auth-utils'
import {
    HeartHandshake, Phone, MessageCircle, QrCode,
    AlertCircle, Clock, CheckCircle2, Users, BarChart3,
    UserPlus, ArrowRight
} from 'lucide-react'
import ModalAcompanhamento from '@/components/acolhimento/ModalAcompanhamento'
import ModalHistorico from '@/components/acolhimento/ModalHistorico'
import ModalListaConsolidados from '@/components/acolhimento/ModalListaConsolidados'

export default async function AcolhimentoDashboard() {
    const db = await getDb()
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const membroLogado = await db.membro.findUnique({
        where: { id: session.membroId },
        include: {
            ministerios: { include: { departamento: true } },
            departamentos_liderados: true
        }
    })
    if (!membroLogado) redirect('/membros/login')

    const checkDepto = (termos: string[]) => {
        const inMin = membroLogado.ministerios.some(m => termos.some(t => m.departamento?.nome.toLowerCase().includes(t)))
        const inLid = membroLogado.departamentos_liderados.some(d => termos.some(t => d.nome.toLowerCase().includes(t)))
        return inMin || inLid
    }
    const isAdmin = isAdminCheck(session.role)
    if (!isAdmin && !checkDepto(['acolhimento', 'integração'])) {
        redirect('/membros/dashboard?error=Acesso restrito.')
    }

    const [novos, emContactoRaw, consolidados] = await Promise.all([
        db.visitante.findMany({ where: { status: 'NOVO' }, orderBy: { data_primeira_visita: 'desc' } }),
        db.visitante.findMany({
            where: { status: 'EM_CONTACTO' },
            include: { acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } } }
        }),
        db.visitante.findMany({
            where: { status: 'CONSOLIDADO' },
            include: { acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } } }
        })
    ])

    const limite24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const emContacto = emContactoRaw.sort((a, b) => {
        const dataA = a.acompanhamentos[0]?.data_contacto || a.data_primeira_visita
        const dataB = b.acompanhamentos[0]?.data_contacto || b.data_primeira_visita
        return new Date(dataB).getTime() - new Date(dataA).getTime()
    })

    const atrasados = emContacto.filter(v => {
        const ultima = v.acompanhamentos[0]?.data_contacto || v.data_primeira_visita
        return new Date(ultima) < limite24h
    }).length

    return (
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">

            {/* HEADER */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Link href={isAdmin ? '/admin/dashboard' : '/membros/dashboard'}
                        className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors">
                        ← Voltar
                    </Link>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Acolhimento</h1>
                    <p className="text-xs text-muted">Gestao de visitantes e ciclo de integracao.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/departamentos/acolhimento/relatorio"
                        className="flex items-center gap-2 bg-bg2 border border-soft text-muted px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-fg hover:border-figueira/30 transition-all">
                        <BarChart3 size={13} /> Relatorio
                    </Link>
                    <Link href="/boasvindas" target="_blank"
                        className="flex items-center gap-2 bg-fg text-bg px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-figueira transition-all shadow-sm">
                        <QrCode size={13} /> Ficha Boas-Vindas
                    </Link>
                </div>
            </header>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Kpi label="Novos" value={novos.length} icon={<UserPlus size={13} />}
                    cor={novos.length > 0 ? 'orange' : undefined} />
                <Kpi label="Em Contacto" value={emContacto.length} icon={<Clock size={13} />} />
                <Kpi label="Atrasados (+24h)" value={atrasados} icon={<AlertCircle size={13} />}
                    cor={atrasados > 0 ? 'red' : 'emerald'} />
                <Kpi label="Consolidados" value={consolidados.length} icon={<CheckCircle2 size={13} />} cor="emerald" />
            </div>

            {/* NOVOS VISITANTES */}
            {novos.length > 0 && (
                <section className="bg-orange-500/5 border border-orange-500/20 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-orange-500/10">
                        <div className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center animate-pulse">
                            <AlertCircle size={16} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-fg">Novos Registos</h2>
                            <p className="text-[8px] font-bold text-orange-600 uppercase tracking-widest">
                                {novos.length} pessoa{novos.length !== 1 ? 's' : ''} aguardam primeiro contacto
                            </p>
                        </div>
                    </div>
                    <div className="divide-y divide-orange-500/10">
                        {novos.map(v => (
                            <div key={v.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-orange-500/5 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                                        <span className="text-[9px] font-black text-orange-600">{v.nome[0]}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black uppercase text-fg truncate">{v.nome}</p>
                                        <p className="text-[9px] font-bold text-muted flex items-center gap-1.5">
                                            <Phone size={9} /> {v.telefone}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <a href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`} target="_blank"
                                        className="w-8 h-8 bg-green-500/10 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                                        <MessageCircle size={14} />
                                    </a>
                                    <ModalAcompanhamento visitante={v} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* EM ACOMPANHAMENTO */}
            <section className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-figueira" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-fg">Em Acompanhamento</h2>
                        <span className="text-[8px] font-black bg-soft px-2 py-0.5 rounded text-muted">{emContacto.length}</span>
                    </div>
                </div>

                {emContacto.length === 0 ? (
                    <div className="py-12 text-center">
                        <HeartHandshake size={24} className="mx-auto text-muted/20 mb-3" />
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Nenhum visitante em contacto activo.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-soft">
                        {emContacto.map(v => {
                            const ultimaData = v.acompanhamentos[0]?.data_contacto || v.data_primeira_visita
                            const isAtrasado = new Date(ultimaData) < limite24h
                            const isSite = v.pedido_oracao?.includes('SITE') || v.pedido_oracao?.includes('CONTACTO')

                            return (
                                <div key={v.id} className={`flex items-center justify-between gap-4 px-5 py-3.5 transition-colors ${isAtrasado ? 'bg-red-500/5' : 'hover:bg-soft/10'}`}>
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAtrasado ? 'bg-red-500/10' : 'bg-figueira/10'}`}>
                                            <span className={`text-[9px] font-black ${isAtrasado ? 'text-red-500' : 'text-figueira'}`}>{v.nome[0]}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-[11px] font-black uppercase text-fg truncate">{v.nome}</p>
                                                {isSite && (
                                                    <span className="text-[7px] font-black bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded border border-blue-500/20">Site</span>
                                                )}
                                                {isAtrasado && (
                                                    <span className="text-[7px] font-black bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">+24h</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[8px] font-bold text-muted flex items-center gap-1">
                                                    <Phone size={8} /> {v.telefone}
                                                </span>
                                                <span className="text-[8px] font-bold text-muted">{v.quantidade_visitas} visita{v.quantidade_visitas !== 1 ? 's' : ''}</span>
                                                <span className="text-[8px] font-bold text-muted">
                                                    Por: {v.acompanhamentos[0]?.membro?.first_name || 'Sistema'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <ModalHistorico visitante={v} />
                                        <a href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`} target="_blank"
                                            className="w-8 h-8 bg-green-500/10 text-green-600 rounded-lg flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                                            <MessageCircle size={14} />
                                        </a>
                                        <ModalAcompanhamento visitante={v} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* CONSOLIDADOS */}
            <section className="bg-bg2 border border-soft rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-soft">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-fg">Consolidados</h2>
                        <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">{consolidados.length}</span>
                    </div>
                    <ModalListaConsolidados consolidados={consolidados} />
                </div>

                {consolidados.length > 0 ? (
                    <div className="px-5 py-4">
                        <div className="flex -space-x-2">
                            {consolidados.slice(0, 8).map(v => (
                                <div key={v.id} className="w-8 h-8 rounded-lg bg-emerald-500/10 border-2 border-bg2 flex items-center justify-center" title={v.nome}>
                                    <span className="text-[8px] font-black text-emerald-600">{v.nome[0]}</span>
                                </div>
                            ))}
                            {consolidados.length > 8 && (
                                <div className="w-8 h-8 rounded-lg bg-soft border-2 border-bg2 flex items-center justify-center">
                                    <span className="text-[7px] font-black text-muted">+{consolidados.length - 8}</span>
                                </div>
                            )}
                        </div>
                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest mt-2">
                            {consolidados.length} pessoa{consolidados.length !== 1 ? 's' : ''} integrada{consolidados.length !== 1 ? 's' : ''} na igreja
                        </p>
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Nenhum consolidado ainda.</p>
                    </div>
                )}
            </section>
        </main>
    )
}

function Kpi({ label, value, icon, cor }: { label: string; value: any; icon: React.ReactNode; cor?: string }) {
    const cores: Record<string, string> = {
        emerald: 'text-emerald-600 bg-emerald-500/8 border-emerald-500/15',
        orange: 'text-orange-600 bg-orange-500/8 border-orange-500/15',
        red: 'text-red-500 bg-red-500/8 border-red-500/15',
    }
    return (
        <div className={`p-4 rounded-2xl border flex flex-col gap-2 ${cor ? cores[cor] : 'bg-bg2 border-soft text-fg'}`}>
            <div className="flex items-center justify-between">
                <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{label}</p>
                <div className="opacity-40">{icon}</div>
            </div>
            <p className="text-xl font-black italic tracking-tighter leading-none">{value}</p>
        </div>
    )
}
