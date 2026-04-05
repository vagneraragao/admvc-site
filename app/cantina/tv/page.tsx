// app/cantina/tv/page.tsx
// TV Wall — mostra produtos do sistema local em formato fullscreen
import { getDb } from '@/lib/db'
import { Coffee } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CantinaVideoWall() {
    const db = await getDb()

    const [produtos, categorias] = await Promise.all([
        db.produtoCantina.findMany({
            where: {
                disponivel: true,
                OR: [{ controla_stock: false }, { stock: { gt: 0 } }],
            },
            include: { categoria: true },
            orderBy: [{ categoria: { ordem: 'asc' } }, { nome: 'asc' }],
        }),
        db.categoriaCantina.findMany({
            where: { ativa: true },
            orderBy: { ordem: 'asc' },
        }),
    ])

    const porCategoria = categorias.map(cat => ({
        ...cat,
        produtos: produtos.filter(p => p.categoria_id === cat.id),
    })).filter(c => c.produtos.length > 0)

    return (
        <main className="fixed inset-0 z-[99999] w-screen h-screen bg-black text-white overflow-hidden">
            {/* Header */}
            <div className="bg-[#111] border-b border-white/10 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Coffee size={24} className="text-figueira" />
                    <h1 className="text-xl font-black uppercase tracking-widest">Cantina ADMVC</h1>
                </div>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Menu do Dia</p>
            </div>

            {/* Grid de produtos */}
            <div className="p-8 overflow-y-auto h-[calc(100vh-72px)]">
                {porCategoria.map(cat => (
                    <div key={cat.id} className="mb-8">
                        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-figueira mb-4 border-b border-white/10 pb-2">
                            {cat.nome}
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {cat.produtos.map(p => (
                                <div key={p.id} className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 space-y-2">
                                    {p.imagem_url && (
                                        <div className="w-full h-20 rounded-xl overflow-hidden bg-black/50 mb-2">
                                            <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <h3 className="text-sm font-black uppercase text-white leading-tight">{p.nome}</h3>
                                    <p className="text-xl font-black italic text-figueira">{p.preco.toFixed(2)}€</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {produtos.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                            <Coffee size={48} className="mx-auto text-white/20" />
                            <p className="text-sm font-black uppercase tracking-widest text-white/40">Nenhum produto disponivel</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
