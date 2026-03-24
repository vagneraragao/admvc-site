// lib/loyverse-api.ts

const LOYVERSE_TOKEN = process.env.LOYVERSE_ACCESS_TOKEN;
const BASE_URL = 'https://api.loyverse.com/v1.0';

// 1. Puxar todos os produtos (Items)
export async function getLoyverseItems() {
    try {
        const res = await fetch(`${BASE_URL}/items`, {
            headers: { 'Authorization': `Bearer ${LOYVERSE_TOKEN}` },
            next: { revalidate: 60 } // Atualiza a cada 60 segundos
        });
        if (!res.ok) throw new Error('Falha ao buscar itens');
        const data = await res.json();
        return data.items || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

// 2. Puxar o Stock Atual (Inventory)
export async function getLoyverseInventory() {
    try {
        const res = await fetch(`${BASE_URL}/inventory`, {
            headers: { 'Authorization': `Bearer ${LOYVERSE_TOKEN}` },
            next: { revalidate: 60 }
        });
        if (!res.ok) throw new Error('Falha ao buscar stock');
        const data = await res.json();
        return data.inventory_levels || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}

// Adicione isto no final do ficheiro lib/loyverse-api.ts

// 3. Puxar as Categorias
export async function getLoyverseCategories() {
    try {
        const LOYVERSE_TOKEN = process.env.LOYVERSE_ACCESS_TOKEN;
        const BASE_URL = 'https://api.loyverse.com/v1.0';

        const res = await fetch(`${BASE_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${LOYVERSE_TOKEN}` },
            next: { revalidate: 60 }
        });
        if (!res.ok) throw new Error('Falha ao buscar categorias');
        const data = await res.json();
        return data.categories || [];
    } catch (error) {
        console.error(error);
        return [];
    }
}