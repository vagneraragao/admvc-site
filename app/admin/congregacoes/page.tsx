// app/admin/congregacoes/page.tsx
import { getTenantClient } from '@/lib/prisma'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import GestaoCongregacoesClient from '@/components/igreja/GestaoCongregacoesClient'

export default async function CongregacoesPage() {
    // 1. Identifica a Igreja do Administrador
    const headersList = await headers();
    const tenantIdStr = headersList.get('x-tenant-id');

    if (!tenantIdStr) {
        redirect('/admin/login?error=Igreja não identificada.');
    }

    const db = getTenantClient(Number(tenantIdStr));

    // 2. Carrega as congregações desta igreja, contando quantos membros cada uma tem
    const congregacoes = await db.congregacao.findMany({
        orderBy: { nome: 'asc' },
        include: {
            _count: {
                select: { membros: true, grupos: true }
            }
        }
    });

    return (
        <div className="bg-bg min-h-screen pb-20">
            <GestaoCongregacoesClient congregacoes={congregacoes} />
        </div>
    );
}