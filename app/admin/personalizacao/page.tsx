// app/admin/personalizacao/page.tsx
import { getDb, getTenantIdFromHeaders } from '@/lib/db'
import { redirect } from 'next/navigation'
import PersonalizacaoClient from '@/components/admin/PersonalizacaoClient'

export default async function PersonalizacaoPage() {
    const db = await getDb()
    const tenantId = await getTenantIdFromHeaders()
    if (!tenantId) redirect('/membros/login')

    const tenant = await db.tenant.findUnique({
        where: { id: tenantId },
        select: {
            cor_primaria: true,
            cor_secundaria: true,
            cor_fundo: true,
            logo_url: true,
            nome: true,
        }
    })

    if (!tenant) redirect('/admin/dashboard')

    return <PersonalizacaoClient tenant={tenant} />
}
