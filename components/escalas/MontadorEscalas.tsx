"use client"

import { useState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { criarEscala } from '@/actions/admin-actions'
import { format, subMinutes } from 'date-fns'
import { Clock, CalendarDays, LayoutGrid, User, ShieldCheck, CheckCircle2, ChevronDown } from 'lucide-react'

export default function MontadorEscalas({ eventos, departamentos, membros }: any) {
    const [eventoId, setEventoId] = useState("");
    const [deptoId, setDeptoId] = useState(departamentos?.length === 1 ? departamentos[0].id.toString() : "");
    const [membroId, setMembroId] = useState("");
    const [funcao, setFuncao] = useState("");
    const [horarioEscala, setHorarioEscala] = useState("");
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
    const membrosDoDepto = membros.filter((m: any) => {
        const temFuncao = m.ministerios?.some((vinc: any) => vinc.departamento_id === Number(deptoId));
        const ehLiderOficial = m.departamentos_liderados?.some((d: any) => d.id === Number(deptoId));
        return temFuncao || ehLiderOficial;
    });

    // 2. Busca as funções que este membro específico tem neste departamento
    const membroAtual = membros.find((m: any) => m.id === Number(membroId));

    let funcoesDisponiveis = membroAtual?.ministerios
        ?.filter((vinc: any) => vinc.departamento_id === Number(deptoId))
        .map((vinc: any) => vinc.funcao) || [];

    // 3. REDE DE SEGURANÇA: Líder
    const isLiderOficial = membroAtual?.departamentos_liderados?.some((d: any) => d.id === Number(deptoId));
    if (isLiderOficial && !funcoesDisponiveis.includes('Líder')) {
        funcoesDisponiveis.push('Líder');
    }

    // Efeito para esconder a mensagem de sucesso
    useEffect(() => {
        if (sucesso) {
            const timer = setTimeout(() => setSucesso(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [sucesso]);

    return (
        <section className="relative animate-in fade-in duration-500">

            {/* FEEDBACK DE SUCESSO */}
            {sucesso && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-max bg-emerald-500 text-white px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4 duration-300 z-50 flex items-center gap-2 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 size={14} /> Escalado com sucesso!
                </div>
            )}

            <form
                ref={formRef}
                action={async (fd) => {
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
                    } else if (res?.error) {
                        alert(res.error);
                    }
                }}
                className="space-y-5"
            >
                {/* 1. SELEÇÃO DO EVENTO */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-1 flex items-center gap-2">
                        <CalendarDays size={14} className="text-blue-500" /> O Culto / Evento
                    </label>
                    <div className="relative">
                        <select
                            required
                            value={eventoId}
                            onChange={handleEventoChange}
                            className="w-full bg-bg border border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-fg focus:border-blue-500 outline-none cursor-pointer appearance-none shadow-sm transition-all hover:border-blue-300 pr-10"
                        >
                            <option value="">Selecione o evento...</option>
                            {eventos.map((ev: any) => {
                                const dataObjeto = new Date(ev.data);
                                const diaSemana = new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(dataObjeto);
                                const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
                                const dataCurta = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dataObjeto);
                                const hora = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(dataObjeto);

                                return (
                                    <option key={ev.id} value={ev.id}>
                                        {dataCurta} ({hora}) • {ev.nome}
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                </div>

                {/* 2. DEPARTAMENTO */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-1 flex items-center gap-2">
                        <LayoutGrid size={14} className="text-blue-500" /> Departamento
                    </label>
                    <div className="relative">
                        <select
                            required
                            value={deptoId}
                            onChange={(e) => {
                                setDeptoId(e.target.value);
                                setMembroId("");
                                setFuncao("");
                            }}
                            className="w-full bg-bg border border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-fg focus:border-blue-500 outline-none cursor-pointer appearance-none shadow-sm transition-all pr-10"
                        >
                            {departamentos.length !== 1 && <option value="">Escolher Setor...</option>}
                            {departamentos.map((d: any) => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                </div>

                {/* 3. VOLUNTÁRIO */}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-1 flex items-center gap-2">
                        <User size={14} className="text-blue-500" /> Voluntário
                    </label>
                    <div className="relative">
                        <select
                            required
                            disabled={!deptoId}
                            value={membroId}
                            onChange={(e) => {
                                setMembroId(e.target.value);
                                setFuncao("");
                            }}
                            className="w-full bg-bg border border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-fg focus:border-blue-500 outline-none cursor-pointer appearance-none shadow-sm disabled:opacity-50 transition-all pr-10"
                        >
                            <option value="">{deptoId ? "Selecionar Nome..." : "Aguardando Setor..."}</option>
                            {membrosDoDepto.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                    </div>
                </div>

                {/* 4. FUNÇÃO E HORA (Lado a Lado mesmo na sidebar) */}
                <div className="grid grid-cols-5 gap-3 pt-2">
                    
                    {/* Função - Ocupa 3 colunas */}
                    <div className="col-span-3 space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1 flex items-center gap-1.5">
                            <ShieldCheck size={12} className="text-blue-500" /> Função
                        </label>
                        <div className="relative">
                            <select
                                required
                                disabled={!membroId}
                                value={funcao}
                                onChange={(e) => setFuncao(e.target.value)}
                                className="w-full bg-bg border border-soft rounded-2xl px-3 py-3 text-[11px] font-bold text-fg focus:border-blue-500 outline-none cursor-pointer appearance-none shadow-sm disabled:opacity-50 transition-all pr-8 truncate"
                            >
                                <option value="">Atuar como...</option>
                                {funcoesDisponiveis.map((f: string) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                        </div>
                    </div>

                    {/* Horário - Ocupa 2 colunas */}
                    <div className="col-span-2 space-y-1.5 relative">
                        <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1 flex items-center gap-1.5">
                            <Clock size={12} className="text-blue-500" /> Chegada
                        </label>
                        <input
                            type="time"
                            required
                            disabled={!eventoId}
                            value={horarioEscala}
                            onChange={(e) => setHorarioEscala(e.target.value)}
                            className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-600 px-2 py-3 rounded-2xl font-black text-[11px] outline-none focus:border-blue-500 transition-all disabled:opacity-50 cursor-pointer text-center"
                        />
                    </div>
                </div>

                {/* BOTÃO SUBMIT */}
                <div className="pt-4 mt-2 border-t border-soft/50">
                    <BotaoSubmit ativo={!!(eventoId && deptoId && membroId && funcao && horarioEscala)} />
                </div>
            </form>
        </section>
    );
}

// ============================================================================
// SUB-COMPONENTE DO BOTÃO
// ============================================================================
function BotaoSubmit({ ativo }: { ativo: boolean }) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending || !ativo}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-md
                ${pending ? 'bg-soft text-muted cursor-wait shadow-none' :
                    ativo ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-500/20' :
                        'bg-soft text-muted/50 cursor-not-allowed shadow-none'}`}
        >
            {pending ? (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processando...
                </div>
            ) : (
                "Adicionar à Escala"
            )}
        </button>
    );
}