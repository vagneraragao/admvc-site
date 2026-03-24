'use client'

import { useState } from 'react'
import { CalendarDays, X, Save, Loader2, Clock, Repeat, Type, Filter, CalendarPlus, Calendar } from 'lucide-react'
import { criarEventoUnificadoAction } from '@/actions/admin-actions'

export default function ModalNovoEvento() {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [tipoEvento, setTipoEvento] = useState<'UNICO' | 'CONTINUO'>('UNICO')

    async function handleAction(formData: FormData) {
        setIsPending(true)
        // Injeta o tipo de evento no formData para a action saber o que fazer
        formData.append('tipo', tipoEvento)

        const res = await criarEventoUnificadoAction(formData)
        setIsPending(false)

        if (res.ok) {
            setIsOpen(false)
            alert(`Sucesso! ${res.totalCriado} evento(s) agendado(s).`)
        } else {
            alert(res.error || "Erro ao gerar eventos.")
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 bg-figueira text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira/90 transition-all shadow-lg shadow-figueira/20 active:scale-95 w-full sm:w-auto justify-center"
            >
                <CalendarPlus size={16} />
                Agendar Novo Evento
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-bg w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-soft flex flex-col animate-in zoom-in-95 duration-300">

                        {/* HEADER */}
                        <div className="p-8 border-b border-soft flex justify-between items-center bg-bg2 relative">
                            <div className="space-y-1">
                                <span className="text-figueira font-black text-[9px] uppercase tracking-[0.3em]">Criador de Agendas</span>
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-fg">Novo <span className="text-muted/20">Evento.</span></h3>
                            </div>
                            <button
                                onClick={() => !isPending && setIsOpen(false)}
                                className="p-4 bg-soft text-fg rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* TOGGLE TIPO DE EVENTO */}
                        <div className="p-8 pb-0">
                            <div className="flex bg-soft/30 p-1.5 rounded-2xl border border-soft">
                                <button
                                    type="button"
                                    onClick={() => setTipoEvento('UNICO')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tipoEvento === 'UNICO' ? 'bg-bg text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
                                >
                                    <Calendar size={14} /> Evento Único
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipoEvento('CONTINUO')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${tipoEvento === 'CONTINUO' ? 'bg-bg text-fg shadow-sm' : 'text-muted hover:text-fg'}`}
                                >
                                    <Repeat size={14} /> Culto Contínuo
                                </button>
                            </div>
                        </div>

                        {/* FORMULÁRIO */}
                        <form action={handleAction} className="p-8 space-y-6 pt-6">

                            {/* COMUM: NOME DO EVENTO E HORÁRIO */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black uppercase text-muted tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <Type size={12} /> Nome
                                    </label>
                                    <input
                                        type="text"
                                        name="nome"
                                        required
                                        placeholder="Ex: Culto da Família"
                                        className="w-full bg-bg2 border-2 border-soft rounded-2xl px-5 py-4 text-xs font-black text-fg focus:border-figueira outline-none"
                                    />
                                </div>
                                <div className="space-y-2 col-span-1">
                                    <label className="text-[10px] font-black uppercase text-muted tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <Clock size={12} /> Hora
                                    </label>
                                    <input
                                        type="time"
                                        name="horario"
                                        required
                                        defaultValue="10:00"
                                        className="w-full bg-bg2 border-2 border-soft rounded-2xl px-5 py-4 text-xs font-black text-fg focus:border-figueira outline-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-soft/50 my-2"></div>

                            {/* ======================================= */}
                            {/* CAMPOS PARA EVENTO ÚNICO                */}
                            {/* ======================================= */}
                            {tipoEvento === 'UNICO' && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95">
                                    <label className="text-[10px] font-black uppercase text-muted tracking-[0.2em] ml-2 flex items-center gap-2">
                                        <CalendarDays size={12} /> Data do Evento
                                    </label>
                                    <input
                                        type="date"
                                        name="dataUnica"
                                        required
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-bg2 border-2 border-soft rounded-2xl px-5 py-4 text-xs font-black text-fg focus:border-figueira outline-none cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* ======================================= */}
                            {/* CAMPOS PARA EVENTOS CONTÍNUOS           */}
                            {/* ======================================= */}
                            {tipoEvento === 'CONTINUO' && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <label className="text-[10px] font-black uppercase text-muted tracking-[0.2em] ml-2 flex items-center gap-2">
                                            <CalendarDays size={12} /> Dia
                                        </label>
                                        <select name="diaDaSemana" className="w-full bg-bg2 border-2 border-soft rounded-2xl px-5 py-4 text-xs font-black text-fg focus:border-figueira outline-none appearance-none cursor-pointer">
                                            <option value="0">Domingos</option>
                                            <option value="1">Segundas-feiras</option>
                                            <option value="2">Terças-feiras</option>
                                            <option value="3">Quartas-feiras</option>
                                            <option value="4">Quintas-feiras</option>
                                            <option value="5">Sextas-feiras</option>
                                            <option value="6">Sábados</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 col-span-2 sm:col-span-1">
                                        <label className="text-[10px] font-black uppercase text-muted tracking-[0.2em] ml-2 flex items-center gap-2">
                                            <Filter size={12} /> Frequência
                                        </label>
                                        <select name="frequencia" className="w-full bg-bg2 border-2 border-soft rounded-2xl px-5 py-4 text-xs font-black text-fg focus:border-figueira outline-none appearance-none cursor-pointer">
                                            <option value="TODAS">Toda a semana</option>
                                            <option value="1">1º do Mês</option>
                                            <option value="2">2º do Mês</option>
                                            <option value="3">3º do Mês</option>
                                            <option value="4">4º do Mês</option>
                                            <option value="ULTIMO">Último do Mês</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black uppercase text-muted tracking-[0.2em] ml-2 flex items-center gap-2">
                                            <Repeat size={12} /> Período de Agendamento
                                        </label>
                                        <select name="meses" className="w-full bg-bg2 border-2 border-soft rounded-2xl px-5 py-4 text-xs font-black text-fg focus:border-figueira outline-none appearance-none cursor-pointer">
                                            <option value="1">Apenas no próximo mês</option>
                                            <option value="3">Preencher Trimestre (3 meses)</option>
                                            <option value="6">Preencher Semestre (6 meses)</option>
                                            <option value="12">Preencher Ano (12 meses)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* BOTÃO SALVAR */}
                            <div className="pt-4 border-t border-soft mt-6">
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full flex items-center justify-center gap-3 bg-fg text-bg px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                >
                                    {isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    {isPending ? "A Guardar na Agenda..." : "Gravar Agendamento"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}