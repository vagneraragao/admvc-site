"use client"

import { useState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { criarEscalaAction } from '@/actions/escalas-actions' // 👈 Certifique-se que o nome bate com a sua action
import { format, subMinutes } from 'date-fns'
import { Clock, CalendarDays, User, ShieldCheck, CheckCircle2, ChevronDown, Loader2, Zap } from 'lucide-react'

export default function MontadorEscalas({ eventos, funcoesDisponiveis, membros, departamentoId }: any) {
    const [eventoId, setEventoId] = useState("");
    const [membroId, setMembroId] = useState("");
    const [funcaoId, setFuncaoId] = useState("");
    const [horarioEscala, setHorarioEscala] = useState("");
    const [sucesso, setSucesso] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    const handleEventoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const idSelecionado = e.target.value;
        setEventoId(idSelecionado);
        const eventoSelecionado = eventos.find((ev: any) => ev.id.toString() === idSelecionado);
        if (eventoSelecionado && eventoSelecionado.data) {
            const dataDoEvento = new Date(eventoSelecionado.data);
            setHorarioEscala(format(subMinutes(dataDoEvento, 30), 'HH:mm'));
        } else {
            setHorarioEscala('');
        }
    };

    const membrosAptos = membros.filter((m: any) => {
        if (!funcaoId) return true;
        return m.funcoesHabilitadas?.includes(Number(funcaoId));
    });

    useEffect(() => {
        if (sucesso) {
            const timer = setTimeout(() => setSucesso(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [sucesso]);

    return (
        <div className="bg-bg2 border border-soft p-6 md:p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-figueira"></div>

            <div className="flex items-center gap-4 border-b border-soft pb-6 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-figueira/10 text-figueira flex items-center justify-center shrink-0 shadow-sm">
                    <Zap size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none">Nova Escala</h2>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1.5">
                        Alocação rápida de voluntários
                    </p>
                </div>
            </div>

            <section className="relative animate-in fade-in duration-500">
                {sucesso && (
                    <div className="absolute -top-4 left-0 right-0 bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4 duration-300 z-50 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20">
                        <CheckCircle2 size={16} /> Voluntário Escalado!
                    </div>
                )}

                <form
                    ref={formRef}
                    action={async (fd) => {
                        fd.append('evento_id', eventoId);
                        fd.append('departamento_id', departamentoId.toString());
                        fd.append('membro_id', membroId);
                        fd.append('funcao_id', funcaoId);
                        fd.append('horario', horarioEscala);

                        const res = await criarEscalaAction(fd); // 👈 Ajuste o nome da action se necessário
                        if (res?.ok) {
                            setSucesso(true);
                            setMembroId("");
                            setFuncaoId("");
                        } else if (res?.error) {
                            alert(res.error);
                        }
                    }}
                    className="space-y-6"
                >
                    {/* PASSO 1 */}
                    <div className="space-y-2 relative">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-figueira text-white text-[9px] font-black flex items-center justify-center shadow-sm">1</span>
                            <label className="text-[10px] font-black uppercase text-muted tracking-widest">Escolha o Evento</label>
                        </div>
                        <div className="relative">
                            <CalendarDays size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-figueira" />
                            <select required value={eventoId} onChange={handleEventoChange} className="w-full bg-bg border border-soft rounded-2xl pl-12 pr-10 py-4 text-xs font-bold text-fg focus:border-figueira outline-none cursor-pointer appearance-none shadow-sm transition-all">
                                <option value="">Selecionar Culto/Evento...</option>
                                {eventos.map((ev: any) => (
                                    <option key={ev.id} value={ev.id}>
                                        {format(new Date(ev.data), 'dd/MM (HH:mm)')} • {ev.nome}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                    </div>

                    {/* PASSO 2 */}
                    <div className={`space-y-2 transition-all duration-300 ${!eventoId ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-figueira text-white text-[9px] font-black flex items-center justify-center shadow-sm">2</span>
                            <label className="text-[10px] font-black uppercase text-muted tracking-widest flex-1">Qual a necessidade?</label>
                        </div>
                        <div className="relative">
                            <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-figueira" />
                            <select required value={funcaoId} onChange={(e) => { setFuncaoId(e.target.value); setMembroId(""); }} className="w-full bg-bg border border-soft rounded-2xl pl-12 pr-10 py-4 text-xs font-bold text-fg focus:border-figueira outline-none cursor-pointer appearance-none shadow-sm transition-all">
                                <option value="">Selecionar Cargo...</option>
                                {(funcoesDisponiveis || []).map((f: any) => (
                                    <option key={f.id} value={f.id}>{f.nome}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                    </div>

                    {/* PASSO 3 */}
                    <div className={`space-y-2 transition-all duration-300 ${!funcaoId ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-5 h-5 rounded-full bg-figueira text-white text-[9px] font-black flex items-center justify-center shadow-sm">3</span>
                            <label className="text-[10px] font-black uppercase text-muted tracking-widest flex items-center gap-2">
                                Quem vai servir?
                                {funcaoId && (
                                    <span className={`px-2 py-0.5 rounded-md text-[8px] ${membrosAptos.length > 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                                        {membrosAptos.length} Apto(s)
                                    </span>
                                )}
                            </label>
                        </div>
                        <div className="relative">
                            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-figueira" />
                            <select required value={membroId} onChange={(e) => setMembroId(e.target.value)} className="w-full bg-bg border border-soft rounded-2xl pl-12 pr-10 py-4 text-xs font-bold text-fg focus:border-figueira outline-none cursor-pointer appearance-none shadow-sm transition-all">
                                <option value="">{funcaoId ? (membrosAptos.length > 0 ? "Selecionar Voluntário..." : "Nenhum membro habilitado") : "Aguardando cargo..."}</option>
                                {membrosAptos.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                    </div>

                    {/* HORÁRIO (Sutil no final) */}
                    <div className={`pt-2 transition-all duration-300 ${!membroId ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between bg-figueira/5 border border-figueira/20 px-5 py-4 rounded-2xl">
                            <label className="text-[10px] font-black uppercase text-figueira tracking-widest flex items-center gap-2">
                                <Clock size={14} /> Chegada Padrão
                            </label>
                            <input
                                type="time"
                                required
                                value={horarioEscala}
                                onChange={(e) => setHorarioEscala(e.target.value)}
                                className="bg-transparent text-figueira font-black text-sm outline-none w-[70px] text-right"
                            />
                        </div>
                    </div>

                    {/* BOTÃO SUBMIT */}
                    <div className="pt-4 mt-4 border-t border-soft/50">
                        <BotaoSubmit ativo={!!(eventoId && membroId && funcaoId && horarioEscala)} />
                    </div>
                </form>
            </section>
        </div>
    );
}

function BotaoSubmit({ ativo }: { ativo: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || !ativo}
            className={`w-full flex items-center justify-center gap-3 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-md
                ${pending ? 'bg-soft text-muted cursor-wait shadow-none' :
                    ativo ? 'bg-fg text-bg hover:bg-figueira hover:text-white active:scale-95 shadow-figueira/20 hover:shadow-xl hover:shadow-figueira/30' :
                        'bg-soft text-muted/40 cursor-not-allowed shadow-none'}`}
        >
            {pending ? (
                <>
                    <Loader2 size={16} className="animate-spin" />
                    Processando...
                </>
            ) : (
                <>
                    <CheckCircle2 size={16} />
                    Confirmar Escala
                </>
            )}
        </button>
    );
}