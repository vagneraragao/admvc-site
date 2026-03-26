"use client"

import { useState, useRef, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { criarEscala } from '@/actions/admin-actions'
import { format, subMinutes } from 'date-fns'
import { Clock, CalendarDays, LayoutGrid, User, ShieldCheck, CheckCircle2, ArrowDown } from 'lucide-react'

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
        // Verifica se ele tem alguma função na tabela de integrantes para este departamento
        const temFuncao = m.ministerios?.some((vinc: any) => vinc.departamento_id === Number(deptoId));

        // Verifica se ele é o Líder Oficial deste departamento
        const ehLiderOficial = m.departamentos_liderados?.some((d: any) => d.id === Number(deptoId));

        return temFuncao || ehLiderOficial;
    });

    // 2. Busca as funções que este membro específico tem neste departamento
    const membroAtual = membros.find((m: any) => m.id === Number(membroId));

    let funcoesDisponiveis = membroAtual?.ministerios
        ?.filter((vinc: any) => vinc.departamento_id === Number(deptoId))
        .map((vinc: any) => vinc.funcao) || [];

    // 3. REDE DE SEGURANÇA: Se ele é o líder oficial, garantimos que a função "Líder" aparece, 
    // mesmo que não esteja registada na tabela de integrantes!
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
        <section className="relative space-y-6 animate-in fade-in duration-500">

            {/* FEEDBACK DE SUCESSO (TOAST ELEGANTE FLUTUANTE) */}
            {sucesso && (
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-in slide-in-from-top-4 duration-300 z-50 flex items-center gap-2 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 size={14} /> Voluntário escalado com sucesso!
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
                className="space-y-6"
            >
                {/* ================================================================== */}
                {/* PASSO 1: SELEÇÃO DO EVENTO (LINHA ÚNICA)                           */}
                {/* ================================================================== */}
                <div className="bg-bg border border-soft p-6 md:p-8 rounded-[2rem] shadow-sm relative z-20">
                    <div className="flex items-center gap-3 mb-6 border-b border-soft pb-4">
                        <span className="w-6 h-6 rounded-full bg-figueira text-white flex items-center justify-center text-[9px] font-black shadow-sm">1</span>
                        <h3 className="text-sm font-black uppercase tracking-widest text-fg">O Evento</h3>
                    </div>

                    <div className="space-y-2 max-w-3xl">
                        <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-2 flex items-center gap-2">
                            <CalendarDays size={14} className="text-figueira" /> Selecione a Data e Culto
                        </label>
                        <select
                            required
                            value={eventoId}
                            onChange={handleEventoChange}
                            className="w-full bg-bg2 border border-soft rounded-2xl px-5 py-4 text-sm font-bold text-fg focus:border-figueira outline-none cursor-pointer appearance-none shadow-sm transition-all hover:border-figueira/50"
                        >
                            <option value="">-- Escolher Evento na Agenda --</option>
                            {eventos.map((ev: any) => {
                                const dataObjeto = new Date(ev.data);

                                // Formatações nativas limpas para Dia, Data e Hora
                                const diaSemana = new Intl.DateTimeFormat('pt-PT', { weekday: 'long' }).format(dataObjeto);
                                const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

                                const dataCurta = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dataObjeto);
                                const hora = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' }).format(dataObjeto);

                                return (
                                    <option key={ev.id} value={ev.id}>
                                        {diaSemanaCapitalizado}, {dataCurta} às {hora} • {ev.nome}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                {/* Ícone de ligação subtil entre os blocos */}
                <div className="flex justify-center -my-3 relative z-10 pointer-events-none">
                    <div className="bg-bg2 border border-soft text-muted w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                        <ArrowDown size={14} />
                    </div>
                </div>

                {/* ================================================================== */}
                {/* PASSO 2: ATRIBUIÇÃO (GRELHA 4 COLUNAS)                              */}
                {/* ================================================================== */}
                <div className="bg-bg border border-soft p-6 md:p-8 rounded-[2rem] shadow-sm relative z-0">
                    <div className="flex items-center gap-3 mb-6 border-b border-soft pb-4">
                        <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black shadow-sm">2</span>
                        <h3 className="text-sm font-black uppercase tracking-widest text-fg">Detalhes da Escala</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                        {/* 1. DEPARTAMENTO */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-2 flex items-center gap-2">
                                <LayoutGrid size={14} className="text-blue-500" /> Departamento
                            </label>
                            <select
                                required
                                value={deptoId}
                                onChange={(e) => {
                                    setDeptoId(e.target.value);
                                    setMembroId("");
                                    setFuncao("");
                                }}
                                className="w-full bg-bg2 border border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-fg focus:border-blue-500 outline-none cursor-pointer appearance-none shadow-sm transition-all"
                            >
                                {departamentos.length !== 1 && <option value="">Escolher Setor...</option>}
                                {departamentos.map((d: any) => (
                                    <option key={d.id} value={d.id}>{d.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. VOLUNTÁRIO */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-2 flex items-center gap-2">
                                <User size={14} className="text-blue-500" /> Voluntário
                            </label>
                            <select
                                required
                                disabled={!deptoId}
                                value={membroId}
                                onChange={(e) => {
                                    setMembroId(e.target.value);
                                    setFuncao("");
                                }}
                                className="w-full bg-bg2 border border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-fg focus:border-blue-500 outline-none cursor-pointer appearance-none shadow-sm disabled:opacity-50 transition-all"
                            >
                                <option value="">{deptoId ? "Selecionar Nome..." : "Aguardando Setor..."}</option>
                                {membrosDoDepto.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* 3. FUNÇÃO E HORA (Agrupados na Grelha) */}
                        <div className="space-y-2 xl:col-span-2">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-2 flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-blue-500" /> Função
                                    </label>
                                    <select
                                        required
                                        disabled={!membroId}
                                        value={funcao}
                                        onChange={(e) => setFuncao(e.target.value)}
                                        className="w-full bg-bg2 border border-soft rounded-2xl px-4 py-3.5 text-xs font-bold text-fg focus:border-blue-500 outline-none cursor-pointer appearance-none shadow-sm disabled:opacity-50 transition-all"
                                    >
                                        <option value="">Atuar como...</option>
                                        {funcoesDisponiveis.map((f: string) => (
                                            <option key={f} value={f}>{f}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-span-1 space-y-2 relative" title="Hora de chegada calculada automaticamente">
                                    <label className="text-[10px] font-black uppercase text-muted tracking-widest ml-2 flex items-center gap-1.5 whitespace-nowrap">
                                        <Clock size={14} className="text-blue-500" /> Chegada
                                    </label>
                                    <input
                                        type="time"
                                        required
                                        disabled={!eventoId}
                                        value={horarioEscala}
                                        onChange={(e) => setHorarioEscala(e.target.value)}
                                        className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-600 px-2 sm:px-4 py-3.5 rounded-2xl font-black text-xs sm:text-sm outline-none focus:border-blue-500 transition-all disabled:opacity-50 cursor-pointer text-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INFORMAÇÃO EXTRA DA HORA */}
                    {horarioEscala && (
                        <div className="mt-4 flex justify-end animate-in fade-in">
                            <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                <Clock size={10} /> Sugestão de chegada calculada (30m antes)
                            </p>
                        </div>
                    )}

                    {/* BOTÃO DE SUBMISSÃO ALINHADO À DIREITA */}
                    <div className="mt-8 pt-6 border-t border-soft flex justify-end">
                        <div className="w-full md:w-auto">
                            <BotaoSubmit ativo={!!(eventoId && deptoId && membroId && funcao && horarioEscala)} />
                        </div>
                    </div>
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
            className={`w-full flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl
                ${pending ? 'bg-soft text-muted cursor-wait' :
                    ativo ? 'bg-fg text-bg hover:bg-figueira active:scale-95 shadow-figueira/20' :
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