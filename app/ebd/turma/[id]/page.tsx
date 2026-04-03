import prisma from '@/lib/prisma'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import TurmaClient from '@/components/pregacao/TurmaClient'
import { podeGerirCursos } from '@/lib/cursos-permissoes'

export const dynamic = 'force-dynamic'

export default async function TurmaPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const { id } = await params
    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const podeGerir = await podeGerirCursos(session.membroId, session.role)

    const [turma, membros, sermoes] = await Promise.all([
        prisma.turmaEBD.findFirst({
            where: { id, tenant_id: tenantId },
            include: {
                curso: true,
                professor: { select: { id: true, first_name: true, last_name: true } },
                matriculas: {
                    include: {
                        membro: { select: { id: true, first_name: true, last_name: true } },
                    },
                    orderBy: { membro: { first_name: 'asc' } },
                },
                aulas: {
                    include: {
                        professor: { select: { first_name: true, last_name: true } },
                        _count: { select: { presencas: true } },
                        presencas: { select: { membro_id: true } },
                        sermao: { select: { id: true, titulo: true } },
                    },
                    orderBy: { data: 'desc' },
                },
                atividades: {
                    include: {
                        notas: true,
                        _count: { select: { notas: true } },
                    },
                    orderBy: { created_at: 'desc' },
                },
            },
        }),
        prisma.membro.findMany({
            where: { tenant_id: tenantId, is_active: true },
            select: { id: true, first_name: true, last_name: true },
            orderBy: { first_name: 'asc' },
        }),
        prisma.sermao.findMany({
            where: { tenant_id: tenantId },
            select: { id: true, titulo: true, data_pregacao: true },
            orderBy: { data_pregacao: 'desc' },
            take: 100,
        }),
    ])

    if (!turma) redirect('/ebd')

    // Serialize dates
    const turmaSerializada = {
        ...turma,
        created_at: turma.created_at.toISOString(),
        curso: {
            ...turma.curso,
            data_inicio: turma.curso.data_inicio.toISOString(),
            data_fim: turma.curso.data_fim.toISOString(),
            created_at: turma.curso.created_at.toISOString(),
            updated_at: turma.curso.updated_at.toISOString(),
        },
        matriculas: turma.matriculas.map(m => ({
            ...m,
            data_matricula: m.data_matricula.toISOString(),
        })),
        aulas: turma.aulas.map(a => ({
            ...a,
            data: a.data.toISOString(),
            created_at: a.created_at.toISOString(),
        })),
        atividades: turma.atividades.map(a => ({
            ...a,
            data_entrega: a.data_entrega?.toISOString() || null,
            created_at: a.created_at.toISOString(),
        })),
    }

    const sermoesSerializados = sermoes.map(s => ({
        ...s,
        data_pregacao: s.data_pregacao.toISOString(),
    }))

    return (
        <TurmaClient
            turma={turmaSerializada}
            membros={membros}
            sermoes={sermoesSerializados}
            podeGerir={podeGerir}
            membroId={session.membroId}
        />
    )
}
