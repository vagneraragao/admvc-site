'use client'

import { useState } from 'react'
import { vincularMembroAFamilia, removerMembroDaFamilia } from '@/actions/familia-actions'
import { UserPlus, Settings2, Trash2, Shield, User, Loader2 } from 'lucide-react'

export function GestaoFamiliaCard({ familia, membrosDisponiveis }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [removingId, setRemovingId] = useState<number | null>(null)

    async function handleVincular(fd: FormData) {
        const membroId = Number(fd.get('membroId'));
        const parentesco = fd.get('parentesco') as string;

        if (!membroId || !parentesco) return alert("Selecione o membro e o parentesco.");

        setLoading(true);
        const res = await vincularMembroAFamilia(membroId, familia.id, parentesco);
        setLoading(false);

        if (res?.erro) {
            alert(res.erro);
        } else {
            setIsEditing(false);
        }
    }

    async function handleRemover(membroId: number) {
        if (window.confirm("Remover este membro da família?")) {
            setRemovingId(membroId);
            await removerMembroDaFamilia(membroId);
            setRemovingId(null);
        }
    }

    return (
        <div className={`bg-bg2 rounded-[2.5rem] border transition-all duration-300 flex flex-col overflow-hidden ${isEditing ? 'border-figueira shadow-xl shadow-figueira/5' : 'border-soft shadow-sm hover:border-soft/80'}`}>

            {/* CABEÇALHO DO CARD */}
            <div className="p-6 md:p-8 bg-bg border-b border-soft flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-black uppercase italic text-fg leading-none tracking-tight">
                        Família <span className="text-figueira">{familia.surname}</span>
                    </h3>
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mt-1">
                        {familia.members.length} {familia.members.length === 1 ? 'Membro' : 'Membros'}
                    </p>
                </div>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`p-3 rounded-xl transition-all ${isEditing ? 'bg-figueira text-white shadow-lg' : 'bg-soft text-muted hover:bg-fg hover:text-bg'}`}
                    title="Gerir Membros"
                >
                    <Settings2 size={16} />
                </button>
            </div>

            {/* CORPO: LISTA DE MEMBROS */}
            <div className="p-6 md:p-8 space-y-3 flex-1 bg-bg2">
                {familia.members.length > 0 ? familia.members.map((membro: any) => (
                    <div key={membro.id} className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-soft/50 group hover:border-figueira/30 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-soft overflow-hidden border-2 border-bg2 shrink-0 flex items-center justify-center text-muted">
                                {membro.avatar_file ? (
                                    <img src={membro.avatar_file} alt={membro.first_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={16} />
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-black uppercase text-fg tracking-tight">{membro.first_name} {membro.last_name}</p>
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest flex items-center gap-1 mt-0.5">
                                    {membro.parentesco?.includes('Chefe') ? <Shield size={10} className="text-figueira" /> : null}
                                    {membro.parentesco || 'Membro'}
                                </p>
                            </div>
                        </div>

                        {isEditing && (
                            <button
                                onClick={() => handleRemover(membro.id)}
                                disabled={removingId === membro.id}
                                className="p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                                title="Remover da família"
                            >
                                {removingId === membro.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            </button>
                        )}
                    </div>
                )) : (
                    <div className="text-center py-6">
                        <p className="text-[10px] text-muted font-bold uppercase tracking-widest italic">Nenhum membro vinculado.</p>
                    </div>
                )}
            </div>

            {/* RODAPÉ: FORMULÁRIO DE VÍNCULO (APARECE AO EDITAR) */}
            {isEditing && (
                <div className="p-6 md:p-8 bg-figueira/5 border-t border-figueira/20 animate-in slide-in-from-bottom-2">
                    <form action={handleVincular} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-figueira tracking-widest ml-2">Adicionar Novo Membro</label>
                            <select
                                name="membroId"
                                className="w-full bg-bg border border-soft rounded-xl p-3 text-[11px] font-bold text-fg outline-none focus:border-figueira appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Selecione o membro isolado...</option>
                                {membrosDisponiveis.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.fullName}</option>
                                ))}
                            </select>
                        </div>

                        <select
                            name="parentesco"
                            className="w-full bg-bg border border-soft rounded-xl p-3 text-[11px] font-bold text-fg outline-none focus:border-figueira appearance-none cursor-pointer"
                            required
                        >
                            <option value="">Definir Parentesco...</option>
                            <option value="Pai (Chefe)">Pai (Chefe da Família)</option>
                            <option value="Mãe (Chefe)">Mãe (Chefe da Família)</option>
                            <option value="Filho(a)">Filho(a)</option>
                            <option value="Cônjuge">Cônjuge</option>
                            <option value="Avô/Avó">Avô / Avó</option>
                            <option value="Outro">Outro</option>
                        </select>

                        <button
                            disabled={loading || membrosDisponiveis.length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-fg text-bg py-4 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:bg-figueira transition-all active:scale-95 shadow-md"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                            {loading ? 'A Vincular...' : 'Confirmar Vínculo'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}