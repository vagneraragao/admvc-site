// app/acolhimento/dashboard/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import {
    HeartHandshake, Users, Phone, MessageCircle, QrCode,
    ArrowLeft, ChevronRight, AlertCircle, Clock, CalendarDays,
    Target, UserPlus, CheckCircle2, ChevronDown
} from 'lucide-react'
import ModalAcompanhamento from '@/components/acolhimento/ModalAcompanhamento'
import ModalHistorico from '@/components/acolhimento/ModalHistorico'
import ModalListaConsolidados from '@/components/acolhimento/ModalListaConsolidados'

export const dynamic = 'force-dynamic'

export default async function AcolhimentoDashboard() {
    const session = await getSessionData();
    if (!session) redirect('/membros/login?error=Sessão expirada');

    const membroLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        include: { ministerios: { include: { departamento: true } } }
    });

    if (!membroLogado) redirect('/membros/login');

    const isAdmin = session.role === 'ADMIN';
    const isEquipaAcolhimento = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('acolhimento') || nomeDepto.includes('integração');
    });

    if (!isAdmin && !isEquipaAcolhimento) {
        redirect('/membros/dashboard?error=Acesso restrito.');
    }

    const novos = await prisma.visitante.findMany({
        where: { status: 'NOVO' },
        orderBy: { data_primeira_visita: 'desc' }
    });

    const emContacto = await prisma.visitante.findMany({
        where: { status: 'EM_CONTACTO' },
        include: {
            acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } }
        }
    });

    const consolidados = await prisma.visitante.findMany({
        where: { status: 'CONSOLIDADO' },
    });

    const formatarDataHora = (data: Date) => {
        return new Date(data).toLocaleString('pt-PT', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            {/* BREADCRUMBS */}
            <nav className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href={isAdmin ? "/admin/dashboard" : "/membros/dashboard"} className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> {isAdmin ? "Painel Admin" : "Dashboard"}
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Acolhimento</span>
            </nav>

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-soft pb-8">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <UserPlus size={14} /> Ciclo de Consolidação
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Gestão de <span className="text-muted/20">Visitantes.</span>
                    </h1>
                </div>

                <div className="flex gap-3">
                    <Link href="/boasvindas" target="_blank" className="bg-bg2 border border-soft text-fg px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-figueira transition-all shadow-sm flex items-center gap-2">
                        <QrCode size={14} className="text-figueira" /> Ficha de Boas-Vindas
                    </Link>
                </div>
            </header>

            {/* ALERTA DE NOVOS (URGENTE) - Cores da paleta com foco no FIGUEIRA */}
            {novos.length > 0 && (
                <section className="bg-fg p-6 md:p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-figueira/20 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-6 relative z-10 px-2">
                        <div className="flex items-center gap-4 text-white">
                            <div className="w-10 h-10 bg-figueira rounded-xl flex items-center justify-center animate-pulse shadow-lg shadow-figueira/20">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Novos Registos</h2>
                                <p className="text-[9px] font-bold uppercase tracking-widest mt-1 text-white/50">{novos.length} pessoas aguardam contacto</p>
                            </div>
                        </div>
                    </div>

                    {/* LISTA MINIMIZADA */}
                    <div className="space-y-2 relative z-10">
                        {novos.map(v => (
                            <details key={v.id} className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all hover:bg-white/10">
                                <summary className="list-none cursor-pointer p-4 flex items-center justify-between gap-4 select-none">
                                    <div className="flex items-center gap-4 truncate">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
                                            <span className="text-[10px] font-black">{v.nome[0]}</span>
                                        </div>
                                        <div className="truncate">
                                            <h3 className="text-[11px] font-black text-white uppercase italic tracking-tight truncate">{v.nome}</h3>
                                            <p className="text-[9px] font-bold text-figueira uppercase tracking-widest flex items-center gap-2">
                                                <Phone size={10} /> {v.telefone}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="hidden sm:block text-[8px] font-black bg-white/10 text-white/60 px-2 py-1 rounded-md uppercase tracking-widest border border-white/5">
                                            {formatarDataHora(v.data_primeira_visita)}
                                        </span>
                                        <ChevronDown size={16} className="text-white/40 group-open:rotate-180 transition-transform" />
                                    </div>
                                </summary>

                                {/* CONTEÚDO REVELADO */}
                                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                                    <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
                                        {v.pedido_oracao && (
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                <p className="text-[8px] font-black text-figueira uppercase tracking-[0.2em] mb-1.5">Mensagem / Pedido:</p>
                                                <p className="text-xs text-white/80 italic font-medium leading-relaxed">
                                                    "{v.pedido_oracao}"
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <a
                                                href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`}
                                                target="_blank"
                                                className="flex-1 bg-green-500 text-white text-center py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-sm"
                                            >
                                                <MessageCircle size={14} /> WhatsApp
                                            </a>
                                            <div className="flex-1 flex">
                                                <ModalAcompanhamento visitante={v} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* GRID PRINCIPAL: EM ACOMPANHAMENTO & ESTATÍSTICAS */}
            <div className="grid lg:grid-cols-3 gap-8 items-start">

                {/* LISTA EM CONTACTO */}
                <section className="lg:col-span-2 bg-bg2 border border-soft p-8 rounded-[3rem] shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                            <Clock size={20} className="text-figueira" /> Em Acompanhamento
                        </h2>
                        <span className="bg-soft text-muted px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-soft">
                            {emContacto.length} Registos
                        </span>
                    </div>

                    <div className="space-y-3">
                        {emContacto.map(v => (
                            <div key={v.id} className="p-5 bg-bg border border-soft rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 group hover:border-figueira/40 transition-all shadow-sm">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-black uppercase text-fg italic tracking-tight">{v.nome}</h4>
                                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-figueira/5 rounded-lg border border-figueira/10">
                                            <Target size={10} className="text-figueira" />
                                            <span className="text-[8px] font-black text-figueira uppercase tracking-widest">
                                                {v.quantidade_visitas} Visitas
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[9px] font-bold text-muted uppercase tracking-widest pt-1">
                                        <span className="flex items-center gap-1.5"><Phone size={10} className="text-figueira/50" /> {v.telefone}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-soft"></span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="opacity-50">Último por:</span>
                                            <span className="text-fg">{v.acompanhamentos[0]?.membro?.first_name || 'Sistema'}</span>
                                            <ModalHistorico visitante={v} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 shrink-0">
                                    <a
                                        href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`}
                                        target="_blank"
                                        className="h-12 px-5 bg-bg border border-soft text-green-600 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white hover:border-green-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={14} />
                                    </a>
                                    <ModalAcompanhamento visitante={v} />
                                </div>
                            </div>
                        ))}
                        {emContacto.length === 0 && (
                            <div className="text-center py-20 border-2 border-dashed border-soft rounded-[2.5rem]">
                                <p className="text-[10px] text-muted uppercase tracking-widest font-black italic">Não existem visitantes em contacto ativo.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* ESTATÍSTICAS / CONSOLIDADOS */}
                <aside className="space-y-6">
                    <div className="bg-bg2 border border-soft p-10 rounded-[3rem] text-center shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-figueira"></div>
                        <div className="w-20 h-20 bg-figueira/10 text-figueira rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-500 shadow-inner">
                            <CheckCircle2 size={32} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-6xl font-black italic text-fg tracking-tighter leading-none">{consolidados.length}</h4>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted pb-8">Pessoas Integradas</p>
                        </div>

                        <ModalListaConsolidados consolidados={consolidados} />
                    </div>

                    <div className="bg-fg p-8 rounded-[3rem] shadow-xl text-white">
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                            <HeartHandshake size={14} className="text-figueira" /> Dica de Integração
                        </h3>
                        <p className="text-[11px] font-medium leading-relaxed opacity-70 italic">
                            "Um visitante consolidado é alguém que encontrou uma família. O contacto nas primeiras 24h aumenta em 80% a chance de retorno."
                        </p>
                    </div>
                </aside>
            </div>
        </main>
    )
}