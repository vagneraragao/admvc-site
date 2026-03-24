"use client"
import { useState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { criarEscala } from '@/actions/admin-actions'
import { format, subMinutes } from 'date-fns'
import { Clock } from 'lucide-react'

export default function MontadorEscalas({ eventos, departamentos, membros }: any) {
    const [eventoId, setEventoId] = useState("");
    const [deptoId, setDeptoId] = useState("");
    const [membroId, setMembroId] = useState("");
    const [funcao, setFuncao] = useState("");
    const [horarioEscala, setHorarioEscala] = useState(""); // NOVO ESTADO PARA A HORA
    const [sucesso, setSucesso] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    // FUNÇÃO QUE CALCULA A HORA DE CHEGADA (Evento - 30 mins)
    const handleEventoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const idSelecionado = e.target.value;
        setEventoId(idSelecionado);

        const eventoSelecionado = eventos.find((ev: any) => ev.id.toString() === idSelecionado);

        if (eventoSelecionado && eventoSelecionado.data) {
            const dataDoEvento = new Date(eventoSelecionado.data);
            const horaChegada = format(subMinutes(dataDoEvento, 30), 'HH:mm');
            setHorarioEscala(horaChegada);
        } else {
            setHorarioEscala('');
        }
    };

    // 1. Filtra membros que pertencem ao departamento selecionado
    const membrosDoDepto = membros.filter((m: any) =>
        m.ministerios?.some((vinc: any) => vinc.departamento_id === Number(deptoId))
    );

    // 2. Busca as funções que este membro específico tem neste departamento
    const membroAtual = membros.find((m: any) => m.id === Number(membroId));
    const funcoesDisponiveis = membroAtual?.ministerios
        ?.filter((vinc: any) => vinc.departamento_id === Number(deptoId))
        .map((vinc: any) => vinc.funcao) || [];

    // Efeito para esconder a mensagem de sucesso
    useEffect(() => {
        if (sucesso) {
            const timer = setTimeout(() => setSucesso(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [sucesso]);

    return (
        <section className="relative bg-bg2 p-8 md:p-10 rounded-[3.5rem] border border-soft shadow-sm space-y-8 overflow-hidden">

            {/* FEEDBACK DE SUCESSO (TOAST ELEGANTE) */}
            {sucesso && (
                <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white py-3 text-center text-[10px] font-black uppercase tracking-[0.3em] animate-in slide-in-from-top duration-500 z-50">
                    ✨ Escala confirmada com sucesso!
                </div>
            )}

            <form
                ref={formRef}
                action={async (fd) => {
                    // Injectamos manualmente os campos de ID que estão no state 
                    // e a hora de chegada que o administrador validou
                    fd.append('evento_id', eventoId);
                    fd.append('departamento_id', deptoId);
                    fd.append('membro_id', membroId);
                    fd.append('funcao', funcao);
                    fd.append('horario', horarioEscala);

                    const res = await criarEscala(fd);
                    if (res?.ok) {
                        setSucesso(true);
                        setMembroId("");
                        setFuncao("");
                        // Não resetamos o evento nem o depto para facilitar atribuição em lote
                    } else if (res?.error) {
                        alert(res.error);
                    }
                }}
                className="space-y-6"
            >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* PASSO 1: EVENTO */}
                    <div className="space-y-2 lg:col-span-2 xl:col-span-1">
                        <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-2">
                            <span className="bg-soft text-fg w-4 h-4 flex items-center justify-center rounded-full text-[8px]">1</span>
                            Evento
                        </label>
                        <select
                            required
                            value={eventoId}
                            onChange={handleEventoChange} // <-- Adicionado o trigger aqui
                            className="w-full bg-bg2 border border-soft p-4 rounded-2xl font-bold text-xs outline-none focus:border-figueira transition-all cursor-pointer"
                        >
                            <option value="">Escolher Evento...</option>
                            {eventos.map((ev: any) => (
                                <option key={ev.id} value={ev.id}>
                                    {new Date(ev.data).toLocaleDateString('pt-PT')} - {ev.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* PASSO 2: DEPARTAMENTO */}
                    <div className="space-y-2 lg:col-span-2 xl:col-span-1">
                        <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-2">
                            <span className="bg-soft text-fg w-4 h-4 flex items-center justify-center rounded-full text-[8px]">2</span>
                            Departamento
                        </label>
                        <select
                            required
                            value={deptoId}
                            onChange={(e) => {
                                setDeptoId(e.target.value);
                                setMembroId("");
                                setFuncao("");
                            }}
                            className="w-full bg-bg2 border border-soft p-4 rounded-2xl font-bold text-xs outline-none focus:border-figueira transition-all cursor-pointer"
                        >
                            <option value="">Escolher Setor...</option>
                            {departamentos.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                            ))}
                        </select>
                    </div>

                    {/* PASSO 3: VOLUNTÁRIO */}
                    <div className="space-y-2 lg:col-span-2 xl:col-span-1">
                        <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-2">
                            <span className="bg-soft text-fg w-4 h-4 flex items-center justify-center rounded-full text-[8px]">3</span>
                            Voluntário
                        </label>
                        <select
                            required
                            disabled={!deptoId}
                            value={membroId}
                            onChange={(e) => {
                                setMembroId(e.target.value);
                                setFuncao("");
                            }}
                            className="w-full bg-bg2 border border-soft p-4 rounded-2xl font-bold text-xs outline-none focus:border-figueira transition-all disabled:opacity-30 cursor-pointer"
                        >
                            <option value="">{deptoId ? "Selecionar Nome..." : "Aguardando Setor..."}</option>
                            {membrosDoDepto.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* PASSO 4: FUNÇÃO E HORA */}
                    <div className="space-y-2 lg:col-span-2 xl:col-span-1">
                        <label className="text-[10px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-2">
                            <span className="bg-soft text-fg w-4 h-4 flex items-center justify-center rounded-full text-[8px]">4</span>
                            Função
                        </label>

                        <div className="flex gap-2">
                            <select
                                required
                                disabled={!membroId}
                                value={funcao}
                                onChange={(e) => setFuncao(e.target.value)}
                                className="flex-1 bg-bg2 border border-soft p-4 rounded-2xl font-bold text-xs outline-none focus:border-figueira transition-all disabled:opacity-30 cursor-pointer"
                            >
                                <option value="">Atuar como...</option>
                                {funcoesDisponiveis.map((f: string) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>

                            {/* O NOVO CAMPO DE HORA CALCULADA */}
                            <div className="relative w-24 shrink-0" title="Hora de chegada (30min antes)">
                                <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-figueira" />
                                <input
                                    type="time"
                                    required
                                    disabled={!eventoId}
                                    value={horarioEscala}
                                    onChange={(e) => setHorarioEscala(e.target.value)}
                                    className="w-full bg-figueira/5 border border-figueira/20 text-figueira p-4 pl-8 rounded-2xl font-black text-[10px] outline-none focus:border-figueira transition-all disabled:opacity-30 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* INFO EXTRA SOBRE A HORA DE CHEGADA */}
                {horarioEscala && (
                    <p className="text-[9px] font-black uppercase text-figueira tracking-widest flex items-center justify-end gap-1.5 animate-in fade-in">
                        <Clock size={10} /> Hora de apresentação do voluntário sugerida: {horarioEscala}h.
                    </p>
                )}

                <div className="pt-6 border-t border-soft/50">
                    <BotaoSubmit
                        ativo={!!(eventoId && deptoId && membroId && funcao && horarioEscala)}
                    />
                </div>
            </form>
        </section>
    );
}

// SUB-COMPONENTE DO BOTÃO
function BotaoSubmit({ ativo }: { ativo: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || !ativo}
            className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-3
                ${pending ? 'bg-soft text-muted cursor-wait' :
                    ativo ? 'bg-fg text-bg hover:bg-figueira active:scale-[0.98] shadow-figueira/20' :
                        'bg-soft text-muted/50 cursor-not-allowed shadow-none'}`}
        >
            {pending ? (
                <>
                    <div className="w-4 h-4 border-2 border-muted border-t-transparent rounded-full animate-spin" />
                    A Registar Escala...
                </>
            ) : (
                "Confirmar Escala"
            )}
        </button>
    );
}