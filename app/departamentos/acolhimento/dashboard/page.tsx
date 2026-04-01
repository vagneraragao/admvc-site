// app/acolhimento/dashboard/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionData, isAdmin as isAdminCheck } from '@/lib/auth-utils'
import {
    HeartHandshake, Phone, MessageCircle, QrCode,
    AlertCircle, Clock, Target, CheckCircle2
} from 'lucide-react'

// Componentes
import ModalAcompanhamento from '@/components/acolhimento/ModalAcompanhamento'
import ModalHistorico from '@/components/acolhimento/ModalHistorico'
import ModalListaConsolidados from '@/components/acolhimento/ModalListaConsolidados'
import Breadcrumb from '@/components/ui/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function AcolhimentoDashboard() {
    const session = await getSessionData();
    if (!session) redirect('/membros/login?error=Sessão expirada');

    // 1. QUERY CORRIGIDA: Inclui departamentos liderados para não bloquear líderes!
    const membroLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        include: {
            ministerios: { include: { departamento: true } },
            departamentos_liderados: true
        }
    });

    if (!membroLogado) redirect('/membros/login');

    // 2. LÓGICA DE PERMISSÕES CENTRALIZADA (A mesma do Member Dashboard)
    const checkDepto = (termos: string[]) => {
        const inMin = membroLogado.ministerios.some(m => termos.some(t => m.departamento?.nome.toLowerCase().includes(t)));
        const inLid = membroLogado.departamentos_liderados.some(d => termos.some(t => d.nome.toLowerCase().includes(t)));
        return inMin || inLid;
    };

    const isAdmin = isAdminCheck(session.role);
    const isEquipaAcolhimento = checkDepto(['acolhimento', 'integração']);

    if (!isAdmin && !isEquipaAcolhimento) {
        redirect('/membros/dashboard?error=Acesso restrito. Não fazes parte da equipa de Acolhimento.');
    }

    // 3. BUSCA DE DADOS
    const [novos, emContactoRaw, consolidados] = await Promise.all([
        prisma.visitante.findMany({ where: { status: 'NOVO' }, orderBy: { data_primeira_visita: 'desc' } }),
        prisma.visitante.findMany({
            where: { status: 'EM_CONTACTO' },
            include: { acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } } }
        }),
        prisma.visitante.findMany({
            where: { status: 'CONSOLIDADO' },
            include: { acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } } }
        })
    ]);

    const limite24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const emContacto = emContactoRaw.sort((a, b) => {
        const dataA = a.acompanhamentos[0]?.data_contacto || a.data_primeira_visita;
        const dataB = b.acompanhamentos[0]?.data_contacto || b.data_primeira_visita;
        return new Date(dataB).getTime() - new Date(dataA).getTime();
    });

    return (
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-500 pb-32">

            {/* BREADCRUMB */}
            <Breadcrumb items={[
                { label: isAdmin ? "Painel Admin" : "Dashboard", href: isAdmin ? "/admin/dashboard" : "/membros/dashboard", isBackIcon: true },
                { label: "Departamentos", hideOnMobile: true },
                { label: "Acolhimento" }
            ]} />

            {/* HEADER MODERNIZADO */}
            <header className="bg-bg2 border border-soft p-6 lg:p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
                <div className="relative z-10">
                    <span className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
                        <HeartHandshake size={14} /> Ciclo de Integração
                    </span>
                    <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Gestão de <span className="text-muted">Visitantes</span>
                    </h1>
                </div>

                <div className="relative z-10 w-full md:w-auto">
                    <Link href="/boasvindas" target="_blank" className="w-full md:w-auto bg-fg text-bg h-12 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira transition-all shadow-lg flex items-center justify-center gap-2">
                        <QrCode size={16} /> Ficha de Boas-Vindas
                    </Link>
                </div>
            </header>

            {/* ALERTA DE NOVOS VISITANTES (URGENTE) */}
            {novos.length > 0 && (
                <section className="bg-emerald-50 border-2 border-emerald-500/20 p-6 lg:p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden animate-in slide-in-from-top-4">
                    <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/20">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-emerald-900 leading-none">Novos Registos</h2>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-1 text-emerald-600">
                                {novos.length} pessoas aguardam o primeiro contacto
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {novos.map(v => (
                            <div key={v.id} className="bg-white border border-emerald-500/10 p-5 rounded-[2rem] shadow-sm hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                        <span className="text-xs font-black uppercase">{v.nome[0]}</span>
                                    </div>
                                    <div className="truncate">
                                        <h3 className="text-sm font-black text-fg uppercase italic tracking-tight truncate">{v.nome}</h3>
                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{v.telefone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 border-t border-soft/50 pt-4">
                                    <a href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`} target="_blank" className="flex-1 bg-green-50 text-green-600 text-center py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center justify-center gap-2">
                                        <MessageCircle size={14} /> WhatsApp
                                    </a>
                                    <ModalAcompanhamento visitante={v} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* GRID PRINCIPAL */}
            <div className="grid lg:grid-cols-12 gap-8 items-start">

                {/* COLUNA ESQUERDA: LISTA EM CONTACTO (AGORA SEMPRE VISÍVEL) */}
                <section className="lg:col-span-8 bg-bg2 border border-soft p-6 lg:p-8 rounded-[2.5rem] shadow-sm">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-soft">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg leading-none">Em Acompanhamento</h2>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1.5">{emContacto.length} Visitantes em ciclo</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {emContacto.map(v => {
                            const ultimaData = v.acompanhamentos[0]?.data_contacto || v.data_primeira_visita;
                            const isAtrasado = new Date(ultimaData) < limite24h;
                            const isSite = v.pedido_oracao?.includes('SITE') || v.pedido_oracao?.includes('CONTACTO');

                            let boxColors = isAtrasado ? "border-red-500/30 bg-red-50" : "bg-bg border-soft";

                            return (
                                <div key={v.id} className={`p-5 border rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 group hover:border-figueira/40 transition-all shadow-sm ${boxColors}`}>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h4 className="text-sm font-black uppercase text-fg italic tracking-tight mr-2">{v.nome}</h4>

                                            {isSite ? (
                                                <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">💻 Site</span>
                                            ) : (
                                                <span className="text-[8px] font-black bg-figueira/10 text-figueira border border-figueira/20 px-2 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1">🌱 Local</span>
                                            )}

                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-fg/5 rounded-lg border border-soft/30">
                                                <Target size={10} className="text-muted" />
                                                <span className="text-[8px] font-black text-muted uppercase tracking-widest">{v.quantidade_visitas} Visitas</span>
                                            </div>

                                            {isAtrasado && (
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/20 animate-pulse">
                                                    <AlertCircle size={10} className="text-red-600" />
                                                    <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">+24h sem ação</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 text-[9px] font-bold text-muted uppercase tracking-widest pt-1">
                                            <span className="flex items-center gap-1.5"><Phone size={10} />{v.telefone}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-soft"></span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="opacity-50">Por:</span>
                                                <span className={isAtrasado ? 'text-red-500/80' : 'text-fg'}>{v.acompanhamentos[0]?.membro?.first_name || 'Sistema'}</span>
                                                <ModalHistorico visitante={v} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 shrink-0 border-t border-soft/50 sm:border-0 pt-4 sm:pt-0">
                                        <a href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`} target="_blank" className="h-12 w-12 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                                            <MessageCircle size={16} />
                                        </a>
                                        <ModalAcompanhamento visitante={v} />
                                    </div>
                                </div>
                            )
                        })}

                        {emContacto.length === 0 && (
                            <div className="text-center py-16 border-2 border-dashed border-soft rounded-[2rem] bg-bg/50">
                                <HeartHandshake size={32} className="mx-auto text-muted mb-4 opacity-50" />
                                <p className="text-[10px] text-muted uppercase tracking-widest font-black italic">Não existem visitantes em contacto ativo.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* COLUNA DIREITA: ESTATÍSTICAS E DICAS */}
                <aside className="lg:col-span-4 space-y-6">
                    <div className="bg-bg2 border border-soft p-8 rounded-[2.5rem] text-center shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-figueira"></div>
                        <div className="w-16 h-16 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                            <CheckCircle2 size={28} />
                        </div>
                        <h4 className="text-6xl font-black italic text-fg tracking-tighter leading-none mb-2">{consolidados.length}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted pb-6">Pessoas Integradas</p>

                        <ModalListaConsolidados consolidados={consolidados} />
                    </div>

                    <div className="bg-fg p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10"><HeartHandshake size={120} /></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-figueira">
                            Dica de Ouro
                        </h3>
                        <p className="text-xs font-medium leading-relaxed opacity-90 italic relative z-10">
                            "Um visitante consolidado é alguém que encontrou uma família. O contacto nas primeiras 24h aumenta em 80% a chance de retorno."
                        </p>
                    </div>
                </aside>

            </div>
        </main>
    )
}