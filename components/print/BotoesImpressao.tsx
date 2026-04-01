'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Printer, CreditCard, List, Loader2, X } from 'lucide-react'

const PDFDownloadLink = dynamic(
    () => import('@react-pdf/renderer').then(mod => mod.PDFDownloadLink),
    { ssr: false }
)

interface MembroData {
    id: number
    first_name: string
    last_name: string
    email: string
    phone_1?: string | null
    id_city?: string | null
    status?: string | null
    church_role?: string | null
    data_admissao?: Date | string | null
}

export default function BotoesImpressao({ membros, igrejaName }: { membros: MembroData[]; igrejaName?: string }) {
    const [tipo, setTipo] = useState<'cartao' | 'lista' | null>(null)
    const [ready, setReady] = useState(false)

    function handleOpen(t: 'cartao' | 'lista') {
        setTipo(t)
        setReady(false)
        // Small delay to load PDF components
        setTimeout(() => setReady(true), 100)
    }

    return (
        <>
            <div className="flex items-center gap-1.5">
                <button onClick={() => handleOpen('cartao')}
                    className="flex items-center gap-1.5 bg-bg2 border border-soft text-muted px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-fg hover:border-figueira/30 transition-all"
                    title="Imprimir cartoes">
                    <CreditCard size={12} /> Cartoes
                </button>
                <button onClick={() => handleOpen('lista')}
                    className="flex items-center gap-1.5 bg-bg2 border border-soft text-muted px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:text-fg hover:border-figueira/30 transition-all"
                    title="Imprimir lista">
                    <List size={12} /> Lista PDF
                </button>
            </div>

            {tipo && ready && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-bg border border-soft rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Printer size={16} className="text-figueira" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-fg">
                                    {tipo === 'cartao' ? 'Cartoes de Membro' : 'Lista de Membros'}
                                </h3>
                            </div>
                            <button onClick={() => setTipo(null)} className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-soft transition-all">
                                <X size={16} />
                            </button>
                        </div>

                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                            {membros.length} membro{membros.length !== 1 ? 's' : ''} selecionado{membros.length !== 1 ? 's' : ''}
                        </p>

                        <PDFDownloadLink
                            document={
                                tipo === 'cartao'
                                    ? <CartaoMembroPDFLazy membros={membros.map(m => ({ ...m, data_admissao: m.data_admissao ? String(m.data_admissao) : null }))} igrejaName={igrejaName} />
                                    : <ListaMembrosPDFLazy membros={membros} igrejaName={igrejaName} />
                            }
                            fileName={tipo === 'cartao' ? 'cartoes-membros.pdf' : 'lista-membros.pdf'}
                        >
                            {({ loading }) => (
                                <button
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-fg text-bg py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-figueira transition-all disabled:opacity-50"
                                >
                                    {loading ? <><Loader2 size={14} className="animate-spin" /> A gerar PDF...</> : <><Printer size={14} /> Descarregar PDF</>}
                                </button>
                            )}
                        </PDFDownloadLink>
                    </div>
                </div>
            )}
        </>
    )
}

// Lazy-loaded PDF document components
const CartaoMembroPDFLazy = dynamic(() => import('./CartaoMembroPDF'), { ssr: false }) as any
const ListaMembrosPDFLazy = dynamic(() => import('./ListaMembrosPDF'), { ssr: false }) as any
