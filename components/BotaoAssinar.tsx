"use client"

import { useState } from 'react'
import { assinarTermosAction } from '@/actions/membro-actions'
import { Loader2, Check } from 'lucide-react'

export default function BotaoAssinar({ membroId }: { membroId: number }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

    async function handleAssinar() {
        setStatus('loading');

        try {
            const result = await assinarTermosAction(membroId);

            if (result.success) {
                setStatus('success');
                // Redireciona de volta para a dashboard após um breve momento
                setTimeout(() => window.location.href = '/membros/dashboard', 1500);
            } else {
                setStatus('idle');
                alert("Ocorreu um erro ao assinar. Tenta novamente.");
            }
        } catch (error) {
            setStatus('idle');
            alert("Erro de ligação.");
        }
    }

    return (
        <button
            onClick={handleAssinar}
            disabled={status !== 'idle'}
            className={`w-full py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl
                ${status === 'success' ? 'bg-green-600 text-white' : 'bg-fg text-bg hover:bg-figueira hover:scale-[1.01] active:scale-[0.98]'}`}
        >
            {status === 'loading' && <Loader2 className="animate-spin" size={20} />}
            {status === 'success' && <Check size={20} />}
            {status === 'idle' && "Confirmar e Assinar Digitalmente"}
            {status === 'success' && "Assinado com Sucesso"}
        </button>
    )
}