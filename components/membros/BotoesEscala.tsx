'use client'

import { useState } from 'react'
import { Check, Loader2, XCircle } from 'lucide-react'
import { alternarConfirmacaoEscala } from '@/actions/membro-actions'

export default function BotoesEscala({ escalaIds, confirmado, colapsado }: { escalaIds: number[], confirmado: boolean, colapsado?: boolean }) {
    const [loading, setLoading] = useState(false);

    async function handleConfirmar(novoStatus: boolean) {
        setLoading(true);
        await alternarConfirmacaoEscala(escalaIds, novoStatus);
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex justify-center py-2">
                <Loader2 className="animate-spin text-figueira" size={16} />
            </div>
        )
    }

    if (confirmado) {
        return (
            <div className="flex flex-col items-center gap-1 animate-in fade-in duration-300">
                <div className="w-full bg-green-500 text-white text-[9px] font-black uppercase tracking-widest py-2 rounded-xl text-center flex items-center justify-center gap-2 shadow-sm">
                    <Check size={12} strokeWidth={4} /> Confirmado
                </div>
                <button
                    onClick={() => handleConfirmar(false)}
                    className="text-[7px] font-bold text-muted hover:text-red-500 transition-colors uppercase tracking-widest pt-1"
                >
                    Cancelar
                </button>
            </div>
        )
    }

    return (
        <div className="animate-in zoom-in-95 duration-300">
            <button
                onClick={() => handleConfirmar(true)}
                className="w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-fg text-bg hover:bg-figueira transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 border-b-4 border-black/20"
            >
                <Check size={16} strokeWidth={3} /> Confirmar Agora
            </button>
        </div>
    )
}