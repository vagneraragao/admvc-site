// app/acolhimento/dashboard/page.tsx
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import { HeartHandshake, Users, Phone, MessageCircle, QrCode, ArrowLeft, ChevronRight, AlertCircle, Clock, CalendarDays } from 'lucide-react'
import ModalAcompanhamento from '@/components/acolhimento/ModalAcompanhamento'
import ModalHistorico from '@/components/acolhimento/ModalHistorico'
import ModalListaConsolidados from '@/components/acolhimento/ModalListaConsolidados'

export const dynamic = 'force-dynamic'

export default async function AcolhimentoDashboard() {
    // ========================================================================
    // 1. VERIFICAÇÃO DE SEGURANÇA E ACESSO
    // ========================================================================
    const session = await getSessionData();
    if (!session) redirect('/membros/login?error=Sessão expirada');

    // Busca o membro logado e os seus departamentos
    const membroLogado = await prisma.membro.findUnique({
        where: { id: session.membroId },
        include: {
            ministerios: {
                include: { departamento: true }
            }
        }
    });

    if (!membroLogado) redirect('/membros/login');

    const isAdmin = session.role === 'ADMIN';

    // Verifica se o membro tem "Acolhimento" ou "Integração" no nome do departamento
    const isEquipaAcolhimento = membroLogado.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('acolhimento') || nomeDepto.includes('integração');
    });

    // Se não for Admin nem da equipa de Acolhimento, bloqueia o acesso
    if (!isAdmin && !isEquipaAcolhimento) {
        redirect('/membros/dashboard?error=Acesso restrito à equipa de Acolhimento.');
    }

    // ========================================================================
    // 2. BUSCAS DOS DADOS DOS VISITANTES
    // ========================================================================
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
        include: {
            acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } }
        },
        orderBy: { data_ultima_visita: 'desc' }
    });

    const formatarDataHora = (data: Date) => {
        return new Date(data).toLocaleString('pt-PT', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <main className="max-w-7xl mx-auto py-10 px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            <nav className="flex items-center gap-4 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href={isAdmin ? "/admin/dashboard" : "/membros/dashboard"} className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> {isAdmin ? "Painel Admin" : "Voltar à Dashboard"}
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Acolhimento & Integração</span>
            </nav>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b border-soft pb-8">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <HeartHandshake size={14} /> Ministério de Integração
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Gestão de <span className="text-muted/20">Visitantes.</span>
                    </h1>
                </div>

                <div className="shrink-0 flex gap-3">
                    <Link href="/acolhimento/boasvindas" target="_blank" className="flex items-center gap-2 bg-bg2 border border-soft text-fg px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:border-figueira hover:text-figueira transition-all shadow-sm">
                        <QrCode size={14} /> Link do QR Code
                    </Link>
                </div>
            </header>

            {/* ALERTAS DE NOVOS VISITANTES */}
            {novos.length > 0 && (
                <section className="bg-orange-50 border border-orange-200 p-8 rounded-[3rem] shadow-sm relative overflow-hidden">
                    <div className="flex items-center gap-3 text-orange-600 mb-6 relative z-10">
                        <AlertCircle size={24} className="animate-bounce" />
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">Ação Imediata</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Novos visitantes aguardando contacto</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                        {novos.map(v => (
                            <div key={v.id} className="bg-white p-6 rounded-[2rem] border border-orange-100 flex flex-col justify-between space-y-4 hover:border-orange-300 transition-all shadow-sm">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-black text-orange-950 uppercase">{v.nome}</h3>
                                        <div className="flex items-center gap-1 text-[8px] font-black text-orange-400 bg-orange-100 px-2 py-1 rounded-md uppercase tracking-widest">
                                            <CalendarDays size={10} /> {formatarDataHora(v.data_primeira_visita)}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest flex items-center gap-1">
                                        <Phone size={10} /> {v.telefone}
                                    </p>

                                    {v.pedido_oracao && (
                                        <div className="mt-4 bg-orange-50 p-4 rounded-2xl border border-orange-100/50">
                                            <p className="text-[9px] font-black text-orange-800 uppercase tracking-widest mb-1">Pedido de Oração:</p>
                                            <p className="text-xs text-orange-900 italic font-medium leading-relaxed">"{v.pedido_oracao}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-4 border-t border-orange-100 flex gap-2">
                                    <a href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`} target="_blank" className="flex-1 bg-green-500 text-white text-center py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-sm flex items-center justify-center gap-2">
                                        <MessageCircle size={12} /> WhatsApp
                                    </a>
                                    <ModalAcompanhamento visitante={v} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* EM ACOMPANHAMENTO E KPIs */}
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <section className="lg:col-span-2 bg-bg2 border border-soft p-8 rounded-[3rem]">
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg mb-6 flex items-center gap-3">
                        <Clock size={18} className="text-figueira" /> Em Acompanhamento ({emContacto.length})
                    </h2>
                    <div className="space-y-4">
                        {emContacto.map(v => (
                            <div key={v.id} className="p-5 bg-bg border border-soft rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 group hover:border-figueira/50 transition-all shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-xs font-black uppercase text-fg">{v.nome}</h4>
                                        <span className="text-[8px] font-black bg-figueira/10 text-figueira px-2 py-0.5 rounded-md uppercase tracking-widest">
                                            {v.quantidade_visitas} {v.quantidade_visitas === 1 ? 'Visita' : 'Visitas'}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-muted font-bold uppercase tracking-widest flex items-center gap-1">
                                        <Phone size={10} /> {v.telefone}
                                    </p>

                                    <div className="mt-2 text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                                        <span className="opacity-60">Último Contacto:</span> <span className="text-fg italic">Por {v.acompanhamentos[0]?.membro?.first_name || 'Alguém'}</span>
                                        <span className="text-soft">•</span>
                                        <ModalHistorico visitante={v} />
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 shrink-0">
                                    <a
                                        href={`https://wa.me/${v.telefone?.replace(/\D/g, '')}`}
                                        target="_blank"
                                        className="flex-1 sm:flex-none bg-green-500/10 text-green-600 text-center py-2.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 border border-green-500/20"
                                    >
                                        <MessageCircle size={12} /> WhatsApp
                                    </a>

                                    <div className="flex-1 sm:flex-none flex">
                                        <ModalAcompanhamento visitante={v} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {emContacto.length === 0 && <p className="text-[10px] text-muted uppercase tracking-widest font-bold italic text-center py-6">Nenhum visitante em acompanhamento.</p>}
                    </div>
                </section>

                <aside className="space-y-4">
                    <div className="bg-bg2 border border-soft p-8 rounded-[3rem] text-center shadow-sm relative overflow-hidden group">
                        <div className="w-16 h-16 bg-figueira/10 text-figueira rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Users size={24} />
                        </div>
                        <h4 className="text-5xl font-black italic text-fg">{consolidados.length}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-2 mb-8">Visitantes Consolidados</p>

                        <ModalListaConsolidados consolidados={consolidados} />
                    </div>
                </aside>
            </div>
        </main>
    )
}