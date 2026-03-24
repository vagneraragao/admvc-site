'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
    Receipt, X, ShoppingBag, Loader2, Coffee, ChevronDown, EyeOff
} from 'lucide-react'
import { getHistoricoComprasLoyverse } from '@/actions/financeiro-actions'

export default function ModalHistoricoCantina({ loyverseId }: { loyverseId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [recibos, setRecibos] = useState<any[]>([])
    const [mounted, setMounted] = useState(false)

    // Garante que o portal só renderiza no cliente (evita erro de SSR)
    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    const abrirHistorico = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsOpen(true)
        if (recibos.length === 0) fetchDados()
    }

    const fetchDados = async () => {
        setLoading(true)
        const res = await getHistoricoComprasLoyverse(loyverseId)
        if (res.receipts) setRecibos(res.receipts)
        setLoading(false)
    }

    const euro = (v: number) =>
        new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(Math.abs(v))

    // ========================================================================
    // LÓGICA DE AGRUPAMENTO POR MÊS E ANO COM CÁLCULO DE TOTAL
    // ========================================================================
    const recibosAgrupados = useMemo(() => {
        const grupos: { [key: string]: { recibos: any[], total: number } } = {}

        recibos.forEach((recibo) => {
            const data = new Date(recibo.created_at)
            // Gera algo como "março de 2026"
            const mesAnoCru = data.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })
            // Capitaliza a primeira letra: "Março 2026"
            const mesAno = mesAnoCru.charAt(0).toUpperCase() + mesAnoCru.slice(1).replace(' de ', ' ')

            if (!grupos[mesAno]) {
                grupos[mesAno] = { recibos: [], total: 0 }
            }
            grupos[mesAno].recibos.push(recibo)
            grupos[mesAno].total += Math.abs(recibo.total_money || 0)
        })

        return grupos
    }, [recibos])

    // --- CONTEÚDO DO MODAL (SERÁ TELETRANSPORTADO PELO PORTAL) ---
    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
            }}
        >
            <div
                className="bg-bg w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-soft flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="p-8 border-b border-soft flex justify-between items-center bg-bg2 relative shrink-0">
                    <div className="space-y-1">
                        <span className="text-figueira font-black text-[9px] uppercase tracking-[0.3em]">Extrato de Consumo</span>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Cantina <span className="text-muted/20">ADMVC.</span></h3>
                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5 pt-1">
                            <EyeOff size={11} /> Clique na compra para ver detalhes
                        </p>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-4 bg-soft text-fg rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* LISTA DE COMPRAS AGRUPADA POR MÊS */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide relative">
                    {loading && recibos.length === 0 ? (
                        <div className="flex flex-col items-center py-24 gap-4">
                            <Loader2 size={32} className="animate-spin text-figueira" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted">A ler terminal...</p>
                        </div>
                    ) : recibos.length === 0 ? (
                        <div className="flex flex-col items-center py-24 opacity-20">
                            <ShoppingBag size={48} />
                            <p className="text-xs font-bold uppercase mt-4">Sem consumo registado</p>
                        </div>
                    ) : (
                        // RENDERIZAÇÃO DOS GRUPOS
                        Object.entries(recibosAgrupados).map(([mesAno, dados]) => (
                            <div key={mesAno} className="space-y-4">
                                {/* Cabeçalho do Mês (Sticky) */}
                                <div className="sticky top-0 -mx-2 px-2 py-2 bg-bg/90 backdrop-blur-md z-10 flex justify-between items-end border-b border-soft/50">
                                    <h4 className="text-[10px] font-black uppercase text-fg tracking-[0.2em]">
                                        {mesAno}
                                    </h4>
                                    <span className="text-[9px] font-bold uppercase text-muted tracking-widest">
                                        Total: <span className="text-figueira italic font-black">{euro(dados.total)}</span>
                                    </span>
                                </div>

                                {/* Lista de recibos deste mês */}
                                <div className="grid gap-3">
                                    {dados.recibos.map((r) => (
                                        <ReciboItem key={r.id} recibo={r} euro={euro} />
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-8 bg-soft/30 border-t border-soft text-center shrink-0">
                    <p className="text-[9px] font-bold text-muted uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <Coffee size={12} className="text-figueira" /> Bom apetite, ADMVC
                    </p>
                </div>
            </div>
        </div>
    )

    return (
        <>
            {/* O BOTÃO QUE FICA DENTRO DO CARD */}
            <button
                type="button"
                onClick={abrirHistorico}
                className="relative z-30 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2.5 rounded-xl hover:bg-white hover:text-fg transition-all active:scale-95 border border-white/5"
            >
                <Receipt size={14} /> Histórico
            </button>

            {/* O PORTAL SÓ RENDERIZA SE ESTIVER MONTADO E ABERTO */}
            {mounted && isOpen && createPortal(modalContent, document.body)}
        </>
    )
}

// ============================================================================
// COMPONENTE INTERATIVO: ITEM DO RECIBO (ACORDEÃO)
// ============================================================================
function ReciboItem({ recibo, euro }: { recibo: any, euro: (v: number) => string }) {
    const [isExpanded, setIsExpanded] = useState(false)

    const dataValida = recibo?.created_at ? new Date(recibo.created_at) : new Date()
    const dia = dataValida.getDate().toString().padStart(2, '0')
    const mes = dataValida.toLocaleString('pt-PT', { month: 'short' }).replace('.', '')
    const hora = dataValida.getHours().toString().padStart(2, '0')
    const min = dataValida.getMinutes().toString().padStart(2, '0')

    const itens = recibo?.line_items || []

    return (
        <div className="bg-bg2 border border-soft rounded-3xl relative overflow-hidden transition-all hover:border-figueira/30 shadow-sm">

            <button
                onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                }}
                className="w-full text-left flex justify-between items-center p-5 hover:bg-soft/50 transition-colors active:scale-[0.99] gap-4"
            >
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center bg-bg border border-soft w-12 h-12 rounded-2xl shrink-0">
                        <span className="text-sm font-black text-fg leading-none">{dia}</span>
                        <span className="text-[8px] font-black uppercase text-figueira mt-0.5">{mes}</span>
                    </div>

                    <div className="space-y-0.5">
                        <h4 className="text-xs font-black uppercase tracking-tight text-fg flex items-center gap-2">
                            Compra Cantina
                            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown size={14} className={isExpanded ? "text-figueira" : "text-muted"} />
                            </div>
                        </h4>
                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-1.5">
                            Doc: #{recibo.receipt_number} <span className="opacity-40">|</span> {hora}:{min}
                        </p>
                    </div>
                </div>

                <div className="text-right shrink-0">
                    <p className="text-base font-black italic text-fg leading-none">{euro(recibo.total_money)}</p>
                    <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-md">Pago</span>
                </div>
            </button>

            {isExpanded && (
                <div className="border-t border-soft/50 bg-bg p-6 pt-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="space-y-3">
                        <p className="text-[9px] font-black uppercase text-muted tracking-[0.2em] mb-3 border-b border-soft pb-2">Itens Consumidos:</p>

                        {itens.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center group/item">
                                <div className="flex items-center gap-3">
                                    <div className="w-1 h-1 rounded-full bg-soft group-hover/item:bg-figueira transition-colors"></div>
                                    <span className="text-[11px] font-bold text-fg uppercase tracking-tight leading-tight">
                                        <span className="text-muted mr-3 font-mono">{item.quantity}x</span> {item.item_name}
                                    </span>
                                </div>
                                <span className="text-[11px] font-black text-fg shrink-0 ml-4 font-mono">{euro(item.total_money)}</span>
                            </div>
                        ))}

                        <div className="flex justify-between items-center pt-4 border-t border-dashed border-soft mt-4">
                            <span className="text-[10px] font-black uppercase text-muted">Total Pago</span>
                            <span className="text-lg font-black italic text-fg">{euro(recibo.total_money)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}