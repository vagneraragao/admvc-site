'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { eliminarCategoria } from '@/actions/cantina-local-actions'

interface Props {
    categoriaId: number
}

export default function BotaoEliminarCategoria({ categoriaId }: Props) {
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm('Eliminar esta categoria? Produtos associados ficarao sem categoria.')) return
        setLoading(true)
        const res = await eliminarCategoria(categoriaId)
        if (res?.error) alert(res.error)
        setLoading(false)
    }

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
            title="Eliminar categoria"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
    )
}
