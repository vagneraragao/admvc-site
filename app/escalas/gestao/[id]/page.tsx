import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import MontadorEscalas from '@/components/escalas/MontadorEscalas'
import ListaEscalados from '@/components/escalas/ListaEscalados'
import { ShieldCheck, Calendar, Activity, BarChart2 } from 'lucide-react'
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
    // Filtra eventos pela congregacao do departamento (ou todos se global)
    const eventoWhere: any = { data: { gte: new Date() } }
    if (depto.congregacaoId) {
        eventoWhere.OR = [
            { congregacao_id: depto.congregacaoId },
            { congregacao_id: null },
        ]
    }

    const eventos = await prisma.evento.findMany({
        where: eventoWhere,
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

            {/* MONTADOR — FULL WIDTH */}
            <section className="bg-bg2 border border-soft rounded-2xl overflow-hidden shadow-sm relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-figueira" />
                <div className="flex items-center gap-4 px-6 py-5 border-b border-soft">
                    <div className="w-10 h-10 rounded-2xl bg-figueira/10 text-figueira flex items-center justify-center shrink-0">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-fg leading-none">Atribuir Escala</h2>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                            Selecionar evento, funcao e membro
                        </p>
                    </div>
                </div>
                <div className="p-6">
                    <MontadorEscalas
                        eventos={eventos}
                        funcoesDisponiveis={depto.funcoes}
                        membros={membrosFormatados}
                        departamentoId={deptoId}
                    />
                </div>
            </section>

            {/* QUADRO DE ESCALAS */}
            <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <Activity size={16} className="text-emerald-500" />
                    <h2 className="text-sm font-black uppercase tracking-widest text-fg">Quadro de Escalas</h2>
                </div>
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <ListaEscalados
                        eventos={eventos}
                        isAdmin={eAdmin}
                        membros={membrosFormatados}
                        isLouvor={isLouvor}
                        podeEditarRepertorio={eAdmin || eLiderModel || !!vinculoLider}
                    />
                </div>
            </section>
        </main>
    );
}