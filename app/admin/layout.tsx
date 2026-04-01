// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { headers } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getSessionData()

    if (!session || session.role !== 'ADMIN') {
        redirect('/membros/dashboard?error=Acesso Restrito a Administradores')
    }

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const [admin, tenant] = await Promise.all([
        prisma.membro.findUnique({
            where: { id: session.membroId },
            select: { first_name: true, congregacao: { select: { nome: true } } }
        }),
        tenantId ? prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { nome: true }
        }) : null,
    ])

    return (
        <div className="min-h-screen bg-bg flex flex-col md:flex-row">
            <AdminSidebar
                adminNome={admin?.first_name}
                igrejaName={tenant?.nome}
                congregacaoNome={admin?.congregacao?.nome}
            />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
