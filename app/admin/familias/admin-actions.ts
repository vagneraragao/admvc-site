// app/admin/familias/actions.ts
'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function associarMembroAFamilia(membroId: number, familiaId: number, parentesco: string) {
    try {
        await prisma.membro.update({
            where: { id: membroId },
            data: {
                familia_id: familiaId,
                parentesco: parentesco
            }
        });
        revalidatePath('/admin/familias');
        return { sucesso: true };
    } catch (e) {
        return { erro: "Falha ao associar membro." };
    }
}