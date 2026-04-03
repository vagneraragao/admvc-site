import prisma from '@/lib/prisma'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import EBDDashboard from '@/components/pregacao/EBDDashboard'

export const dynamic = 'force-dynamic'

export default async function EBDPage({
    searchParams,
}: {
    searchParams: Promise<{ ano?: string; mes?: string; sermao_id?: string }>
}) {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const params = await searchParams
    const headersList = await headers()
    const tenantId = Number(headersList.get('x-tenant-id') || 0)

    const agora = new Date()
    const ano = params.ano ? Number(params.ano) : agora.getFullYear()
    const mes = params.mes ? Number(params.mes) : agora.getMonth() + 1

    const inicio = new Date(ano, mes - 1, 1)
    const fim = new Date(ano, mes, 1)

    // Verificar se é admin ou membro da diaconia
    const membroData = await prisma.membro.findUnique({
        where: { id: session.membroId },
        select: {
            ministerios: { include: { departamento: { select: { nome: true } } } },
            departamentos_liderados: { select: { nome: true } },
        },
    })

    const checkDepto = (termos: string[]) => {
        const inMin = membroData?.ministerios?.some((m: any) => termos.some(t => m.departamento?.nome.toLowerCase().includes(t))) || false
        const inLid = membroData?.departamentos_liderados?.some((d: any) => termos.some(t => d.nome.toLowerCase().includes(t))) || false
        return inMin || inLid
    }

    const podeGerir = isAdmin(session.role) || checkDepto(['diaconia', 'diácono', 'diacono'])

    const [cursos, aulas, membros, sermoes] = await Promise.all([
        prisma.cursoEBD.findMany({
            where: { tenant_id: tenantId },
            include: {
                turmas: {
                    include: {
                        professor: { select: { first_name: true, last_name: true } },
                        _count: { select: { matriculas: true, aulas: true, atividades: true } },
                    },
                },
                _count: { select: { turmas: true } },
            },
            orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
        }),
        prisma.escolaBiblica.findMany({
            where: {
                tenant_id: tenantId,
                data: { gte: inicio, lt: fim },
            },
            include: {
                professor: { select: { first_name: true, last_name: true } },
                sermao: { select: { id: true, titulo: true } },
                turma: { select: { id: true, nome: true } },
                _count: { select: { presencas: true } },
                presencas: { select: { membro_id: true } },
            },
            orderBy: { data: 'desc' },
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

    const cursosSerializados = cursos.map(c => ({
        ...c,
        data_inicio: c.data_inicio.toISOString(),
        data_fim: c.data_fim.toISOString(),
        created_at: c.created_at.toISOString(),
        updated_at: c.updated_at.toISOString(),
        turmas: c.turmas.map(t => ({
            ...t,
            created_at: t.created_at.toISOString(),
        })),
    }))

    const aulasSerializadas = aulas.map(a => ({
        ...a,
        data: a.data.toISOString(),
        created_at: a.created_at.toISOString(),
    }))

    const sermoesSerializados = sermoes.map(s => ({
        ...s,
        data_pregacao: s.data_pregacao.toISOString(),
    }))

    return (
        <EBDDashboard
            cursos={cursosSerializados}
            aulas={aulasSerializadas}
            membros={membros}
            sermoes={sermoesSerializados}
            mes={mes}
            ano={ano}
            sermaoIdInicial={params.sermao_id || null}
            podeGerir={podeGerir}
        />
    )
}
