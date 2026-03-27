'use client'
import { Check, X, Trash2 } from 'lucide-react'
import { alterarStatusCompromisso, apagarCompromisso } from '@/actions/agenda-actions'
import ModalEditarCompromisso from './ModalEditarCompromisso'

export default function BotoesAcaoCompromisso({ comp }: { comp: any }) {
    if (comp.status === 'PENDENTE') {
        return (
            <div className="flex items-center gap-2">
                <button onClick={() => alterarStatusCompromisso(comp.id, 'AGENDADO')} className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all" title="Aprovar">
                    <Check size={14} strokeWidth={3} />
                </button>
                <button onClick={() => apagarCompromisso(comp.id)} className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all" title="Recusar">
                    <X size={14} strokeWidth={3} />
                </button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <ModalEditarCompromisso comp={comp} />
            <button onClick={() => confirm("Apagar marcação?") && apagarCompromisso(comp.id)} className="w-8 h-8 rounded-xl bg-bg border border-soft text-muted hover:text-red-500 flex items-center justify-center transition-all" title="Apagar">
                <Trash2 size={14} />
            </button>
        </div>
    )
}