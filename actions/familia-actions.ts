'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function vincularMembroAFamilia(membroId: number, familiaId: number, parentesco: string) {
    try {
        await prisma.membro.update({
            where: { id: membroId },
            data: { familia_id: familiaId, parentesco }
        });
        revalidatePath('/admin/familias');
        return { sucesso: true };
    } catch (e) {
        return { erro: "Erro ao vincular." };
    }
}

// actions/familia-actions.ts
export async function criarNovaFamilia(formData: FormData) {
    const surname = formData.get('surname') as string;

    if (!surname) return { erro: "Nome é obrigatório" };

    try {
        await prisma.familia.create({
            data: { surname: surname }
        });

        revalidatePath('/admin/familias');
        return { sucesso: true };
    } catch (e) {
        return { erro: "Erro ao criar família." };
    }
}


export async function removerMembroDaFamilia(membroId: number) {
    try {
        await prisma.membro.update({
            where: { id: membroId },
            data: {
                familia_id: null,
                parentesco: null // Limpamos também o parentesco ao sair da família
            }
        });

        revalidatePath('/admin/familias');
        // Importante: revalidar a página de edição também, caso esteja aberta
        revalidatePath('/admin/membros/editar/[id]', 'page');

        return { sucesso: true };
    } catch (error) {
        console.error("Erro ao remover membro:", error);
        return { erro: "Não foi possível remover o membro." };
    }
}

