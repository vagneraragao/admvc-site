// app/api/loyverse/sync/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { membroId } = body

        if (!membroId) {
            return NextResponse.json({ error: 'ID do membro é obrigatório.' }, { status: 400 })
        }

        // 1. Busca o membro no seu banco de dados
        const membro = await prisma.membro.findUnique({
            where: { id: Number(membroId) }
        })

        if (!membro) {
            return NextResponse.json({ error: 'Membro não encontrado no banco.' }, { status: 404 })
        }

        // Se ele já tem o loyverse_id, não precisamos criar de novo
        if (membro.loyverse_id) {
            return NextResponse.json({
                message: 'Membro já está sincronizado com a Cantina.',
                loyverse_id: membro.loyverse_id
            })
        }

        // 2. Prepara os dados para enviar para o Loyverse
        const loyversePayload = {
            name: `${membro.first_name} ${membro.last_name}`,
            email: membro.email,
            // phone_number: membro.telefone // (Descomente se você tiver telefone no banco)
            note: "Membro integrado via App da Igreja"
        }

        // 3. Faz a requisição para a API oficial do Loyverse
        const res = await fetch('https://api.loyverse.com/v1.0/customers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // O Token de Acesso fica seguro nas variáveis de ambiente
                'Authorization': `Bearer ${process.env.LOYVERSE_ACCESS_TOKEN}`
            },
            body: JSON.stringify(loyversePayload)
        })

        if (!res.ok) {
            const errorData = await res.json()
            console.error("ERRO API LOYVERSE:", errorData)
            return NextResponse.json({ error: 'Falha ao criar carteira no Loyverse.' }, { status: res.status })
        }

        // 4. Extrai a resposta de sucesso do Loyverse
        const data = await res.json()
        const novoLoyverseId = data.id

        // 5. Salva o ID gerado pelo Loyverse no perfil do membro no SEU banco
        await prisma.membro.update({
            where: { id: membro.id },
            data: { loyverse_id: novoLoyverseId }
        })

        return NextResponse.json({
            success: true,
            message: 'Carteira digital criada com sucesso!',
            loyverse_id: novoLoyverseId
        })

    } catch (error: any) {
        console.error("ERRO INTERNO SYNC LOYVERSE:", error)
        return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
    }
}