// app/admin/membros/page.tsx
import prisma from '@/lib/prisma'
import MembrosListClient from '@/components/admin/MembrosListClient'; // Ajusta o caminho se necessário

export const dynamic = 'force-dynamic'

export default async function ListaMembrosAdmin() {
    // 1. Buscar membros com os novos campos de termos
    const membros = await prisma.membro.findMany({
        orderBy: {
            created_at: 'desc'
        },
        select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_1: true,
            gender: true,
            id_city: true,
            avatar_file: true,
            // NOVOS CAMPOS PARA OS ÍCONES
            gdpr_aceite: true,
            gdpr_validade: true,
            permanecer_aceite: true,
            permanecer_validade: true,
        }
    });

    return (
        <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-6">



            <MembrosListClient membros={membros} />

        </main>
    )
}