// app/membros/dashboard/page.tsx
import { Suspense } from 'react'
import { getTenantClient } from '@/lib/prisma'
import { headers } from 'next/headers'
import ModuloBloqueado from '@/components/ui/ModuloBloqueado'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import { logoutMembro } from '@/actions/auth-actions'

import {
    ShieldCheck, PieChart, UserCircle, LogOut, Users,
    LayoutDashboard, Coffee, Receipt, BellRing, FileSignature,
    HeartHandshake, Store, Heart, MessageSquare, Menu, MapPin,
    Clock, CalendarDays, MonitorPlay, Wallet2, ListMusic, ChevronRight,
    Pencil
} from 'lucide-react'

// Componentes
import CardWalletCantina from '@/components/membros/CardWalletCantina'
import BotoesEscala from '@/components/membros/BotoesEscala'
import PainelFinanceiroMembro from '@/components/membros/PainelFinanceiroMembro'
import CardDepartamentoMembro from '@/components/membros/CardDepartamentoMembro'
import SessaoExtratoCantina from '@/components/membros/SessaoExtratoCantina'
import NotificacaoHeader from '@/components/membros/NotificacaoHeader'
import FormAcompanhamentoRapido from '@/components/acolhimento/FormAcompanhamentoRapido'
import WidgetAgendaUnificada from '@/components/membros/WidgetAgendaUnificada'
import AvisoEscalaVazia from '@/components/membros/AvisoEscalaVazia'
import ModalRelatorioEscalas from '@/components/membros/ModalRelatorioEscalas'
import ModalExtratoMembro from '@/components/financeiro/ModalExtratoMembro'
import ModalRepertorio from '@/components/louvor/ModalRepertorio'
import ModalHistoricoEscalas from '@/components/louvor/ModalHistoricoEscalas'
import ModalGestaoGrupo from '@/components/membros/ModalGestaoGrupo'
import DrawerEditarPerfil from '@/components/membros/DrawerEditarPerfil'
import CardAniversariantesMes from '@/components/membros/CardAniversariantesMes'
import ModalDetalhesEscala from '@/components/membros/ModalDetalhesEscalas'
import ModalIndisponibilidade from '@/components/membros/ModalIndisponibilidade'
import BotaoSetlistPalco from '@/components/louvor/BotaoSetlistPalco'

