// app/cantina/menu-local/page.tsx
// Menu publico da cantina — le produtos da base de dados local
import { getDb } from '@/lib/db'
import { getSessionData } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'
import { Coffee, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MenuLocalPage() {
    const session = await getSessionData()
    if (!session) redirect('/membros/login')

    const db = await getDb()

    const [produtos, categorias] = await Promise.all([
        db.produtoCantina.findMany({
            where: {
                disponivel: true,
                OR: [
                    { controla_stock: false },
                    { stock: { gt: 0 } },
                ],
            },
            include: { categoria: true },
            orderBy: [{ categoria: { ordem: 'asc' } }, { nome: 'asc' }],
        }),
        db.categoriaCantina.findMany({
            where: { ativa: true },
            orderBy: { ordem: 'asc' },
        }),
    ])

    // Agrupar por categoria
    const porCategoria = categorias.map(cat => ({
        ...cat,
        produtos: produtos.filter(p => p.categoria_id === cat.id),
    }))
    const semCategoria = produtos.filter(p => !p.categoria_id)

    return (
        <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 space-y-10 pb-24 animate-in fade-in duration-700">
            <header className="text-center space-y-4 pb-8 border-b border-soft">
                <span className="text-figueira font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                    <Coffee size={14} /> Menu Cantina
                </span>
                <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-fg leading-none">
                    O que temos <span className="text-muted/20">hoje.</span>
                </h1>
            </header>

            {porCategoria.filter(c => c.produtos.length > 0).map(cat => (
                <section key={cat.id} className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-widest text-fg flex items-center gap-3">
                        <Package size={16} className="text-figueira" /> {cat.nome}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {cat.produtos.map(p => (
                            <div key={p.id} className="bg-bg2 border border-soft rounded-[2rem] p-5 space-y-2 hover:border-figueira/20 transition-all">
                                {p.imagem_url && (
                                    <div className="w-full h-24 rounded-xl bg-soft overflow-hidden mb-2">
                                        <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <h3 className="text-sm font-black uppercase text-fg leading-tight">{p.nome}</h3>
                                <p className="text-lg font-black italic text-figueira">{p.preco.toFixed(2)}€</p>
                                {p.controla_stock && (
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted">
                                        {p.stock > 0 ? `${p.stock} disponivel` : 'Esgotado'}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            ))}

            {semCategoria.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-black uppercase tracking-widest text-fg">Outros</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {semCategoria.map(p => (
                            <div key={p.id} className="bg-bg2 border border-soft rounded-[2rem] p-5 space-y-2">
                                <h3 className="text-sm font-black uppercase text-fg leading-tight">{p.nome}</h3>
                                <p className="text-lg font-black italic text-figueira">{p.preco.toFixed(2)}€</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {produtos.length === 0 && (
                <div className="py-20 text-center">
                    <Coffee size={32} className="mx-auto text-muted/20 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Nenhum produto disponivel de momento</p>
                </div>
            )}
        </main>
    )
}
