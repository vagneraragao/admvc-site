// app/membros/dashboard/page.tsx
import prisma from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import {
    ShieldCheck, PieChart, UserCircle, LogOut, Users,
    LayoutDashboard, Coffee, Receipt, BellRing, FileSignature,
    HeartHandshake, Store, Heart, MessageSquare, Menu, ArrowLeft
} from 'lucide-react'
import { logoutMembro } from '@/actions/auth-actions'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import CardWalletCantina from '@/components/membros/CardWalletCantina'
import BotoesEscala from '@/components/membros/BotoesEscala'
import PainelFinanceiroMembro from '@/components/membros/PainelFinanceiroMembro'
import ModalCarregarCantina from '@/components/cantina/ModalCarregarCantina'
import BotaoVoltar from '@/components/membros/BotaoVoltar'
import CardDepartamentoMembro from '@/components/membros/CardDepartamentoMembro'
import SessaoExtratoCantina from '@/components/membros/SessaoExtratoCantina'
import WidgetMural from '@/components/membros/WidgetMural'
import WidgetAgendaIgreja from '@/components/membros/WidgetAgendaIgreja'

export default async function DashboardMembro() {
    const proximosEventos = await prisma.evento.findMany({
        where: {
            data: { gte: new Date() } // Apenas eventos de hoje em diante
        },
        orderBy: {
            data: 'asc' // O mais próximo primeiro
        },
        take: 10 // Limitar para não sobrecarregar
    });

    const session = await getSessionData();

    if (!session) redirect('/membros/login');

    const { membroId, role } = session;

    // 1. BUSCA O MEMBRO E AS SUAS INFORMAÇÕES
    const membro = await prisma.membro.findUnique({
        where: { id: membroId },
        include: {
            ministerios: { include: { departamento: true } },
            grupos: true,
            lider_de_grupo: true,
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

    // VERIFICAÇÕES DE PERMISSÃO
    const isEquipaAcolhimento = membro.ministerios.some(v => v.departamento?.nome.toLowerCase().includes('acolhimento') || v.departamento?.nome.toLowerCase().includes('integração'));
    const isEquipaCantina = membro.ministerios.some(v => v.departamento?.nome.toLowerCase().includes('cantina'));
    const isEquipaSocial = membro.ministerios.some(v => v.departamento?.nome.toLowerCase().includes('social') || v.departamento?.nome.toLowerCase().includes('despensa') || v.departamento?.nome.toLowerCase().includes('assistência'));

    // Mostra o dropdown se o utilizador for admin ou participar numa equipa especial
    const mostraFerramentasExtra = role === 'ADMIN' || role === 'FINANCE' || isEquipaAcolhimento || isEquipaCantina || isEquipaSocial;

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
        include: { autor: { select: { first_name: true, last_name: true, avatar_file: true } }, departamento: { select: { nome: true } }, grupo: { select: { nome: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    const minhasRifas = await prisma.rifaNumero.findMany({ where: { membro_id: membroId }, include: { rifa: true }, orderBy: { createdAt: 'desc' } });
    const minhasContribuicoes = await prisma.contribuicao.findMany({ where: { membro_id: membroId }, orderBy: { data: 'desc' } });
    const carregamentosHistorico = await prisma.pedidoSaldoCantina.findMany({ where: { membro_id: membroId }, orderBy: { createdAt: 'desc' } });

    let saldoCantina = 0;
    if (membro?.loyverse_id) {
        try {
            const loyverseToken = process.env.LOYVERSE_ACCESS_TOKEN;
            const res = await fetch(`https://api.loyverse.com/v1.0/customers/${membro.loyverse_id}`, { headers: { 'Authorization': `Bearer ${loyverseToken}` }, next: { revalidate: 60 } });
            if (res.ok) { const data = await res.json(); saldoCantina = data.total_points || 0; }
        } catch (error) { console.error("Erro ao buscar saldo Loyverse:", error); }
    }

    const escalasPendentes = membro?.escalas.filter((esc: any) => !esc.confirmado) || [];
    const iniciais = `${membro?.first_name?.[0] || 'M'}${membro?.last_name?.[0] || 'V'}`;

    const departamentosAgrupados = new Map();

    // Adiciona Departamentos
    membro?.ministerios?.forEach((vinculo: any) => {
        const depto = vinculo.departamento;
        if (!depto) return;
        const key = `depto-${depto.id}`; // 👈 Chave única
        if (departamentosAgrupados.has(key)) {
            const existente = departamentosAgrupados.get(key);
            if (!existente.funcoes.includes(vinculo.funcao)) existente.funcoes.push(vinculo.funcao);
        } else {
            departamentosAgrupados.set(key, {
                id: depto.id,
                nome: depto.nome,
                tipo: 'DEPARTAMENTO',
                lider_id: depto.lider_id,
                funcoes: [vinculo.funcao]
            });
        }
    });

    // Adiciona Grupos Participantes
    membro?.grupos?.forEach((grupo: any) => {
        const key = `grupo-${grupo.id}`; // 👈 Chave única
        if (!departamentosAgrupados.has(key)) {
            departamentosAgrupados.set(key, {
                id: grupo.id,
                nome: grupo.nome,
                tipo: 'GRUPO',
                funcoes: ['Membro']
            });
        }
    });

    // Adiciona/Sobrescreve com Grupos onde é LÍDER
    membro?.lider_de_grupo?.forEach((grupo: any) => {
        const key = `grupo-${grupo.id}`;
        departamentosAgrupados.set(key, {
            id: grupo.id,
            nome: grupo.nome,
            tipo: 'GRUPO',
            funcoes: ['Líder do Grupo'] // Dá prioridade visual à liderança
        });
    });

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

    const hoje = new Date();
    const gdprPendente = !membro.gdpr_aceite || (membro.gdpr_validade && membro.gdpr_validade < hoje);
    const permanecerPendente = !membro.permanecer_aceite || (membro.permanecer_validade && membro.permanecer_validade < hoje);

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-12 animate-in fade-in duration-700 relative">

            {/* ========================================================= */}
            {/* CABEÇALHO DO PERFIL & NAVEGAÇÃO COMPACTA                  */}
            {/* ========================================================= */}
            <header className="bg-bg2 border border-soft p-6 lg:p-8 rounded-[3rem] shadow-xl relative overflow-visible">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">

                    {/* INFO DO MEMBRO */}
                    <div className="flex items-center gap-6">
                        <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                            {membro?.avatar_file ? (
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
                                    {membro?.first_name} <span className="text-muted">{membro?.last_name}</span>
                                </h1>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse hidden sm:block"></div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <span className="text-[9px] font-black text-figueira bg-figueira/10 px-3 py-1 rounded-full uppercase tracking-widest border border-figueira/20">
                                    {role === 'ADMIN' ? 'Administrador' : role === 'FINANCE' ? 'Tesouraria' : 'Membro'}
                                </span>
                                {membro?.familia && (
                                    <span className="text-[9px] font-black text-muted bg-soft px-3 py-1 rounded-full uppercase tracking-widest italic border border-soft/50">
                                        Família {membro.familia.surname}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AÇÕES (MURAL, FERRAMENTAS, LOGOUT) */}
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto pt-4 lg:pt-0 border-t border-soft lg:border-0">

                        <Link href="/membros/mural" className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-12 px-6 bg-bg border border-soft text-muted hover:text-figueira hover:border-figueira rounded-2xl group transition-all shadow-sm">
                            <MessageSquare size={16} className="group-hover:scale-110 transition-transform text-figueira" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Mural</span>
                        </Link>

                        <Link href={`/membros/perfil/editar/${membro?.id}`} className="flex-1 lg:flex-none flex items-center justify-center gap-2 h-12 px-4 bg-bg border border-soft text-muted hover:text-fg hover:border-fg rounded-2xl group transition-all shadow-sm" title="Editar Perfil">
                            <UserCircle size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="lg:hidden text-[10px] font-black uppercase tracking-widest">Perfil</span>
                        </Link>

                        {/* DROPDOWN DE FERRAMENTAS EXTRA (APARECE SE TIVER PERMISSÕES) */}
                        {mostraFerramentasExtra && (
                            <details className="group relative z-50 flex-1 lg:flex-none">
                                <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                                    <div className="h-12 w-full lg:w-12 bg-figueira text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-figueira/90 transition-all shadow-sm active:scale-95">
                                        <Menu size={18} />
                                        <span className="lg:hidden text-[10px] font-black uppercase tracking-widest">Ferramentas</span>
                                    </div>
                                </summary>

                                <div className="absolute right-0 top-full mt-2 w-56 bg-bg border border-soft p-2 rounded-[1.5rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1 z-50">
                                    <p className="text-[9px] font-black uppercase text-figueira tracking-widest border-b border-soft/50 pb-2 mb-1 px-3 mt-1">
                                        Área de Serviço
                                    </p>

                                    {role === 'ADMIN' && (
                                        <Link href="/admin/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <ShieldCheck size={14} className="text-muted group-hover/link:text-figueira" /> Painel ADMIN
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || role === 'FINANCE') && (
                                        <Link href="/financeiro/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <PieChart size={14} className="text-muted group-hover/link:text-figueira" /> Financeiro
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || role === 'FINANCE' || isEquipaCantina) && (
                                        <Link href="/cantina/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <Store size={14} className="text-muted group-hover/link:text-figueira" /> Cantina POS
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || role === 'FINANCE' || isEquipaSocial) && (
                                        <Link href="/cantina/despensa" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
                                            <Heart size={14} className="text-muted group-hover/link:text-figueira" /> Ação Social
                                        </Link>
                                    )}
                                    {(role === 'ADMIN' || isEquipaAcolhimento) && (
                                        <Link href="/acolhimento/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-4 py-3 rounded-xl transition-all flex items-center gap-3 group/link">
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

            {/* ========================================================= */}
            {/* AVISOS CRÍTICOS (MANTIDOS IGUAIS PORQUE SÃO IMPORTANTES)  */}
            {/* ========================================================= */}
            <div className="space-y-4">
                {(visitantesPendentesCount > 0 && (role === 'ADMIN' || isEquipaAcolhimento)) && (
                    <section className="bg-emerald-50 border-2 border-emerald-500/20 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                        <div className="flex items-center gap-5">
                            <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-2xl shrink-0">
                                <HeartHandshake size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg leading-none">Novos Visitantes</h3>
                                <p className="text-xs font-medium text-muted mt-1 max-w-xl">
                                    Existem <span className="font-black text-emerald-600">{visitantesPendentesCount} pessoas</span> a aguardar contacto de boas-vindas.
                                </p>
                            </div>
                        </div>
                        <Link href="/acolhimento/dashboard" className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shrink-0 shadow-sm">
                            Acompanhar
                        </Link>
                    </section>
                )}

                {(gdprPendente || permanecerPendente) && (
                    <section className="bg-bg2 border-2 border-orange-500/20 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden animate-in fade-in duration-500">
                        <div className="absolute top-0 left-0 w-2 h-full bg-orange-500"></div>
                        <div className="flex items-center gap-5">
                            <div className="bg-orange-500/10 text-orange-500 p-4 rounded-2xl shrink-0">
                                <FileSignature size={24} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg leading-none">Assinaturas Pendentes</h3>
                                <p className="text-xs font-medium text-muted mt-1 max-w-xl">
                                    Renova ou assina os teus termos obrigatórios:
                                    {gdprPendente && <span className="font-black text-orange-500 ml-1">GDPR</span>}
                                    {gdprPendente && permanecerPendente && " e "}
                                    {permanecerPendente && <span className="font-black text-orange-500 ml-1">Permanecer</span>}.
                                </p>
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
                                <p className="text-xs font-medium text-white/80 mt-1 max-w-md">Foste escalado para <span className="font-black text-white">{escalasPendentes.length} novo(s) serviço(s)</span>. Confirma a tua presença.</p>
                            </div>
                        </div>
                        <a href="#agenda-servico" className="w-full md:w-auto text-center bg-white text-figueira px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-bg hover:text-fg transition-all active:scale-95 shadow-sm">
                            Ver Escalas
                        </a>
                    </section>
                )}
            </div>

            {/* O RESTO DA PÁGINA MANTÉM-SE INALTERADO A PARTIR DAQUI (Departamentos, Escalas, Financeiro, Cantina) */}
            {/* ========================================================= */}
            {/* DEPARTAMENTOS DO MEMBRO & AGENDA DA IGREJA                */}
            {/* ========================================================= */}
            {/* ... o código que já tens continua aqui por baixo ... */}

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* COLUNA ESQUERDA (Ocupa 2/3 do ecrã): Departamentos */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-4">
                        <Users size={20} className="text-figueira" />
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Meus Departamentos</h2>
                        <div className="h-[1px] flex-1 bg-soft"></div>
                    </div>

                    {departamentosAgrupados.size > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Array.from(departamentosAgrupados.values()).map((depto: any) => (
                                <CardDepartamentoMembro key={depto.id} depto={depto} membroId={membro?.id} role={role} />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 border-2 border-dashed border-soft rounded-[2.5rem] bg-bg2/50 text-center">
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Ainda não fazes parte de nenhum departamento.</p>
                        </div>
                    )}
                </div>

                {/* COLUNA DIREITA (Ocupa 1/3 do ecrã): Agenda Global */}
                <div className="lg:col-span-1 h-full">
                    <WidgetAgendaIgreja eventos={proximosEventos} isAdmin={role === 'ADMIN'} />
                </div>
            </section>

            {/* AGENDA DE SERVIÇO (ESCALAS PESSOAIS) */}
            <section id="agenda-servico" className="space-y-6 scroll-mt-10 pt-6">
                <div className="flex items-center gap-4">
                    <LayoutDashboard size={20} className="text-figueira" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">As Minhas Escalas</h2>
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

            {/* PAINEL FINANCEIRO */}
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

            {/* WIDGET FLUTUANTE DE MENSAGENS */}
            <WidgetMural avisos={ultimosAvisos} />

        </main>
    )
}