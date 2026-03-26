// app/membros/gestao/escalas/[id]/page.tsx
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import Link from 'next/link'

import MontadorEscalas from '@/components/escalas/MontadorEscalas'
import ListaEscalados from '@/components/escalas/ListaEscalados'
import { ArrowLeft, ChevronRight, ShieldCheck, Settings2, Users, ChevronDown } from 'lucide-react'

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
                where: { departamento_id: deptoId }, // <--- O SEGREDO ESTÁ AQUI
                include: {
                    membro: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            avatar_file: true,
                            phone_1: true // Importante para a foto na lista
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

    // 3. DEPARTAMENTO (Passamos como um Array de 1 item para o MontadorEscalas bloquear outros grupos)
    //    const departamentos = [depto];
    const departamentos = await prisma.departamento.findMany({
        where: role === 'ADMIN' ? undefined : { // Se for Admin, vê todos. Se não, filtra:
            OR: [
                { lider_id: membroId }, // 👈 1. Procura onde ele é o Líder Oficial (Isto resolve o teu bug!)
                {
                    integrantes: {
                        some: {
                            membro_id: membroId,
                            funcao: 'Líder' // 👈 2. Procura onde ele tem a função de Líder na equipa
                        }
                    }
                }
            ]
        },
        orderBy: {
            nome: 'asc'
        }
    });
    // 4. MEMBROS DA EQUIPA (Filtrados para mostrar só quem pertence a este departamento)
    const membrosComFuncoes = await prisma.membro.findMany({
        where: {
            status: { in: ['Ativo', 'ATIVO'] } // Traz apenas quem está ativo na igreja
        },
        include: {
            // Traz TODAS as funções que este membro tem em QUALQUER departamento
            ministerios: {
                select: {
                    departamento_id: true,
                    funcao: true
                }
            },
            // Traz TODOS os departamentos onde ele é o Líder Oficial
            departamentos_liderados: {
                select: { id: true }
            }
        },
        orderBy: { first_name: "asc" }
    });

    return (
        <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 space-y-10 animate-in fade-in duration-700 pb-32">

            {/* --- BREADCRUMBS --- */}
            <nav className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted">
                <Link href="/membros/dashboard" className="hover:text-figueira transition-colors flex items-center gap-2">
                    <ArrowLeft size={12} strokeWidth={3} /> Minha Dashboard
                </Link>
                <ChevronRight size={10} className="opacity-30" />
                <span className="text-fg italic">Gestão de Escalas</span>
            </nav>

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
                        Aloque os voluntários do seu departamento para os próximos eventos.
                    </p>
                </div>
            </header>

            <div className="space-y-10 pt-4">

                {/* --- PASSO 1: O MONTADOR DE ESCALAS (ABERTO POR PADRÃO) --- */}
                <section className="bg-bg2 border border-soft p-6 md:p-8 rounded-[3.5rem] shadow-sm">
                    <div className="flex items-center gap-4 border-b border-soft pb-6 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                            <Settings2 size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg leading-none">Atribuir Escala</h2>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">
                                Selecione o evento e aloque as funções.
                            </p>
                        </div>
                    </div>

                    {/* O Montador agora tem mais espaço lateral devido à redução do padding de p-12 para p-8 */}
                    <MontadorEscalas
                        eventos={eventos}
                        departamentos={departamentos}
                        membros={membrosComFuncoes}
                    />
                </section>

                {/* --- PASSO 2: A LISTA PARA VISUALIZAR (CARTÃO CONTRAÍVEL) --- */}
                <section className="scroll-mt-24">
                    <details className="group bg-bg2 border border-soft rounded-[3.5rem] shadow-sm overflow-hidden transition-all duration-300">

                        {/* CABEÇALHO CLICÁVEL DO ACORDEÃO */}
                        <summary className="list-none cursor-pointer p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 [&::-webkit-details-marker]:hidden hover:bg-soft/20 transition-colors outline-none">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-bg border border-soft flex items-center justify-center shrink-0 shadow-sm transition-transform group-open:scale-110">
                                    <Users size={20} className="text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg leading-none">
                                        Equipa Escalada
                                    </h2>
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">
                                        Clique para ver quem está escalado e as confirmações.
                                    </p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-bg border border-soft flex items-center justify-center text-muted group-open:bg-emerald-500 group-open:text-white group-open:border-emerald-500 transition-all shadow-sm shrink-0">
                                <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300" />
                            </div>
                        </summary>

                        {/* CONTEÚDO EXPANDIDO */}
                        <div className="px-6 md:px-8 pb-8 border-t border-soft/50 pt-8 animate-in slide-in-from-top-4 fade-in duration-300">
                            <ListaEscalados eventos={eventos} />
                        </div>
                    </details>
                </section>

            </div>
        </main>
    );
}