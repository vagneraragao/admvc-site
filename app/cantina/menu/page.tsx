// app/cantina/menu/page.tsx
import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories } from '@/lib/loyverse-api'
import MenuClient from '@/components/cantina/MenuClient'
import { Coffee } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60;

export default async function CantinaMenuPublico() {
    // 1. Busca dados do Loyverse
    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(),
        getLoyverseInventory(),
        getLoyverseCategories() // <- Adicionámos isto
    ]);

    // 2. Descobre os IDs proibidos
    const categoriasOcultasIds = categories
        .filter((c: any) => {
            const nomeCat = c.name.toLowerCase();
            return nomeCat.includes('despensa') || nomeCat.includes('assistencia') || nomeCat.includes('assistência');
        })
        .map((c: any) => c.id);

    // Filtra os Itens
    const itensPublicos = items.filter((item: any) => !categoriasOcultasIds.includes(item.category_id));

    const definirCategoria = (nome: string) => {
        const n = nome.toLowerCase();
        if (n.includes('doce') || n.includes('sobremesa') || n.includes('bolo') || n.includes('brownie') || n.includes('brigadeiro')) return 'Doces & Sobremesas';
        if (n.includes('salgado') || n.includes('lanche') || n.includes('torta') || n.includes('coxinha') || n.includes('pastel') || n.includes('pão') || n.includes('sanduiche') || n.includes('bife')) return 'Salgados & Lanches';
        if (n.includes('bebida') || n.includes('suco') || n.includes('refrigerante') || n.includes('água') || n.includes('cafe') || n.includes('café') || n.includes('sumo')) return 'Bebidas';
        if (n.includes('combo') || n.includes('promo')) return 'Combos Especiais';
        return 'Diversos';
    };

    // 3. Processamento dos Itens (Usando a lista itensPublicos)
    const produtosProcessados = itensPublicos.map((item: any) => {
        const variantePrincipal = item.variants[0];
        const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);
        const stock = stockInfo?.in_stock || 0;

        let nomeOriginal = item.item_name.trim();
        let nomeLimpo = nomeOriginal.replace(/^-+/, '').trim();

        return {
            id: item.id,
            nome: nomeLimpo,
            categoria: definirCategoria(nomeLimpo),
            preco: variantePrincipal?.price || 0,
            imagem: item.image_url || null,
            cor: item.color || '#4b5563',
            stock: stock,
        };
    }).filter((p: any) => p.stock > 0);

    return (
        <main className="min-h-screen bg-bg pb-24">
            {/* HEADER PÚBLICO */}
            <header className="bg-bg2 border-b border-soft pt-12 pb-8 px-6 text-center relative overflow-hidden">
                {/* Efeito de Fundo */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-full bg-figueira/5 blur-[80px] rounded-full pointer-events-none"></div>

                <div className="relative z-10 space-y-4 flex flex-col items-center">
                    <div className="w-20 h-20 bg-figueira text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-figueira/20 mb-2">
                        <Coffee size={40} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-fg leading-none">
                            O Nosso <span className="text-figueira">Menu.</span>
                        </h1>
                        <p className="text-xs md:text-sm font-bold text-muted uppercase tracking-widest mt-3 max-w-md mx-auto">
                            Escolhe o teu lanche favorito e faz o pedido no balcão da cantina.
                        </p>
                    </div>
                </div>
            </header>

            {/* COMPONENTE INTERATIVO (Filtros e Grelha) */}
            <div className="max-w-5xl mx-auto px-6 mt-8">
                <MenuClient produtos={produtosProcessados} />
            </div>

            {/* BOTÃO VOLTAR (Opcional, caso venham de um QR Code na mesa) */}
            <div className="text-center mt-16">
                <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors">
                    &larr; Voltar à página principal
                </Link>
            </div>
        </main>
    )
}