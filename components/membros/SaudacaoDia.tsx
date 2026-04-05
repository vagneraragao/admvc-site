import { Calendar, Clock } from 'lucide-react'

interface Props {
    nome: string
    proximoEvento: { nome: string; data: Date; tipo?: string } | null
    escalaHoje: { departamento: string; funcao: string; hora_chegada?: string } | null
}

export default function SaudacaoDia({ nome, proximoEvento, escalaHoje }: Props) {
    const hora = new Date().getHours()
    const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite'

    return (
        <div className="bg-bg2 border border-soft rounded-[2.5rem] p-6 md:p-8 space-y-3">
            <div>
                <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-fg leading-none">
                    {saudacao}, <span className="text-figueira">{nome}</span>
                </h1>
            </div>

            <div className="flex flex-wrap gap-3">
                {escalaHoje && (
                    <div className="flex items-center gap-2 bg-figueira/10 border border-figueira/20 text-figueira px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <Clock size={12} />
                        Escalado: {escalaHoje.departamento} {escalaHoje.hora_chegada ? `(chegar ${escalaHoje.hora_chegada})` : ''}
                    </div>
                )}
                {proximoEvento && (
                    <div className="flex items-center gap-2 bg-bg border border-soft text-muted px-4 py-2 rounded-xl text-[10px] font-bold">
                        <Calendar size={12} />
                        Proximo: {proximoEvento.nome} — {new Date(proximoEvento.data).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>
        </div>
    )
}
