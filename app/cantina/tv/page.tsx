import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories } from '@/lib/loyverse-api'

export const dynamic = 'force-dynamic'

export default async function CantinaVideoWall() {
    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(),
        getLoyverseInventory(),
        getLoyverseCategories()
    ]);

    // 1. Filtrar categorias que não devem aparecer na TV
    const categoriasOcultasIds = categories
        .filter((c: any) => {
            const nomeCat = c.name.toLowerCase();
            return nomeCat.includes('despensa') || nomeCat.includes('assistencia') || nomeCat.includes('assistência');
        })
        .map((c: any) => c.id);

    // 2. Processar os produtos com os nomes de campos corretos da API
    const allProcessedProducts = items
        .filter((item: any) => !categoriasOcultasIds.includes(item.category_id))
        .map((item: any) => {
            const variantePrincipal = item.variants?.[0] || {};
            const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);
            const stock = stockInfo?.in_stock || 0;
            const isAvailable = variantePrincipal?.stores?.[0]?.available_for_sale ?? true;
            // BUSCAR O PREÇO REAL (Igual ao que fizemos na Gestão)
            const precoReal = variantePrincipal?.default_price ?? variantePrincipal?.stores?.[0]?.price ?? 0;

            // BUSCAR O NOME REAL DA CATEGORIA
            const categoriaObj = categories.find((c: any) => c.id === item.category_id);
            const nomeCategoria = categoriaObj?.name || 'Diversos';

            let nomeOriginal = item.item_name.trim();
            let isDestaque = nomeOriginal.startsWith('-');
            let nomeLimpo = isDestaque ? nomeOriginal.replace(/^-+/, '').trim() : nomeOriginal;

            // Lógica de Cores baseada na Categoria Real ou Nome
            const obterCorCategoria = (catNome: string) => {
                const c = catNome.toLowerCase();
                if (c.includes('doce') || c.includes('bolo')) return 'rgba(216, 27, 96, 0.9)';
                if (c.includes('salgado') || c.includes('lanche')) return 'rgba(255, 143, 0, 0.9)';
                if (c.includes('bebida') || c.includes('caf')) return 'rgba(2, 136, 209, 0.9)';
                return 'rgba(67, 160, 71, 0.9)';
            };

            return {
                id: item.id,
                nome: nomeLimpo,
                isDestaque: isDestaque,
                preco: precoReal,
                categoria: nomeCategoria,
                imagem: item.image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
                corTag: obterCorCategoria(nomeCategoria),
                stock: stock,
                isAvailable: isAvailable,
            };
        })
        .filter((p: any) => p.stock > 0 && p.isAvailable); // Só mostra o que tem stock

    const itensDestaque = allProcessedProducts.filter((p: any) => p.isDestaque);
    const itensComuns = allProcessedProducts.filter((p: any) => !p.isDestaque);
    const listaDuplicada = [...itensComuns, ...itensComuns];

    let duracaoAnimacao = Math.max(20, Math.min(120, listaDuplicada.length * 5));

    const euro = (valor: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);

    return (
        <main className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col font-sans overflow-hidden bg-black text-white">
            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --verde-1: #1b5e20; --verde-2: #2e7d32; --verde-3: #43a047;
                    --amarelo: #ffd54f; --amarelo-2: #ffcc00; --laranja: #ff6f00;
                    --vermelho: #ff3300; --branco: #ffffff;
                }
                .bg-main {
                    position: absolute; inset: 0; z-index: 0;
                    background: linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.75)), url('https://images.unsplash.com/photo-1504674900247-0877df9cc836') no-repeat center center / cover;
                }
                .bg-glow {
                    position: absolute; inset: 0; pointer-events: none;
                    background: radial-gradient(circle at 20% 18%, rgba(67,160,71,0.16), transparent 25%),
                                radial-gradient(circle at 80% 22%, rgba(255,204,0,0.14), transparent 22%),
                                radial-gradient(circle at 50% 85%, rgba(255,111,0,0.10), transparent 30%);
                    animation: pulseBg 10s ease-in-out infinite alternate; z-index: 1;
                }
                @keyframes pulseBg { from { transform: scale(1); opacity: 0.9; } to { transform: scale(1.04); opacity: 1; } }
                .tv-header {
                    position: relative; z-index: 20; flex-shrink: 0;
                    background: linear-gradient(to bottom, rgba(0,0,0,0.92), rgba(0,0,0,0.55));
                    border-bottom: 2px solid rgba(255,204,0,0.35); backdrop-filter: blur(8px); padding: 14px 28px;
                }
                .badge-top {
                    padding: 12px 18px; border-radius: 999px; font-size: 1rem; font-weight: 900; white-space: nowrap; color: #111;
                    background: linear-gradient(45deg, var(--amarelo-2), var(--amarelo));
                    box-shadow: 0 10px 25px rgba(255,204,0,0.28);
                }
                .area-rolagem {
                    flex: 1; position: relative; overflow: visible; z-index: 5; display: flex; align-items: center; padding: 40px 0;
                    mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
                    -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
                }
                .container-rolagem {
                    display: flex; flex-wrap: nowrap; gap: 35px; padding-right: 35px; width: max-content;
                    animation: rolarHorizontal linear infinite; will-change: transform;
                }
                @keyframes rolarHorizontal { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .tv-card {
                    width: 250px; border-radius: 22px; overflow: hidden; position: relative;
                    background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.07));
                    border: 1px solid rgba(255,255,255,0.10); backdrop-filter: blur(8px);
                    box-shadow: 0 14px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08);
                    animation: floatCard 4.8s ease-in-out infinite; transform-origin: center center;
                }
                @keyframes floatCard { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-7px) scale(1); } }
                .badge-categoria {
                    position: absolute; top: 10px; left: 10px; z-index: 10; color: #fff; padding: 6px 14px;
                    border-radius: 12px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.25); text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                }
                .img-wrap { position: relative; height: 165px; overflow: hidden; background: #111; }
                .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
                .shine {
                    position: absolute; top: -120%; left: -50%; width: 48%; height: 300%; transform: rotate(18deg);
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent);
                    animation: shineMove 5.2s linear infinite; pointer-events: none; z-index: 2;
                }
                @keyframes shineMove { 0% { left: -60%; } 100% { left: 130%; } }
                .tv-info { padding: 16px 14px 18px; text-align: center; position: relative; z-index: 2; }
                .tv-nome { font-size: 1.35rem; font-weight: 900; margin-bottom: 8px; line-height: 1.1; min-height: 48px; display: flex; align-items: center; justify-content: center; text-transform: uppercase; }
                .tv-preco {
                    display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: 16px;
                    font-size: 1.8rem; color: #fff; font-weight: 900; background: linear-gradient(45deg, var(--verde-2), var(--verde-3));
                    box-shadow: 0 10px 20px rgba(46,125,50,0.32), inset 0 1px 0 rgba(255,255,255,0.20);
                    animation: pulsePrice 1.8s ease-in-out infinite;
                }
                @keyframes pulsePrice { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
                .area-rodape { position: relative; z-index: 10; flex-shrink: 0; }
                .badge-sugestao {
                    position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
                    background: linear-gradient(45deg, var(--vermelho), var(--laranja)); color: #fff; padding: 8px 28px;
                    border-radius: 18px 18px 0 0; font-size: 1.25rem; font-weight: 900; text-transform: uppercase;
                    box-shadow: 0 10px 20px rgba(255,51,0,0.30); border: 1px solid rgba(255,255,255,0.10);
                }
                .rodape-destaques {
                    background: linear-gradient(to top, rgba(0,0,0,0.96), rgba(15,15,15,0.92)); border-top: 3px solid rgba(255,111,0,0.40);
                    padding: 18px 24px 20px; display: flex; justify-content: center; gap: 26px; align-items: stretch;
                    box-shadow: 0 -14px 30px rgba(0,0,0,0.45); min-height: 265px;
                }
                .card-destaque {
                    width: 300px; display: flex; flex-direction: column; align-items: center; overflow: hidden; border-radius: 22px;
                    background: linear-gradient(145deg, rgba(90,20,8,0.95), rgba(35,5,3,0.95)); border: 1px solid rgba(255,111,0,0.25);
                    position: relative; transform: scale(1.02);
                }
                .img-wrap-destaque { position: relative; width: 100%; height: 175px; overflow: hidden; border-bottom: 1px solid rgba(255,111,0,0.28); }
                .img-wrap-destaque img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .nome-destaque { font-size: 1.7rem; font-weight: 900; color: #fff; text-transform: uppercase; line-height: 1.08; margin-bottom: 10px; min-height: 56px; display: flex; align-items: center; justify-content: center; }
                .preco-destaque { font-size: 2.8rem; color: var(--amarelo); font-weight: 900; }
            `}} />

            <div className="bg-main"></div>
            <div className="bg-glow"></div>

            <header className="tv-header flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img className="w-[68px] h-[68px] rounded-[18px] object-cover bg-white"
                        src="https://ui-avatars.com/api/?name=Cantina+ADMVC&background=0D8ABC&color=fff&size=128"
                        alt="Logo Cantina" />
                    <div>
                        <h1 className="text-[2rem] font-black leading-none tracking-widest text-white">CANTINA DA IGREJA ADMVC</h1>
                        <p className="mt-2 text-[0.98rem] font-bold text-white/90">Nosso menu • Produtos fresquinhos • Seja bem-vindo</p>
                    </div>
                </div>
                <div className="badge-top">NOSSO MENU</div>
            </header>

            <div className="area-rolagem">
                {itensComuns.length > 0 ? (
                    <div className="container-rolagem" style={{ animationDuration: `${duracaoAnimacao}s` }}>
                        {listaDuplicada.map((item: any, idx: number) => (
                            <div key={`${item.id}-${idx}`} className="tv-card">
                                <div className="img-wrap">
                                    {/* 👇 CATEGORIA REAL AQUI */}
                                    <div className="badge-categoria" style={{ background: item.corTag }}>{item.categoria}</div>
                                    <img src={item.imagem} alt={item.nome} />
                                    <div className="shine"></div>
                                </div>
                                <div className="tv-info">
                                    <div className="tv-nome">{item.nome}</div>
                                    <div className="text-[0.88rem] text-white/80 font-bold mb-3">Sabor e qualidade</div>
                                    {/* 👇 PREÇO REAL AQUI */}
                                    <div className="tv-preco">{euro(item.preco)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full text-center text-white/50 z-20">
                        <h2 className="text-4xl font-black uppercase tracking-widest">Aguardando produtos em estoque...</h2>
                    </div>
                )}
            </div>

            {itensDestaque.length > 0 && (
                <div className="area-rodape">
                    <div className="badge-sugestao">⭐ Destaques da Casa ⭐</div>
                    <div className="rodape-destaques">
                        {itensDestaque.map((item: any) => (
                            <div key={item.id} className="card-destaque">
                                <div className="img-wrap-destaque">
                                    {/* 👇 CATEGORIA REAL AQUI */}
                                    <div className="badge-categoria" style={{ background: item.corTag }}>{item.categoria}</div>
                                    <img src={item.imagem} alt={item.nome} />
                                    <div className="shine"></div>
                                </div>
                                <div className="p-4 px-4 pb-5 text-center w-full relative z-10">
                                    <div className="nome-destaque">{item.nome}</div>
                                    {/* 👇 PREÇO REAL AQUI */}
                                    <div className="preco-destaque">{euro(item.preco)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <meta httpEquiv="refresh" content="60" />
        </main>
    )
}