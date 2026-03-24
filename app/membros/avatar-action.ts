// app/membros/avatar-action.ts
'use server'

import { put } from '@vercel/blob'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function uploadAvatarMembro(membroId: number, formData: FormData) {
    try {
        const file = formData.get('avatar') as File;

        if (!file || file.size === 0) {
            return { erro: "Nenhum arquivo selecionado." };
        }

        // 1. Upload para o Vercel Blob
        const blob = await put(`avatars/membro_${membroId}.jpg`, file, {
            access: 'public',
            addRandomSuffix: true, // Evita cache e nomes duplicados
        });

        // 2. Atualizar o banco de dados com a nova URL
        await prisma.membro.update({
            where: { id: membroId },
            data: { avatar_file: blob.url },
        });

        revalidatePath('/membros');
        return { sucesso: "Fotografia atualizada!", url: blob.url };

    } catch (error) {
        console.error("Erro no upload:", error);
        return { erro: "Falha ao enviar a imagem." };
    }
}