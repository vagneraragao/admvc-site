// app/membros/layout.tsx — Layout partilhado do portal do membro
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import { getTenantClient } from '@/lib/prisma'
import prisma from '@/lib/prisma'
import MembroHeader from '@/components/membros/MembroHeader'

export default async function MembrosLayout({ children }: { children: React.ReactNode }) {
    const session = await getSessionData()

    // Paginas publicas (login, termos) nao precisam de header
    const headersList = await headers()
    const pathname = headersList.get('x-next-pathname') || ''

    // Se nao tem sessao, renderizar sem header (login page etc.)
    if (!session) {
        return <>{children}</>
    }

    const tenantIdStr = headersList.get('x-tenant-id')
    if (!tenantIdStr) return <>{children}</>

    const db = getTenantClient(Number(tenantIdStr))

    const [membro, tenantData, escolaridades] = await Promise.all([
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
    ])

    if (!membro) return <>{children}</>

    // Permissoes
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
    }
    const mostraServico = permissoes.isAdmin || permissoes.isFinance || permissoes.isAcolhimento || permissoes.isCantina || permissoes.isMidia || permissoes.isLouvor || permissoes.isLider

    return (
        <div className="min-h-screen bg-bg">
            <MembroHeader
                membro={membro}
                igrejaName={tenantData?.nome || 'Igreja'}
                role={role}
                permissoes={permissoes}
                mostraServico={mostraServico}
                escolaridades={escolaridades}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                {children}
            </div>
        </div>
    )
}
