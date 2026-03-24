// app/admin/despensa/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function cadastrarItemLoyverse(formData: FormData) {
    try {
        const LOYVERSE_TOKEN = process.env.LOYVERSE_ACCESS_TOKEN;
        const nome = formData.get('nome') as string;
        const categoriaId = formData.get('categoria_id') as string;

        // Estrutura exigida pelo Loyverse para criar um novo produto
        const novoItem = {
            item_name: nome,
            category_id: categoriaId,
            is_sold_by_weight: false,
            track_inventory: true, // Queremos controlar as quantidades!
            variants: [
                {
                    pricing_type: "FIXED",
                    price: 0, // Preço zero, pois é assistência/despensa
                    cost: 0
                }
            ]
        };

        const res = await fetch('https://api.loyverse.com/v1.0/items', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${LOYVERSE_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoItem)
        });

        if (!res.ok) {
            const erro = await res.json();
            console.error("Erro Loyverse:", erro);
            return { error: "Falha ao criar o item no Loyverse." };
        }

        revalidatePath('/admin/despensa');
        return { ok: true };
    } catch (error) {
        console.error(error);
        return { error: "Erro interno ao comunicar com o sistema." };
    }
}