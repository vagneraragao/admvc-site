'use client'

import { useState, useMemo } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Search, User, CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { registarVenda, obterSaldoMembro } from '@/actions/cantina-local-actions'

interface Produto {
    id: number
    nome: string
    preco: number
    stock: number
    controla_stock: boolean
    categoria: { id: number; nome: string } | null
}

interface Categoria {
    id: number
    nome: string
}

interface Membro {
    id: number
    first_name: string
    last_name: string
}

interface CartItem {
    produtoId: number
    nome: string
    preco: number
    quantidade: number
    stock: number
    controla_stock: boolean
}

interface Props {
    produtos: Produto[]
    categorias: Categoria[]
    membros: Membro[]
}

export default function POSClient({ produtos, categorias, membros }: Props) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedMembro, setSelectedMembro] = useState<Membro | null>(null)
    const [membroBusca, setMembroBusca] = useState('')
    const [membroDropdownOpen, setMembroDropdownOpen] = useState(false)
    const [saldo, setSaldo] = useState<number | null>(null)
    const [categoriaAtiva, setCategoriaAtiva] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingSaldo, setLoadingSaldo] = useState(false)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

    const total = cart.reduce((sum, item) => sum + item.preco * item.quantidade, 0)
    const saldoRestante = saldo !== null ? saldo - total : null

    // Filter products by category
    const produtosFiltrados = categoriaAtiva
        ? produtos.filter(p => p.categoria?.id === categoriaAtiva)
        : produtos

    // Filter members by search
    const membrosFiltrados = useMemo(() => {
        if (!membroBusca.trim()) return membros.slice(0, 8)
        const q = membroBusca.toLowerCase()
        return membros.filter(m =>
            `${m.first_name} ${m.last_name}`.toLowerCase().includes(q)
        ).slice(0, 8)
    }, [membroBusca, membros])

    async function selecionarMembro(membro: Membro) {
        setSelectedMembro(membro)
        setMembroBusca('')
        setMembroDropdownOpen(false)
        setLoadingSaldo(true)
        try {
            const s = await obterSaldoMembro(membro.id)
            setSaldo(s)
        } catch {
            setSaldo(0)
        } finally {
            setLoadingSaldo(false)
        }
    }

    function addToCart(produto: Produto) {
        setCart(prev => {
            const existing = prev.find(i => i.produtoId === produto.id)
            if (existing) {
                if (produto.controla_stock && existing.quantidade >= produto.stock) return prev
                return prev.map(i =>
                    i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i
                )
            }
            if (produto.controla_stock && produto.stock <= 0) return prev
            return [...prev, {
                produtoId: produto.id,
                nome: produto.nome,
                preco: produto.preco,
                quantidade: 1,
                stock: produto.stock,
                controla_stock: produto.controla_stock,
            }]
        })
    }

    function updateQty(produtoId: number, delta: number) {
        setCart(prev => prev.map(item => {
            if (item.produtoId !== produtoId) return item
            const newQty = item.quantidade + delta
            if (newQty <= 0) return item
            if (item.controla_stock && newQty > item.stock) return item
            return { ...item, quantidade: newQty }
        }))
    }

    function removeItem(produtoId: number) {
        setCart(prev => prev.filter(i => i.produtoId !== produtoId))
    }

    async function confirmarVenda() {
        if (!selectedMembro || cart.length === 0) return
        setLoading(true)
        setFeedback(null)
        try {
            const itens = cart.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade }))
            const result = await registarVenda(selectedMembro.id, itens)
            if (result?.error) {
                setFeedback({ type: 'error', msg: result.error })
            } else {
                setFeedback({ type: 'success', msg: 'Venda registada com sucesso!' })
                setCart([])
                // Refresh saldo
                const s = await obterSaldoMembro(selectedMembro.id)
                setSaldo(s)
            }
        } catch {
            setFeedback({ type: 'error', msg: 'Erro ao registar venda.' })
        } finally {
            setLoading(false)
            setTimeout(() => setFeedback(null), 4000)
        }
    }

    const cartCount = cart.reduce((sum, i) => sum + i.quantidade, 0)

    return (
        <div className="min-h-screen bg-bg p-4 lg:p-6">
            {/* Feedback toast */}
            {feedback && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all ${feedback.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {feedback.msg}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 max-w-[1600px] mx-auto">
                {/* LEFT SIDE - Products */}
                <div className="flex-1 lg:w-2/3 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <CreditCard size={20} className="text-figueira" />
                        <h1 className="text-lg font-black uppercase tracking-widest text-fg">Ponto de Venda</h1>
                    </div>

                    {/* Category tabs */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setCategoriaAtiva(null)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!categoriaAtiva ? 'bg-fg text-bg shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-fg'}`}
                        >
                            Todos
                        </button>
                        {categorias.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setCategoriaAtiva(cat.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${categoriaAtiva === cat.id ? 'bg-figueira text-bg shadow-md' : 'bg-bg2 border border-soft text-muted hover:border-figueira'}`}
                            >
                                {cat.nome}
                            </button>
                        ))}
                    </div>

                    {/* Product grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                        {produtosFiltrados.map(produto => {
                            const inCart = cart.find(i => i.produtoId === produto.id)
                            const esgotado = produto.controla_stock && produto.stock <= 0
                            return (
                                <button
                                    key={produto.id}
                                    onClick={() => !esgotado && addToCart(produto)}
                                    disabled={esgotado}
                                    className={`relative bg-bg2 border rounded-2xl p-4 text-left transition-all ${esgotado ? 'border-soft opacity-40 cursor-not-allowed' : 'border-soft hover:border-figueira hover:shadow-lg cursor-pointer'} ${inCart ? 'border-figueira/50 ring-1 ring-figueira/20' : ''}`}
                                >
                                    {inCart && (
                                        <span className="absolute top-2 right-2 bg-figueira text-bg text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                            {inCart.quantidade}
                                        </span>
                                    )}
                                    <p className="text-xs font-bold text-fg truncate">{produto.nome}</p>
                                    <p className="text-sm font-black text-figueira mt-1">{produto.preco.toFixed(2)}€</p>
                                    {produto.controla_stock && (
                                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${produto.stock <= 3 ? 'text-red-400' : 'text-muted2'}`}>
                                            Stock: {produto.stock}
                                        </p>
                                    )}
                                </button>
                            )
                        })}
                        {produtosFiltrados.length === 0 && (
                            <div className="col-span-full py-12 text-center text-muted text-xs">
                                Nenhum produto disponivel nesta categoria.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE - Cart */}
                <div className="lg:w-1/3 lg:max-w-[400px]">
                    <div className="bg-bg2 border border-soft rounded-[2rem] p-5 space-y-4 lg:sticky lg:top-6">
                        {/* Member selector */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                                <User size={12} /> Membro
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
                                <input
                                    type="text"
                                    placeholder={selectedMembro ? `${selectedMembro.first_name} ${selectedMembro.last_name}` : 'Pesquisar membro...'}
                                    value={membroBusca}
                                    onChange={e => { setMembroBusca(e.target.value); setMembroDropdownOpen(true) }}
                                    onFocus={() => setMembroDropdownOpen(true)}
                                    className="w-full bg-bg border border-soft rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-fg outline-none focus:border-figueira transition-colors"
                                />
                                {membroDropdownOpen && membrosFiltrados.length > 0 && (
                                    <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-bg2 border border-soft rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                        {membrosFiltrados.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => selecionarMembro(m)}
                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-fg hover:bg-soft/30 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                            >
                                                {m.first_name} {m.last_name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedMembro && (
                                <div className="flex items-center justify-between bg-bg rounded-xl px-3 py-2 border border-soft">
                                    <span className="text-[10px] font-bold text-fg">{selectedMembro.first_name} {selectedMembro.last_name}</span>
                                    <span className="text-[10px] font-black text-figueira">
                                        {loadingSaldo ? <Loader2 size={12} className="animate-spin" /> : `${(saldo ?? 0).toFixed(2)}€`}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-soft" />

                        {/* Cart header */}
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                                <ShoppingCart size={12} /> Carrinho
                            </span>
                            {cartCount > 0 && (
                                <span className="text-[9px] font-black text-figueira bg-figueira/10 px-2 py-0.5 rounded-full">
                                    {cartCount} {cartCount === 1 ? 'item' : 'itens'}
                                </span>
                            )}
                        </div>

                        {/* Cart items */}
                        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                            {cart.length === 0 ? (
                                <p className="text-xs text-muted2 text-center py-6">Carrinho vazio</p>
                            ) : (
                                cart.map(item => (
                                    <div key={item.produtoId} className="flex items-center gap-2 bg-bg rounded-xl px-3 py-2 border border-soft">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-fg truncate">{item.nome}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => updateQty(item.produtoId, -1)} className="w-6 h-6 rounded-lg bg-soft/30 flex items-center justify-center text-muted hover:text-fg transition-colors">
                                                <Minus size={12} />
                                            </button>
                                            <span className="text-[11px] font-black text-fg w-6 text-center">{item.quantidade}</span>
                                            <button onClick={() => updateQty(item.produtoId, 1)} className="w-6 h-6 rounded-lg bg-soft/30 flex items-center justify-center text-muted hover:text-fg transition-colors">
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <span className="text-[11px] font-black text-figueira w-14 text-right">
                                            {(item.preco * item.quantidade).toFixed(2)}€
                                        </span>
                                        <button onClick={() => removeItem(item.produtoId)} className="text-muted2 hover:text-red-400 transition-colors ml-1">
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Totals */}
                        {cart.length > 0 && (
                            <>
                                <div className="border-t border-soft" />
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted font-bold">Total</span>
                                        <span className="font-black text-fg">{total.toFixed(2)}€</span>
                                    </div>
                                    {selectedMembro && saldo !== null && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted font-bold">Saldo restante</span>
                                            <span className={`font-black ${saldoRestante !== null && saldoRestante < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {saldoRestante !== null ? `${saldoRestante.toFixed(2)}€` : '—'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Confirm button */}
                        <button
                            onClick={confirmarVenda}
                            disabled={loading || cart.length === 0 || !selectedMembro || (saldoRestante !== null && saldoRestante < 0)}
                            className="w-full bg-figueira text-bg font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <><Loader2 size={14} className="animate-spin" /> A processar...</>
                            ) : (
                                <><CreditCard size={14} /> Confirmar Venda</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
