'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { eliminarCategoria } from '@/actions/cantina-local-actions'
import { useConfirm } from '@/components/ui/ConfirmDialog'

interface Props {
    categoriaId: number
}

export default function BotaoEliminarCategoria({ categoriaId }: Props) {
    const [loading, setLoading] = useState(false)
    const confirmar = useConfirm()

    async function handleDelete() {
        if (!await confirmar({ mensagem: 'Eliminar esta categoria? Produtos associados ficarao sem categoria.', tipo: 'perigo' })) return
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
