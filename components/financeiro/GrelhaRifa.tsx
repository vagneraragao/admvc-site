'use client'

import { useState } from 'react'
import { Ticket, User, CheckCircle2, Loader2, X, Euro, Edit3, Layers, Power } from 'lucide-react'
import { atualizarCompradorRifaAction, venderNumerosRifaLoteAction, finalizarRifaAction } from '@/app/financeiro/actions'

interface GrelhaRifaProps {
    rifa: any;
    membros: any[];
}

export default function GrelhaRifa({ rifa, membros }: GrelhaRifaProps) {
    const [numerosSelecionados, setNumerosSelecionados] = useState<number[]>([]);
    const [numeroEditando, setNumeroEditando] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [tipoComprador, setTipoComprador] = useState<'MEMBRO' | 'EXTERNO'>('MEMBRO');
    const [isEditing, setIsEditing] = useState(false);

    const todosNumeros = Array.from({ length: rifa.total_numeros }, (_, i) => i + 1);

    const mapaVendidos = new Map();
    rifa.numeros_vendidos.forEach((venda: any) => {
        mapaVendidos.set(venda.numero, venda);
    });

    const toggleNumeroLivre = (num: number) => {
        setNumeroEditando(null);
        setIsEditing(false);
        setNumerosSelecionados(prev =>
            prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]
        );
    };

    const selecionarNumeroVendido = (num: number) => {
        setNumerosSelecionados([]);
        setNumeroEditando(num);
        setIsEditing(false);
    };

    async function handleVenderLote(formData: FormData) {
        setLoading(true);
        const result = await venderNumerosRifaLoteAction(formData);
        if (result.ok) setNumerosSelecionados([]);
        else alert(result.error);
        setLoading(false);
    }

    async function handleAtualizar(formData: FormData) {
        setLoading(true);
        const result = await atualizarCompradorRifaAction(formData);
        if (result.ok) setIsEditing(false);
        else alert(result.error);
        setLoading(false);
    }

    // --- NOVA FUNÇÃO PARA ENCERRAR A RIFA ---
    async function handleEncerrarRifa() {
        if (window.confirm("Tem a certeza que deseja encerrar esta Rifa? Ela deixará de aparecer na Dashboard.")) {
            setLoading(true);
            const result = await finalizarRifaAction(rifa.id);
            if (!result.ok) {
                alert(result.error);
                setLoading(false);
            }
            // Se for sucesso, não precisamos de setLoading(false) porque o componente vai desaparecer da tela
        }
    }

    const vendaSelecionada = numeroEditando ? mapaVendidos.get(numeroEditando) : null;
    const valorTotalLote = rifa.valor_numero * numerosSelecionados.length;

    return (
        <div className="bg-bg2 border border-soft rounded-[2.5rem] overflow-hidden shadow-sm flex flex-col md:flex-row">

            {/* LADO ESQUERDO: A GRELHA DE NÚMEROS */}
            <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-soft">

                {/* CABEÇALHO DA RIFA (Agora com o botão de Encerrar) */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none flex items-center gap-2">
                            <Ticket className="text-figueira" /> {rifa.nome}
                        </h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                            Prémio: <span className="text-figueira">{rifa.premio}</span>
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                            <span className="text-[10px] font-black uppercase text-muted tracking-widest block">Progresso</span>
                            <span className="text-lg font-black text-fg italic leading-none">
                                {rifa.numeros_vendidos.length} <span className="text-xs text-muted">/ {rifa.total_numeros}</span>
                            </span>
                        </div>
                        {/* NOVO BOTÃO DE ENCERRAR */}
                        <button
                            onClick={handleEncerrarRifa}
                            disabled={loading}
                            className="text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                            <Power size={10} /> Encerrar Rifa
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[400px] overflow-y-auto p-2">
                    {todosNumeros.map(num => {
                        const venda = mapaVendidos.get(num);
                        const isVendido = !!venda;
                        const isSelecionadoLivre = numerosSelecionados.includes(num);
                        const isSelecionadoVendido = numeroEditando === num;

                        const nomeCurto = isVendido
                            ? (venda.membro ? venda.membro.first_name : venda.nome_externo.split(' ')[0])
                            : '';

                        return (
                            <button
                                key={num}
                                onClick={() => isVendido ? selecionarNumeroVendido(num) : toggleNumeroLivre(num)}
                                className={`
                                    relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden
                                    ${isVendido
                                        ? isSelecionadoVendido
                                            ? 'bg-figueira text-white shadow-lg scale-110 z-10 border-2 border-white'
                                            : 'bg-figueira/10 text-figueira border border-figueira/30 hover:bg-figueira/20'
                                        : isSelecionadoLivre
                                            ? 'bg-fg text-bg shadow-lg scale-110 z-10'
                                            : 'bg-bg border border-soft text-fg hover:border-fg hover:bg-fg/5'
                                    }
                                `}
                            >
                                <span className="text-sm font-black">{num}</span>
                                {isVendido && (
                                    <span className="text-[7px] font-black uppercase w-full truncate px-1 text-center opacity-80 mt-0.5">
                                        {nomeCurto}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* LADO DIREITO: CHECKOUT OU DETALHES (Mantém-se igual) */}
            <div className="w-full md:w-80 p-6 md:p-8 bg-bg flex flex-col justify-center min-h-[300px]">

                {/* ESTADO 1: NENHUM NÚMERO SELECIONADO */}
                {numerosSelecionados.length === 0 && !numeroEditando ? (
                    <div className="text-center opacity-50 space-y-3">
                        <Layers size={40} className="mx-auto text-muted" />
                        <p className="text-[10px] font-black uppercase text-muted tracking-widest leading-relaxed">
                            Clica nos números livres<br />para venda múltipla
                        </p>
                    </div>

                ) : vendaSelecionada && !isEditing ? (

                    // ESTADO 2: VISUALIZAR UM NÚMERO VENDIDO (COM BOTÃO DE EDITAR)
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[9px] font-black uppercase text-figueira tracking-widest block flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Número Vendido
                                </span>
                                <h4 className="text-4xl font-black italic text-fg leading-none mt-1">
                                    #{numeroEditando}
                                </h4>
                            </div>
                            <button onClick={() => setNumeroEditando(null)} className="p-2 bg-bg2 rounded-xl text-muted hover:text-red-500 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-soft">
                            <div className="bg-figueira/10 border border-figueira/20 p-5 rounded-2xl relative">
                                <span className="text-[8px] font-black uppercase text-muted tracking-widest block mb-1">Comprador</span>
                                <p className="text-sm font-black text-figueira uppercase pr-8">
                                    {vendaSelecionada.membro
                                        ? `${vendaSelecionada.membro.first_name} ${vendaSelecionada.membro.last_name}`
                                        : vendaSelecionada.nome_externo}
                                </p>
                                <span className="text-[9px] font-bold text-muted uppercase mt-2 block">
                                    Tipo: {vendaSelecionada.membro ? 'Membro da Igreja' : 'Externo'}
                                </span>

                                <button
                                    onClick={() => {
                                        setTipoComprador(vendaSelecionada.membro ? 'MEMBRO' : 'EXTERNO');
                                        setIsEditing(true);
                                    }}
                                    className="absolute top-4 right-4 p-2 bg-white rounded-lg text-figueira hover:bg-figueira hover:text-white transition-all shadow-sm"
                                    title="Corrigir Comprador"
                                >
                                    <Edit3 size={14} />
                                </button>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-bg2 rounded-2xl border border-soft">
                                <span className="text-[9px] font-black uppercase text-muted tracking-widest block">Valor Pago</span>
                                <span className="text-lg font-black text-fg italic flex items-center gap-1">
                                    {rifa.valor_numero.toFixed(2)} <Euro size={14} className="text-muted" />
                                </span>
                            </div>
                        </div>
                    </div>

                ) : (

                    // ESTADO 3: FORMULÁRIO (VENDA EM LOTE OU EDIÇÃO)
                    <form action={isEditing ? handleAtualizar : handleVenderLote} className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                        {isEditing ? (
                            <input type="hidden" name="venda_id" value={vendaSelecionada.id} />
                        ) : (
                            <>
                                <input type="hidden" name="rifa_id" value={rifa.id} />
                                <input type="hidden" name="numeros" value={JSON.stringify(numerosSelecionados)} />
                            </>
                        )}

                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`text-[9px] font-black uppercase tracking-widest block ${isEditing ? 'text-orange-500' : 'text-muted'}`}>
                                    {isEditing ? 'A Corrigir Dono' : `${numerosSelecionados.length} Números Selecionados`}
                                </span>
                                <h4 className={`text-2xl font-black italic leading-none mt-1 ${isEditing ? 'text-fg' : 'text-figueira'}`}>
                                    {isEditing
                                        ? `#${numeroEditando}`
                                        : numerosSelecionados.join(', ')}
                                </h4>
                            </div>
                            <button type="button" onClick={() => { isEditing ? setIsEditing(false) : setNumerosSelecionados([]) }} className="p-2 bg-bg2 rounded-xl text-muted hover:text-red-500 transition-colors shrink-0">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-soft">
                            <div className="flex bg-bg2 p-1 rounded-xl">
                                <button type="button" onClick={() => setTipoComprador('MEMBRO')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${tipoComprador === 'MEMBRO' ? 'bg-white shadow-sm text-fg' : 'text-muted'}`}>
                                    Membro
                                </button>
                                <button type="button" onClick={() => setTipoComprador('EXTERNO')} className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${tipoComprador === 'EXTERNO' ? 'bg-white shadow-sm text-fg' : 'text-muted'}`}>
                                    Externo
                                </button>
                            </div>

                            {tipoComprador === 'MEMBRO' ? (
                                <div>
                                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest">Selecionar Membro</label>
                                    <select
                                        name="membro_id"
                                        required
                                        defaultValue={isEditing && vendaSelecionada?.membro_id ? vendaSelecionada.membro_id : ""}
                                        className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1"
                                    >
                                        <option value="">Quem está a comprar?</option>
                                        {membros.map(m => (
                                            <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[9px] font-black uppercase text-muted ml-2 tracking-widest flex items-center gap-1"><User size={12} /> Nome (Amigo/Vizinho)</label>
                                    <input
                                        name="nome_externo"
                                        required
                                        defaultValue={isEditing && vendaSelecionada?.nome_externo ? vendaSelecionada.nome_externo : ""}
                                        placeholder="Ex: Sr. Manuel do Café"
                                        className="w-full bg-bg border border-soft p-4 rounded-2xl text-xs font-bold outline-none focus:border-figueira mt-1"
                                    />
                                </div>
                            )}

                            {!isEditing && (
                                <div className="bg-figueira/5 border border-figueira/20 p-4 rounded-2xl flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase text-figueira tracking-widest block">Total a Pagar</span>
                                    <span className="text-xl font-black text-fg italic flex items-center gap-1">
                                        {valorTotalLote.toFixed(2)} <Euro size={16} className="text-muted" />
                                    </span>
                                </div>
                            )}
                        </div>

                        <button disabled={loading} className={`w-full text-bg py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl disabled:opacity-50 ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-fg hover:bg-figueira'}`}>
                            {loading ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? <Edit3 size={16} /> : <CheckCircle2 size={16} />)}
                            {loading ? 'A Gravar...' : (isEditing ? 'Guardar Correção' : `Vender ${numerosSelecionados.length} Números`)}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}