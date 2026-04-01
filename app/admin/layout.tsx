// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { headers } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'
import CongregacaoFilter from '@/components/admin/CongregacaoFilter'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getSessionData()

    if (!session || !['ADMIN', 'CONGREGATION_ADMIN'].includes(session.role)) {
        redirect('/membros/dashboard?error=Acesso Restrito a Administradores')
    }

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const [admin, tenant, congregacoes] = await Promise.all([
        prisma.membro.findUnique({
            where: { id: session.membroId },
            select: { first_name: true, congregacao_id: true, congregacao: { select: { nome: true } } }
        }),
        tenantId ? prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { nome: true }
        }) : null,
        tenantId ? prisma.congregacao.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, nome: true, cidade: true },
            orderBy: { nome: 'asc' }
        }) : [],
    ])

    const isCongAdmin = session.role === 'CONGREGATION_ADMIN'
    const congFixa = isCongAdmin ? admin?.congregacao_id : undefined

    return (
        <div className="min-h-screen bg-bg flex flex-col md:flex-row">
            <AdminSidebar
                adminNome={admin?.first_name}
                igrejaName={tenant?.nome}
                congregacaoNome={admin?.congregacao?.nome}
                role={session.role}
                congregacaoFilter={
                    congregacoes.length > 0 ? (
                        <CongregacaoFilter
                            congregacoes={congregacoes}
                            selected={congFixa ?? undefined}
                            disabled={isCongAdmin}
                        />
                    ) : undefined
                }
            />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
