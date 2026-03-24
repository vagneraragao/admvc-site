// app/cantina/tv/page.tsx
import { getLoyverseItems, getLoyverseInventory, getLoyverseCategories } from '@/lib/loyverse-api'

// Força a atualização a cada 60 segundos
export const revalidate = 60;

export default async function CantinaVideoWall() {
    // 1. Busca dados do Loyverse (AGORA COM CATEGORIAS)
    const [items, inventory, categories] = await Promise.all([
        getLoyverseItems(),
        getLoyverseInventory(),
        getLoyverseCategories() // <- Adicionámos isto
    ]);

    // 2. Descobre os IDs das categorias proibidas ("Despensa" e "Assistencia")
    const categoriasOcultasIds = categories
        .filter((c: any) => {
            const nomeCat = c.name.toLowerCase();
            return nomeCat.includes('despensa') || nomeCat.includes('assistencia') || nomeCat.includes('assistência');
        })
        .map((c: any) => c.id);

    // 3. Filtra os Itens (Remove os das categorias ocultas)
    const itensPublicos = items.filter((item: any) => !categoriasOcultasIds.includes(item.category_id));

    // 4. Lógica para definir a cor da etiqueta com base no NOME do produto
    const obterCorCategoria = (nomeItem: string) => {
        const cat = String(nomeItem).toLowerCase();
        if (cat.includes('doce') || cat.includes('sobremesa') || cat.includes('bolo')) return 'rgba(216, 27, 96, 0.9)';
        if (cat.includes('salgado') || cat.includes('lanche') || cat.includes('torta') || cat.includes('coxinha') || cat.includes('pastel')) return 'rgba(255, 143, 0, 0.9)';
        if (cat.includes('bebida') || cat.includes('suco') || cat.includes('refrigerante') || cat.includes('água') || cat.includes('cafe')) return 'rgba(2, 136, 209, 0.9)';
        if (cat.includes('combo') || cat.includes('promoção')) return 'rgba(123, 31, 162, 0.9)';
        return 'rgba(67, 160, 71, 0.9)';
    };

    // 5. Processa e separa os produtos (Usando agora a lista itensPublicos)
    const allProcessedProducts = itensPublicos.map((item: any) => {
        const variantePrincipal = item.variants[0];
        const stockInfo = inventory.find((inv: any) => inv.variant_id === variantePrincipal?.variant_id);
        const stock = stockInfo?.in_stock || 0;

        let nomeOriginal = item.item_name.trim();
        let isDestaque = false;
        let nomeLimpo = nomeOriginal;

        if (nomeOriginal.startsWith('-')) {
            isDestaque = true;
            nomeLimpo = nomeOriginal.replace(/^-+/, '').trim();
        }

        return {
            id: item.id,
            nome: nomeLimpo,
            isDestaque: isDestaque,
            preco: variantePrincipal?.price || 0,
            imagem: item.image_url || 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
            corTag: obterCorCategoria(nomeLimpo),
            stock: stock,
        };
    }).filter((p: any) => p.stock > 0);

    const itensDestaque = allProcessedProducts.filter((p: any) => p.isDestaque);
    const itensComuns = allProcessedProducts.filter((p: any) => !p.isDestaque);

    const listaDuplicada = [...itensComuns, ...itensComuns];

    let duracaoAnimacao = listaDuplicada.length * 5;
    if (duracaoAnimacao < 20) duracaoAnimacao = 20;
    if (duracaoAnimacao > 120) duracaoAnimacao = 120;

    const euro = (valor: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(valor);

    return (
        <main className="fixed inset-0 z-[99999] w-screen h-screen flex flex-col font-sans overflow-hidden bg-black text-white">


            {/* INJETAR O SEU CSS ORIGINAL */}
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
                .container-rolagem:hover { animation-play-state: paused; }
                @keyframes rolarHorizontal { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }

                .tv-card {
                    width: 250px; border-radius: 22px; overflow: hidden; position: relative;
                    background: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.07));
                    border: 1px solid rgba(255,255,255,0.10); backdrop-filter: blur(8px);
                    box-shadow: 0 14px 28px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08);
                    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, z-index 0s;
                    animation: floatCard 4.8s ease-in-out infinite; transform-origin: center center;
                }
                .tv-card:hover {
                    transform: scale(1.35) translateY(-15px) !important; z-index: 999; cursor: pointer;
                    border: 1.5px solid var(--amarelo); animation-play-state: paused;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.6), 0 0 20px rgba(255, 255, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.15);
                }
                .tv-card:nth-child(2n) { animation-delay: .5s; }
                .tv-card:nth-child(3n) { animation-delay: .9s; }
                @keyframes floatCard { 0%,100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-7px) scale(1); } }
                
                .badge-categoria {
                    position: absolute; top: 10px; left: 10px; z-index: 10; color: #fff; padding: 6px 14px;
                    border-radius: 12px; font-size: 0.85rem; font-weight: 800; text-transform: uppercase;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.25); text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                }
                .img-wrap { position: relative; height: 165px; overflow: hidden; background: #111; }
                .img-wrap img { width: 100%; height: 100%; object-fit: cover; transform: scale(1.05); transition: transform 0.5s ease; }
                .tv-card:hover .img-wrap img { transform: scale(1.15); }

                .shine {
                    position: absolute; top: -120%; left: -50%; width: 48%; height: 300%; transform: rotate(18deg);
                    background: linear-gradient(to right, transparent, rgba(255,255,255,0.18), transparent);
                    animation: shineMove 5.2s linear infinite; pointer-events: none; z-index: 2;
                }
                @keyframes shineMove { 0% { left: -60%; } 100% { left: 130%; } }

                .tv-info { padding: 16px 14px 18px; text-align: center; position: relative; z-index: 2; }
                .tv-nome { font-size: 1.35rem; font-weight: 900; margin-bottom: 8px; line-height: 1.1; min-height: 48px; display: flex; align-items: center; justify-content: center; text-transform: uppercase; text-shadow: 0 2px 8px rgba(0,0,0,0.25); }
                .tv-preco {
                    display: inline-flex; align-items: center; justify-content: center; padding: 10px 18px; border-radius: 16px;
                    font-size: 1.8rem; color: #fff; font-weight: 900; background: linear-gradient(45deg, var(--verde-2), var(--verde-3));
                    box-shadow: 0 10px 20px rgba(46,125,50,0.32), inset 0 1px 0 rgba(255,255,255,0.20);
                    animation: pulsePrice 1.8s ease-in-out infinite;
                }
                @keyframes pulsePrice { 0%,100% { box-shadow: 0 10px 20px rgba(46,125,50,0.32), inset 0 1px 0 rgba(255,255,255,0.20); } 50% { box-shadow: 0 14px 28px rgba(67,160,71,0.45), inset 0 1px 0 rgba(255,255,255,0.24); } }

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
                    box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 16px 34px rgba(255,51,0,0.22); position: relative; transform: scale(1.02);
                }
                .img-wrap-destaque { position: relative; width: 100%; height: 175px; overflow: hidden; border-bottom: 1px solid rgba(255,111,0,0.28); }
                .img-wrap-destaque img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .nome-destaque { font-size: 1.7rem; font-weight: 900; color: #fff; text-transform: uppercase; line-height: 1.08; margin-bottom: 10px; min-height: 56px; display: flex; align-items: center; justify-content: center; text-shadow: 0 3px 10px rgba(0,0,0,0.32); }
                .preco-destaque { font-size: 2.8rem; color: var(--amarelo); font-weight: 900; text-shadow: 0 0 12px rgba(255,204,0,0.18); }
            `}} />

            {/* BACKGROUNDS EFEITOS */}
            <div className="bg-main"></div>
            <div className="bg-glow"></div>

            {/* HEADER */}
            <header className="tv-header flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Altere o src abaixo para o logotipo real da sua igreja se desejar */}
                    <img className="w-[68px] h-[68px] rounded-[18px] object-cover bg-white border-2 border-white/15 shadow-[0_10px_24px_rgba(0,0,0,0.35)]"
                        src="https://ui-avatars.com/api/?name=Cantina+ADMVC&background=0D8ABC&color=fff&size=128"
                        alt="Logo Cantina" />
                    <div>
                        <h1 className="text-[2rem] font-black leading-none tracking-widest text-white drop-shadow-[0_3px_14px_rgba(0,0,0,0.35)]">CANTINA DA IGREJA ADMVC</h1>
                        <p className="mt-2 text-[0.98rem] font-bold text-white/90">Nosso menu • Produtos fresquinhos • Seja bem-vindo</p>
                    </div>
                </div>
                <div className="badge-top">NOSSO MENU</div>
            </header>

            {/* CONTAINER DE ROLAGEM HORIZONTAL (ITENS COMUNS) */}
            <div className="area-rolagem">
                {itensComuns.length > 0 ? (
                    <div className="container-rolagem" style={{ animationDuration: `${duracaoAnimacao}s` }}>
                        {listaDuplicada.map((item: any, idx: number) => (
                            <div key={`${item.id}-${idx}`} className="tv-card">
                                <div className="img-wrap">
                                    <div className="badge-categoria" style={{ background: item.corTag }}>Diversos</div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.imagem} alt={item.nome} />
                                    <div className="shine"></div>
                                </div>
                                <div className="tv-info">
                                    <div className="tv-nome">{item.nome}</div>
                                    <div className="text-[0.88rem] text-white/80 font-bold mb-3">Sabor e qualidade</div>
                                    <div className="tv-preco">{euro(item.preco)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full text-center text-white/50 z-20">
                        <h2 className="text-4xl font-black uppercase tracking-widest">Nenhum produto em estoque.</h2>
                    </div>
                )}
            </div>

            {/* RODAPÉ: DESTAQUES DA CASA */}
            {itensDestaque.length > 0 && (
                <div className="area-rodape">
                    <div className="badge-sugestao">⭐ Destaques da Casa ⭐</div>
                    <div className="rodape-destaques">
                        {itensDestaque.map((item: any) => (
                            <div key={item.id} className="card-destaque">
                                <div className="img-wrap-destaque">
                                    <div className="badge-categoria" style={{ background: item.corTag }}>Especial</div>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.imagem} alt={item.nome} />
                                    <div className="shine"></div>
                                </div>
                                <div className="p-4 px-4 pb-5 text-center w-full relative z-10">
                                    <div className="nome-destaque">{item.nome}</div>
                                    <div className="preco-destaque">{euro(item.preco)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Refresh Automático para puxar novos dados e esconder quem fica sem stock */}
            <meta httpEquiv="refresh" content="60" />
        </main>
    )
}