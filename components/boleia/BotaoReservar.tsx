'use client'

import { useState } from 'react'
import { reservarBoleia } from '@/actions/boleia-actions'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/ConfirmDialog'

export default function BotaoReservar({ ofertaId }: { ofertaId: number }) {
    const toast = useToast()
    const [loading, setLoading] = useState(false)

    async function handleReservar() {
        setLoading(true)
        const res = await reservarBoleia(ofertaId)
        if (res.error) {
            toast(res.error, 'erro')
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleReservar}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-figueira text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-figueira/90 transition-all active:scale-95 disabled:opacity-50"
        >
            {loading ? <Loader2 size={12} className="animate-spin" /> : null}
            {loading ? 'A reservar...' : 'Reservar Lugar'}
        </button>
    )
}
