'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { confirmarDonativo } from '@/actions/donativo-actions'

export default function BotaoConfirmarDonativo({ donativoId }: { donativoId: number }) {
    const [loading, setLoading] = useState(false)

    async function handleConfirmar() {
        if (!confirm('Confirmar este donativo? O valor sera adicionado ao fundo correspondente.')) return
        setLoading(true)
        const res = await confirmarDonativo(donativoId)
        if (!res.ok) {
            alert(res.error || 'Erro ao confirmar donativo.')
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleConfirmar}
            disabled={loading}
            className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {loading ? '...' : 'Confirmar'}
        </button>
    )
}
