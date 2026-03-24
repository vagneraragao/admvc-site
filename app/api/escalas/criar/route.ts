// app/api/escalas/criar/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { eventoId, membroId, departamentoId, funcao, horario } = body

        // Validação básica
        if (!eventoId || !membroId || !departamentoId || !funcao) {
            return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
        }

        // Criar a escala no banco
        const novaEscala = await prisma.escala.create({
            data: {
                evento_id: Number(eventoId),
                membro_id: Number(membroId),
                departamento_id: Number(departamentoId),
                funcao: String(funcao),
                horario: String(horario),
            },
            include: {
                evento: true,
                membro: true,
                departamento: true
            }
        })

        return NextResponse.json(novaEscala)

    } catch (error: any) {
        console.error("ERRO AO CRIAR ESCALA:", error)

        // Verifica se o erro é de duplicidade (P2002 no Prisma)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Este voluntário já está escalado para este evento neste departamento.' },
                { status: 400 }
            )
        }

        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}