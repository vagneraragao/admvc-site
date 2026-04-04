import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories, getLoyverseTokenForTenant } from '@/lib/loyverse-api'
import { getTenantIdFromHeaders } from '@/lib/db'
import MenuClient from '@/components/cantina/MenuClient'
import { Coffee, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function CantinaMenuPublico() {
    const tenantId = await getTenantIdFromHeaders();
    const token = await getLoyverseTokenForTenant(tenantId);

    if (!token) {
        return (
            <main className="min-h-screen bg-bg pb-24 flex items-center justify-center">
                <div className="bg-orange-50 border border-orange-200 p-8 rounded-3xl text-center space-y-2 max-w-md">
                    <AlertTriangle className="mx-auto text-orange-500" size={32} />
                    <h2 className="text-lg font-black uppercase text-orange-700">Loyverse nao configurado</h2>
                    <p className="text-sm text-orange-600">Menu indisponivel de momento.</p>
                </div>
            </main>
        );
    }

    // 1. Busca dados do Loyverse
    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(token),
        getLoyverseInventory(token),
        getLoyverseCategories(token)
    ]);

    // 2. Descobre os IDs proibidos (Despensa e Assistência)
    const categoriasOcultasIds = categories
        .filter((c: any) => {
            const nomeCat = c.name.toLowerCase();
            return nomeCat.includes('despensa') || nomeCat.includes('assistencia') || nomeCat.includes('assistência');
        })
        .map((c: any) => c.id);

    // 3. Processamento dos Itens
    const produtosProcessados = items
        .filter((item: any) => !categoriasOcultasIds.includes(item.category_id))
        .map((item: any) => {
            const variantePrincipal = item.variants?.[0] || {};
            const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);
            const stock = stockInfo?.in_stock || 0;
            const isAvailable = variantePrincipal?.stores?.[0]?.available_for_sale ?? true;
            // BUSCAR O PREÇO REAL (Igual ao que corrigimos nos outros ficheiros)
            const precoReal = variantePrincipal?.default_price ?? variantePrincipal?.stores?.[0]?.price ?? 0;

            // BUSCAR A CATEGORIA REAL DO LOYVERSE
            const categoriaObj = categories.find((c: any) => c.id === item.category_id);
            const nomeCategoria = categoriaObj?.name || 'Diversos';

            let nomeOriginal = item.item_name.trim();
            let nomeLimpo = nomeOriginal.replace(/^-+/, '').trim();

            return {
                id: item.id,
                nome: nomeLimpo,
                // Usamos a categoria real vinda do Loyverse para os filtros do MenuClient
                categoria: nomeCategoria,
                preco: precoReal,
                imagem: item.image_url || null,
                cor: item.color || '#4b5563',
                stock: stock,
                isAvailable: isAvailable,
            };
        })
        // Removemos itens sem stock e itens marcados como "Não disponível para venda"
        .filter((p: any) => p.stock > 0 && p.isAvailable);

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
                {/* O MenuClient agora recebe os produtos com os nomes de categoria reais do Loyverse */}
                <MenuClient produtos={produtosProcessados} />
            </div>

            {/* FOOTER QR CODE INFO */}
            <footer className="text-center mt-12 mb-8 px-6">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/40">
                    ADMVC • Menu Digital Sincronizado
                </p>
            </footer>

            {/* BOTÃO VOLTAR */}
            <div className="text-center mt-4">
                <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-figueira transition-colors">
                    &larr; Voltar à página principal
                </Link>
            </div>
        </main>
    )
}