// app/membros/dashboard/page.tsx
import prisma from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import {
    ShieldCheck, PieChart, UserCircle, LogOut, Users, Phone,
    LayoutDashboard, Coffee, Receipt, BellRing, FileSignature,
    HeartHandshake, Store, Heart, MessageSquare, Menu, ArrowLeft,
    MessageCircle, ChevronDown, Clock, CalendarDays,
    Wallet2
} from 'lucide-react'
import { logoutMembro } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import CardWalletCantina from '@/components/membros/CardWalletCantina'
import BotoesEscala from '@/components/membros/BotoesEscala'
import PainelFinanceiroMembro from '@/components/membros/PainelFinanceiroMembro'
import ModalCarregarCantina from '@/components/cantina/ModalCarregarCantina'
import CardDepartamentoMembro from '@/components/membros/CardDepartamentoMembro'
import SessaoExtratoCantina from '@/components/membros/SessaoExtratoCantina'
import WidgetMural from '@/components/membros/WidgetMural'
import FormAcompanhamentoRapido from '@/components/acolhimento/FormAcompanhamentoRapido'
import WidgetAgendaUnificada from '@/components/membros/WidgetAgendaUnificada'
import AvisoEscalaVazia from '@/components/membros/AvisoEscalaVazia'
import ModalRelatorioEscalas from '@/components/membros/ModalRelatorioEscalas'
import ModalExtratoMembro from '@/components/financeiro/ModalExtratoMembro'

