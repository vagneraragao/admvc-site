// actions/loyverse-actions.ts
'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function vincularLoyverseId(membroId: number, loyverseId: string) {
    try {
        await prisma.membro.update({
            where: { id: membroId },
            data: { loyverse_id: loyverseId }
        })

        // Substitui pela rota real onde está o teu relatório
        revalidatePath('/admin/relatorios/loyverse')
        return { sucesso: true }
    } catch (error) {
        console.error("Erro ao vincular Loyverse:", error)
        return { sucesso: false, erro: "Falha ao gravar o ID na base de dados." }
    }
}