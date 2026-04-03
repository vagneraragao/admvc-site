// app/membros/agendar/page.tsx — Vista do membro para pedir agendamento
import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getTenantClient } from '@/lib/prisma'
import AgendarClient from '@/components/membros/AgendarClient'

export const revalidate = 45

export default async function AgendarPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)
    const db = getTenantClient(tenantId)

    // Buscar agendas publicas com horarios dos proximos dias
    const agendas = await db.agenda.findMany({
        where: { is_publica: true },
        include: {
            dono: { select: { first_name: true, last_name: true, avatar_file: true } },
            compromissos: {
                where: { data_inicio: { gte: new Date() }, status: { in: ['AGENDADO', 'PENDENTE'] } },
                select: { data_inicio: true, data_fim: true },
                orderBy: { data_inicio: 'asc' },
                take: 20,
            }
        },
        orderBy: { nome: 'asc' }
    })

    const membro = await db.membro.findUnique({
        where: { id: session.membroId },
        select: { id: true, first_name: true, last_name: true, phone_1: true, email: true }
    })

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-6 animate-in fade-in duration-700 pb-20">
            <AgendarClient agendas={agendas} membro={membro} />
        </div>
    )
}
