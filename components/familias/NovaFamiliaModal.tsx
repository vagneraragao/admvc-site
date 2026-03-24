'use client'

import { useState } from 'react'
import { criarNovaFamilia } from '@/actions/familia-actions'
import { Plus, X, Loader2, Home } from 'lucide-react'

export default function NovaFamiliaModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleAction(formData: FormData) {
        setLoading(true)
        await criarNovaFamilia(formData)
        setLoading(false)
        setIsOpen(false) // Fecha o modal após sucesso
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-fg text-bg px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-figueira transition-all shadow-xl active:scale-95"
            >
                <Plus size={16} /> Nova Família
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-bg2 w-full max-w-md border border-soft p-8 rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-300">

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-soft text-muted rounded-full hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="mb-8">
                            <div className="w-12 h-12 bg-figueira/10 text-figueira rounded-2xl flex items-center justify-center mb-4">
                                <Home size={20} />
                            </div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-fg">Criar Agregado</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Insira o apelido principal da família</p>
                        </div>

                        <form action={handleAction} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-muted ml-4 tracking-widest">Apelido (Ex: Silva, Oliveira)</label>
                                <input
                                    name="surname"
                                    placeholder="Escreva aqui..."
                                    className="w-full bg-bg border border-soft rounded-2xl p-4 text-xs font-bold text-fg focus:border-figueira outline-none transition-all shadow-sm"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 bg-figueira text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition-all shadow-lg shadow-figueira/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                {loading ? 'A criar...' : 'Guardar Família'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}