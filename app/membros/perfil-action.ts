'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function atualizarDadosMembro(membroId: number, formData: FormData) {
    try {
        const data = {
            // Pessoal
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            birthdate: formData.get('birthdate') ? new Date(formData.get('birthdate') as string) : null,
            gender: formData.get('gender') as string,
            marital_status: formData.get('marital_status') as string,
            nationality: formData.get('nationality') as string,
            tax_id: formData.get('tax_id') as string,
            id_card_number: formData.get('id_card_number') as string,
            profession: formData.get('profession') as string,

            // Filiação
            father_name: formData.get('father_name') as string,
            mother_name: formData.get('mother_name') as string,

            // Contacto e Morada
            phone_1: formData.get('phone_1') as string,
            phone_2: formData.get('phone_2') as string,
            address_1: formData.get('address_1') as string,
            address_2: formData.get('address_2') as string,
            address_number: formData.get('address_number') as string,
            postal_code: formData.get('postal_code') as string,
            id_city: formData.get('id_city') as string,
            state: formData.get('state') as string,
            country: formData.get('country') as string,

            // Notas
            notes: formData.get('notes') as string,
        }

        await prisma.membro.update({
            where: { id: membroId },
            data: data
        })

        revalidatePath('/membros')
        revalidatePath('/admin/membros')

        return { sucesso: "Dados atualizados com sucesso!" }
    } catch (error) {
        console.error(error)
        return { erro: "Erro ao salvar no banco de dados." }
    }
}