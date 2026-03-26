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
    const emContactoRaw = await prisma.visitante.findMany({
        where: { status: 'EM_CONTACTO' },
        include: {
            acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } }
        }
    });

    const limite24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const emContacto = emContactoRaw.sort((a, b) => {
        const dataA = a.acompanhamentos[0]?.data_contacto || a.data_primeira_visita;
        const dataB = b.acompanhamentos[0]?.data_contacto || b.data_primeira_visita;
        return new Date(dataB).getTime() - new Date(dataA).getTime();
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
                <section className="bg-fg rounded-[3rem] shadow-xl overflow-hidden border border-white/5">
                    <details className="group" open={novos.length > 0 && novos.length <= 3}>
                        <summary className="list-none cursor-pointer p-8 flex items-center justify-between group-open:border-b group-open:border-white/10 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-figueira rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-figueira/20 text-white">
                                    <AlertCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-white">Novos Registos</h2>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-2 text-figueira">
                                        {novos.length} pessoas aguardam o primeiro contacto
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-open:hidden">Clique para gerir</span>
                                <ChevronDown size={24} className="text-white/40 group-open:rotate-180 transition-transform duration-500" />
                            </div>
                        </summary>

                        <div className="p-6 md:p-8 space-y-3 bg-white/[0.02] animate-in slide-in-from-top-4 duration-500">
                            {novos.map(v => (
                                <details key={v.id} className="group/item bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all">
                                    <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-figueira/20 flex items-center justify-center text-white shrink-0 border border-white/10">
                                                <span className="text-xs font-black uppercase">{v.nome[0]}</span>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-white uppercase italic tracking-tight">{v.nome}</h3>
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">{v.telefone}</p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-white/20 group-open/item:rotate-90 transition-transform" />
                                    </summary>
                                    <div className="px-5 pb-5 pt-2 border-t border-white/5">
                                        {/* ... (Manter o conteúdo do v.pedido_oracao e botões WhatsApp/Modal que já tinhas) */}
                                        <div className="flex gap-2 mt-4">
                                            <a href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`} target="_blank" className="flex-1 bg-green-500 text-white text-center py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
                                                <MessageCircle size={14} /> WhatsApp
                                            </a>
                                            <ModalAcompanhamento visitante={v} />
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                    </details>
                </section>
            )}

            {/* GRID PRINCIPAL: EM ACOMPANHAMENTO & ESTATÍSTICAS */}
            <div className="grid lg:grid-cols-3 gap-8 items-start">

                {/* LISTA EM CONTACTO (RETRÁTIL) */}
                {/* LISTA EM CONTACTO (Colapsado por Padrão) */}
                <section className="lg:col-span-2 bg-bg2 border border-soft rounded-[3rem] shadow-sm overflow-hidden">
                    {/* Retirámos a propriedade 'open' para ficar sempre colapsado de início */}
                    <details className="group">
                        <summary className="list-none cursor-pointer p-8 flex items-center justify-between group-open:border-b group-open:border-soft transition-all hover:bg-soft/5">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg">Em Acompanhamento</h2>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mt-1">{emContacto.length} Visitantes em ciclo ativo</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted group-open:hidden">Expandir lista</span>
                                <ChevronDown size={24} className="text-muted/40 group-open:rotate-180 transition-transform duration-500" />
                            </div>
                        </summary>

                        <div className="p-8 space-y-3 bg-bg/30 animate-in fade-in slide-in-from-top-2 duration-500">
                            {emContacto.map(v => {
                                // 1. Lógica do Atraso de 24h
                                const ultimaData = v.acompanhamentos[0]?.data_contacto || v.data_primeira_visita;
                                const isAtrasado = new Date(ultimaData) < limite24h;

                                // 2. Lógica de Origem (Lê o campo que configurámos antes)
                                const isSite = v.pedido_oracao?.includes('SITE') || v.pedido_oracao?.includes('CONTACTO');

                                // 3. Definição Dinâmica da Cor do Box
                                let boxColors = "";
                                if (isAtrasado) {
                                    boxColors = "border-red-500/30 bg-red-500/5 hover:border-red-500/50"; // Atrasado (Urgente)
                                } else if (isSite) {
                                    boxColors = "border-indigo-500/20 bg-indigo-500/5 hover:border-indigo-500/40"; // Veio do Site (Azul/Índigo)
                                } else {
                                    boxColors = "bg-bg border-soft hover:border-figueira/40"; // Presencial / Boas-vindas (Padrão)
                                }

                                return (
                                    <div key={v.id} className={`p-5 border rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 group/card transition-all shadow-sm ${boxColors}`}>

                                        {/* DADOS DO VISITANTE */}
                                        <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h4 className="text-sm font-black uppercase text-fg italic tracking-tight">{v.nome}</h4>

                                                {/* TAG DE ORIGEM (NOVO) */}
                                                {isSite ? (
                                                    <span className="text-[8px] font-black bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                                        💻 Via Site
                                                    </span>
                                                ) : (
                                                    <span className="text-[8px] font-black bg-figueira/10 text-figueira border border-figueira/20 px-2 py-0.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                                        🌱 Presencial
                                                    </span>
                                                )}

                                                {/* Tag de Visitas */}
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-fg/5 rounded-lg border border-soft/30">
                                                    <Target size={10} className="text-muted" />
                                                    <span className="text-[8px] font-black text-muted uppercase tracking-widest">
                                                        {v.quantidade_visitas} Visitas
                                                    </span>
                                                </div>

                                                {/* ALERTA DE 24H */}
                                                {isAtrasado && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 rounded-lg border border-red-500/20 animate-pulse">
                                                        <AlertCircle size={10} className="text-red-500" />
                                                        <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">
                                                            +24h sem registo
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-[9px] font-bold text-muted uppercase tracking-widest pt-1">
                                                <span className="flex items-center gap-1.5">
                                                    <Phone size={10} className={isSite ? "text-indigo-400" : "text-figueira/50"} />
                                                    {v.telefone}
                                                </span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-soft"></span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="opacity-50">Último por:</span>
                                                    <span className={isAtrasado ? 'text-red-500/80' : 'text-fg'}>
                                                        {v.acompanhamentos[0]?.membro?.first_name || 'Sistema'}
                                                    </span>
                                                    <ModalHistorico visitante={v} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* AÇÕES */}
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
                                )
                            })}

                            {/* MENSAGEM SE ESTIVER VAZIO */}
                            {emContacto.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-soft rounded-[2.5rem]">
                                    <p className="text-[10px] text-muted uppercase tracking-widest font-black italic">Não existem visitantes em contacto ativo.</p>
                                </div>
                            )}
                        </div>
                    </details>
                </section>

                {/* ESTATÍSTICAS / CONSOLIDADOS (COLUNA DA DIREITA) */}
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