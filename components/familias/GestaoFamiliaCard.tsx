'use client'

import { useState } from 'react'
import { removerMembroDaFamilia } from '@/actions/familia-actions'
import { Settings2, Trash2, Shield, User, Loader2 } from 'lucide-react'
import BotaoExcluirFamilia from '@/components/familias/BotaoExcluirFamilia'
import ModalAdicionarMembroFamilia from '@/components/familias/ModalAdicionarMembroFamilia'

export function GestaoFamiliaCard({ familia }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [removingId, setRemovingId] = useState<number | null>(null)

    async function handleRemover(membroId: number) {
        if (window.confirm("Remover este membro da família?")) {
            setRemovingId(membroId);
            await removerMembroDaFamilia(membroId);
            setRemovingId(null);
        }
    }

    return (
        <div className={`bg-bg2 rounded-[2.5rem] border transition-all duration-300 flex flex-col overflow-hidden ${isEditing ? 'border-figueira shadow-xl shadow-figueira/5' : 'border-soft shadow-sm hover:border-soft/80'}`}>

            {/* CABEÇALHO DO CARD (Sempre Visível) */}
            {/* Note que removi a 'border-b' fixa e passei-a para o bloco debaixo, para ficar limpo quando retraído */}
            <div className="p-6 md:p-8 bg-bg flex justify-between items-center relative z-10">
                <div>
                    <h3 className="text-2xl font-black uppercase italic text-fg leading-none tracking-tight">
                        Família <span className="text-figueira">{familia.surname}</span>
                    </h3>
                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mt-1">
                        {familia.members.length} {familia.members.length === 1 ? 'Membro' : 'Membros'}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-3 rounded-xl transition-all ${isEditing ? 'bg-figueira text-white shadow-lg' : 'bg-soft text-muted hover:bg-fg hover:text-bg'}`}
                        title={isEditing ? "Fechar Edição" : "Gerir Membros"}
                    >
                        <Settings2 size={16} />
                    </button>

                    {/* BOTÃO DE EXCLUIR FAMÍLIA */}
                    <BotaoExcluirFamilia
                        familiaId={familia.id}
                        nomeFamilia={familia.surname}
                        qtdMembros={familia.members.length}
                    />
                </div>
            </div>

            {/* CONTEÚDO EXPANSÍVEL (Aparece apenas quando clicamos na engrenagem) */}
            {isEditing && (
                <div className="flex flex-col border-t border-soft animate-in slide-in-from-top-4 fade-in duration-300">

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
                                            {membro.parentesco?.includes('Chefe') || membro.parentesco?.includes('CABEÇA') ? <Shield size={10} className="text-figueira" /> : null}
                                            {membro.parentesco ? membro.parentesco.replace(/_/g, ' ') : 'Membro'}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemover(membro.id)}
                                    disabled={removingId === membro.id}
                                    className="p-2 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                                    title="Remover da família"
                                >
                                    {removingId === membro.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        )) : (
                            <div className="text-center py-6">
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest italic">Nenhum membro vinculado.</p>
                            </div>
                        )}
                    </div>

                    {/* RODAPÉ: O NOSSO MODAL INTELIGENTE DE BUSCA */}
                    <div className="p-6 bg-figueira/5 border-t border-figueira/20">
                        <ModalAdicionarMembroFamilia familiaId={familia.id} familiaNome={familia.surname} />
                    </div>

                </div>
            )}
        </div>
    )
}