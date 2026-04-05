import { Calendar, Wallet2, Clock, Users } from 'lucide-react'

interface Props {
    escalasEsteMes: number
    contribuicaoAno: number
    membroDesde: Date | null
    presencaGrupos: number | null // percentage
}

export default function EstatisticasPessoais({ escalasEsteMes, contribuicaoAno, membroDesde, presencaGrupos }: Props) {
    const tempoMembro = membroDesde ? (() => {
        const diff = Date.now() - new Date(membroDesde).getTime()
        const anos = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
        const meses = Math.floor((diff % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000))
        return anos > 0 ? `${anos}a ${meses}m` : `${meses} meses`
    })() : null

    const stats = [
        { label: 'Escalas este mes', value: escalasEsteMes, icon: Calendar },
        { label: 'Contribuido este ano', value: `${contribuicaoAno.toFixed(0)}€`, icon: Wallet2 },
        ...(tempoMembro ? [{ label: 'Membro ha', value: tempoMembro, icon: Clock }] : []),
        ...(presencaGrupos !== null ? [{ label: 'Presenca grupos', value: `${presencaGrupos}%`, icon: Users }] : []),
    ]

    return (
        <div className="space-y-2">
            <h3 className="text-[9px] font-black uppercase tracking-widest text-muted">As Minhas Estatisticas</h3>
            <div className="space-y-1.5">
                {stats.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-bg border border-soft rounded-xl px-3 py-2">
                        <span className="text-[9px] font-bold text-muted flex items-center gap-2">
                            <s.icon size={11} className="text-figueira" /> {s.label}
                        </span>
                        <span className="text-[11px] font-black text-fg">{s.value}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
