'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { eliminarItemAssistencia } from '@/actions/assistencia-actions'

export default function BotaoEliminarItem({ itemId, itemNome }: { itemId: number; itemNome: string }) {
    const [loading, setLoading] = useState(false)

    async function handleEliminar() {
        if (!confirm(`Tem certeza que deseja eliminar "${itemNome}"? Esta acao nao pode ser desfeita.`)) {
            return
        }

        setLoading(true)
        const res = await eliminarItemAssistencia(itemId)
        if (res?.error) {
            alert(res.error)
        }
        setLoading(false)
    }

    return (
        <button
            onClick={handleEliminar}
            disabled={loading}
            className="p-2 rounded-xl text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
            title="Eliminar item"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
    )
}
