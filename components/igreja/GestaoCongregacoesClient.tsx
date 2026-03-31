// app/admin/congregacoes/GestaoCongregacoesClient.tsx
'use client'

import { useState } from 'react'
import { criarCongregacao, atualizarCongregacao, excluirCongregacao } from '@/actions/admin-actions'
import { PlusCircle, Loader2, CheckCircle2, Building2, Edit3, ArrowLeft, Users, MapPin, Trash2 } from 'lucide-react'
import Breadcrumb from '@/components/ui/Breadcrumb'

export default function GestaoCongregacoesClient({ congregacoes }: { congregacoes: any[] }) {
    const [modo, setModo] = useState<'lista' | 'criar' | 'editar'>('lista');
    const [selecionada, setSelecionada] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'error' | 'success', msg: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setStatus(null);

        let res;
        if (modo === 'criar') {
            res = await criarCongregacao(formData);
        } else if (modo === 'editar' && selecionada) {
            res = await atualizarCongregacao(selecionada.id, formData);
        }

        if (res?.error) {
            setStatus({ type: 'error', msg: res.error });
            setLoading(false);
        } else if (res?.ok) {
            setStatus({ type: 'success', msg: res.message! });
            setLoading(false);
            setTimeout(() => voltarLista(), 1500);
        }
    }

    async function handleDelete() {
        if (!confirm("Tem a certeza que deseja apagar esta congregação?")) return;

        setLoading(true);
        const res = await excluirCongregacao(selecionada.id);

        if (res?.error) {
            setStatus({ type: 'error', msg: res.error });
            setLoading(false);
        } else {
            setStatus({ type: 'success', msg: res.message! });
            setTimeout(() => voltarLista(), 1500);
        }
    }

    const voltarLista = () => {
        setModo('lista');
        setSelecionada(null);
        setStatus(null);
        setLoading(false);
    };

    return (
        <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 space-y-8 animate-in fade-in">
            <Breadcrumb items={[{ label: "Administração", href: "/admin/dashboard" }, { label: "Congregações" }]} />

            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-soft pb-8">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-fg flex items-center gap-3">
                        <Building2 size={32} className="text-figueira" />
                        Congregações
                    </h1>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">
                        Gerir as unidades físicas da sua igreja
                    </p>
                </div>

                {modo === 'lista' ? (
                    <button onClick={() => setModo('criar')} className="bg-fg text-bg px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-figueira transition-all flex items-center gap-2">
                        <PlusCircle size={16} /> Nova Congregação
                    </button>
                ) : (
                    <button onClick={voltarLista} className="bg-bg2 border border-soft text-fg px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-figueira transition-all flex items-center gap-2">
                        <ArrowLeft size={16} /> Voltar à Lista
                    </button>
                )}
            </header>

            {/* VISTA 1: LISTA */}
            {modo === 'lista' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {congregacoes.length === 0 ? (
                        <div className="col-span-full p-10 border-2 border-dashed border-soft rounded-[3rem] text-center bg-bg2/50">
                            <p className="text-xs font-black uppercase tracking-widest text-muted italic">A sua igreja ainda não tem congregações registadas.</p>
                        </div>
                    ) : (
                        congregacoes.map((c) => (
                            <div key={c.id} className="bg-bg2 border border-soft p-8 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group">
                                <div>
                                    <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center mb-4">
                                        <Building2 size={24} />
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-fg leading-none truncate">
                                        {c.nome}
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted mt-2 flex items-center gap-2 truncate">
                                        <MapPin size={12} className="shrink-0" /> {c.cidade}
                                    </p>

                                    <div className="mt-6 flex items-center gap-4 border-t border-soft pt-4">
                                        <span className="text-[9px] font-black text-muted uppercase tracking-widest flex items-center gap-1.5 bg-bg px-3 py-1.5 rounded-lg border border-soft">
                                            <Users size={12} className="text-figueira" /> {c._count.membros} Membros
                                        </span>
                                    </div>
                                </div>

                                <button onClick={() => { setSelecionada(c); setModo('editar'); setStatus(null); }} className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-bg border border-soft rounded-xl text-[9px] font-black uppercase tracking-widest text-muted group-hover:bg-fg group-hover:text-bg transition-all">
                                    <Edit3 size={14} /> Gerir Unidade
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* VISTA 2: FORMULÁRIO */}
            {(modo === 'criar' || modo === 'editar') && (
                <div className="max-w-2xl bg-bg2 border border-soft p-8 md:p-12 rounded-[3.5rem] shadow-xl animate-in slide-in-from-bottom-4 duration-500">
                    <form action={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Nome da Congregação</label>
                            <input name="nome" defaultValue={selecionada?.nome} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-xs font-bold text-fg outline-none focus:border-figueira transition-all" placeholder="Ex: Campus Norte" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Cidade</label>
                                <input name="cidade" defaultValue={selecionada?.cidade} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-xs font-bold text-fg outline-none focus:border-figueira transition-all" placeholder="Ex: Lisboa" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Endereço (Morada)</label>
                                <input name="endereco" defaultValue={selecionada?.endereco} required className="w-full bg-bg border border-soft rounded-2xl px-5 py-4 text-xs font-bold text-fg outline-none focus:border-figueira transition-all" placeholder="Rua, Nº..." />
                            </div>
                        </div>

                        {status && (
                            <div className={`flex items-center gap-3 text-[10px] font-black uppercase p-4 rounded-2xl animate-in zoom-in-95 duration-300 ${status.type === 'error' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                                {status.type === 'error' ? '❌ ' : <CheckCircle2 size={18} />} {status.msg}
                            </div>
                        )}

                        <div className="pt-6 border-t border-soft flex flex-col sm:flex-row gap-4">
                            <button disabled={loading} type="submit" className={`flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${loading ? 'bg-muted text-bg cursor-wait' : 'bg-fg text-bg hover:bg-figueira'}`}>
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                                {loading ? 'A guardar...' : 'Guardar Congregação'}
                            </button>

                            {modo === 'editar' && (
                                <button type="button" onClick={handleDelete} disabled={loading} className="py-5 px-6 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 flex items-center justify-center" title="Apagar Congregação">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </main>
    )
}