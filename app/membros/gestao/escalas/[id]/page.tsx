// app/membros/gestao/escalas/[id]/page.tsx
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import Link from 'next/link'
import Breadcrumb from '@/components/ui/Breadcrumb'
import MontadorEscalas from '@/components/escalas/MontadorEscalas'
import ListaEscalados from '@/components/escalas/ListaEscalados'
import { ArrowLeft, ChevronRight, ShieldCheck, Settings2, Users } from 'lucide-react'

export default async function GestaoEscalaLider({ params }: { params: { id: string } }) {
    const { id } = await params;
    const deptoId = parseInt(id);

    // 1. VERIFICAÇÃO DE SESSÃO E SEGURANÇA
    const session = await getSessionData();
    if (!session) redirect('/membros/login');
    const { membroId, role } = session;

    const depto = await prisma.departamento.findUnique({
        where: { id: deptoId }
    });

    if (!depto) redirect('/membros/dashboard?error=departamento_nao_encontrado');

    const vinculoLider = await prisma.integranteDepartamento.findFirst({
        where: {
            membro_id: membroId,
            departamento_id: deptoId,
            funcao: { contains: 'Lider', mode: 'insensitive' }
        }
    });

    const eAdmin = role === 'ADMIN';
    const eLiderModel = depto.lider_id === membroId;

    if (!vinculoLider && !eAdmin && !eLiderModel) {
        redirect('/membros/dashboard?error=Acesso negado');
    }

    // 2. BUSCA EVENTOS (Filtrando as escalas APENAS para este departamento)
    const eventos = await prisma.evento.findMany({
        where: { data: { gte: new Date() } },
        include: {
            escalas: {
                where: { departamento_id: deptoId },
                include: {
                    membro: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            avatar_file: true,
                            phone_1: true 
                        }
                    },
                    departamento: true
                },
                orderBy: [
                    { departamento: { nome: 'asc' } }
                ]
            }
        },
        orderBy: { data: 'asc' }
    });

    // 3. DEPARTAMENTOS
    const departamentos = await prisma.departamento.findMany({
        where: role === 'ADMIN' ? undefined : { 
            OR: [
                { lider_id: membroId }, 
                {
                    integrantes: {
                        some: {
                            membro_id: membroId,
                            funcao: 'Líder' 
                        }
                    }
                }
            ]
        },
        orderBy: {
            nome: 'asc'
        }
    });

    // 4. MEMBROS DA EQUIPA
    const membrosComFuncoes = await prisma.membro.findMany({
        where: {
            status: { in: ['Ativo', 'ATIVO'] } 
        },
        include: {
            ministerios: {
                select: {
                    departamento_id: true,
                    funcao: true
                }
            },
            departamentos_liderados: {
                select: { id: true }
            }
        },
        orderBy: { first_name: "asc" }
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700 pb-32">
{/* BREADCRUMB PADRONIZADO E INTELIGENTE */}
            <Breadcrumb items={[
                { 
                    label: "Dashboard", 
                    href: "/membros/dashboard", 
                    isBackIcon: true 
                },
                { 
                    label: "Gestão de Escalas" 
                }
            ]} />




            {/* --- CABEÇALHO --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-soft">
                <div className="space-y-2">
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <ShieldCheck size={14} /> Gestão da Equipa
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                        Escalas: <span className="text-muted/30">{depto.nome}</span>
                    </h1>
                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest pt-2">
                        Painel de alocação de voluntários para os próximos eventos.
                    </p>
                </div>
            </header>

            {/* ========================================================= */}
            {/* NOVO LAYOUT UNIFICADO: LADO A LADO                        */}
            {/* ========================================================= */}
            <div className="grid lg:grid-cols-12 gap-8 items-start pt-4">

                {/* COLUNA ESQUERDA: MONTADOR DE ESCALAS (Fixo no scroll do PC) */}
                <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-8 z-10 space-y-6">
                    <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
                        {/* Linha de destaque no topo do card */}
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
                        
                        <div className="flex items-center gap-4 border-b border-soft pb-6 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                                <Settings2 size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">Nova Atribuição</h2>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">
                                    Adicionar à escala
                                </p>
                            </div>
                        </div>

                        <MontadorEscalas
                            eventos={eventos}
                            departamentos={departamentos}
                            membros={membrosComFuncoes}
                        />
                    </div>
                </aside>

                {/* COLUNA DIREITA: VISÃO GERAL (Lista aberta) */}
                <section className="lg:col-span-7 xl:col-span-8 space-y-6">
                    
                    {/* Cabeçalho subtil da lista */}
                    <div className="flex items-center gap-3 px-2">
                        <Users size={16} className="text-emerald-500" />
                        <h2 className="text-sm font-black uppercase tracking-widest text-fg">Quadro Geral de Escalas</h2>
                    </div>

                    {/* Aqui chamamos a Lista diretamente, SEM o Acordeão! */}
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
<ListaEscalados eventos={eventos} isAdmin={eAdmin} membros={membrosComFuncoes} />
                    </div>

                </section>
            </div>
        </main>
    );
}