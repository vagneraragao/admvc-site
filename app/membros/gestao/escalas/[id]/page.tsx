// app/membros/gestao/escalas/[id]/page.tsx
import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'
import Link from 'next/link'

// Importando os SEUS componentes originais do painel Admin
import MontadorEscalas from '@/components/MontadorEscalas'
import ListaEscalados from '@/components/ListaEscalados'

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
    const departamentos = [depto];

    // 4. MEMBROS DA EQUIPA (Filtrados para mostrar só quem pertence a este departamento)
    const membrosComFuncoes = await prisma.membro.findMany({
        where: {
            ministerios: {
                some: { departamento_id: deptoId }
            }
        },
        include: {
            ministerios: {
                where: { departamento_id: deptoId }, // Traz só as funções deste depto
                select: {
                    departamento_id: true,
                    funcao: true
                }
            }
        },
        orderBy: { first_name: "asc" }
    });

    return (
        <main className="max-w-6xl mx-auto p-8 pb-32 space-y-12">
            <header className="border-b border-soft pb-8 space-y-4">
                <Link
                    href="/membros/dashboard"
                    className="text-[10px] font-black uppercase text-muted hover:text-figueira transition-colors flex items-center gap-2"
                >
                    <span className="text-lg leading-none">←</span> Voltar ao Dashboard
                </Link>

                <div>
                    <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em]">Gestão da Equipa</span>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg">
                        Escala: <span className="opacity-50">{depto.nome}</span>
                    </h1>
                </div>
            </header>

            {/* Passo 1: O Formulário para Adicionar */}
            {/* Como enviamos apenas 1 departamento, o select do Montador ficará bloqueado nele! */}
            <MontadorEscalas
                eventos={eventos}
                departamentos={departamentos}
                membros={membrosComFuncoes}
            />

            {/* Passo 2: A Lista para Visualizar */}
            {/* Como filtramos a busca no banco, a lista só vai mostrar as escalas DESTE departamento */}
            <div className="pt-10">
                <ListaEscalados eventos={eventos} />
            </div>
        </main>
    );
}