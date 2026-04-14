'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Coffee, Maximize, Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface Produto {
    id: number
    nome: string
    preco: number
    imagem_url: string | null
    promocoes: any
    categoria: { id: number; nome: string } | null
}

interface Props {
    produtos: Produto[]
    categorias: { id: number; nome: string }[]
}

export default function CantinaTV({ produtos, categorias }: Props) {
    const [paginaAtual, setPaginaAtual] = useState(0)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // Produtos com promocao = destaques
    const destaques = produtos.filter(p => p.promocoes && Array.isArray(p.promocoes) && (p.promocoes as any[]).length > 0)
    // Se nao ha promocoes, pegar os 6 mais caros como destaque
    const produtosDestaque = destaques.length > 0
        ? destaques
        : [...produtos].sort((a, b) => b.preco - a.preco).slice(0, 6)

    // Agrupar por categoria para as paginas
    const porCategoria = categorias
        .map(cat => ({
            ...cat,
            produtos: produtos.filter(p => p.categoria?.id === cat.id),
        }))
        .filter(c => c.produtos.length > 0)

    // Paginas: cada categoria e uma pagina
    const paginas = porCategoria.length > 0 ? porCategoria : [{ id: 0, nome: 'Produtos', produtos }]
    const totalPaginas = paginas.length

    // Auto-scroll entre paginas
    useEffect(() => {
        if (totalPaginas <= 1) return

        timerRef.current = setInterval(() => {
            setPaginaAtual(prev => (prev + 1) % totalPaginas)
        }, 8000) // 8 segundos por pagina

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [totalPaginas])

    // Reset timer ao mudar pagina manualmente
    const irParaPagina = useCallback((idx: number) => {
        setPaginaAtual(idx)
        if (timerRef.current) clearInterval(timerRef.current)
        timerRef.current = setInterval(() => {
            setPaginaAtual(prev => (prev + 1) % totalPaginas)
        }, 8000)
    }, [totalPaginas])

    // Fullscreen API
    async function toggleFullscreen() {
        if (!containerRef.current) return
        if (!document.fullscreenElement) {
            await containerRef.current.requestFullscreen()
            setIsFullscreen(true)
        } else {
            await document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    useEffect(() => {
        function onFsChange() {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', onFsChange)
        return () => document.removeEventListener('fullscreenchange', onFsChange)
    }, [])

    const paginaActual = paginas[paginaAtual] || paginas[0]

    // Auto-reload a cada 5 minutos para actualizar produtos
    useEffect(() => {
        const reload = setInterval(() => window.location.reload(), 5 * 60 * 1000)
        return () => clearInterval(reload)
    }, [])

    return (
        <div ref={containerRef} className="fixed inset-0 z-[99999] w-screen h-screen bg-[#0a0a0a] text-white overflow-hidden flex flex-col select-none cursor-default">
            {/* ── HEADER ─────────────────────────────────── */}
            <div className="bg-[#111] border-b border-white/5 px-8 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-figueira flex items-center justify-center">
                        <Coffee size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-[0.2em]">Cantina</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-figueira">Menu do Dia</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Indicadores de pagina */}
                    <div className="flex items-center gap-2">
                        {paginas.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => irParaPagina(idx)}
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    idx === paginaAtual ? 'w-8 bg-figueira' : 'w-2 bg-white/20 hover:bg-white/40'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Botao fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl hover:bg-figueira transition-all"
                        title="Tela cheia"
                    >
                        <Maximize size={18} />
                    </button>
                </div>
            </div>

            {/* ── CONTEUDO PRINCIPAL — GRID DE PRODUTOS ─── */}
            <div className="flex-1 overflow-hidden relative">
                {/* Titulo da categoria */}
                <div className="px-8 pt-6 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {totalPaginas > 1 && (
                            <button
                                onClick={() => irParaPagina((paginaAtual - 1 + totalPaginas) % totalPaginas)}
                                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-lg font-black uppercase tracking-[0.3em] text-figueira">
                            {paginaActual.nome}
                        </h2>
                        {totalPaginas > 1 && (
                            <button
                                onClick={() => irParaPagina((paginaAtual + 1) % totalPaginas)}
                                className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-all"
                            >
                                <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                    <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
                        {paginaActual.produtos.length} produtos
                    </span>
                </div>

                {/* Grid de produtos */}
                <div className="px-8 pb-4 overflow-y-auto h-[calc(100%-80px)]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                        {paginaActual.produtos.map(p => {
                            const temPromocao = p.promocoes && Array.isArray(p.promocoes) && (p.promocoes as any[]).length > 0
                            const promo = temPromocao ? (p.promocoes as any[])[0] : null

                            return (
                                <div
                                    key={p.id}
                                    className={`rounded-2xl p-4 space-y-2 transition-all ${
                                        temPromocao
                                            ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-2 border-amber-500/30 ring-1 ring-amber-500/10'
                                            : 'bg-[#161616] border border-white/5 hover:border-white/10'
                                    }`}
                                >
                                    {p.imagem_url && (
                                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-black/50">
                                            <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <h3 className="text-sm font-black uppercase text-white leading-tight">{p.nome}</h3>
                                    <div className="flex items-end gap-2">
                                        <p className="text-2xl font-black italic text-figueira">{p.preco.toFixed(2)}€</p>
                                        {promo && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-amber-500 text-black mb-1">
                                                {promo.quantidade}x {promo.preco_total?.toFixed(2)}€
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {produtos.length === 0 && (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4">
                                <Coffee size={64} className="mx-auto text-white/10" />
                                <p className="text-lg font-black uppercase tracking-widest text-white/20">Nenhum produto disponivel</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── BARRA INFERIOR — DESTAQUES ─────────────── */}
            {produtosDestaque.length > 0 && (
                <div className="bg-[#111] border-t border-white/5 px-6 py-3 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Star size={12} className="text-amber-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500">
                            {destaques.length > 0 ? 'Promocoes' : 'Destaques'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                        {produtosDestaque.map(p => {
                            const temPromocao = p.promocoes && Array.isArray(p.promocoes) && (p.promocoes as any[]).length > 0
                            const promo = temPromocao ? (p.promocoes as any[])[0] : null

                            return (
                                <div
                                    key={p.id}
                                    className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-xl px-4 py-2.5 shrink-0 min-w-[200px]"
                                >
                                    {p.imagem_url && (
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/50 shrink-0">
                                            <img src={p.imagem_url} alt={p.nome} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-black uppercase text-white truncate">{p.nome}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-black italic text-figueira">{p.preco.toFixed(2)}€</span>
                                            {promo && (
                                                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black">
                                                    {promo.quantidade}x {promo.preco_total?.toFixed(2)}€
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── BARRA DE PROGRESSO DO AUTO-SCROLL ──────── */}
            {totalPaginas > 1 && (
                <div className="h-1 bg-black shrink-0">
                    <div
                        className="h-full bg-figueira transition-all"
                        style={{
                            width: `${((paginaAtual + 1) / totalPaginas) * 100}%`,
                            transition: 'width 0.5s ease',
                        }}
                    />
                </div>
            )}
        </div>
    )
}
