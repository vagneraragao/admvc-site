'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { aprovarSaldoCantinaAction } from '@/app/financeiro/actions'

interface BotaoAprovarProps {
    pedidoId: number;
    loyverseId: string | null;
    valor: number;
}

export default function BotaoAprovarCantina({ pedidoId, loyverseId, valor }: BotaoAprovarProps) {
    const [loading, setLoading] = useState(false)

    async function handleAprovar() {
        setLoading(true)

        // Chama a ação no servidor
        const res = await aprovarSaldoCantinaAction(pedidoId, loyverseId, valor)

        if (res.ok) {
            alert(`✅ Sucesso! O carregamento de €${valor} foi aprovado e o saldo enviado para o Loyverse.`)
        } else {
            alert(`❌ Erro: ${res.error}`)
        }

        setLoading(false)
    }

    return (
        <button
            onClick={handleAprovar}
            disabled={loading}
            className="bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-sm active:scale-95"
            title="Aprovar e enviar para o Loyverse"
        >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
        </button>
    )
}