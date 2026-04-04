'use client'

import { useState } from 'react'
import { cancelarOfertaBoleia } from '@/actions/boleia-actions'
import { Loader2, Trash2 } from 'lucide-react'

export default function BotaoCancelarOferta({ ofertaId }: { ofertaId: number }) {
    const [loading, setLoading] = useState(false)

    async function handleCancelar() {
        if (!confirm('Tem a certeza que quer cancelar esta boleia? Os passageiros serao notificados.')) return
        setLoading(true)
        const res = await cancelarOfertaBoleia(ofertaId)
        if (res.error) {
            alert(res.error)
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleCancelar}
            disabled={loading}
            className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            {loading ? 'A cancelar...' : 'Cancelar'}
        </button>
    )
}
