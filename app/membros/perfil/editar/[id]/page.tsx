import prisma from '@/lib/prisma'
// Certifique-se que o caminho abaixo aponta para o novo componente do Membro que criámos!
import MeuPerfilClient from '@/components/membros/MeuPerfilClient'
import { redirect } from 'next/navigation'
import { getSessionData } from '@/lib/auth-utils'

// Nota: No Next 15, params é uma Promise. Se der erro, remova o await.
export default async function EditarMeuPerfilPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSessionData();

    // Aguarda os parâmetros
    const { id: idParam } = await params;
    const idParaEditar = Number(idParam);

    if (!session) redirect('/membros/login');

    // SEGURANÇA: Só pode editar se for o próprio ID ou se for ADMIN
    const podeEditar = session.membroId === idParaEditar || session.role === 'ADMIN';

    if (!podeEditar) {
        redirect('/membros/dashboard?error=Não tem permissão para editar este perfil');
    }

    // AQUI ESTAVA O PROBLEMA: Faltava buscar as escolaridades no Promise.all!
    const [membro, escolaridades] = await Promise.all([
        prisma.membro.findUnique({
            where: { id: idParaEditar },
            include: {
                ministerios: { include: { departamento: true } },
                cargos: true,
                grupos: true,
                familia: true,
            }
        }),
        prisma.escolaridade.findMany({ orderBy: { id: 'asc' } }), // <-- BUSCA AQUI
    ]);

    if (!membro) redirect('/membros/dashboard');

    return (
        <div className="bg-bg min-h-screen pt-10">
            <MeuPerfilClient
                membro={membro}
                escolaridades={escolaridades} // <-- PASSA PARA O CLIENTE AQUI
            />
        </div>
    );
}