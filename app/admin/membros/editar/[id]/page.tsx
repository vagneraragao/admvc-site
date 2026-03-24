import prisma from '@/lib/prisma'
import EditarMembroClient from '@/components/Client' // Confirma se o caminho está correto
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

// Nota: No Next 15, params é Promise. Se for Next 14, remove o await do params.
export default async function EditarMembroPage({ params }: { params: Promise<{ id: string }> }) {

    // --- 1. SEGURANÇA DE ACESSO ---
    const cookieStore = await cookies();
    const session = cookieStore.get('admvc_session');

    // Se não há cookie, expulsa logo
    if (!session) redirect('/membros/login?error=Sessao expirada');

    const sessionValue = decodeURIComponent(session.value);
    const isAdmin = sessionValue.includes('role:ADMIN');

    // Única verificação necessária
    if (!isAdmin) {
        redirect('/membros/login?error=Acesso restrito a administradores');
    }

    // --- 2. BUSCA DE DADOS ---
    const { id: idParam } = await params; // Aguarda os parâmetros da URL
    const id = Number(idParam);

    if (isNaN(id)) redirect('/admin/membros');
    const escolaridades = await prisma.escolaridade.findMany({ orderBy: { id: 'asc' } });
    const [membro, todosCargos, todosDeptos, todosGrupos] = await Promise.all([
        prisma.membro.findUnique({
            where: { id },
            include: {
                ministerios: { include: { departamento: true } },
                cargos: true,
                grupos: true,
                familia: true,
            }
        }),
        prisma.cargo.findMany(),
        prisma.departamento.findMany(),
        prisma.grupo.findMany(),
    ]);

    if (!membro) redirect('/admin/membros');

    const rolesDisponiveis = [
        { label: 'Membro Comum', value: 'USER' },
        { label: 'Líder de Ministério', value: 'LEADER' },
        { label: 'Financeiro / Tesouraria', value: 'FINANCE' },
        { label: 'Administrador Geral', value: 'ADMIN' },
    ];

    return (
        <EditarMembroClient
            membro={membro}
            todosCargos={todosCargos}
            todosDeptos={todosDeptos}
            todosGrupos={todosGrupos}
            roles={rolesDisponiveis}
            isAdmin={true}
            escolaridades={escolaridades}
        />
    );
}