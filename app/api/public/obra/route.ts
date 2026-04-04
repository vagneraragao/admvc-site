import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const projeto = await prisma.projetoObra.findFirst({
            include: {
                etapas: { orderBy: { ordem: 'asc' } }
            }
        })

        if (!projeto) {
            return NextResponse.json({ ok: true, data: null })
        }

        return NextResponse.json({ ok: true, data: projeto })
    } catch (error: any) {
        console.error('[API PUBLIC] Erro ao buscar obra:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}
