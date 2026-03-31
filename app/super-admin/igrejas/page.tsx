// app/super-admin/igrejas/page.tsx
import prismaGlobal from '@/lib/prisma'
import GestaoIgrejasClient from '@/components/igreja/GestaoIgrejasClient'

export default async function SuperAdminIgrejasPage() {
    // Busca todas as igrejas e conta quantos membros cada uma tem
    const igrejas = await prismaGlobal.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { membros: true, congregacoes: true }
            }
        }
    });

    return (
        <div className="min-h-screen bg-bg pb-20">
            {/* Passamos as igrejas para o Client Component */}
            <GestaoIgrejasClient igrejasIniciais={igrejas} />
        </div>
    );
}