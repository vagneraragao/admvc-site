"use client"

import { useState } from 'react'
import { CalendarDays, Clock, ShieldCheck, User, CheckCircle2, Trash2, Edit3, X, Save, Loader2, LayoutGrid, MessageCircle, ChevronDown } from 'lucide-react'
import { removerEscalaAction, atualizarEscalaAction } from '@/actions/admin-actions'
import ModalEditarEvento from '@/components/admin/ModalEditarEvento'
import BotaoApagarEvento from '@/components/admin/BotaoApagarEvento'

// Adicionámos "membros" às propriedades para capturar as funções de cada um
export default function ListaEscalados({ eventos, isAdmin, membros }: { eventos: any[], isAdmin?: boolean, membros?: any[] }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isPending, setIsPending] = useState(false);

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
            setEditingId(null); 
        } else {
            alert(res.error);
        }
    }

// Função para Partilhar via WhatsApp (Versão Bulletproof com Códigos Unicode)
    function handlePartilharWhatsApp(evento: any, escalasAgrupadas: any) {
        const dataFormatada = new Intl.DateTimeFormat('pt-PT', {
            weekday: 'long', day: '2-digit', month: 'long'
        }).format(new Date(evento.data));

        const diaSemanaCapitalizado = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);

        // Códigos Unicode oficiais (À prova de erros de codificação)
        const eEstrela = '\u2728';     // ✨
        const eIgreja = '\u26EA';      // ⛪
        const eCalendario = '\uD83D\uDCC5'; // 📅
        const eAzul = '\uD83D\uDD39';  // 🔹
        const ePessoa = '\uD83D\uDC64'; // 👤
        const eRelogio = '\u23F0';     // ⏰
        const eCheck = '\u2705';       // ✅
        const eLivro = '\uD83D\uDCD6'; // 📖
        const eMaos = '\uD83D\uDE4F';  // 🙏

        // CABEÇALHO DO EVENTO
        let texto = `${eEstrela} *ESCALA DE SERVIÇO* ${eEstrela}\n\n`;
        texto += `${eIgreja} *${evento.nome.toUpperCase()}*\n`;
        texto += `${eCalendario} _${diaSemanaCapitalizado}_\n\n`;

        // LISTA AGRUPADA POR DEPARTAMENTO
        Object.entries(escalasAgrupadas).forEach(([deptoNome, escalas]: [string, any]) => {
            texto += `${eAzul} *${deptoNome.toUpperCase()}* ${eAzul}\n`;
            
            escalas.forEach((esc: any) => {
                const nome = `${esc.membro.first_name} ${esc.membro.last_name}`;
                texto += `${ePessoa} ${nome}\n`;
                texto += `  |_ _${esc.funcao}_ | ${eRelogio} *${esc.horario}*\n`;
            });
            texto += `\n`;
        });

        // RODAPÉ E VERSÍCULO
        texto += `────────────────\n`;
        texto += `${eCheck} *Atenção:* Por favor, não se esqueçam de confirmar a vossa presença na plataforma!\n\n`;
        
        texto += `${eLivro} _"Tudo o que fizerem, façam de todo o coração, como para o Senhor, e não para os homens."_ \n— *Colossenses 3:23* ${eMaos}`;

        // Codifica o texto para formato de URL de forma segura
        const textoEncoded = encodeURIComponent(texto);
        
        // Abre o WhatsApp usando a API mais estável
        window.open(`https://api.whatsapp.com/send?text=${textoEncoded}`, '_blank');
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
        <div className="space-y-6">
            {eventosComEscala.map((evento, index) => {
                const dataFormatada = new Intl.DateTimeFormat('pt-PT', {
                    weekday: 'long', day: '2-digit', month: 'long'
                }).format(new Date(evento.data));

                const escalasAgrupadasPorDepto = evento.escalas.reduce((acc: any, escala: any) => {
                    const deptoNome = escala.departamento?.nome || 'Sem Departamento';
                    if (!acc[deptoNome]) acc[deptoNome] = [];
                    acc[deptoNome].push(escala);
                    return acc;
                }, {});

                return (
                    <details 
                        key={evento.id} 
                        open={index === 0} 
                        className="group bg-bg border border-soft rounded-[2.5rem] overflow-hidden shadow-sm transition-all duration-300"
                    >
                        {/* CABEÇALHO DO EVENTO */}
                        <summary className="list-none cursor-pointer bg-bg2 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 outline-none [&::-webkit-details-marker]:hidden hover:bg-soft/10 transition-colors group-open:border-b border-soft">
                            
                            <div className="flex items-start sm:items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-soft/50 flex items-center justify-center text-muted group-open:bg-blue-500 group-open:text-white transition-colors shrink-0">
                                    <ChevronDown size={18} className="group-open:rotate-180 transition-transform duration-300" />
                                </div>

                                <div>
                                    <h3 className="text-lg font-black uppercase italic tracking-tighter text-fg leading-none">
                                        {evento.nome}
                                    </h3>
                                    <p className="text-[10px] font-black uppercase text-muted tracking-widest mt-1.5 flex items-center gap-1.5">
                                        <CalendarDays size={12} className="text-figueira" /> {dataFormatada}
                                    </p>
                                </div>
                                
                                {isAdmin && (
                                    <div className="mt-1 sm:mt-0 flex gap-2" onClick={(e) => e.preventDefault()}>
                                        <ModalEditarEvento evento={evento} />
                                        <BotaoApagarEvento id={evento.id} nome={evento.nome} />
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3" onClick={(e) => e.preventDefault()}>
                                <button 
                                    onClick={() => handlePartilharWhatsApp(evento, escalasAgrupadasPorDepto)}
                                    className="bg-green-50 text-green-600 hover:bg-green-500 hover:text-white border border-green-200 transition-all text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 active:scale-95"
                                    title="Enviar Escala para o Grupo"
                                >
                                    <MessageCircle size={14} /> Partilhar
                                </button>

                                <span className="bg-bg border border-soft text-[9px] font-black uppercase tracking-widest text-fg px-4 py-2.5 rounded-xl shadow-sm whitespace-nowrap">
                                    {evento.escalas.length} Voluntários
                                </span>
                            </div>
                        </summary>

                        {/* LISTA AGRUPADA POR DEPARTAMENTO */}
                        <div className="flex flex-col animate-in slide-in-from-top-2 duration-300">
                            {Object.entries(escalasAgrupadasPorDepto).map(([deptoNome, escalasDoDepto]: any) => (
                                <div key={deptoNome}>

                                    <div className="bg-soft/20 px-6 py-3 flex items-center justify-between border-b border-soft">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid size={12} className="text-blue-500" />
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-fg">
                                                {deptoNome}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-soft">
                                        {escalasDoDepto.map((escala: any) => {
                                            const isEditing = editingId === escala.id;

                                            // LÓGICA MÁGICA PARA DESCOBRIR AS FUNÇÕES DO MEMBRO
                                            let funcoesDisponiveis = [escala.funcao]; // Garante que a função atual é sempre visível
                                            
                                            if (membros) {
                                                const membroCompleto = membros.find((m: any) => m.id === escala.membro.id);
                                                if (membroCompleto) {
                                                    const funcoesSet = new Set<string>();
                                                    
                                                    // Funções que o membro tem registadas neste departamento
                                                    membroCompleto.ministerios?.forEach((vinc: any) => {
                                                        if (vinc.departamento_id === escala.departamento_id) {
                                                            funcoesSet.add(vinc.funcao);
                                                        }
                                                    });
                                                    
                                                    // Se for o líder oficial do departamento, garante a função "Líder"
                                                    const isLiderOficial = membroCompleto.departamentos_liderados?.some((d: any) => d.id === escala.departamento_id);
                                                    if (isLiderOficial) funcoesSet.add('Líder');
                                                    
                                                    funcoesSet.add(escala.funcao); // Proteção contra falhas
                                                    funcoesDisponiveis = Array.from(funcoesSet);
                                                }
                                            }

                                            return (
                                                <div key={escala.id} className="p-4 sm:p-6 hover:bg-soft/10 transition-colors">

                                                    {/* --- MODO DE VISUALIZAÇÃO --- */}
                                                    {!isEditing && (
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

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

                                                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                                                <button
                                                                    onClick={() => setEditingId(escala.id)}
                                                                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-bg border border-soft text-muted hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                                                                    title="Editar Escala"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                
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

                                                    {/* --- MODO DE EDIÇÃO INLINE --- */}
                                                    {isEditing && (
                                                        <form action={handleAtualizar} className="flex flex-col sm:flex-row items-end sm:items-center gap-4 bg-bg2 p-4 rounded-2xl border border-figueira/30 shadow-inner animate-in fade-in zoom-in-95">
                                                            <input type="hidden" name="id" value={escala.id} />

                                                            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div className="space-y-1.5">
                                                                    <label className="text-[9px] font-black uppercase text-muted tracking-widest ml-1">Alterar Função</label>
                                                                    <div className="relative">
                                                                        <select
                                                                            name="funcao"
                                                                            defaultValue={escala.funcao}
                                                                            required
                                                                            className="w-full bg-bg border border-soft rounded-xl px-4 py-2.5 text-xs font-bold focus:border-figueira outline-none shadow-sm appearance-none cursor-pointer pr-8 truncate"
                                                                        >
                                                                            {funcoesDisponiveis.map((f) => (
                                                                                <option key={f} value={f}>{f}</option>
                                                                            ))}
                                                                        </select>
                                                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                                                                    </div>
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
                                                                <button type="button" onClick={() => setEditingId(null)} className="flex-1 sm:flex-none p-3 rounded-xl bg-bg border border-soft text-muted hover:text-red-500 transition-all flex items-center justify-center shadow-sm">
                                                                    <X size={16} />
                                                                </button>
                                                                <button type="submit" disabled={isPending} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-figueira text-white text-[10px] font-black uppercase tracking-widest hover:bg-figueira/90 transition-all shadow-sm disabled:opacity-50">
                                                                    {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
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
                    </details>
                )
            })}
        </div>
    )
}