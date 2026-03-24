'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { alternarConfirmacaoEscala } from '@/actions/membro-actions'

export default function BotoesEscala({ escalaIds, confirmado }: { escalaIds: number[], confirmado: boolean }) {
    const [loading, setLoading] = useState(false);

    async function handleConfirmar(novoStatus: boolean) {
        setLoading(true);
        await alternarConfirmacaoEscala(escalaIds, novoStatus);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-4 mt-2">
                <Loader2 className="animate-spin text-figueira" size={20} />
            </div>
        )
    }

    if (confirmado) {
        return (
            <div className="mt-4 flex flex-col gap-2 animate-in fade-in duration-300">
                <div className="bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest py-3 rounded-xl text-center border border-green-500/20 flex items-center justify-center gap-2">
                    <Check size={16} /> Presença Confirmada
                </div>
                <button
                    onClick={() => handleConfirmar(false)}
                    className="text-[8px] font-bold text-muted hover:text-red-500 transition-colors text-center uppercase tracking-widest"
                >
                    Cancelar Confirmação
                </button>
            </div>
        )
    }

    return (
        <div className="mt-4 animate-in fade-in duration-300">
            <button
                onClick={() => handleConfirmar(true)}
                className="w-full py-3 text-[10px] font-black uppercase tracking-widest rounded-xl bg-fg text-bg hover:bg-figueira transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
                <Check size={16} /> Confirmar Presença
            </button>
        </div>
    )
}