import { getDb } from '@/lib/db'
import { getSessionData, isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import POSClient from '@/components/cantina/POSClient'

export const dynamic = 'force-dynamic'

export default async function POSPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const db = await getDb()

    const [produtos, categorias, membros] = await Promise.all([
        db.produtoCantina.findMany({
            where: { disponivel: true },
            include: { categoria: true },
            orderBy: [{ categoria: { ordem: 'asc' } }, { nome: 'asc' }],
        }),
        db.categoriaCantina.findMany({
            where: { ativa: true },
            orderBy: { ordem: 'asc' },
        }),
        db.membro.findMany({
            where: { is_active: true },
            select: { id: true, first_name: true, last_name: true },
            orderBy: { first_name: 'asc' },
        }),
    ])

    // Serialize dates
    const produtosData = produtos.map(p => ({
        ...p,
        criado_em: p.criado_em.toISOString(),
        atualizado_em: p.atualizado_em.toISOString(),
        categoria: p.categoria ? { ...p.categoria, criado_em: p.categoria.criado_em.toISOString() } : null,
    }))

    return <POSClient produtos={produtosData} categorias={categorias.map(c => ({ ...c, criado_em: c.criado_em.toISOString() }))} membros={membros} />
}
