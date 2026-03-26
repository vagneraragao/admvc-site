"use client"

import { useState } from 'react'
import { CalendarDays, Clock, ShieldCheck, User, CheckCircle2, Trash2, Edit3, X, Save, Loader2, LayoutGrid } from 'lucide-react'
import { removerEscalaAction, atualizarEscalaAction } from '@/actions/admin-actions'
import ModalEditarEscala from '@/components/admin/ModalEditarEscala'
import ModalEditarEvento from '@/components/admin/ModalEditarEvento'
import BotaoApagarEvento from '@/components/admin/BotaoApagarEvento'


export default function ListaEscalados({ eventos }: { eventos: any[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isPending, setIsPending] = useState(false);

    // Filtra eventos que realmente têm escalas
    const eventosComEscala = eventos.filter(ev => ev.escalas && ev.escalas.length > 0);

    async function handleRemover(id: number) {
        if (!confirm("Tens a certeza que desejas remover este voluntário da escala?")) return;

        const res = await removerEscalaAction(id);
        if (res.error) alert(res.error);
    }

    async function handleAtualizar(formData: FormData) {
        setIsPending(true);
        const res = await atualizarEscalaAction(formData);
        setIsPending(false);

        if (res.ok) {
            setEditingId(null); // Fecha o modo de edição
        } else {
            alert(res.error);
        }
    }

    if (eventosComEscala.length === 0) {
        return (
            <div className="py-16 text-center border-2 border-dashed border-soft rounded-[2.5rem] bg-bg2/50">
                <ShieldCheck size={32} className="mx-auto text-muted/30 mb-4" />
                <p className="text-[10px] font-black text-muted uppercase tracking-widest italic">Nenhuma equipa escalada para os próximos eventos.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {eventosComEscala.map((evento) => {
                const dataFormatada = new Intl.DateTimeFormat('pt-PT', {
                    weekday: 'long', day: '2-digit', month: 'long'
                }).format(new Date(evento.data));

                // A MÁGICA DO AGRUPAMENTO: Organiza as escalas deste evento por Departamento
                const escalasAgrupadasPorDepto = evento.escalas.reduce((acc: any, escala: any) => {
                    const deptoNome = escala.departamento?.nome || 'Sem Departamento';
                    if (!acc[deptoNome]) {
                        acc[deptoNome] = [];
                    }
                    acc[deptoNome].push(escala);
                    return acc;
                }, {});

                return (
                    <div key={evento.id} className="bg-bg border border-soft rounded-[2.5rem] overflow-hidden shadow-sm">

{/* CABEÇALHO DO EVENTO */}
                        <div className="bg-bg2 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            
                            {/* AGRUPAMOS O TÍTULO E O BOTÃO DE EDITAR */}
                            <div className="flex items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-fg leading-none">
                                        {evento.nome}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mt-1.5 flex items-center gap-1.5">
                                        <CalendarDays size={12} className="text-figueira" /> {dataFormatada}
                                    </p>
                                </div>
                                
                                {/* O TEU MODAL DE EDITAR EVENTO ENTRA AQUI! */}
                                <div className="mt-1 sm:mt-0">
                                    <ModalEditarEvento evento={evento} />
                                    <BotaoApagarEvento id={evento.id} nome={evento.nome} />
                                </div>
                            </div>

                            <span className="bg-bg border border-soft text-[9px] font-black uppercase tracking-widest text-fg px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                                {evento.escalas.length} Voluntários no total
                            </span>
                        </div>

                        {/* LISTA AGRUPADA POR DEPARTAMENTO */}
                        <div className="flex flex-col">
                            {Object.entries(escalasAgrupadasPorDepto).map(([deptoNome, escalasDoDepto]: any) => (
                                <div key={deptoNome} className="border-t border-soft">

                                    {/* CABEÇALHO DO DEPARTAMENTO (Sub-título) */}
                                    <div className="bg-soft/30 px-6 py-2.5 flex items-center justify-between border-b border-soft">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid size={12} className="text-blue-500" />
                                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-fg">
                                                {deptoNome}
                                            </h4>
                                        </div>
                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted">
                                            {escalasDoDepto.length} Escalados
                                        </span>
                                    </div>

                                    {/* VOLUNTÁRIOS DESTE DEPARTAMENTO */}
                                    <div className="divide-y divide-soft">
                                        {escalasDoDepto.map((escala: any) => {
                                            const isEditing = editingId === escala.id;

                                            return (
                                                <div key={escala.id} className="p-4 sm:p-6 hover:bg-soft/20 transition-colors">

                                                    {/* MODO VISUALIZAÇÃO */}
                                                    {!isEditing && (
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                                                            {/* INFO DO MEMBRO */}
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-bg2 border border-soft flex items-center justify-center text-muted shrink-0 shadow-sm overflow-hidden">
                                                                    {escala.membro.avatar_file ? (
                                                                        <img src={escala.membro.avatar_file} alt="Avatar" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <User size={16} />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-black uppercase text-fg leading-none flex items-center gap-2">
                                                                        {escala.membro.first_name} {escala.membro.last_name}
                                                                        {escala.confirmado ? (
                                                                            <span className="text-emerald-500" title="Presença Confirmada"><CheckCircle2 size={12} /></span>
                                                                        ) : (
                                                                            <span className="text-orange-400" title="A aguardar confirmação"><Clock size={12} /></span>
                                                                        )}
                                                                    </h4>
                                                                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600 flex items-center gap-1">
                                                                            <ShieldCheck size={10} /> {escala.funcao}
                                                                        </span>
                                                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted flex items-center gap-1 border-l border-soft pl-3">
                                                                            <Clock size={10} /> Chegada às {escala.horario}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* BOTÕES DE AÇÃO */}
                                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                                <ModalEditarEscala escala={escala} />
                                                                <button
                                                                    onClick={() => handleRemover(escala.id)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg border border-soft text-muted hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                                                                    title="Remover da Escala"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* MODO EDIÇÃO (INLINE) */}
                                                    {isEditing && (
                                                        <form action={handleAtualizar} className="flex flex-col sm:flex-row items-end sm:items-center gap-4 bg-bg2 p-4 rounded-2xl border border-figueira/30 shadow-inner animate-in fade-in zoom-in-95">
                                                            <input type="hidden" name="id" value={escala.id} />

                                                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Alterar Função</label>
                                                                    <input
                                                                        name="funcao"
                                                                        defaultValue={escala.funcao}
                                                                        required
                                                                        className="w-full bg-bg border border-soft rounded-xl px-4 py-2.5 text-xs font-bold focus:border-figueira outline-none shadow-sm"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Novo Horário</label>
                                                                    <input
                                                                        type="time"
                                                                        name="horario"
                                                                        defaultValue={escala.horario}
                                                                        required
                                                                        className="w-full bg-bg border border-soft rounded-xl px-4 py-2.5 text-xs font-bold focus:border-figueira outline-none cursor-pointer shadow-sm"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="flex gap-2 w-full sm:w-auto">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingId(null)}
                                                                    className="flex-1 sm:flex-none p-3 rounded-xl bg-bg border border-soft text-muted hover:text-red-500 transition-all flex items-center justify-center shadow-sm"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                                <button
                                                                    type="submit"
                                                                    disabled={isPending}
                                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-figueira text-white text-[10px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all shadow-sm disabled:opacity-50"
                                                                >
                                                                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                    Salvar
                                                                </button>
                                                            </div>
                                                        </form>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}