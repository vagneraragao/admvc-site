import prisma from '@/lib/prisma'
import RelatoriosClient from '@/components/relatorios/RelatoriosClient'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage() {
    const membros = await prisma.membro.findMany({
        where: { status: { in: ['Ativo', 'ATIVO'] } },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            birthdate: true,
            gender: true,
            marital_status: true,
            baptism_status: true,
            data_admissao: true,
            id_city: true,
            state: true,
            role: true,
            church_role: true,
            // 👇 NOVA LINHA ADICIONADA AQUI:
            termo_aceite: true,
        }
    });

    return <RelatoriosClient membros={membros} />;
}