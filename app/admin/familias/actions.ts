'use server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function vincularMembroAFamilia(formData: FormData) {
    const membroId = Number(formData.get('membroId'));
    const familiaId = Number(formData.get('familiaId'));
    const parentesco = formData.get('parentesco') as string;

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
    } catch (error) {
        return { erro: "Não foi possível vincular o membro." };
    }
}