export default async function DashboardMembro() {
    // 1. DADOS BASE DA SESSÃO E EVENTOS GERAIS
    const session = await getSessionData();
    if (!session) redirect('/membros/login');
    const { membroId, role } = session;

    const proximosEventosPromise = prisma.evento.findMany({
        where: { data: { gte: new Date() } },
        orderBy: { data: 'asc' },
        take: 10
    });

    // 2. BUSCA O MEMBRO (Query Principal)
    const membro = await prisma.membro.findUnique({
        where: { id: membroId },
        include: {
            grupos: true,
            lider_de_grupo: true,
            departamentos_liderados: true,
            ministerios: { include: { departamento: true } },
            familia: true,
            escalas: {
                where: { evento: { data: { gte: new Date() } } },
                include: { evento: true, departamento: true },
                orderBy: { evento: { data: 'asc' } },
            },
            objetivos_financeiros: {
                include: { lancamentos: { orderBy: { data_recebimento: 'desc' } } }
            }
        }
    });

    if (!membro) return redirect('/membros/login?error=Sessão expirada ou utilizador inexistente');

    // 3. VERIFICAÇÕES DE PERMISSÃO E VARIÁVEIS ÚTEIS
    const isEquipaAcolhimento = membro.ministerios.some(v => v.departamento?.nome.toLowerCase().includes('acolhimento') || v.departamento?.nome.toLowerCase().includes('integração'));
    const isEquipaCantina = membro.ministerios.some(v => v.departamento?.nome.toLowerCase().includes('cantina'));
    const isEquipaSocial = membro.ministerios.some(v => v.departamento?.nome.toLowerCase().includes('social') || v.departamento?.nome.toLowerCase().includes('despensa') || v.departamento?.nome.toLowerCase().includes('assistência'));
    const mostraFerramentasExtra = role === 'ADMIN' || role === 'FINANCE' || isEquipaAcolhimento || isEquipaCantina || isEquipaSocial;

    const deptIds = membro.ministerios?.map(m => m.departamento?.id).filter(Boolean) || [];
    const grupoIds = membro.grupos?.map(g => g.id).filter(Boolean) || [];

    // 4. FUNÇÃO PARA BUSCAR SALDO LOYVERSE DE FORMA ISOLADA
    const fetchLoyverseSaldo = async () => {
        if (!membro.loyverse_id) return 0;
        try {
            const res = await fetch(`https://api.loyverse.com/v1.0/customers/${membro.loyverse_id}`, {
                headers: { 'Authorization': `Bearer ${process.env.LOYVERSE_ACCESS_TOKEN}` },
                cache: 'no-store'
            });
            return res.ok ? (await res.json()).total_points || 0 : 0;
        } catch { return 0; }
    };

    // 5. OTIMIZAÇÃO: EXECUTAR QUERIES SECUNDÁRIAS EM PARALELO (MUITO MAIS RÁPIDO!)
    const [
        proximosEventos,
        visitantesPendentesCount,
        ultimosAvisos,
        minhasRifas,
        minhasContribuicoes,
        carregamentosHistorico,
        meusAcompanhamentos,
        saldoCantina
    ] = await Promise.all([
        proximosEventosPromise,
        (role === 'ADMIN' || isEquipaAcolhimento) ? prisma.visitante.count({ where: { status: 'NOVO' } }) : Promise.resolve(0),
        prisma.avisoMural.findMany({
            where: { OR: [{ departamento_id: { in: deptIds.length > 0 ? deptIds : [-1] } }, { grupo_id: { in: grupoIds.length > 0 ? grupoIds : [-1] } }] },
            include: { autor: { select: { first_name: true, last_name: true, avatar_file: true } }, departamento: { select: { nome: true } }, grupo: { select: { nome: true } } },
            orderBy: { createdAt: 'desc' }, take: 5
        }),
        prisma.rifaNumero.findMany({ where: { membro_id: membroId }, include: { rifa: true }, orderBy: { createdAt: 'desc' } }),
        prisma.contribuicao.findMany({ where: { membro_id: membroId }, orderBy: { data: 'desc' } }),
        prisma.pedidoSaldoCantina.findMany({ where: { membro_id: membroId }, orderBy: { createdAt: 'desc' } }),
        isEquipaAcolhimento ? prisma.visitante.findMany({
            where: { status: 'EM_CONTACTO', acompanhamentos: { some: { membro_id: membroId } } },
            include: { acompanhamentos: { include: { membro: true }, orderBy: { data_contacto: 'desc' } } },
            orderBy: { data_ultima_visita: 'desc' }, take: 6
        }) : Promise.resolve([]),
        fetchLoyverseSaldo()
    ]);

    // 6. PROCESSAMENTO DE DADOS (Agrupamentos)
    const escalasPendentes = membro.escalas.filter((esc: any) => !esc.confirmado);
    const iniciais = `${membro.first_name?.[0] || 'M'}${membro.last_name?.[0] || 'V'}`;
    const hoje = new Date();
    const gdprPendente = !membro.gdpr_aceite || (membro.gdpr_validade && membro.gdpr_validade < hoje);
    const permanecerPendente = !membro.permanecer_aceite || (membro.permanecer_validade && membro.permanecer_validade < hoje);

    const departamentosAgrupados = new Map();
    membro.ministerios?.forEach((vinculo: any) => {
        if (!vinculo.departamento) return;
        const key = `depto-${vinculo.departamento.id}`;
        if (departamentosAgrupados.has(key)) {
            if (!departamentosAgrupados.get(key).funcoes.includes(vinculo.funcao)) departamentosAgrupados.get(key).funcoes.push(vinculo.funcao);
        } else {
            departamentosAgrupados.set(key, { id: vinculo.departamento.id, nome: vinculo.departamento.nome, tipo: 'DEPARTAMENTO', lider_id: vinculo.departamento.lider_id, funcoes: [vinculo.funcao] });
        }
    });
    membro.departamentos_liderados?.forEach((depto: any) => {
        const key = `depto-${depto.id}`;
        if (departamentosAgrupados.has(key)) {
            if (!departamentosAgrupados.get(key).funcoes.includes('Líder')) departamentosAgrupados.get(key).funcoes.push('Líder');
        } else {
            departamentosAgrupados.set(key, { id: depto.id, nome: depto.nome, tipo: 'DEPARTAMENTO', lider_id: depto.lider_id, funcoes: ['Líder'] });
        }
    });
    membro.grupos?.forEach((grupo: any) => {
        if (!departamentosAgrupados.has(`grupo-${grupo.id}`)) departamentosAgrupados.set(`grupo-${grupo.id}`, { id: grupo.id, nome: grupo.nome, tipo: 'GRUPO', funcoes: ['Membro'] });
    });
    membro.lider_de_grupo?.forEach((grupo: any) => {
        departamentosAgrupados.set(`grupo-${grupo.id}`, { id: grupo.id, nome: grupo.nome, tipo: 'GRUPO', funcoes: ['Líder do Grupo'] });
    });

    const meusGrupos = [...(membro.grupos || []), ...(membro.lider_de_grupo || [])];
    const gruposUnicos = Array.from(new Map(meusGrupos.map(g => [g.id, g])).values());

    const escalasAgrupadas = new Map();
    membro.escalas.forEach((esc: any) => {
        const key = `${esc.evento.id}-${esc.departamento.id}`;
        if (escalasAgrupadas.has(key)) {
            const existente = escalasAgrupadas.get(key);
            existente.ids.push(esc.id);
            if (!existente.funcoes.includes(esc.funcao)) existente.funcoes.push(esc.funcao);
            if (!esc.confirmado) existente.confirmado = false;
        } else {
            escalasAgrupadas.set(key, { ...esc, ids: [esc.id], funcoes: [esc.funcao] });
        }
    });
    const listaEscalas = Array.from(escalasAgrupadas.values()).slice(0, 4);

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-700 relative">

            {/* CABEÇALHO DO PERFIL */}
            <header className="bg-bg2 border border-soft p-6 lg:p-8 rounded-[3rem] shadow-xl relative overflow-visible">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                            {membro.avatar_file ? (
                                <Image src={membro.avatar_file} alt="Perfil" fill className="rounded-3xl object-cover border-4 border-white shadow-lg" />
                            ) : (
                                <div className="w-full h-full rounded-3xl bg-fg text-bg flex items-center justify-center text-2xl font-black border-4 border-white shadow-lg">
                                    {iniciais}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl md:text-4xl font-black text-fg italic tracking-tighter uppercase leading-none">
                                    {membro.first_name} <span className="text-muted">{membro.last_name}</span>
                                </h1>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse hidden sm:block"></div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[9px] font-black text-figueira bg-figueira/10 px-3 py-1 rounded-full uppercase tracking-widest border border-figueira/20">
                                    {role === 'ADMIN' ? 'Administrador' : role === 'FINANCE' ? 'Tesouraria' : 'Membro'}
                                </span>
                                {membro.familia && (
                                    <span className="text-[9px] font-black text-muted bg-soft px-3 py-1 rounded-full uppercase tracking-widest italic border border-soft/50">
                                        Família {membro.familia.surname}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t border-soft lg:border-0">
                        <Link href="/membros/mural" className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-12 px-6 bg-bg border border-soft text-muted hover:text-figueira hover:border-figueira rounded-2xl group transition-all shadow-sm">
                            <MessageSquare size={16} className="group-hover:scale-110 transition-transform text-figueira" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Mural</span>
                        </Link>
                        <Link href={`/membros/perfil/editar/${membro.id}`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-12 px-4 bg-bg border border-soft text-muted hover:text-fg hover:border-fg rounded-2xl group transition-all shadow-sm" title="Editar Perfil">
                            <UserCircle size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="lg:hidden text-[10px] font-black uppercase tracking-widest">Perfil</span>
                        </Link>

                        {mostraFerramentasExtra && (
                            <details className="group relative z-50 flex-1 lg:flex-none">
                                <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                                    <div className="h-12 w-full lg:w-12 bg-figueira text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-figueira/90 transition-all shadow-sm active:scale-95">
                                        <Menu size={18} />
                                        <span className="lg:hidden text-[10px] font-black uppercase tracking-widest">Ferramentas</span>
                                    </div>
                                </summary>
                                <div className="absolute right-0 top-full mt-2 w-56 bg-bg border border-soft p-2 rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1 z-50">
                                    <p className="text-[9px] font-black uppercase text-figueira tracking-widest border-b border-soft/50 pb-2 mb-1 px-3 mt-1">Área de Serviço</p>
                                    {role === 'ADMIN' && (
                                        <Link href="/admin/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <ShieldCheck size={14} className="text-muted group-hover/link:text-figueira" /> Painel ADMIN
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || role === 'FINANCE') && (
                                        <Link href="/departamentos/financeiro/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <PieChart size={14} className="text-muted group-hover/link:text-figueira" /> Financeiro
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || role === 'FINANCE' || isEquipaCantina) && (
                                        <Link href="/departamentos/cantina/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <Store size={14} className="text-muted group-hover/link:text-figueira" /> Cantina POS
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || role === 'FINANCE' || isEquipaSocial) && (
                                        <Link href="/departamentos/cantina/despensa" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <Heart size={14} className="text-muted group-hover/link:text-figueira" /> Ação Social
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || isEquipaAcolhimento) && (
                                        <Link href="/departamentos/acolhimento/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <HeartHandshake size={14} className="text-muted group-hover/link:text-figueira" /> Acolhimento
                                        </Link>
                                    )}
                                </div>
                            </details>
                        )}
                        <form action={logoutMembro} className="shrink-0">
                            <button type="submit" className="h-12 w-12 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm" title="Terminar Sessão">
                                <LogOut size={16} strokeWidth={3} />
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* AVISOS CRÍTICOS */}
            <div className="space-y-4">
                {(visitantesPendentesCount > 0 && (role === 'ADMIN' || isEquipaAcolhimento)) && (
                    <section className="bg-emerald-50 border-2 border-emerald-500/20 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <div className="flex items-center gap-5">
                            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl shrink-0"><HeartHandshake size={24} /></div>
                            <div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg leading-none">Novos Visitantes</h3>
                                <p className="text-xs font-medium text-muted mt-1 max-w-xl">
                                    Existem <span className="font-black text-emerald-600">{visitantesPendentesCount} pessoas</span> a aguardar contacto de boas-vindas.
                                </p>
                            </div>
                        </div>
                        <Link href="/departamentos/acolhimento/dashboard" className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shrink-0 shadow-sm">
                            Acompanhar
                        </Link>
                    </section>
                )}

                {(gdprPendente || permanecerPendente) && (
                    <section className="bg-bg2 border-2 border-orange-500/20 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden animate-in fade-in duration-500">
                        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                        <div className="flex items-center gap-5">
                            <div className="bg-orange-500/10 text-orange-500 p-4 rounded-2xl shrink-0"><FileSignature size={24} /></div>
                            <div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg leading-none">Assinaturas Pendentes</h3>
                                <p className="text-xs font-medium text-muted mt-1 max-w-xl">Renova ou assina os teus termos obrigatórios.</p>
                            </div>
                        </div>
                        <Link href="/membros/termos" className="w-full md:w-auto flex items-center justify-center bg-orange-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shrink-0 shadow-sm">
                            Ler e Assinar
                        </Link>
                    </section>
                )}

                {escalasPendentes.length > 0 && (
                    <section className="bg-figueira text-white p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border-4 border-figueira/20 animate-in fade-in duration-500">
                        <div className="flex items-center gap-5">
                            <div className="bg-white/20 p-4 rounded-2xl relative shrink-0">
                                <BellRing size={24} className="animate-pulse" />
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-figueira"></span>
                                </span>
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter leading-none">Ação Necessária</h3>
                                <p className="text-xs font-medium text-white/80 mt-1 max-w-md">Foste escalado para <span className="font-black text-white">{escalasPendentes.length} novo(s) serviço(s)</span>.</p>
                            </div>
                        </div>
                        <a href="#agenda-servico" className="w-full md:w-auto text-center bg-white text-figueira px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bg hover:text-fg transition-all active:scale-95 shadow-sm">
                            Ver Escalas
                        </a>
                    </section>
                )}
            </div>

            {/* AGENDA DE SERVIÇO (ESCALAS PESSOAIS) */}
            <section id="agenda-servico" className="space-y-6 scroll-mt-10 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <LayoutDashboard size={20} className="text-figueira" />
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">As Minhas Escalas</h2>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-1">
                        <div className="h-[1px] flex-1 bg-soft hidden sm:block"></div>
                        {/* O NOVO BOTÃO ENTRA AQUI! Passamos o ID do membro logado */}
                        <ModalRelatorioEscalas membroId={membro?.id} />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {listaEscalas.length > 0 ? (
                        listaEscalas.map((esc: any) => {
                            const isConfirmado = esc.confirmado;
                            return (
                                <div key={`${esc.evento.id}-${esc.departamento.id}`} className={`bg-bg2 border transition-all duration-500 flex flex-col justify-between overflow-hidden relative ${isConfirmado ? 'p-4 rounded-[2rem] border-green-500/20 opacity-90 shadow-sm' : 'p-6 rounded-[2.5rem] border-soft shadow-xl border-l-4 border-l-orange-500 hover:border-figueira/50'}`}>
                                    <div>
                                        <div className="flex items-center gap-4">
                                            <div className={`text-bg rounded-2xl text-center shadow-lg transition-all duration-500 ${isConfirmado ? 'bg-green-500 p-2 min-w-[50px]' : 'bg-fg p-3 min-w-[60px]'}`}>
                                                <span className="block text-[7px] font-black uppercase opacity-70">{new Date(esc.evento.data).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                                <span className={`${isConfirmado ? 'text-lg' : 'text-2xl'} block font-black italic leading-none`}>{new Date(esc.evento.data).toLocaleDateString('pt-PT', { day: '2-digit' })}</span>
                                            </div>
                                            <div className="space-y-1 overflow-hidden">
                                                <h5 className={`font-black uppercase italic text-fg leading-tight tracking-tighter truncate ${isConfirmado ? 'text-[10px]' : 'text-xs'}`}>{esc.evento.nome}</h5>
                                                <span className="text-[8px] font-bold text-figueira uppercase bg-figueira/10 px-2 py-0.5 rounded-md border border-figueira/20 inline-block">{esc.departamento.nome}</span>
                                            </div>
                                        </div>
                                        {!isConfirmado && (
                                            <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-2xl animate-in slide-in-from-top-2 duration-500">
                                                <span className="text-[8px] font-black text-orange-600 uppercase tracking-widest block mb-1">Horário da tua Escala:</span>
                                                <p className="text-lg font-black text-orange-700 italic flex items-center gap-2"><Clock size={18} strokeWidth={3} className="text-orange-500" /> {esc.horario || "Verificar Horário"}</p>
                                            </div>
                                        )}
                                        {!isConfirmado && (
                                            <div className="pt-4 mt-4 border-t border-soft animate-in fade-in duration-700">
                                                <span className="text-[8px] font-black text-muted uppercase tracking-widest block mb-1">Função na Escala:</span>
                                                <p className="text-[10px] font-black text-fg uppercase italic leading-tight">{esc.funcoes?.length > 0 ? esc.funcoes.join(' + ') : 'Serviço Geral'}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className={isConfirmado ? 'mt-3' : 'mt-5'}>
                                        <BotoesEscala escalaIds={esc.ids} confirmado={isConfirmado} />
                                    </div>
                                </div>
                            );
                        })
) : (
                        <AvisoEscalaVazia />
                    )}
                </div>
            </section>



            {/* ========================================================= */}
            {/* NOVO LAYOUT INTELIGENTE: ACOLHIMENTO + AGENDA             */}
            {/* ========================================================= */}
            <div className={`grid grid-cols-1 ${isEquipaAcolhimento && meusAcompanhamentos.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8 items-start`}>
                
                {/* COLUNA 1: ACOLHIMENTO (Colapsável) */}
                {isEquipaAcolhimento && meusAcompanhamentos.length > 0 && (
                    <details className="group bg-bg2 border border-soft rounded-[2.5rem] shadow-sm overflow-hidden transition-all">
                        <summary className="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none select-none border-b border-transparent group-open:border-soft transition-colors bg-bg/50 hover:bg-soft/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-figueira/10 text-figueira rounded-2xl">
                                    <HeartHandshake size={24} />
                                </div>
                                <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg">Acolhimento</h2>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-soft flex items-center justify-center text-muted group-open:rotate-180 transition-transform">
                                <ChevronDown size={16} />
                            </div>
                        </summary>
                        <div className="p-6 md:p-8 pt-6 animate-in slide-in-from-top-4 duration-500 bg-bg2">
                            <div className="space-y-4">
                                {meusAcompanhamentos.map((visitante: any) => (
                                    <details key={visitante.id} className="group/item bg-bg border border-soft rounded-[2rem] overflow-hidden transition-all hover:border-figueira/30 shadow-sm">
                                        <summary className="list-none cursor-pointer p-5 flex items-center justify-between gap-4 select-none">
                                            <div className="flex items-center gap-4 truncate">
                                                <div className="w-10 h-10 rounded-xl bg-figueira/10 text-figueira flex items-center justify-center shrink-0">
                                                    <Users size={18} />
                                                </div>
                                                <div className="truncate">
                                                    <h3 className="text-sm font-black text-fg uppercase italic tracking-tight truncate">{visitante.nome}</h3>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{visitante.telefone}</p>
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className="text-muted group-open/item:rotate-180 transition-transform" />
                                        </summary>
                                        <div className="px-5 pb-6 border-t border-soft/30 pt-4 bg-bg2">
                                            <FormAcompanhamentoRapido visitante={visitante} />
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </details>
                )}

                {/* COLUNA 2: AGENDA DA IGREJA (Colapsável) */}
                <details className="group bg-bg2 border border-soft rounded-[2.5rem] shadow-sm overflow-hidden transition-all">
                    <summary className="flex items-center justify-between p-6 md:p-8 cursor-pointer list-none select-none border-b border-transparent group-open:border-soft transition-colors bg-bg/50 hover:bg-soft/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                                <CalendarDays size={24} />
                            </div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg">Agenda Global</h2>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-soft flex items-center justify-center text-muted group-open:rotate-180 transition-transform">
                            <ChevronDown size={16} />
                        </div>
                    </summary>
                    <div className="p-6 md:p-8 pt-6 animate-in slide-in-from-top-4 duration-500 bg-bg2">
                        <WidgetAgendaUnificada 
                            eventosIgreja={proximosEventos} 
                            gruposMembro={gruposUnicos} 
                            isAdmin={role === 'ADMIN'} 
                        />
                    </div>
                </details>
            </div>

            {/* SECÇÃO DE DEPARTAMENTOS */}
            <section className="space-y-6">
                <div className="flex items-center gap-4">
                    <Users size={20} className="text-figueira" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Meus Departamentos</h2>
                    <div className="h-[1px] flex-1 bg-soft"></div>
                </div>

                {departamentosAgrupados.size > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from(departamentosAgrupados.values()).map((depto: any) => (
                            <CardDepartamentoMembro key={depto.id} depto={depto} membroId={membro?.id} role={role} />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 border-2 border-dashed border-soft rounded-[2.5rem] bg-bg2/50 text-center">
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Ainda não fazes parte de nenhum departamento.</p>
                    </div>
                )}
            </section>

            {/* PAINEL FINANCEIRO */}
            <div className="flex items-center gap-4 mb-8">
                <Wallet2 size={20} className="text-figueira" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Minhas Finanças</h2>
                <div className="h-[1px] flex-1 bg-soft"></div>
                                <ModalExtratoMembro membro={membro} />

            </div>
            {membro && (
                <PainelFinanceiroMembro
                    objetivos={membro.objetivos_financeiros || []}
                    numerosRifa={minhasRifas}
                    contribuicoes={minhasContribuicoes}
                />
            )}

            {/* CANTINA E LOYVERSE */}
            <section className="space-y-6 pt-6 border-t border-soft">
                <div className="flex items-center gap-4 mb-8">
                    <Coffee size={20} className="text-figueira" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Cantina e Consumos</h2>
                    <div className="h-[1px] flex-1 bg-soft"></div>
                </div>

                <div className="grid md:grid-cols-12 gap-8 items-start">
                    <div className="md:col-span-4 lg:col-span-3">
                        <CardWalletCantina membro={membro} saldoLoyverse={saldoCantina} />
                    </div>

                    <div className="md:col-span-8 lg:col-span-9 space-y-8">
                        <div className="bg-bg2 border border-soft p-6 lg:p-8 rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-figueira/10 rounded-[1.5rem] text-figueira hidden sm:block"><Receipt size={24} /></div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                        Conta Cantina
                                        {membro?.loyverse_id ? (
                                            <span className="bg-green-500/10 text-green-600 font-black tracking-widest text-[8px] px-2 py-0.5 rounded-full border border-green-500/20 uppercase">Ativa</span>
                                        ) : (
                                            <span className="bg-red-500/10 text-red-500 font-black tracking-widest text-[8px] px-2 py-0.5 rounded-full border border-red-500/20 uppercase">Pendente</span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-muted leading-relaxed font-medium max-w-md">Identifica-te no balcão da cantina para debitar as tuas compras automaticamente.</p>
                                </div>
                            </div>
                            <div className="shrink-0"><ModalCarregarCantina membroId={membro.id} /></div>
                        </div>

                        <div id="secao-extrato" className="scroll-mt-24">
                            <SessaoExtratoCantina carregamentos={carregamentosHistorico} objetivos={membro?.objetivos_financeiros || []} />
                        </div>
                    </div>
                </div>
            </section>

            {/* WIDGET FLUTUANTE DE MENSAGENS */}
            <WidgetMural avisos={ultimosAvisos} />

        </main>
    )
}