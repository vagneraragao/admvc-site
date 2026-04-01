import prismaGlobal from '@/lib/prisma'
import SuperAdminDashboardClient from '@/components/superadmin/SuperAdminDashboardClient'
import { requireSAAuth } from '@/lib/sa-auth'

export default async function SuperAdminPage() {
    await requireSAAuth()

    // 2. Busca de Dados Globais da Plataforma
    const igrejas = await prismaGlobal.tenant.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: {
                    membros: true,
                    congregacoes: true
                }
            }
        }
    });

    // 3. Cálculos de KPI
    const kpis = {
        totalIgrejas: igrejas.length,
        totalMembros: igrejas.reduce((acc, curr) => acc + curr._count.membros, 0),
        totalCongregacoes: igrejas.reduce((acc, curr) => acc + curr._count.congregacoes, 0),
        igrejasPro: igrejas.filter(i => i.plano === 'PRO' || i.plano === 'ENTERPRISE').length
    };

    return (
        <div className="min-h-screen bg-bg pb-20">
            {/* Aqui ele chama o ficheiro 2 e envia os dados! */}
            <SuperAdminDashboardClient igrejas={igrejas} kpis={kpis} />
        </div>
    );
}