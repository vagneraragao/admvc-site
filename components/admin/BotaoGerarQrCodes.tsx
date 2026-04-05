'use client'

import { useState } from 'react'
import { QrCode, Loader2, CheckCircle } from 'lucide-react'
import { gerarQrCodesTodosMembros } from '@/actions/cantina-local-actions'

export default function BotaoGerarQrCodes() {
    const [loading, setLoading] = useState(false)
    const [resultado, setResultado] = useState<{ count: number } | null>(null)

    async function handleGerar() {
        if (!confirm('Isto vai gerar QR Code para todos os membros que ainda nao tem. Continuar?')) return
        setLoading(true)
        const res = await gerarQrCodesTodosMembros()
        if ('count' in res) {
            setResultado({ count: res.count })
        } else {
            alert(res.error || 'Erro ao gerar.')
        }
        setLoading(false)
    }

    if (resultado) {
        return (
            <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-500">
                <CheckCircle size={12} /> {resultado.count} QR codes gerados
            </span>
        )
    }

    return (
        <button
            onClick={handleGerar}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-bg border border-soft text-fg px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-figueira/30 transition-all active:scale-95 disabled:opacity-50"
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <QrCode size={12} />}
            {loading ? 'A gerar...' : 'Gerar QR para todos'}
        </button>
    )
}
