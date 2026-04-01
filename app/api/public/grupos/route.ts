import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const revalidate = 3600 // Cache 1 hora

export async function GET() {
    try {
        const grupos = await prisma.grupo.findMany({
            where: { publico: true },
            include: {
                lideres: {
                    select: { first_name: true, last_name: true, avatar_file: true }
                },
                _count: { select: { membros: true } }
            },
            orderBy: [{ regiao: 'asc' }, { nome: 'asc' }]
        })

        return NextResponse.json({ ok: true, data: grupos })
    } catch (error: any) {
        console.error('[API PUBLIC] Erro ao buscar grupos:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor.' },
            { status: 500 }
        )
    }
}
