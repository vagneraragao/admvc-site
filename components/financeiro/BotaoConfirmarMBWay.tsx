'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { confirmarMBWayCarneAction } from '@/app/financeiro/actions'

interface Props {
    lancamentoId: number
    membroId: number
    valor: number
}

export default function BotaoConfirmarMBWay({ lancamentoId, membroId, valor }: Props) {
    const [loading, setLoading] = useState(false)

    async function confirmar() {
        // Mensagem corrigida: foca apenas no carnê
        if (!confirm(`Confirmar o recebimento exato de ${valor}€ via MB Way para este carnê?`)) return

        setLoading(true)

        // Chama a Server Action diretamente
        const res = await confirmarMBWayCarneAction(lancamentoId)

        if (res?.error) {
            alert('Erro: ' + res.error)
        }

        // Se der sucesso, a Action já faz o revalidatePath, 
        // então o Next.js atualiza a tela automaticamente!
        setLoading(false)
    }

    return (
        <button
            onClick={confirmar}
            disabled={loading}
            className="bg-fg text-bg px-5 py-3 rounded-xl font-black text-[9px] uppercase hover:bg-green-600 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50"
            title="Validar Pagamento"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Confirmar
        </button>
    )
}