// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getSessionData()

    if (!session || session.role !== 'ADMIN') {
        redirect('/membros/dashboard?error=Acesso Restrito a Administradores')
    }

    const admin = await prisma.membro.findUnique({
        where: { id: session.membroId },
        select: { first_name: true }
    })

    return (
        <div className="min-h-screen bg-bg flex flex-col md:flex-row">
            <AdminSidebar adminNome={admin?.first_name} />
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
