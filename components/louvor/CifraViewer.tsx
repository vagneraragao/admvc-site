'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Plus, Minus, Play, Pause, Hash, X, Settings2 } from 'lucide-react'
import { parseCifra, transporCifra, calcularSemitons, TONS_DISPONIVEIS } from '@/lib/cifra'

interface Props {
    cifra: string
    titulo: string
    artista?: string | null
    tomOriginal?: string | null
    tomTocado?: string
    onClose: () => void
}

export default function CifraViewer({ cifra, titulo, artista, tomOriginal, tomTocado, onClose }: Props) {
    const [semitons, setSemitons] = useState(() => {
        if (tomOriginal && tomTocado) return calcularSemitons(tomOriginal, tomTocado)
        return 0
    })
    const [scrolling, setScrolling] = useState(false)
    const [velocidade, setVelocidade] = useState(1.5)
    const [fontSize, setFontSize] = useState(14)
    const scrollRef = useRef<HTMLDivElement>(null)
    const rafRef = useRef<number | null>(null)

    const cifraTransposta = transporCifra(cifra, semitons)
    const { linhas } = parseCifra(cifraTransposta)

    // Tom atual
    const tomAtual = tomOriginal
        ? TONS_DISPONIVEIS[(TONS_DISPONIVEIS.indexOf(tomOriginal) + semitons + 12) % 12]
        : null

    // Auto-scroll
    const scroll = useCallback(() => {
        if (!scrollRef.current || !scrolling) return
        scrollRef.current.scrollTop += velocidade * 0.5
        rafRef.current = requestAnimationFrame(scroll)
    }, [scrolling, velocidade])

    useEffect(() => {
        if (scrolling) {
            rafRef.current = requestAnimationFrame(scroll)
        }
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }, [scrolling, scroll])

    // Keyboard
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === ' ') { e.preventDefault(); setScrolling(s => !s) }
            if (e.key === 'ArrowUp') setSemitons(s => s - 1)
            if (e.key === 'ArrowDown') setSemitons(s => s + 1)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    return (
        <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col">
            {/* HEADER */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0 border-b border-white/10">
                <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/60 hover:bg-white/20 active:scale-90">
                    <ArrowLeft size={16} />
                </button>

                <div className="text-center flex-1 mx-3">
                    <p className="text-xs font-black uppercase tracking-tighter truncate">{titulo}</p>
                    {artista && <p className="text-[8px] text-white/40 uppercase tracking-widest">{artista}</p>}
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Tom */}
                    {tomAtual && (
                        <div className="flex items-center gap-1 bg-white/10 rounded-xl px-2.5 py-1.5">
                            <Hash size={11} className="text-white/50" />
                            <span className="text-xs font-black">{tomAtual}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-white/5 bg-white/5">
                {/* Transpor */}
                <div className="flex items-center gap-1">
                    <button onClick={() => setSemitons(s => s - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 active:scale-90">
                        <Minus size={14} />
                    </button>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/40 w-8 text-center">
                        {semitons > 0 ? `+${semitons}` : semitons}
                    </span>
                    <button onClick={() => setSemitons(s => s + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/60 hover:bg-white/20 active:scale-90">
                        <Plus size={14} />
                    </button>
                </div>

                {/* Tamanho fonte */}
                <div className="flex items-center gap-1">
                    <button onClick={() => setFontSize(s => Math.max(10, s - 2))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/60 text-[10px] font-black">
                        A-
                    </button>
                    <button onClick={() => setFontSize(s => Math.min(24, s + 2))}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/60 text-[10px] font-black">
                        A+
                    </button>
                </div>

                {/* Auto-scroll */}
                <div className="flex items-center gap-1">
                    {scrolling && (
                        <input type="range" min="0.5" max="5" step="0.5" value={velocidade}
                            onChange={e => setVelocidade(Number(e.target.value))}
                            className="w-16 h-1 accent-emerald-500" />
                    )}
                    <button onClick={() => setScrolling(s => !s)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg active:scale-90 ${scrolling ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                        {scrolling ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                </div>
            </div>

            {/* CIFRA */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                <div className="max-w-2xl mx-auto font-mono whitespace-pre-wrap" style={{ fontSize }}>
                    {linhas.map((segs, i) => (
                        <div key={i} className="min-h-[1.6em] leading-relaxed">
                            {segs.length === 0 && <br />}
                            {segs.map((seg, j) => (
                                seg.tipo === 'acorde' ? (
                                    <span key={j} className="text-emerald-400 font-black" style={{ fontSize: fontSize + 2 }}>
                                        {seg.valor}
                                    </span>
                                ) : (
                                    <span key={j} className="text-white/80">{seg.valor}</span>
                                )
                            ))}
                        </div>
                    ))}
                    {/* Espaço extra para o auto-scroll poder continuar */}
                    <div className="h-[60vh]" />
                </div>
            </div>
        </div>
    )
}
