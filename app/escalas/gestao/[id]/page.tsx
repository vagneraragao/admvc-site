import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import Breadcrumb from '@/components/ui/Breadcrumb'
import MontadorEscalas from '@/components/escalas/MontadorEscalas'
import ListaEscalados from '@/components/escalas/ListaEscalados'
import { ShieldCheck, Users, Award, Calendar, Activity } from 'lucide-react'
//import RelatorioEscalasDepartamento from '@/components/escalas/RelatorioEscalasDepartamento'
import ModalRelatorioEscalaLider from '@/components/escalas/ModalRelatorioEscalaLider'

export default async function GestaoEscalaLider({ params }: { params: { id: string } }) {
    const { id } = await params;
    const deptoId = parseInt(id);

    // 1. VERIFICAÇÃO DE SESSÃO E SEGURANÇA
    const session = await getSessionData();
    if (!session) redirect('/membros/login');
    const { membroId, role } = session;

    const depto = await prisma.departamento.findUnique({
        where: { id: deptoId },
        include: { funcoes: true }
    });

    if (!depto) redirect('/membros/dashboard?error=departamento_nao_encontrado');

    const vinculoLider = await prisma.integranteDepartamento.findFirst({
        where: {
            membro_id: membroId,
            departamento_id: deptoId,
            OR: [
                { pode_gerir_escalas: true },
                { funcoes: { some: { funcao: { nome: { contains: 'Lider', mode: 'insensitive' } } } } }
            ]
        }
    });

    const eAdmin = isAdmin(role);
    const eLiderModel = depto.lider_id === membroId;

    if (!vinculoLider && !eAdmin && !eLiderModel) {
        redirect('/membros/dashboard?error=Acesso negado');
    }

    // 2. BUSCA EVENTOS E ESCALAS ATUAIS (Com Repertório)
    const eventos = await prisma.evento.findMany({
        where: { data: { gte: new Date() } },
        include: {
            repertorio: {
                include: { musica: true },
                orderBy: { ordem: 'asc' }
            },
            escalas: {
                where: { departamento_id: deptoId },
                include: {
                    membro: { select: { id: true, first_name: true, last_name: true, avatar_file: true, phone_1: true } },
                    departamento: { select: { nome: true } }
                }
            }
        },
        orderBy: { data: 'asc' }
    });

    const equipaDoDepartamento = await prisma.integranteDepartamento.findMany({
        where: { departamento_id: deptoId },
        include: {
            membro: { select: { id: true, first_name: true, last_name: true, avatar_file: true, phone_1: true } },
            funcoes: { include: { funcao: true } }
        }
    });

    const membrosFormatados = equipaDoDepartamento.map(i => ({
        ...i.membro,
        funcoesHabilitadas: i.funcoes.map(f => f.funcao_id)
    }));

    const proximoEvento = eventos.length > 0 ? eventos[0] : null;

    // 3. IDENTIFICAR SE É LOUVOR
    const isLouvor = depto.nome.toLowerCase().includes('louvor') || depto.nome.toLowerCase().includes('música') || depto.nome.toLowerCase().includes('musica');

    const historicoEscalas = await prisma.escala.findMany({
        where: {
            departamento_id: deptoId,
            // Busca os últimos 6 meses + próximos 3 meses para ter contexto completo
            evento: {
                data: {
                    gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                    lte: new Date(new Date().setMonth(new Date().getMonth() + 3)),
                }
            }
        },
        include: {
            membro: {
                select: { id: true, first_name: true, last_name: true, avatar_file: true }
            },
            evento: {
                select: { id: true, nome: true, data: true }
            }
        },
        orderBy: { evento: { data: 'desc' } }
    })

    const historicoSerializado = historicoEscalas.map(e => ({
        ...e,
        motivo_recusa: (e as any).motivo_recusa ?? null,
        evento: {
            ...e.evento,
            data: e.evento.data.toISOString()
        }
    }))


    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700 pb-32">
            <Breadcrumb items={[
                { label: "Dashboard", href: "/membros/dashboard", isBackIcon: true },
                { label: "Gestão de Escalas" }
            ]} />

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Painel do Líder
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Escalas: <span className="text-muted/30">{depto.nome}</span>
                    </h1>
                </div>

                {/* BOTÃO RELATÓRIO ESTRATÉGICO */}
                <ModalRelatorioEscalaLider
                    departamentoId={deptoId}
                    departamentoNome={depto.nome}
                    equipaDoDepartamento={equipaDoDepartamento}
                />
            </header>

            {/* CARDS DE ESTATÍSTICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                <div className="bg-bg2 border border-soft p-6 rounded-[2rem] flex items-center gap-5 shadow-sm">
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0">
                        <Users size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted tracking-widest">Voluntários Aptos</p>
                        <p className="text-2xl font-black text-fg tracking-tighter">{equipaDoDepartamento.length}</p>
                    </div>
                </div>
                <div className="bg-bg2 border border-soft p-6 rounded-[2rem] flex items-center gap-5 shadow-sm">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                        <Award size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted tracking-widest">Cargos Criados</p>
                        <p className="text-2xl font-black text-fg tracking-tighter">{depto.funcoes.length}</p>
                    </div>
                </div>
                <div className="bg-bg2 border border-soft p-6 rounded-[2rem] flex items-center gap-5 shadow-sm">
                    <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center shrink-0">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-muted tracking-widest">Próximo Evento</p>
                        <p className="text-sm font-black text-fg tracking-tighter truncate mt-1">
                            {proximoEvento ? proximoEvento.nome : 'Nenhum agendado'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start pt-4">
                {/* COLUNA ESQUERDA: MONTADOR INTELIGENTE */}
                <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 z-10 space-y-6">
                    <MontadorEscalas
                        eventos={eventos}
                        funcoesDisponiveis={depto.funcoes}
                        membros={membrosFormatados}
                        departamentoId={deptoId}
                    />
                </aside>

                {/* COLUNA DIREITA: VISÃO GERAL */}
                <section className="lg:col-span-7 xl:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-emerald-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-fg">Quadro de Escalas</h2>
                        </div>
                    </div>

                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        {/* PASSAMOS A VARIÁVEL isLouvor AQUI! */}
                        <ListaEscalados
                            eventos={eventos}
                            isAdmin={eAdmin}
                            membros={membrosFormatados}
                            isLouvor={isLouvor}
                        />
                    </div>
                </section>

                {/*
                <section className="mt-8 border-t border-soft pt-8">
                    <RelatorioEscalasDepartamento
                        escalas={historicoSerializado}
                        equipaDoDepartamento={equipaDoDepartamento}
                    />
                </section>
*/}

            </div>
        </main>
    );
}