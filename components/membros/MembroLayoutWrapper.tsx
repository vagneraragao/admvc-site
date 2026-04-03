// components/membros/MembroLayoutWrapper.tsx
// Layout reutilizavel para qualquer rota que precisa do header do membro
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import { getTenantClient } from '@/lib/prisma'
import MembroHeader from '@/components/membros/MembroHeader'

export default async function MembroLayoutWrapper({ children }: { children: React.ReactNode }) {
    const session = await getSessionData()
    if (!session) return <>{children}</>

    const headersList = await headers()
    const tenantIdStr = headersList.get('x-tenant-id')
    if (!tenantIdStr) return <>{children}</>

    const db = getTenantClient(Number(tenantIdStr))

    // IDs de departamentos e grupos do membro para filtrar avisos
    const membroBasico = await db.membro.findUnique({
        where: { id: session.membroId },
        select: {
            ministerios: { select: { departamento_id: true } },
            grupos: { select: { id: true } },
        }
    })
    const deptIds = membroBasico?.ministerios?.map((m: any) => m.departamento_id).filter(Boolean) || []
    const grupoIds = membroBasico?.grupos?.map((g: any) => g.id).filter(Boolean) || []

    const [membro, tenantData, escolaridades, ultimosAvisos, visitantesAtualizados] = await Promise.all([
        db.membro.findUnique({
            where: { id: session.membroId },
            include: {
                congregacao: { select: { nome: true } },
                ministerios: { include: { departamento: true } },
                departamentos_liderados: true,
            }
        }),
        db.tenant.findFirst({ select: { nome: true } }),
        db.escolaridade.findMany({ orderBy: { id: 'asc' } }),
        // Avisos do mural (departamentos e grupos do membro)
        db.avisoMural.findMany({
            where: {
                OR: [
                    { departamento_id: { in: deptIds.length > 0 ? deptIds : [-1] } },
                    { grupo_id: { in: grupoIds.length > 0 ? grupoIds : [-1] } }
                ]
            },
            include: {
                autor: { select: { first_name: true, last_name: true, avatar_file: true } },
                departamento: { select: { nome: true } },
                grupo: { select: { nome: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
        }),
        // Visitantes pendentes (só para acolhimento/admin)
        db.visitante.findMany({
            where: { status: { in: ['NOVO', 'EM_CONTACTO'] } },
            select: { id: true, nome: true, data_ultima_visita: true, status: true },
            orderBy: { data_ultima_visita: 'desc' },
            take: 5
        }),
    ])

    if (!membro) return <>{children}</>

    const checkDepto = (termos: string[]) => {
        const inMin = membro.ministerios.some((m: any) => termos.some(t => m.departamento?.nome.toLowerCase().includes(t)))
        const inLid = membro.departamentos_liderados.some((d: any) => termos.some(t => d.nome.toLowerCase().includes(t)))
        return inMin || inLid
    }

    const role = session.role
    const permissoes = {
        isAdmin: isAdmin(role),
        isLider: membro.departamentos_liderados?.length > 0,
        isMidia: checkDepto(['mídia', 'midia', 'multimédia']),
        isAcolhimento: checkDepto(['acolhimento', 'integração']),
        isCantina: checkDepto(['cantina']),
        isFinance: isAdmin(role) || role === 'FINANCE',
        isLouvor: checkDepto(['louvor', 'música', 'musica', 'banda']),
        isDiaconia: checkDepto(['diaconia', 'diácono', 'diacono']),
    }
    const mostraServico = permissoes.isAdmin || permissoes.isFinance || permissoes.isAcolhimento || permissoes.isCantina || permissoes.isMidia || permissoes.isLouvor || permissoes.isLider

    return (
        <>
            <MembroHeader
                membro={membro}
                igrejaName={tenantData?.nome || 'Igreja'}
                role={role}
                permissoes={permissoes}
                mostraServico={mostraServico}
                escolaridades={escolaridades}
                avisos={ultimosAvisos}
                alertasAcolhimento={permissoes.isAcolhimento || permissoes.isAdmin ? visitantesAtualizados : []}
            />
            {children}
        </>
    )
}
