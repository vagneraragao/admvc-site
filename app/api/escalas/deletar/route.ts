// app/api/escalas/deletar/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 })

    try {
        await prisma.escala.delete({
            where: { id: parseInt(id) }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao deletar escala' }, { status: 500 })
    }
}