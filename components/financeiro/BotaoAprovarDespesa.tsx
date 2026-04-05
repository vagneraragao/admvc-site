'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { aprovarDespesaAction } from '@/actions/fundos-actions'

export default function BotaoAprovarDespesa({ despesaId }: { despesaId: number }) {
    const [loading, setLoading] = useState(false)

    async function handleAprovar() {
        if (!confirm('Aprovar esta despesa?')) return
        setLoading(true)
        const res = await aprovarDespesaAction(despesaId)
        if (!res.ok) {
            alert(res.error || 'Erro ao aprovar despesa.')
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleAprovar}
            disabled={loading}
            className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white px-4 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 active:scale-95"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {loading ? '...' : 'Aprovar'}
        </button>
    )
}
