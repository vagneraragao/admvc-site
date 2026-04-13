'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Euro } from 'lucide-react'
import { aprovarSaldoCantinaAction } from '@/actions/financeiro-actions'
import { useConfirm } from '@/components/ui/ConfirmDialog'

export default function BotaoAprovarCantina({
    pedidoId,
    loyverseId,
    valor,
    nomeMembro
}: {
    pedidoId: number,
    loyverseId: string | null,
    valor: number,
    nomeMembro: string
}) {
    const [loading, setLoading] = useState(false)
    const confirmar = useConfirm()

    async function handleAprovar() {
        if (!await confirmar({ mensagem: `Aprovar o carregamento de €${valor} para ${nomeMembro}?`, tipo: 'info' })) return

        setLoading(true)

        // 🛡️ Filtro de segurança absoluto contra a string "null"
        const safeLoyverseId = (loyverseId && loyverseId !== 'null' && loyverseId !== 'undefined') ? loyverseId : null;

        const res = await aprovarSaldoCantinaAction(pedidoId, safeLoyverseId, valor)

        if (!res.ok) {
            alert(`❌ Erro ao aprovar: ${res.error}`)
        }

        setLoading(false)
    }

    return (
        <button
            onClick={handleAprovar}
            disabled={loading}
            className="bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm active:scale-95"
            title={`Aprovar €${valor} para ${nomeMembro}`}
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            {loading ? 'A Aprovar...' : 'Aprovar Pedido'}
        </button>
    )
}