export default async function DashboardMembro({
    searchParams
}: {
    searchParams: { tab?: string }
}) {
    const { tab } = await searchParams;
    const currentTab = tab || 'geral';

    // 1. DADOS BASE DA SESSÃO E TENANT
    const session = await getSessionData();
    if (!session) redirect('/membros/login');
    const { membroId, role } = session;

    const headersList = await headers();
    const tenantIdStr = headersList.get('x-tenant-id');

    if (!tenantIdStr) {
        return redirect('/membros/login?error=Igreja não identificada na sessão.');
    }

    const db = getTenantClient(Number(tenantIdStr));

    // Buscar nome da igreja
    const tenantData = await db.tenant.findFirst({ select: { nome: true } })
    const igrejaName = tenantData?.nome || 'Igreja'

    // 2. BUSCA O MEMBRO — com grupos e encontros incluídos
    const membro = await db.membro.findUnique({
        where: { id: membroId },
        include: {
            // ✅ Grupos como MEMBRO — com membros, líderes e encontros
            grupos: {
                include: {
                    membros: {
                        select: { id: true, first_name: true, last_name: true, avatar_file: true }
                    },
                    lideres: {
                        select: { id: true, first_name: true, last_name: true }
                    },
                    encontros: {
                        include: {
                            presentes: {
                                select: { id: true, first_name: true, last_name: true }
                            }
                        },
                        orderBy: { data: 'desc' },
                        take: 20
                    }
                }
            },
            // ✅ Grupos como LÍDER — mesma estrutura
            lider_de_grupo: {
                include: {
                    membros: {
                        select: { id: true, first_name: true, last_name: true, avatar_file: true }
                    },
                    lideres: {
                        select: { id: true, first_name: true, last_name: true }
                    },
                    encontros: {
                        include: {
                            presentes: {
                                select: { id: true, first_name: true, last_name: true }
                            }
                        },
                        orderBy: { data: 'desc' },
                        take: 20
                    }
                }
            },
            departamentos_liderados: true,
            ministerios: {
                include: { departamento: true, funcoes: { include: { funcao: true } } }
            },
            familia: true,
            congregacao: { select: { nome: true, cidade: true } },
            escalas: {
                where: { evento: { data: { gte: new Date() } } },
                orderBy: { evento: { data: 'asc' } },
                include: {
                    departamento: true,
                    evento: {
                        include: {
                            repertorio: {
                                include: { musica: true },
                                orderBy: { ordem: 'asc' }
                            }
                        }
                    }
                }
            },
            objetivos_financeiros: {
                include: { lancamentos: { orderBy: { data_recebimento: 'desc' } } }
            }
        }
    });

    if (!membro) return redirect('/membros/login?error=Sessão expirada ou utilizador inexistente');

    // 3. LÓGICA DE PERMISSÕES
    const checkDepto = (termos: string[]) => {
        const isInMinisterio = membro.ministerios.some((v: any) =>
            termos.some(termo => v.departamento?.nome.toLowerCase().includes(termo))
        );
        const isLiderando = membro.departamentos_liderados.some((d: any) =>
            termos.some(termo => d.nome.toLowerCase().includes(termo))
        );
        return isInMinisterio || isLiderando;
    };

    const permissoes = {
        isMidia: checkDepto(['mídia', 'midia', 'multimédia']),
        isAcolhimento: checkDepto(['acolhimento', 'integração']),
        isCantina: checkDepto(['cantina']),
        isSocial: checkDepto(['social', 'despensa', 'assistência']),
        isLouvor: checkDepto(['louvor', 'música', 'musica', 'banda']),
        isLider: membro.departamentos_liderados?.length > 0 || membro.lider_de_grupo?.length > 0,
        isAdminOrFinance: isAdmin(role) || role === 'FINANCE'
    };

    const mostraFerramentasExtra = permissoes.isAdminOrFinance || permissoes.isAcolhimento || permissoes.isCantina || permissoes.isSocial || permissoes.isMidia || permissoes.isLouvor;

    const deptIds = membro.ministerios?.map((m: any) => m.departamento?.id).filter(Boolean) || [];
    const grupoIds = membro.grupos?.map((g: any) => g.id).filter(Boolean) || [];

    let departamentoLouvorId = membro.ministerios.find((v: any) =>
        ['louvor', 'música', 'musica'].some(t => v.departamento?.nome.toLowerCase().includes(t))
    )?.departamento?.id || membro.departamentos_liderados.find((d: any) =>
        ['louvor', 'música', 'musica'].some(t => d.nome.toLowerCase().includes(t))
    )?.id;

    if (!departamentoLouvorId && isAdmin(role)) {
        const depto = await db.departamento.findFirst({
            where: { nome: { contains: 'Louvor', mode: 'insensitive' } }
        });
        departamentoLouvorId = depto?.id;
    }

    // 4. DADOS PARALELOS
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

    const [
        proximosEventos, visitantesPendentesCount, ultimosAvisos,
        minhasRifas, minhasContribuicoes, carregamentosHistorico,
        meusAcompanhamentos, saldoCantina, visitantesAtualizados,
        escolaridades, aniversariantesMes
    ] = await Promise.all([
        db.evento.findMany({
            where: { data: { gte: new Date() } },
            orderBy: { data: 'asc' },
            take: 10
        }),
        (isAdmin(role) || permissoes.isAcolhimento)
            ? db.visitante.count({ where: { status: 'NOVO' } })
            : Promise.resolve(0),
        db.avisoMural.findMany({
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
        }),
        db.rifaNumero.findMany({
            where: { membro_id: membroId },
            include: { rifa: true },
            orderBy: { createdAt: 'desc' }
        }),
        db.contribuicao.findMany({
            where: { membro_id: membroId },
            orderBy: { data: 'desc' }
        }),
        db.pedidoSaldoCantina.findMany({
            where: { membro_id: membroId },
            orderBy: { createdAt: 'desc' }
        }),

        // INDEX 6 - meusAcompanhamentos
        permissoes.isAcolhimento ? db.visitante.findMany({
            where: {
                tenant_id: Number(tenantIdStr),
                status: 'EM_CONTACTO',
                acompanhamentos: { some: { membro_id: membroId } }
            },
            select: {
                id: true,
                nome: true,
                status: true,
                data_ultima_visita: true,
                acompanhamentos: {
                    select: {
                        id: true,
                        data_contacto: true,
                        tipo_contacto: true,
                        observacoes: true,
                        membro_id: true,
                    }
                }
            },
            orderBy: { data_ultima_visita: 'desc' },
            take: 6
        }) : Promise.resolve([]),

        // INDEX 7 - saldoCantina
        fetchLoyverseSaldo(),

        // INDEX 8 - visitantesAtualizados
        permissoes.isAcolhimento ? db.visitante.findMany({
            where: { status: { in: ['NOVO', 'EM_CONTACTO'] } },
            select: {
                id: true,
                nome: true,
                data_ultima_visita: true,
                status: true
            },
            orderBy: { data_ultima_visita: 'desc' },
            take: 5
        }) : Promise.resolve([]),

        // INDEX 9 - escolaridades para o drawer de perfil
        db.escolaridade.findMany({ orderBy: { id: 'asc' } }),

        // INDEX 10 - aniversariantes do mês atual (filtrado por mês em JS)
        db.membro.findMany({
            where: {
                is_active: true,
                birthdate: { not: null },
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                avatar_file: true,
                birthdate: true,
            }
        })
    ]);

    // 5. PROCESSAMENTO DE DADOS UI
    const iniciais = `${membro.first_name?.[0] || 'M'}${membro.last_name?.[0] || 'V'}`;
    const hoje = new Date();
    const gdprPendente = !membro.gdpr_aceite || (membro.gdpr_validade && membro.gdpr_validade < hoje);

    // ✅ Filtra aniversariantes pelo mês actual comparando apenas mês/dia
    const mesAtual = hoje.getMonth() // 0-11
    const aniversariantesMesFiltrados = aniversariantesMes
        .filter((m: any) => m.birthdate && new Date(m.birthdate).getMonth() === mesAtual)
        .sort((a: any, b: any) => new Date(a.birthdate).getDate() - new Date(b.birthdate).getDate())

    const escalasAgrupadas = new Map();
    membro.escalas.forEach((esc: any) => {
        const key = `${esc.evento.id}-${esc.departamento.id}`;
        if (escalasAgrupadas.has(key)) {
            const existente = escalasAgrupadas.get(key);
            existente.ids.push(esc.id);
            if (!existente.funcoes.includes(esc.funcao)) existente.funcoes.push(esc.funcao);
            if (!esc.confirmado) existente.confirmado = false;
            // ✅ mantém motivo_recusa se existir em qualquer escala do grupo
            if (esc.motivo_recusa) existente.motivo_recusa = esc.motivo_recusa;
        } else {
            escalasAgrupadas.set(key, {
                ...esc,
                ids: [esc.id],
                funcoes: [esc.funcao],
                motivo_recusa: esc.motivo_recusa ?? null
            });
        }
    });
    // Ordenar: confirmadas primeiro, depois por data mais próxima
    const listaEscalas = Array.from(escalasAgrupadas.values())
        .sort((a: any, b: any) => {
            // Confirmadas primeiro
            if (a.confirmado && !b.confirmado) return -1
            if (!a.confirmado && b.confirmado) return 1
            // Depois por data mais próxima
            return new Date(a.evento.data).getTime() - new Date(b.evento.data).getTime()
        })
        .slice(0, 6);

    // DEPARTAMENTOS
    const departamentosAgrupados = new Map();
    membro.ministerios?.forEach((v: any) => {
        if (!v.departamento) return;
        departamentosAgrupados.set(`depto-${v.departamento.id}`, {
            id: v.departamento.id,
            nome: v.departamento.nome,
            tipo: 'DEPARTAMENTO',
            lider_id: v.departamento.lider_id,
            funcoes: v.funcoes?.map((f: any) => f.funcao.nome) || [],
            pode_gerir_escalas: v.pode_gerir_escalas
        });
    });
    membro.departamentos_liderados?.forEach((d: any) => {
        if (departamentosAgrupados.has(`depto-${d.id}`)) {
            departamentosAgrupados.get(`depto-${d.id}`).funcoes.push('Líder');
        } else {
            departamentosAgrupados.set(`depto-${d.id}`, {
                id: d.id,
                nome: d.nome,
                tipo: 'DEPARTAMENTO',
                lider_id: d.lider_id,
                funcoes: ['Líder'],
                pode_gerir_escalas: false
            });
        }
    });

    // GRUPOS — com todos os dados para o ModalGestaoGrupo
    const gruposAgrupados = new Map();

    // Grupos onde é MEMBRO
    membro.grupos?.forEach((g: any) => {
        gruposAgrupados.set(`grupo-${g.id}`, {
            id: g.id,
            nome: g.nome,
            tipo: 'GRUPO',
            categoria: g.categoria ?? null,
            descricao: g.descricao ?? null,
            dia_semana: g.dia_semana,
            horario: g.horario,
            bairro: g.bairro,
            cidade: g.cidade,
            funcoes: ['Membro'],
            pode_gerir_escalas: false,
            // ✅ Dados completos para o modal
            membros: g.membros ?? [],
            lideres: g.lideres ?? [],
            encontros: g.encontros ?? [],
            isLider: false
        });
    });

    // Grupos onde é LÍDER
    membro.lider_de_grupo?.forEach((g: any) => {
        if (gruposAgrupados.has(`grupo-${g.id}`)) {
            const existente = gruposAgrupados.get(`grupo-${g.id}`);
            existente.funcoes = ['Líder'];
            existente.isLider = true;
            // Garante que os dados completos são atualizados
            existente.membros = g.membros ?? existente.membros;
            existente.lideres = g.lideres ?? existente.lideres;
            existente.encontros = g.encontros ?? existente.encontros;
        } else {
            gruposAgrupados.set(`grupo-${g.id}`, {
                id: g.id,
                nome: g.nome,
                tipo: 'GRUPO',
                categoria: g.categoria ?? null,
                descricao: g.descricao ?? null,
                dia_semana: g.dia_semana,
                horario: g.horario,
                bairro: g.bairro,
                cidade: g.cidade,
                funcoes: ['Líder'],
                pode_gerir_escalas: false,
                // ✅ Dados completos para o modal
                membros: g.membros ?? [],
                lideres: g.lideres ?? [],
                encontros: g.encontros ?? [],
                isLider: true
            });
        }
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-700 relative">

            {/* MODAL DE MÓDULO BLOQUEADO (aparece quando redirecionado do middleware) */}
            <Suspense fallback={null}>
                <ModuloBloqueado />
            </Suspense>

            {/* CABEÇALHO DO PERFIL */}
            <header className="bg-bg2 border border-soft p-6 lg:p-8 rounded-2xl shadow-sm relative z-30">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                            {membro.avatar_file ? (
                                <Image src={membro.avatar_file} alt="Perfil" fill className="rounded-2xl object-cover border-2 border-soft shadow-sm" />
                            ) : (
                                <div className="w-full h-full rounded-2xl bg-fg text-bg flex items-center justify-center text-lg font-black border-2 border-soft shadow-sm">
                                    {iniciais}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-figueira mb-0.5">
                                {igrejaName}{membro.congregacao ? ` · ${membro.congregacao.nome}` : ''}
                            </p>
                            <h1 className="text-2xl md:text-3xl font-black text-fg italic tracking-tighter uppercase leading-none">
                                {membro.first_name} <span className="text-muted/40">{membro.last_name}</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[8px] font-black text-figueira bg-figueira/10 px-2 py-0.5 rounded-lg uppercase tracking-widest border border-figueira/20">
                                    {permissoes.isLider ? 'Lider' : isAdmin(role) ? 'Admin' : 'Membro'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto pt-4 lg:pt-0 border-t border-soft lg:border-0">
                        {/* MENU HAMBÚRGUER — Serviço */}
                        <details className="group relative z-50 flex-1 lg:flex-none">
                            <summary className="list-none cursor-pointer marker:hidden [&::-webkit-details-marker]:hidden">
                                <div className="h-11 w-full lg:w-auto px-4 bg-figueira text-white rounded-xl flex items-center justify-center gap-2 hover:bg-figueira/90 transition-all shadow-sm active:scale-95">
                                    <Menu size={16} />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Servico</span>
                                </div>
                            </summary>
                            <div className="absolute right-0 top-full mt-2 w-60 bg-bg border border-soft p-2 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-0.5 z-50">
                                {/* SECÇÃO: Meu Perfil */}
                                <p className="text-[8px] font-black uppercase text-muted tracking-widest px-3 pt-1 pb-1">Minha Conta</p>
                                <DrawerEditarPerfil membro={membro} escolaridades={escolaridades} isMenuItem />
                                <ModalIndisponibilidade isMenuItem />
                                <ModalRelatorioEscalas membroId={membro?.id} isMenuItem />
                                <Link href="/membros/dashboard?tab=financeiro" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-3 py-2.5 rounded-lg transition-all flex items-center gap-3">
                                    <Wallet2 size={13} className="text-emerald-500" /> Financas e Cantina
                                </Link>

                                {/* SEPARADOR */}
                                {mostraFerramentasExtra && <div className="border-t border-soft my-1" />}

                                {/* SECÇÃO: Departamentos */}
                                {mostraFerramentasExtra && (
                                    <>
                                        <p className="text-[8px] font-black uppercase text-muted tracking-widest px-3 pt-1 pb-1">Departamentos</p>
                                        {isAdmin(role) && (
                                            <Link href="/admin/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-3 py-2.5 rounded-lg transition-all flex items-center gap-3">
                                                <ShieldCheck size={13} className="text-figueira" /> Painel Admin
                                            </Link>
                                        )}
                                        {permissoes.isAdminOrFinance && (
                                            <Link href="/departamentos/financeiro/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-3 py-2.5 rounded-lg transition-all flex items-center gap-3">
                                                <PieChart size={13} className="text-emerald-500" /> Tesouraria
                                            </Link>
                                        )}
                                        {permissoes.isAcolhimento && (
                                            <Link href="/departamentos/acolhimento/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-3 py-2.5 rounded-lg transition-all flex items-center gap-3">
                                                <HeartHandshake size={13} className="text-blue-500" /> Acolhimento
                                            </Link>
                                        )}
                                        {permissoes.isCantina && (
                                            <Link href="/departamentos/cantina/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-3 py-2.5 rounded-lg transition-all flex items-center gap-3">
                                                <Store size={13} className="text-orange-500" /> Cantina
                                            </Link>
                                        )}
                                        {permissoes.isMidia && (
                                            <Link href="/louvor/holyrics" className="text-[10px] font-bold uppercase tracking-widest text-fg hover:bg-soft px-3 py-2.5 rounded-lg transition-all flex items-center gap-3">
                                                <MonitorPlay size={13} className="text-purple-500" /> Midia / Holyrics
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </details>

                        {/* NOTIFICAÇÕES */}
                        <NotificacaoHeader
                            avisos={ultimosAvisos}
                            alertasAcolhimento={visitantesAtualizados}
                        />

                        <form action={logoutMembro} className="shrink-0">
                            <button type="submit" className="h-11 w-11 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                <LogOut size={15} strokeWidth={3} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* TABS */}
                <div className="mt-6 pt-4 border-t border-soft flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                    {[
                        { tab: 'geral', label: 'Home', icon: LayoutDashboard },
                        { tab: 'departamentos', label: 'Igreja', icon: Users },
                    ].map(({ tab, label, icon: Icon }) => (
                        <Link key={tab} href={`/membros/dashboard?tab=${tab}`}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                currentTab === tab ? 'bg-fg text-bg shadow-sm' : 'text-muted hover:bg-soft/30 hover:text-fg'
                            }`}>
                            <Icon size={14} /> {label}
                        </Link>
                    ))}
                </div>
            </header>

            {/* AVISOS CRÍTICOS */}
            {gdprPendente && (
                <section className="bg-bg2 border-2 border-orange-500/20 p-5 rounded-3xl flex justify-between items-center gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <FileSignature className="text-orange-500" size={24} />
                        <div>
                            <h3 className="text-sm font-black uppercase italic tracking-tighter text-fg">Assinaturas Pendentes</h3>
                            <p className="text-xs text-muted">Renova os teus termos obrigatórios.</p>
                        </div>
                    </div>
                    <Link href="/membros/termos" className="bg-orange-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-600">
                        Assinar
                    </Link>
                </section>
            )}

            {/* CONTEÚDO DAS ABAS */}
            <div className="relative z-10">

                {/* ── ABA: GERAL ───────────────────────────────────────────── */}
                {currentTab === 'geral' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <section id="agenda-servico" className="space-y-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-lg font-black uppercase italic tracking-tighter text-fg flex items-center gap-2">
                                        <CalendarDays size={16} className="text-figueira" /> Minhas Escalas
                                    </h2>
                                    {(isAdmin(role) || membro.departamentos_liderados?.length > 0) && departamentoLouvorId && (
                                        <ModalHistoricoEscalas departamentoId={departamentoLouvorId} />
                                    )}
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {listaEscalas.length > 0 ? (
                                    listaEscalas.map((esc: any) => (
                                        <div key={esc.id} className={`bg-bg2 border p-5 rounded-[2rem] shadow-sm transition-all flex flex-col gap-4
                                            ${esc.confirmado ? 'border-emerald-500/20' : 'border-soft hover:border-figueira/30'}`}>

                                            {/* CABEÇALHO */}
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-2xl text-center shadow-sm min-w-[54px] ${esc.confirmado ? 'bg-emerald-500 text-white' : 'bg-fg text-bg'}`}>
                                                    <span className="block text-[7px] font-black uppercase opacity-70">
                                                        {new Date(esc.evento.data).toLocaleDateString('pt-PT', { month: 'short' })}
                                                    </span>
                                                    <span className="text-xl block font-black italic leading-tight">
                                                        {new Date(esc.evento.data).toLocaleDateString('pt-PT', { day: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-black uppercase italic text-fg text-xs truncate">{esc.evento.nome}</h5>
                                                    <span className="text-[8px] font-bold text-figueira uppercase bg-figueira/10 px-2 py-0.5 rounded-md border border-figueira/20 inline-block mt-1">
                                                        {esc.departamento.nome}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* FUNÇÃO E HORÁRIO */}
                                            <div className="space-y-1.5 px-1">
                                                {esc.funcoes?.filter(Boolean).length > 0 && (
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-figueira shrink-0" />
                                                        {esc.funcoes.join(' · ')}
                                                    </p>
                                                )}
                                                {esc.horario && (
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                                        Chegar às {esc.horario}
                                                    </p>
                                                )}
                                            </div>

                                            {/* REPERTÓRIO (louvor) */}
                                            {(esc.departamento.nome.toLowerCase().includes('louvor') || esc.departamento.nome.toLowerCase().includes('música')) && (
                                                <>
                                                    <ModalRepertorio eventoId={esc.evento.id} repertorioInical={esc.evento.repertorio || []} podeEditar={true} />
                                                    <BotaoSetlistPalco eventoId={esc.evento.id} totalMusicas={esc.evento.repertorio?.length || 0} />
                                                </>
                                            )}

                                            {/* BOTÃO DETALHES */}
                                            <ModalDetalhesEscala escala={esc} />

                                            {/* BOTÕES DE CONFIRMAÇÃO */}
                                            <BotoesEscala
                                                escalaIds={esc.ids}
                                                confirmado={esc.confirmado}
                                                motivoRecusa={esc.motivo_recusa ?? null}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <AvisoEscalaVazia />
                                )}
                            </div>
                        </section>

                        <section className="grid lg:grid-cols-3 gap-6">
                            {/* AGENDA — colapsável no mobile */}
                            <details className="lg:col-span-2 bg-bg2 border border-soft rounded-2xl shadow-sm collapsible-mobile">
                                <summary className="p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-fg flex items-center gap-2">
                                        <CalendarDays size={14} className="text-figueira" /> Agenda da Igreja
                                    </h2>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted lg:hidden">
                                        {proximosEventos.length} evento{proximosEventos.length !== 1 ? 's' : ''}
                                    </span>
                                </summary>
                                <div className="px-5 pb-5">
                                    <WidgetAgendaUnificada
                                        eventosIgreja={proximosEventos}
                                        gruposMembro={membro.grupos || []}
                                        isAdmin={isAdmin(role)}
                                    />
                                </div>
                            </details>

                            {/* ANIVERSARIANTES — colapsável no mobile */}
                            <details className="lg:col-span-1 bg-bg2 border border-soft rounded-2xl shadow-sm collapsible-mobile">
                                <summary className="p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-widest text-fg flex items-center gap-2">
                                        <CalendarDays size={14} className="text-figueira" /> Aniversarios
                                    </h2>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted lg:hidden">
                                        {aniversariantesMesFiltrados.length}
                                    </span>
                                </summary>
                                <div className="px-5 pb-5">
                                    <CardAniversariantesMes aniversariantes={aniversariantesMesFiltrados} />
                                    {aniversariantesMesFiltrados.length === 0 && (
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted text-center py-4">
                                            Sem aniversarios este mes
                                        </p>
                                    )}
                                </div>
                            </details>
                        </section>
                    </div>
                )}

                {/* ── ABA: DEPARTAMENTOS ───────────────────────────────────── */}
                {currentTab === 'departamentos' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">

                        {/* DEPARTAMENTOS */}
                        <section className="space-y-6">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                <Users className="text-figueira" /> Onde Eu Sirvo
                            </h2>
                            {departamentosAgrupados.size > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from(departamentosAgrupados.values()).map((depto: any) => (
                                        <CardDepartamentoMembro
                                            key={depto.id}
                                            depto={depto}
                                            membroId={membro?.id}
                                            role={role}
                                            podeGerirEscalas={depto.pode_gerir_escalas}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-soft rounded-[2.5rem] text-center">
                                    <p className="text-xs font-black text-muted uppercase tracking-widest italic">
                                        Não pertences a departamentos no momento.
                                    </p>
                                </div>
                            )}
                        </section>

                        {/* GRUPOS ✅ com ModalGestaoGrupo integrado */}
                        {gruposAgrupados.size > 0 && (
                            <section className="space-y-6">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                    <Users className="text-blue-500" /> Meus Grupos
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from(gruposAgrupados.values()).map((grupo: any) => (
                                        <div key={grupo.id} className="bg-bg2 border border-soft p-6 rounded-[2rem] shadow-sm hover:border-blue-500/40 transition-all space-y-4">

                                            {/* CABEÇALHO */}
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                                    <Users size={20} className="text-blue-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-black uppercase italic tracking-tight text-fg leading-none truncate">
                                                        {grupo.nome}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {grupo.funcoes.map((f: string) => (
                                                            <span key={f} className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${f === 'Líder'
                                                                ? 'bg-figueira/10 text-figueira border-figueira/20'
                                                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                                }`}>
                                                                {f}
                                                            </span>
                                                        ))}
                                                        {grupo.categoria && (
                                                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border bg-soft text-muted border-soft">
                                                                {grupo.categoria}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DESCRIÇÃO */}
                                            {grupo.descricao && (
                                                <p className="text-[11px] text-muted leading-relaxed line-clamp-2 border-t border-soft pt-3">
                                                    {grupo.descricao}
                                                </p>
                                            )}

                                            {/* DETALHES */}
                                            <div className="grid grid-cols-2 gap-2 border-t border-soft pt-3">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays size={12} className="text-blue-500 shrink-0" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted truncate">
                                                        {grupo.dia_semana}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={12} className="text-blue-500 shrink-0" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted truncate">
                                                        {grupo.horario}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 flex items-center gap-2">
                                                    <MapPin size={12} className="text-blue-500 shrink-0" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted truncate">
                                                        {grupo.bairro}, {grupo.cidade}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* ✅ MODAL DE GESTÃO DO GRUPO */}
                                            <div className="border-t border-soft pt-4">
                                                <ModalGestaoGrupo
                                                    grupo={{
                                                        id: grupo.id,
                                                        nome: grupo.nome,
                                                        dia_semana: grupo.dia_semana,
                                                        horario: grupo.horario,
                                                        bairro: grupo.bairro,
                                                        cidade: grupo.cidade,
                                                        categoria: grupo.categoria,
                                                        descricao: grupo.descricao,
                                                        membros: grupo.membros ?? [],
                                                        lideres: grupo.lideres ?? [],
                                                        encontros: grupo.encontros ?? [],
                                                    }}
                                                    membroId={membroId}
                                                    isLider={grupo.isLider || isAdmin(role)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ACOMPANHAMENTOS */}
                        {permissoes.isAcolhimento && meusAcompanhamentos.length > 0 && (
                            <section className="space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                        <HeartHandshake className="text-emerald-500" /> Meus Acompanhamentos
                                    </h2>
                                    <Link href="/departamentos/acolhimento/dashboard"
                                        className="text-[10px] font-black uppercase bg-fg text-bg px-5 py-3 rounded-xl hover:bg-figueira transition-colors flex items-center justify-center gap-2 shadow-md w-full sm:w-auto">
                                        Painel Completo <ChevronRight size={14} />
                                    </Link>
                                </div>

                                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {meusAcompanhamentos.map((visitante: any) => (
                                        <div key={visitante.id} className="bg-bg2 border border-soft rounded-[2rem] p-5 hover:border-emerald-500/30 transition-all space-y-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                        <span className="text-xs font-black text-emerald-600 uppercase">
                                                            {visitante.nome?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs font-black text-fg uppercase italic tracking-tight leading-none">
                                                            {visitante.nome}
                                                        </h3>
                                                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest mt-0.5">
                                                            {visitante.telefone}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                                    {visitante.status}
                                                </span>
                                            </div>
                                            <FormAcompanhamentoRapido visitante={visitante} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}

                {/* ── ABA: FINANCEIRO ──────────────────────────────────────── */}
                {currentTab === 'financeiro' && (
                    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
                        <section className="space-y-6">
                            <div className="flex items-center justify-between gap-4">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg flex items-center gap-3">
                                    <Wallet2 className="text-figueira" /> Contribuições
                                </h2>
                                <ModalExtratoMembro membro={membro} />
                            </div>
                            <PainelFinanceiroMembro
                                objetivos={membro.objetivos_financeiros || []}
                                numerosRifa={minhasRifas}
                                contribuicoes={minhasContribuicoes}
                            />
                        </section>

                        <section className="bg-bg2 border border-soft p-8 rounded-[2.5rem] shadow-sm">
                            <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg mb-6 flex items-center gap-3">
                                <Coffee className="text-orange-500" /> Cantina e Consumos
                            </h2>
                            <div className="grid lg:grid-cols-12 gap-8 items-start">
                                <div className="lg:col-span-4 flex flex-col gap-6">
                                    <CardWalletCantina membro={membro} saldoLoyverse={saldoCantina} />
                                </div>
                                <div className="lg:col-span-8 bg-bg border border-soft rounded-[2rem] p-6 shadow-inner relative overflow-hidden">
                                    <h3 className="text-sm font-black uppercase italic text-fg mb-4 flex items-center gap-2">
                                        <Receipt size={16} /> Últimos Movimentos
                                    </h3>
                                    <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        <SessaoExtratoCantina
                                            carregamentos={carregamentosHistorico}
                                            objetivos={membro?.objetivos_financeiros || []}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </div>

        </main>
    )
}