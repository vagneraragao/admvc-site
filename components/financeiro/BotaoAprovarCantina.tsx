'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { aprovarSaldoCantinaAction } from '@/actions/financeiro-actions'

interface Pedido {
    id: number
    loyverse_id?: string | null
    valor: number
    membro: {
        first_name: string
        last_name: string
    }
}

interface BotaoAprovarProps {
    pedidos: Pedido[]
}

export default function BotaoAprovarCantina({ pedidos }: BotaoAprovarProps) {
    const [loading, setLoading] = useState(false)

    async function handleAprovar() {
        if (!confirm(`Aprovar ${pedidos.length} pedido(s) de carregamento pendente(s)?`)) return

        setLoading(true)

        for (const pedido of pedidos) {
            const res = await aprovarSaldoCantinaAction(pedido.id, pedido.loyverse_id ?? null, pedido.valor)

            if (res.ok) {
                console.log(`✅ Carregamento de €${pedido.valor} aprovado para ${pedido.membro.first_name}.`)
            } else {
                alert(`❌ Erro ao aprovar pedido #${pedido.id}: ${res.error}`)
            }
        }

        setLoading(false)
    }

    return (
        <button
            onClick={handleAprovar}
            disabled={loading}
            className="bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm active:scale-95"
            title="Aprovar todos e enviar para o Loyverse"
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
        </button>
    )
}