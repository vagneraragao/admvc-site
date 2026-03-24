// app/membros/dashboard/page.tsx
import prisma from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import {
    ShieldCheck, PieChart, UserCircle, LogOut, Users,
    LayoutDashboard, Coffee, Receipt, BellRing, FileSignature,
    HeartHandshake, Store, Heart, MessageSquare
} from 'lucide-react'
import { logoutMembro } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import CardWalletCantina from '@/components/membros/CardWalletCantina'
import BotoesEscala from '@/components/membros/BotoesEscala'
import PainelFinanceiroMembro from '@/components/membros/PainelFinanceiroMembro'
import ModalCarregarCantina from '@/components/membros/ModalCarregarCantina'
import BotaoVoltar from '@/components/membros/BotaoVoltar'
import CardDepartamentoMembro from '@/components/membros/CardDepartamentoMembro'
import SessaoExtratoCantina from '@/components/membros/SessaoExtratoCantina'
import WidgetMural from '@/components/membros/WidgetMural'

export default async function DashboardMembro() {
    const session = await getSessionData();

    if (!session) redirect('/membros/login');

    const { membroId, role } = session;

    // 1. BUSCA O MEMBRO E AS SUAS INFORMAÇÕES
    const membro = await prisma.membro.findUnique({
        where: { id: membroId },
        include: {
            ministerios: { include: { departamento: true } },
            grupos: true, // Necessário para o Mural
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

    if (!membro) {
        return redirect('/membros/login?error=Sessão expirada ou utilizador inexistente');
    }

    const isEquipaAcolhimento = membro.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('acolhimento') || nomeDepto.includes('integração');
    });

    const isEquipaCantina = membro.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('cantina');
    });

    const isEquipaSocial = membro.ministerios.some(vinculo => {
        const nomeDepto = vinculo.departamento?.nome.toLowerCase() || '';
        return nomeDepto.includes('social') || nomeDepto.includes('despensa') || nomeDepto.includes('assistência');
    });

    const visitantesPendentesCount = (role === 'ADMIN' || isEquipaAcolhimento)
        ? await prisma.visitante.count({ where: { status: 'NOVO' } })
        : 0;

    const deptIds = membro.ministerios?.map(m => m.departamento?.id).filter(Boolean) || [];
    const grupoIds = membro.grupos?.map(g => g.id).filter(Boolean) || [];

    const ultimosAvisos = await prisma.avisoMural.findMany({
        where: {
            OR: [
                { departamento_id: { in: deptIds.length > 0 ? deptIds : [-1] } },
                { grupo_id: { in: grupoIds.length > 0 ? grupoIds : [-1] } }
            ]
        },
        include: {
            autor: { select: { first_name: true, last_name: true, avatar_file: true } },
            departamento: { select: { nome: true } },
            grupo: { select: { nome: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    // 2. BUSCAS ADICIONAIS
    const minhasRifas = await prisma.rifaNumero.findMany({
        where: { membro_id: membroId },
        include: { rifa: true },
        orderBy: { createdAt: 'desc' }
    });

    const minhasContribuicoes = await prisma.contribuicao.findMany({
        where: { membro_id: membroId },
        orderBy: { data: 'desc' }
    });

    const carregamentosHistorico = await prisma.pedidoSaldoCantina.findMany({
        where: { membro_id: membroId },
        orderBy: { createdAt: 'desc' }
    });

    // 3. BUSCA O SALDO DO LOYVERSE
    let saldoCantina = 0;
    if (membro?.loyverse_id) {
        try {
            const loyverseToken = process.env.LOYVERSE_ACCESS_TOKEN;
            const res = await fetch(`https://api.loyverse.com/v1.0/customers/${membro.loyverse_id}`, {
                headers: { 'Authorization': `Bearer ${loyverseToken}` },
                next: { revalidate: 60 }
            });
            if (res.ok) {
                const data = await res.json();
                saldoCantina = data.total_points || 0;
            }
        } catch (error) {
            console.error("Erro ao buscar saldo Loyverse:", error);
        }
    }

    const escalasPendentes = membro?.escalas.filter((esc: any) => !esc.confirmado) || [];
    const iniciais = `${membro?.first_name?.[0] || 'M'}${membro?.last_name?.[0] || 'V'}`;

    // --- LÓGICA 1: AGRUPAR DEPARTAMENTOS ---
    const departamentosAgrupados = new Map();
    membro?.ministerios?.forEach((vinculo: any) => {
        const depto = vinculo.departamento;
        if (!depto) return;

        if (departamentosAgrupados.has(depto.id)) {
            const existente = departamentosAgrupados.get(depto.id);
            if (!existente.funcoes.includes(vinculo.funcao)) existente.funcoes.push(vinculo.funcao);
        } else {
            departamentosAgrupados.set(depto.id, {
                id: depto.id,
                nome: depto.nome,
                lider_id: depto.lider_id,
                funcoes: [vinculo.funcao]
            });
        }
    });

    // --- LÓGICA 2: AGRUPAR ESCALAS ---
    const escalasAgrupadas = new Map();
    membro?.escalas.forEach((esc: any) => {
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

            {/* ========================================================= */}
            {/* NAVEGAÇÃO DE TOPO                                         */}
            {/* ========================================================= */}
            <nav className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-soft">
                <div className="flex flex-wrap items-center gap-3">
                    <BotaoVoltar />

                    <div className="px-5 py-3 bg-figueira text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg cursor-default">
                        <UserCircle size={16} /> Área de Membro
                    </div>

                    {/* Divisor vertical */}
                    <div className="hidden md:block w-[1px] h-6 bg-soft mx-2"></div>

                    <div className="flex flex-wrap items-center gap-2">

                        {/* 👇 NOVO BOTÃO: MURAL (Aparece para todos, logo após a Área de Membro) */}
                        <Link href="/membros/mural" className="px-4 py-3 bg-bg2 border border-soft text-muted hover:text-figueira hover:border-figueira rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 group">
                            <MessageSquare size={14} className="text-figueira group-hover:scale-110 transition-transform" />
                            Mural
                        </Link>

                        {/* BOTÃO AÇÃO SOCIAL / DESPENSA */}
                        {(role === 'ADMIN' || role === 'FINANCE' || isEquipaSocial) && (
                            <Link href="/admin/despensa" className="px-4 py-3 bg-bg2 border border-soft text-muted hover:text-blue-500 hover:border-blue-500 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 group">
                                <Heart size={14} className="text-blue-500 group-hover:scale-110 transition-transform" />
                                Social
                            </Link>
                        )}

                        {/* BOTÃO CANTINA */}
                        {(role === 'ADMIN' || role === 'FINANCE' || isEquipaCantina) && (
                            <Link href="/admin/cantina" className="px-4 py-3 bg-bg2 border border-soft text-muted hover:text-amber-500 hover:border-amber-500 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 group">
                                <Store size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
                                Cantina
                            </Link>
                        )}

                        {/* BOTÃO ACOLHIMENTO */}
                        {(role === 'ADMIN' || isEquipaAcolhimento) && (
                            <Link href="/admin/acolhimento" className="px-4 py-3 bg-bg2 border border-soft text-muted hover:text-figueira hover:border-figueira rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 group">
                                <HeartHandshake size={14} className="text-figueira group-hover:scale-110 transition-transform" />
                                Acolhimento
                            </Link>
                        )}

                        {role === 'ADMIN' && (
                            <>
                                <Link href="/financeiro/dashboard" className="px-4 py-3 bg-bg2 border border-soft text-muted hover:text-green-600 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                                    <PieChart size={14} className="text-green-500" /> Financeiro
                                </Link>
                                <Link href="/admin/dashboard" className="px-4 py-3 bg-bg2 border border-soft text-muted hover:text-fg rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                                    <ShieldCheck size={14} className="text-figueira" /> ADMIN
                                </Link>
                            </>
                        )}

                        {/* BOTÃO FINANCEIRO */}
                        {role === 'FINANCE' && (
                            <>
                                <Link href="/financeiro/dashboard" className="px-4 py-3 bg-bg2 border border-soft text-muted hover:text-fg rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                                    <PieChart size={14} className="text-green-500" /> Financeiro
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-muted/40 italic">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    Acesso: {role}
                </div>
            </nav>

            {/* ========================================================= */}
            {/* HEADER DO PERFIL COM LOGOUT                               */}
            {/* ========================================================= */}
            <header className="bg-bg2 border border-soft p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 shrink-0">
                            {membro?.avatar_file ? (
                                <Image src={membro.avatar_file} alt="Perfil" fill className="rounded-3xl object-cover border-4 border-white shadow-lg" />
                            ) : (
                                <div className="w-full h-full rounded-3xl bg-fg text-bg flex items-center justify-center text-2xl font-black border-4 border-white shadow-lg">
                                    {iniciais}
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl md:text-4xl font-black text-fg italic tracking-tighter uppercase leading-none">
                                {membro?.first_name} <span className="text-muted">{membro?.last_name}</span>
                            </h1>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[9px] font-black text-figueira bg-figueira/10 px-3 py-1 rounded-full uppercase tracking-widest">
                                    Membro {role}
                                </span>
                                {membro?.familia && (
                                    <span className="text-[9px] font-black text-muted bg-soft px-3 py-1 rounded-full uppercase tracking-widest italic">
                                        Família {membro.familia.surname}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Link href={`/membros/perfil/editar/${membro?.id}`} className="flex-1 md:flex-none flex items-center justify-center gap-2 p-4 bg-bg border border-soft text-muted hover:text-figueira rounded-2xl group transition-all">
                            <UserCircle size={20} className="group-hover:scale-110 transition-transform" />
                            <span className="md:hidden text-[10px] font-black uppercase tracking-widest">Editar Perfil</span>
                        </Link>
                        <form action={logoutMembro} className="flex-1 md:flex-none">
                            <button type="submit" className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all group">
                                <LogOut size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Terminar Sessão</span>
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* ========================================================= */}
            {/* AVISOS E WIDGETS DE GESTÃO                                */}
            {/* ========================================================= */}
            <div className="space-y-4">

                {/* WIDGET: ALERTAS DE ACOLHIMENTO (Apenas Equipa/Admin) */}
                {(visitantesPendentesCount > 0) && (
                    <section className="bg-emerald-50 border-2 border-emerald-500/20 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <div className="flex items-center gap-5">
                            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl shrink-0">
                                <HeartHandshake size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase italic tracking-tighter text-fg leading-none">Novos Visitantes</h3>
                                <p className="text-xs font-medium text-muted mt-1 max-w-xl">
                                    Existem <span className="font-black text-emerald-600">{visitantesPendentesCount} pessoas</span> que visitaram a igreja e aguardam um contacto de boas-vindas.
                                </p>
                            </div>
                        </div>
                        <Link href="/admin/acolhimento" className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shrink-0 shadow-lg shadow-emerald-600/20">
                            Fazer Acompanhamento
                        </Link>
                    </section>
                )}

                {/* AVISO GDPR */}
                {membro && !membro.termo_aceite && (
                    <section className="bg-bg2 border-2 border-orange-500/20 p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden animate-in fade-in duration-500">
                        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                        <div className="flex items-center gap-5">
                            <div className="bg-orange-500/10 text-orange-500 p-4 rounded-2xl shrink-0">
                                <FileSignature size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase italic tracking-tighter text-fg leading-none">Assinatura Pendente</h3>
                                <p className="text-xs font-medium text-muted mt-1 max-w-xl">Ainda não assinaste os documentos <strong>Permanecer</strong> e <strong>GDPR</strong>. É obrigatório para servires ativamente na igreja.</p>
                            </div>
                        </div>
                        <Link href="/membros/termos" className="w-full md:w-auto flex items-center justify-center bg-orange-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shrink-0 shadow-lg">
                            Ler e Assinar
                        </Link>
                    </section>
                )}

                {/* AVISO ESCALAS */}
                {escalasPendentes.length > 0 && (
                    <section className="bg-figueira text-white p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl border-4 border-figueira/20 animate-in fade-in duration-500">
                        <div className="flex items-center gap-5">
                            <div className="bg-white/20 p-4 rounded-2xl relative">
                                <BellRing size={28} className="animate-pulse" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-figueira"></span>
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase italic tracking-tighter leading-none">Ação Necessária</h3>
                                <p className="text-xs font-medium text-white/80 mt-1 max-w-md">Foste escalado para <span className="font-black text-white">{escalasPendentes.length} novo(s) serviço(s)</span>. Por favor, confirma a tua presença.</p>
                            </div>
                        </div>
                        <a href="#agenda-servico" className="w-full md:w-auto text-center bg-white text-figueira px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bg hover:text-fg transition-all active:scale-95 shadow-lg">
                            Ver Agenda
                        </a>
                    </section>
                )}
            </div>

            {/* ========================================================= */}
            {/* DEPARTAMENTOS DO MEMBRO                                   */}
            {/* ========================================================= */}
            {departamentosAgrupados.size > 0 && (
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Users size={20} className="text-figueira" />
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Meus Departamentos</h2>
                        <div className="h-[1px] flex-1 bg-soft"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.from(departamentosAgrupados.values()).map((depto: any) => (
                            <CardDepartamentoMembro key={depto.id} depto={depto} membroId={membro?.id} role={role} />
                        ))}
                    </div>
                </section>
            )}

            {/* ========================================================= */}
            {/* AGENDA E ESCALAS                                          */}
            {/* ========================================================= */}
            <section id="agenda-servico" className="space-y-6 scroll-mt-10">
                <div className="flex items-center gap-4">
                    <LayoutDashboard size={20} className="text-figueira" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Agenda de Serviço</h2>
                    <div className="h-[1px] flex-1 bg-soft"></div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {listaEscalas.length > 0 ? (
                        listaEscalas.map((esc: any) => (
                            <div key={`${esc.evento.id}-${esc.departamento.id}`} className="bg-bg2 border border-soft p-6 rounded-[2.5rem] shadow-sm hover:border-figueira/50 transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-fg text-bg p-3 rounded-2xl text-center min-w-[60px] shadow-lg">
                                            <span className="block text-[8px] font-black uppercase opacity-50">{new Date(esc.evento.data).toLocaleDateString('pt-PT', { month: 'short' })}</span>
                                            <span className="block text-2xl font-black italic">{new Date(esc.evento.data).toLocaleDateString('pt-PT', { day: '2-digit' })}</span>
                                        </div>
                                        <div className="space-y-1">
                                            <h5 className="text-xs font-black uppercase italic text-fg leading-none tracking-tighter">{esc.evento.nome}</h5>
                                            <span className="text-[9px] font-bold text-figueira uppercase bg-figueira/10 px-2 py-0.5 rounded-md border border-figueira/20 inline-block mt-1">
                                                {esc.departamento.nome}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-soft">
                                        <span className="text-[8px] font-black text-muted uppercase tracking-widest block mb-1">Servirás como:</span>
                                        <p className="text-[10px] font-black text-fg uppercase italic leading-tight">{esc.funcoes.join(' + ')}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <BotoesEscala escalaIds={esc.ids} confirmado={esc.confirmado} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-16 border-2 border-dashed border-soft rounded-[3rem] text-center bg-bg2/30">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Estás livre de escalas por enquanto.</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ========================================================= */}
            {/* PAINEL FINANCEIRO (RIFAS E CARNÊS)                        */}
            {/* ========================================================= */}
            {membro && (
                <PainelFinanceiroMembro
                    objetivos={membro.objetivos_financeiros || []}
                    numerosRifa={minhasRifas}
                    contribuicoes={minhasContribuicoes}
                />
            )}

            {/* ========================================================= */}
            {/* CANTINA E LOYVERSE                                        */}
            {/* ========================================================= */}
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
                                <div className="p-4 bg-figueira/10 rounded-[1.5rem] text-figueira hidden sm:block">
                                    <Receipt size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                        Conta Cantina
                                        {membro?.loyverse_id ? (
                                            <span className="bg-green-500/10 text-green-600 font-black tracking-widest text-[8px] px-2 py-0.5 rounded-full border border-green-500/20 uppercase">Ativa</span>
                                        ) : (
                                            <span className="bg-red-500/10 text-red-500 font-black tracking-widest text-[8px] px-2 py-0.5 rounded-full border border-red-500/20 uppercase">Pendente</span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-muted leading-relaxed font-medium max-w-md">
                                        Identifica-te no balcão da cantina para debitar as tuas compras automaticamente.
                                    </p>
                                </div>
                            </div>

                            <div className="shrink-0">
                                <ModalCarregarCantina membroId={membro.id} />
                            </div>
                        </div>

                        <div id="secao-extrato" className="scroll-mt-24">
                            <SessaoExtratoCantina carregamentos={carregamentosHistorico} objetivos={membro?.objetivos_financeiros || []} />
                        </div>
                    </div>
                </div>
            </section>

            {/* 👇 WIDGET FLUTUANTE DE MENSAGENS (NO CANTO INFERIOR) */}
            <WidgetMural avisos={ultimosAvisos} />

        </main>
    )
}