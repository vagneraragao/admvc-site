// app/super-admin/igrejas/[id]/modulos/page.tsx
import prismaGlobal from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import GestaoModulosClient from '@/components/superadmin/GestaoModulosClient'

export const dynamic = 'force-dynamic'

export default async function GestaoModulosPage({ params }: { params: Promise<{ id: string }> }) {
    const cookieStore = await cookies()
    const session = cookieStore.get('admvc_session')
    if (!session) redirect('/membros/login')

    const { id } = await params
    const igrejaId = Number(id)
    if (isNaN(igrejaId)) notFound()

    const igreja = await prismaGlobal.tenant.findUnique({
        where: { id: igrejaId },
        include: {
            _count: { select: { membros: true, congregacoes: true, departamentos: true } }
        }
    })

    if (!igreja) notFound()

    return (
        <GestaoModulosClient
            igreja={{
                id: igreja.id,
                nome: igreja.nome,
                slug: igreja.slug,
                plano: igreja.plano,
                modulos_custom: igreja.modulos_custom as string[] | null,
                _count: igreja._count,
            }}
        />
    )
}
