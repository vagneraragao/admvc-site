'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { apagarEventoAction } from '@/actions/admin-actions'

export default function BotaoApagarEvento({ id, nome }: { id: number, nome: string }) {
    const [isPending, setIsPending] = useState(false);

    async function handleApagar() {
        if (!confirm(`Tens a certeza que queres APAGAR o evento "${nome}"? Todas as escalas associadas serão perdidas.`)) return;

        setIsPending(true);
        const res = await apagarEventoAction(id);
        setIsPending(false);

        if (!res.ok) {
            alert(res.error);
        }
    }

    return (
        <button
            onClick={handleApagar}
            disabled={isPending}
            className="p-2 bg-bg2 border border-soft text-muted hover:text-red-500 hover:border-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 shadow-sm flex items-center justify-center disabled:opacity-50"
            title="Apagar Evento"
        >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    )
}